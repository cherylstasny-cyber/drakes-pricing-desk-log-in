import type { MatchReason, MatchResult, PropertyTrait, WatchCriterion } from './types';

const AVOID_PENALTY_MULTIPLIER = 2;

function findTrait(traits: PropertyTrait[], categoryKey: string, attributeKey: string): PropertyTrait | undefined {
  return traits.find((t) => t.categoryKey === categoryKey && t.attributeKey === attributeKey);
}

/**
 * Scores one property against one watch's criteria.
 * - MUST criteria without a sufficiently-confident matching trait hard-fail the property (score 0, passed=false).
 * - AVOID criteria with a sufficiently-confident matching trait apply a heavy penalty (does not hard-fail by default).
 * - PREFER criteria reward the score proportionally to weight * confidence.
 * The result always carries `reasons` (and `missingPreferred`) so a score is never shown without its explanation.
 */
export function scoreProperty(watchId: string, criteria: WatchCriterion[], traits: PropertyTrait[]): MatchResult {
  const reasons: MatchReason[] = [];
  const mustFailures: MatchReason[] = [];
  const missingPreferred: MatchReason[] = [];

  let earnedScore = 0;
  let possibleScore = 0;

  for (const criterion of criteria) {
    const trait = findTrait(traits, criterion.categoryKey, criterion.attributeKey);
    const confidentMatch = !!trait && trait.confidence >= criterion.confidenceThreshold;

    if (criterion.requirement === 'MUST') {
      possibleScore += criterion.weight;
      const reason: MatchReason = {
        categoryKey: criterion.categoryKey,
        attributeKey: criterion.attributeKey,
        requirement: 'MUST',
        matched: confidentMatch,
        confidence: trait?.confidence,
        contribution: confidentMatch ? criterion.weight : 0,
      };
      reasons.push(reason);
      if (!confidentMatch) mustFailures.push(reason);
      else earnedScore += criterion.weight;
      continue;
    }

    if (criterion.requirement === 'AVOID') {
      const contribution = confidentMatch ? -criterion.weight * AVOID_PENALTY_MULTIPLIER * (trait?.confidence ?? 0) : 0;
      reasons.push({
        categoryKey: criterion.categoryKey,
        attributeKey: criterion.attributeKey,
        requirement: 'AVOID',
        matched: confidentMatch,
        confidence: trait?.confidence,
        contribution,
      });
      earnedScore += contribution;
      continue;
    }

    // PREFER
    possibleScore += criterion.weight;
    const contribution = confidentMatch ? criterion.weight * (trait?.confidence ?? 0) : 0;
    const reason: MatchReason = {
      categoryKey: criterion.categoryKey,
      attributeKey: criterion.attributeKey,
      requirement: 'PREFER',
      matched: confidentMatch,
      confidence: trait?.confidence,
      contribution,
    };
    reasons.push(reason);
    earnedScore += contribution;
    if (!confidentMatch) missingPreferred.push(reason);
  }

  const passed = mustFailures.length === 0;
  const score = passed && possibleScore > 0 ? Math.max(0, Math.min(100, Math.round((earnedScore / possibleScore) * 100))) : 0;

  return {
    propertyId: traits[0]?.propertyId ?? '',
    watchId,
    score,
    passed,
    mustFailures,
    reasons,
    missingPreferred,
    scoredAt: new Date().toISOString(),
  };
}

/** Only alert when the property passed (no MUST failures) and cleared the watch's configured threshold. */
export function shouldAlert(result: MatchResult, alertThreshold: number): boolean {
  return result.passed && result.score >= alertThreshold;
}

/**
 * Duplicate-alert prevention: suppress a new alert for the same watch+property
 * pair if one was already sent within the cooldown window, unless the score
 * has since improved meaningfully (a materially better match is still worth surfacing).
 */
export function shouldSuppressDuplicateAlert(
  newResult: MatchResult,
  previousAlerts: Array<{ propertyId: string; watchId: string; score: number; sentAt: string }>,
  cooldownHours = 24,
  minScoreImprovement = 5
): boolean {
  const now = new Date(newResult.scoredAt).getTime();
  const priorForPair = previousAlerts.filter(
    (a) => a.propertyId === newResult.propertyId && a.watchId === newResult.watchId
  );
  if (priorForPair.length === 0) return false;

  const mostRecent = priorForPair.reduce((latest, a) => (new Date(a.sentAt) > new Date(latest.sentAt) ? a : latest));
  const hoursSince = (now - new Date(mostRecent.sentAt).getTime()) / 3_600_000;
  const improved = newResult.score - mostRecent.score >= minScoreImprovement;

  return hoursSince < cooldownHours && !improved;
}
