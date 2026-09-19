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

/**
 * A requirement marker "carries through" to the end of its sentence (until
 * overridden by a later marker in the same sentence), rather than only
 * covering the single word right after it. This matters for lists like
 * "does not want gray interiors, a modern-farmhouse renovation, or a major
 * fixer" -- a naive per-match lookback would classify everything after the
 * first item as PREFER by default, silently dropping AVOID items.
 * Still a heuristic: the agent reviews the structured interpretation before
 * confirming the watch (see NATURAL-LANGUAGE SETUP in the product spec),
 * which is the real correctness backstop for a rule-based v1 like this one.
 */
function findRequirement(sentence: string, matchIndex: number): Requirement {
  const before = sentence.slice(0, matchIndex);
  let lastMarkerIndex = -1;
  let lastRequirement: Requirement = 'PREFER';

  for (const marker of AVOID_MARKERS) {
    const idx = before.lastIndexOf(marker);
    if (idx > lastMarkerIndex) {
      lastMarkerIndex = idx;
      lastRequirement = 'AVOID';
    }
  }
  for (const marker of MUST_MARKERS) {
    const idx = before.lastIndexOf(marker);
    if (idx > lastMarkerIndex) {
      lastMarkerIndex = idx;
      lastRequirement = 'MUST';
    }
  }

  return lastMarkerIndex === -1 ? 'PREFER' : lastRequirement;
}

function splitSentences(text: string): Array<{ sentence: string; offset: number }> {
  const parts: Array<{ sentence: string; offset: number }> = [];
  let start = 0;
  const re = /[.!?]+/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    parts.push({ sentence: text.slice(start, match.index + match[0].length), offset: start });
    start = match.index + match[0].length;
  }
  if (start < text.length) parts.push({ sentence: text.slice(start), offset: start });
  return parts;
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
    const sentences = splitSentences(normalized);
    const criteria: ParsedCriterion[] = [];
    const seen = new Set<string>();

    for (const { category, attribute } of allAttributes()) {
      for (const synonym of attribute.synonyms) {
        const synonymNormalized = normalizeText(synonym);
        let found: { index: number; requirement: Requirement } | undefined;
        for (const { sentence, offset } of sentences) {
          const localIndex = sentence.indexOf(synonymNormalized);
          if (localIndex === -1) continue;
          found = { index: offset + localIndex, requirement: findRequirement(sentence, localIndex) };
          break;
        }
        if (!found) continue;
        const key = `${category.key}:${attribute.key}`;
        if (seen.has(key)) break;
        seen.add(key);
        criteria.push({
          categoryKey: category.key,
          attributeKey: attribute.key,
          requirement: found.requirement,
          confidence: attribute.highEvidenceBar ? 0.6 : 0.75,
          evidence: rawText.slice(Math.max(0, found.index - 10), found.index + synonymNormalized.length + 10).trim(),
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
