import { describe, expect, it } from 'vitest';
import { scoreProperty, shouldAlert, shouldSuppressDuplicateAlert } from '../matching';
import type { PropertyTrait, WatchCriterion } from '../types';

function criterion(overrides: Partial<WatchCriterion>): WatchCriterion {
  return {
    id: overrides.id ?? Math.random().toString(36),
    categoryKey: 'entertainment',
    attributeKey: 'media_room',
    requirement: 'PREFER',
    weight: 1,
    confidenceThreshold: 0.6,
    ...overrides,
  };
}

function trait(overrides: Partial<PropertyTrait>): PropertyTrait {
  return {
    propertyId: 'prop-1',
    categoryKey: 'entertainment',
    attributeKey: 'media_room',
    value: 'present',
    confidence: 0.9,
    sourceType: 'remarks',
    evidence: 'test',
    modelVersion: 'test-v1',
    analyzedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('scoreProperty', () => {
  it('hard-fails when a MUST criterion has no matching trait', () => {
    const criteria = [criterion({ requirement: 'MUST', categoryKey: 'bathroom', attributeKey: 'freestanding_soaking_tub' })];
    const result = scoreProperty('watch-1', criteria, []);
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
    expect(result.mustFailures).toHaveLength(1);
  });

  it('never returns a score without reasons explaining it', () => {
    const criteria = [criterion({ requirement: 'PREFER' })];
    const result = scoreProperty('watch-1', criteria, [trait({})]);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it('rewards PREFER matches proportional to confidence', () => {
    const criteria = [criterion({ requirement: 'PREFER', weight: 1 })];
    const highConfidence = scoreProperty('watch-1', criteria, [trait({ confidence: 0.95 })]);
    const lowConfidence = scoreProperty('watch-1', criteria, [trait({ confidence: 0.6 })]);
    expect(highConfidence.score).toBeGreaterThan(lowConfidence.score);
  });

  it('gates matches below the confidence threshold', () => {
    const criteria = [criterion({ requirement: 'PREFER', confidenceThreshold: 0.8 })];
    const result = scoreProperty('watch-1', criteria, [trait({ confidence: 0.5 })]);
    expect(result.reasons[0].matched).toBe(false);
    expect(result.missingPreferred).toHaveLength(1);
  });

  it('excludes a property outright when a confidently-matched AVOID criterion is present, not just a lower score', () => {
    // The electric-stove scenario: a client who dislikes a feature should never see a house that has it,
    // no matter how well everything else matches.
    const criteria = [
      criterion({ requirement: 'PREFER', categoryKey: 'kitchen', attributeKey: 'natural_oak_kitchen', weight: 1 }),
      criterion({ requirement: 'AVOID', categoryKey: 'kitchen', attributeKey: 'commercial_style_kitchen', weight: 1 }),
    ];
    const traits = [
      trait({ categoryKey: 'kitchen', attributeKey: 'natural_oak_kitchen', confidence: 1 }),
      trait({ categoryKey: 'kitchen', attributeKey: 'commercial_style_kitchen', confidence: 1 }),
    ];
    const result = scoreProperty('watch-1', criteria, traits);
    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
    expect(result.avoidMatches).toHaveLength(1);
    expect(result.avoidMatches[0].attributeKey).toBe('commercial_style_kitchen');
  });

  it('does not exclude a property when the AVOID trait is absent or below its confidence threshold', () => {
    const criteria = [criterion({ requirement: 'AVOID', categoryKey: 'kitchen', attributeKey: 'green_kitchen', confidenceThreshold: 0.8 })];
    const noTrait = scoreProperty('watch-1', criteria, []);
    const lowConfidenceTrait = scoreProperty('watch-1', criteria, [trait({ categoryKey: 'kitchen', attributeKey: 'green_kitchen', confidence: 0.4 })]);
    expect(noTrait.passed).toBe(true);
    expect(lowConfidenceTrait.passed).toBe(true);
    expect(lowConfidenceTrait.avoidMatches).toHaveLength(0);
  });

  it('does not misidentify a low-confidence brand claim as a confirmed match', () => {
    const criteria = [criterion({ requirement: 'PREFER', categoryKey: 'appliances', attributeKey: 'sub_zero', confidenceThreshold: 0.85 })];
    const result = scoreProperty('watch-1', criteria, [
      trait({ categoryKey: 'appliances', attributeKey: 'sub_zero', value: 'likely', confidence: 0.55 }),
    ]);
    expect(result.reasons[0].matched).toBe(false);
  });
});

describe('shouldAlert', () => {
  it('only alerts when passed and score clears the threshold', () => {
    const passing = scoreProperty('watch-1', [criterion({ requirement: 'PREFER' })], [trait({})]);
    expect(shouldAlert(passing, 50)).toBe(true);
    expect(shouldAlert(passing, 101)).toBe(false);
  });

  it('never alerts on a failed watch regardless of score', () => {
    const failed = scoreProperty('watch-1', [criterion({ requirement: 'MUST' })], []);
    expect(shouldAlert(failed, 0)).toBe(false);
  });
});

describe('shouldSuppressDuplicateAlert', () => {
  const baseResult = {
    propertyId: 'prop-1',
    watchId: 'watch-1',
    score: 80,
    passed: true,
    mustFailures: [],
    avoidMatches: [],
    reasons: [],
    missingPreferred: [],
    scoredAt: new Date().toISOString(),
  };

  it('suppresses a re-alert for the same pair within the cooldown window with no score improvement', () => {
    const prior = [{ propertyId: 'prop-1', watchId: 'watch-1', score: 80, sentAt: new Date().toISOString() }];
    expect(shouldSuppressDuplicateAlert(baseResult, prior)).toBe(true);
  });

  it('does not suppress when the score improved meaningfully', () => {
    const prior = [{ propertyId: 'prop-1', watchId: 'watch-1', score: 70, sentAt: new Date().toISOString() }];
    expect(shouldSuppressDuplicateAlert({ ...baseResult, score: 90 }, prior)).toBe(false);
  });

  it('does not suppress once the cooldown window has passed', () => {
    const old = new Date(Date.now() - 48 * 3_600_000).toISOString();
    const prior = [{ propertyId: 'prop-1', watchId: 'watch-1', score: 80, sentAt: old }];
    expect(shouldSuppressDuplicateAlert(baseResult, prior, 24)).toBe(false);
  });

  it('does not suppress alerts for a different property', () => {
    const prior = [{ propertyId: 'prop-2', watchId: 'watch-1', score: 80, sentAt: new Date().toISOString() }];
    expect(shouldSuppressDuplicateAlert(baseResult, prior)).toBe(false);
  });
});
