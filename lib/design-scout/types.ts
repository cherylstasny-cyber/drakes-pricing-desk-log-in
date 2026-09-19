export type Requirement = 'MUST' | 'PREFER' | 'AVOID';

export type ParsedCriterion = {
  categoryKey: string;
  attributeKey: string;
  targetValue?: string;
  requirement: Requirement;
  /** 0-1: how confident the parser is that this phrase maps to this attribute+requirement. */
  confidence: number;
  /** The source phrase this was extracted from, kept for agent review. */
  evidence: string;
};

export type ParsedPreferences = {
  criteria: ParsedCriterion[];
  priceMin?: number;
  priceMax?: number;
  geographyLabel?: string;
};

export type WatchCriterion = {
  id: string;
  categoryKey: string;
  attributeKey: string;
  targetValue?: string;
  requirement: Requirement;
  weight: number;
  confidenceThreshold: number;
};

export type SourceType = 'photo' | 'remarks' | 'structured' | 'historical';

export type PropertyTrait = {
  propertyId: string;
  categoryKey: string;
  attributeKey: string;
  value: string;
  /** 0-1 */
  confidence: number;
  sourceType: SourceType;
  evidence: string;
  modelVersion: string;
  analyzedAt: string;
};

export type MatchReason = {
  categoryKey: string;
  attributeKey: string;
  requirement: Requirement;
  matched: boolean;
  confidence?: number;
  contribution: number;
};

export type MatchResult = {
  propertyId: string;
  watchId: string;
  /** 0-100 */
  score: number;
  /** false if any MUST criterion is unmet OR any AVOID criterion is confidently matched -- both exclude the property from results. */
  passed: boolean;
  mustFailures: MatchReason[];
  /** AVOID criteria that were confidently matched -- these are why the property was excluded, not just penalized. */
  avoidMatches: MatchReason[];
  reasons: MatchReason[];
  missingPreferred: MatchReason[];
  scoredAt: string;
};

export type ListingRaw = {
  externalId: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode?: string;
  price: number;
  status: 'coming_soon' | 'new' | 'active' | 'reactivated' | 'pending' | 'sold' | 'off_market';
  listDate: string;
  remarks: string;
  photoCaptions: string[];
};
