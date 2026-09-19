import { describe, expect, it } from 'vitest';
import { KeywordPreferenceParser } from '../parser';

const SUSAN_REQUEST =
  "Susan wants a turnkey architectural home in Willow Bend under $2 million. She likes Frank Lloyd Wright/Prairie influence, mature trees, warm natural-wood kitchens, Sub-Zero appliances, a refrigerated glass wine room and a movie/media room. She wants a freestanding soaking tub. She does not want gray interiors, a generic modern-farmhouse renovation or a major fixer.";

function find(criteria: ReturnType<KeywordPreferenceParser['parse']>['criteria'], categoryKey: string, attributeKey: string) {
  return criteria.find((c) => c.categoryKey === categoryKey && c.attributeKey === attributeKey);
}

describe('KeywordPreferenceParser - Susan / Willow Bend scenario', () => {
  const parser = new KeywordPreferenceParser();
  const result = parser.parse(SUSAN_REQUEST);

  it('extracts a price ceiling as a MUST criterion', () => {
    expect(result.priceMax).toBe(2_000_000);
    const budget = find(result.criteria, 'budget', 'price_max');
    expect(budget?.requirement).toBe('MUST');
    expect(budget?.targetValue).toBe('2000000');
  });

  it('classifies "wants a turnkey" as MUST', () => {
    expect(find(result.criteria, 'condition_renovation', 'turnkey')?.requirement).toBe('MUST');
  });

  it('classifies liked style/feature phrases as PREFER', () => {
    expect(find(result.criteria, 'architectural_style', 'frank_lloyd_wright_prairie')?.requirement).toBe('PREFER');
    expect(find(result.criteria, 'lot_privacy_landscaping', 'mature_trees')?.requirement).toBe('PREFER');
    expect(find(result.criteria, 'kitchen', 'natural_oak_kitchen')?.requirement).toBe('PREFER');
    expect(find(result.criteria, 'appliances', 'sub_zero')?.requirement).toBe('PREFER');
    expect(find(result.criteria, 'wine_beverage_bar', 'glass_enclosed_wine_room')?.requirement).toBe('PREFER');
    expect(find(result.criteria, 'entertainment', 'media_room')?.requirement).toBe('PREFER');
  });

  it('carries a negation marker across a comma-separated list of AVOID items in the same sentence', () => {
    expect(find(result.criteria, 'interior_design', 'gray_flip_style')?.requirement).toBe('AVOID');
    expect(find(result.criteria, 'condition_renovation', 'generic_modern_farmhouse_reno')?.requirement).toBe('AVOID');
    expect(find(result.criteria, 'condition_renovation', 'major_fixer')?.requirement).toBe('AVOID');
  });

  it('does not let a prior sentence\'s marker leak into the next sentence', () => {
    // "wants a freestanding soaking tub" is its own sentence with its own MUST marker,
    // not accidentally inheriting AVOID from the following sentence.
    expect(find(result.criteria, 'bathroom', 'freestanding_soaking_tub')?.requirement).toBe('MUST');
  });

  it('gives brand/style claims a lower confidence than plain feature mentions', () => {
    const subZero = find(result.criteria, 'appliances', 'sub_zero');
    const mediaRoom = find(result.criteria, 'entertainment', 'media_room');
    expect(subZero!.confidence).toBeLessThan(mediaRoom!.confidence);
  });
});

describe('KeywordPreferenceParser - explicit AVOID phrasing', () => {
  const parser = new KeywordPreferenceParser();

  it('classifies "does not want X" as AVOID', () => {
    const result = parser.parse('The buyer does not want a green kitchen.');
    expect(find(result.criteria, 'kitchen', 'green_kitchen')?.requirement).toBe('AVOID');
  });

  it('classifies "without a pool" as AVOID', () => {
    const result = parser.parse('Looking for a quiet street without a spa.');
    expect(find(result.criteria, 'pool_spa', 'spa')?.requirement).toBe('AVOID');
  });
});
