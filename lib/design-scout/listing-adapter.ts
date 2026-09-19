import { allAttributes, normalizeText } from './taxonomy';
import type { ListingRaw, PropertyTrait, SourceType } from './types';

/**
 * Where new/active/coming-soon listings come from. v1 is synthetic/test data
 * only -- MLS/data-provider access, licensing, and photo-use rights have not
 * been confirmed (see docs/design-scout/DATA_SOURCE_ABSTRACTION.md).
 * A real MLS-backed implementation plugs in behind this same interface.
 */
export interface ListingSource {
  fetchEligibleListings(): Promise<ListingRaw[]>;
}

/**
 * Turns a listing's structured data + remarks + (eventually) photos into
 * Property Intelligence traits. v1 only reads remarks/photo captions
 * (text) with a keyword extractor; real photo pixel analysis needs a vision
 * model vendor decision and is intentionally not wired here yet.
 */
export interface TraitExtractor {
  extractTraits(listing: ListingRaw, propertyId: string): PropertyTrait[];
}

export const MODEL_VERSION = 'keyword-extractor-v1';

const SUSAN_TEST_LISTING: ListingRaw = {
  externalId: 'TEST-WB-001',
  addressLine1: '412 Willow Bend Court',
  city: 'Willow Bend',
  state: 'TX',
  postalCode: '75001',
  price: 1_875_000,
  status: 'new',
  listDate: new Date().toISOString(),
  remarks:
    'Stunning Prairie-influenced custom home on a wooded lot with mature trees. Warm natural oak kitchen features a Sub-Zero refrigerator, Wolf range, and oversized island. Temperature-controlled glass wine room off the dining room. Media room downstairs with tiered seating. Primary suite includes a freestanding soaking tub and dual closets. Turnkey condition throughout -- no updates needed.',
  photoCaptions: [
    'Front exterior with mature landscaping and low-slung Prairie roofline',
    'Kitchen with natural oak cabinetry and waterfall island',
    'Glass-enclosed wine room adjacent to dining',
    'Media room with built-in screen',
    'Primary bath with freestanding soaking tub',
  ],
};

const OFF_TARGET_TEST_LISTING: ListingRaw = {
  externalId: 'TEST-WB-002',
  addressLine1: '88 Suburban Loop',
  city: 'Willow Bend',
  state: 'TX',
  postalCode: '75001',
  price: 1_650_000,
  status: 'active',
  listDate: new Date().toISOString(),
  remarks:
    'Recently flipped modern farmhouse with an all-gray kitchen and gray interior throughout. Major renovation completed builder-grade. No architectural style character; generic modern-farmhouse renovation.',
  photoCaptions: ['Gray kitchen with white oak flooring', 'Gray-toned great room'],
};

export class SyntheticListingSource implements ListingSource {
  async fetchEligibleListings(): Promise<ListingRaw[]> {
    return [SUSAN_TEST_LISTING, OFF_TARGET_TEST_LISTING];
  }
}

export class KeywordTraitExtractor implements TraitExtractor {
  extractTraits(listing: ListingRaw, propertyId: string): PropertyTrait[] {
    const traits: PropertyTrait[] = [];
    const remarksNormalized = normalizeText(listing.remarks);
    const photoText = normalizeText(listing.photoCaptions.join('. '));
    const now = new Date().toISOString();

    for (const { category, attribute } of allAttributes()) {
      for (const synonym of attribute.synonyms) {
        const synonymNormalized = normalizeText(synonym);
        const inRemarks = remarksNormalized.includes(synonymNormalized);
        const inPhotos = photoText.includes(synonymNormalized);
        if (!inRemarks && !inPhotos) continue;

        const sourceType: SourceType = inRemarks && inPhotos ? 'structured' : inPhotos ? 'photo' : 'remarks';
        // Brand/style claims that need a high evidence bar only count as "confirmed"
        // when corroborated by both remarks and photo captions; otherwise "likely".
        const confirmed = !attribute.highEvidenceBar || (inRemarks && inPhotos);
        traits.push({
          propertyId,
          categoryKey: category.key,
          attributeKey: attribute.key,
          value: confirmed ? 'present' : 'likely',
          confidence: confirmed ? 0.9 : 0.55,
          sourceType,
          evidence: inRemarks ? `Listing remarks: "${synonym}"` : `Photo caption: "${synonym}"`,
          modelVersion: MODEL_VERSION,
          analyzedAt: now,
        });
        break;
      }
    }

    return traits;
  }
}

export function createSyntheticListingSource(): ListingSource {
  return new SyntheticListingSource();
}

export function createKeywordTraitExtractor(): TraitExtractor {
  return new KeywordTraitExtractor();
}
