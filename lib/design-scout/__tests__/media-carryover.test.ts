import { describe, expect, it } from 'vitest';
import { applyCarryoverProvenance, resolveEffectiveContent } from '../media-carryover';
import type { ListingRaw, PropertyTrait } from '../types';

const BASE_LISTING: ListingRaw = {
  externalId: 'X-1',
  addressLine1: '1 Test St',
  city: 'Willow Bend',
  state: 'TX',
  price: 1_000_000,
  status: 'active',
  listDate: new Date().toISOString(),
  remarks: '',
  photoCaptions: [],
};

describe('resolveEffectiveContent', () => {
  it('uses current content when both remarks and photos are present', () => {
    const current = { ...BASE_LISTING, remarks: 'new remarks', photoCaptions: ['new photo'] };
    const result = resolveEffectiveContent(current, { remarks: 'old remarks', photoCaptions: ['old photo'] }, true);
    expect(result.remarksSource).toBe('current');
    expect(result.photoCaptionsSource).toBe('current');
    expect(result.listing.remarks).toBe('new remarks');
    expect(result.listing.photoCaptions).toEqual(['new photo']);
  });

  it('falls back to previous photos and remarks when a recheck has neither', () => {
    const current = { ...BASE_LISTING, remarks: '', photoCaptions: [] };
    const result = resolveEffectiveContent(current, { remarks: 'old remarks', photoCaptions: ['old photo'] }, true);
    expect(result.remarksSource).toBe('carried_over');
    expect(result.photoCaptionsSource).toBe('carried_over');
    expect(result.listing.remarks).toBe('old remarks');
    expect(result.listing.photoCaptions).toEqual(['old photo']);
  });

  it('mixes sources independently -- new remarks but no new photos falls back only for photos', () => {
    const current = { ...BASE_LISTING, remarks: 'updated price info', photoCaptions: [] };
    const result = resolveEffectiveContent(current, { remarks: 'old remarks', photoCaptions: ['old photo'] }, true);
    expect(result.remarksSource).toBe('current');
    expect(result.photoCaptionsSource).toBe('carried_over');
    expect(result.listing.remarks).toBe('updated price info');
    expect(result.listing.photoCaptions).toEqual(['old photo']);
  });

  it('does not fall back when the agent has turned off media reuse for this property', () => {
    const current = { ...BASE_LISTING, remarks: '', photoCaptions: [] };
    const result = resolveEffectiveContent(current, { remarks: 'old remarks', photoCaptions: ['old photo'] }, false);
    expect(result.remarksSource).toBe('current');
    expect(result.photoCaptionsSource).toBe('current');
    expect(result.listing.remarks).toBe('');
    expect(result.listing.photoCaptions).toEqual([]);
  });

  it('has nothing to fall back to on the first-ever check', () => {
    const current = { ...BASE_LISTING, remarks: '', photoCaptions: [] };
    const result = resolveEffectiveContent(current, null, true);
    expect(result.remarksSource).toBe('current');
    expect(result.photoCaptionsSource).toBe('current');
  });
});

describe('applyCarryoverProvenance', () => {
  const trait = (overrides: Partial<PropertyTrait>): PropertyTrait => ({
    propertyId: 'p1',
    categoryKey: 'kitchen',
    attributeKey: 'green_kitchen',
    value: 'present',
    confidence: 0.9,
    sourceType: 'photo',
    evidence: 'seen in photo',
    modelVersion: 'v1',
    analyzedAt: new Date().toISOString(),
    ...overrides,
  });

  it('leaves traits untouched when nothing was carried over', () => {
    const traits = [trait({ sourceType: 'photo' })];
    expect(applyCarryoverProvenance(traits, 'current', 'current')).toEqual(traits);
  });

  it('retags photo-sourced traits as historical when photos were carried over', () => {
    const traits = [trait({ sourceType: 'photo' })];
    const [result] = applyCarryoverProvenance(traits, 'current', 'carried_over');
    expect(result.sourceType).toBe('historical');
    expect(result.evidence).toContain('carried over');
  });

  it('does not retag remarks-sourced traits when only photos were carried over', () => {
    const traits = [trait({ sourceType: 'remarks' })];
    const [result] = applyCarryoverProvenance(traits, 'current', 'carried_over');
    expect(result.sourceType).toBe('remarks');
  });

  it('retags structured (corroborated) traits as historical if either side was carried over', () => {
    const traits = [trait({ sourceType: 'structured' })];
    const [result] = applyCarryoverProvenance(traits, 'carried_over', 'current');
    expect(result.sourceType).toBe('historical');
  });
});
