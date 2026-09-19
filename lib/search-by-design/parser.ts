import { allAttributes, normalizeText } from './taxonomy';
import type { ParsedCriterion, ParsedPreferences, Requirement } from './types';

/**
 * Swappable interface: v1 is rule-based (KeywordPreferenceParser). A future
 * LLM-backed implementation (e.g. calling the Claude API) can implement the
 * same interface without any caller changes.
 */
export interface PreferenceParser {
  parse(rawText: string): ParsedPreferences;
}

const AVOID_MARKERS = [
  'does not want', "doesn't want", 'do not want', "don't want",
  'no ', 'not ', 'without ', 'avoid ', 'dislikes', 'hates', 'nothing with',
];

const MUST_MARKERS = [
  'must have', 'needs', 'has to have', 'require', 'requires', 'required',
  'non-negotiable', 'wants a', 'wants', 'looking for a',
];

const NEGATION_WINDOW = 24; // characters of look-behind used to catch "does not want X" before attribute mention

function findRequirement(text: string, matchIndex: number): Requirement {
  const windowStart = Math.max(0, matchIndex - NEGATION_WINDOW);
  const before = text.slice(windowStart, matchIndex);
  if (AVOID_MARKERS.some((marker) => before.includes(marker))) return 'AVOID';
  if (MUST_MARKERS.some((marker) => before.includes(marker))) return 'MUST';
  return 'PREFER';
}

function extractPrice(text: string): { priceMax?: number; priceMin?: number } {
  const under = text.match(/under\s+\$?([\d,.]+)\s*(million|m|k)?/i);
  const between = text.match(/\$?([\d,.]+)\s*(million|m|k)?\s*(?:-|to)\s*\$?([\d,.]+)\s*(million|m|k)?/i);
  const toNumber = (raw: string, unit?: string) => {
    const base = parseFloat(raw.replace(/,/g, ''));
    if (!unit) return base;
    const u = unit.toLowerCase();
    if (u === 'million' || u === 'm') return base * 1_000_000;
    if (u === 'k') return base * 1_000;
    return base;
  };
  if (between) {
    return {
      priceMin: toNumber(between[1], between[2]),
      priceMax: toNumber(between[3], between[4]),
    };
  }
  if (under) {
    return { priceMax: toNumber(under[1], under[2]) };
  }
  return {};
}

export class KeywordPreferenceParser implements PreferenceParser {
  parse(rawText: string): ParsedPreferences {
    const normalized = normalizeText(rawText);
    const criteria: ParsedCriterion[] = [];
    const seen = new Set<string>();

    for (const { category, attribute } of allAttributes()) {
      for (const synonym of attribute.synonyms) {
        const synonymNormalized = normalizeText(synonym);
        const index = normalized.indexOf(synonymNormalized);
        if (index === -1) continue;
        const key = `${category.key}:${attribute.key}`;
        if (seen.has(key)) break;
        seen.add(key);
        const requirement = findRequirement(normalized, index);
        criteria.push({
          categoryKey: category.key,
          attributeKey: attribute.key,
          requirement,
          confidence: attribute.highEvidenceBar ? 0.6 : 0.75,
          evidence: rawText.slice(Math.max(0, index - 10), index + synonymNormalized.length + 10).trim(),
        });
        break;
      }
    }

    const { priceMin, priceMax } = extractPrice(normalized);
    if (priceMax !== undefined) {
      criteria.push({
        categoryKey: 'budget',
        attributeKey: 'price_max',
        targetValue: String(priceMax),
        requirement: 'MUST',
        confidence: 0.9,
        evidence: `Price ceiling parsed from: "${rawText}"`,
      });
    }

    return { criteria, priceMin, priceMax };
  }
}

export function createKeywordPreferenceParser(): PreferenceParser {
  return new KeywordPreferenceParser();
}

/**
 * Adapter slot for a future LLM-backed parser. Not wired to a live provider
 * yet (no model/vendor decision made) -- intentionally throws so callers
 * fail loudly instead of silently degrading to a stub.
 */
export function createLLMPreferenceParser(): PreferenceParser {
  throw new Error(
    'LLM-backed preference parser is not configured. Set an AI provider and implement this adapter before use; KeywordPreferenceParser remains the default.'
  );
}
