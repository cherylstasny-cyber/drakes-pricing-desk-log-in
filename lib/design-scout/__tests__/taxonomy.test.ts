import { describe, expect, it } from 'vitest';
import { TAXONOMY, allAttributes, findAttribute, normalizeText } from '../taxonomy';

describe('taxonomy normalization', () => {
  it('lowercases and collapses whitespace', () => {
    expect(normalizeText('  Sub-Zero   Refrigerator ')).toBe('sub-zero refrigerator');
  });

  it('every category has a unique key', () => {
    const keys = TAXONOMY.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('every attribute key is unique within its category', () => {
    for (const category of TAXONOMY) {
      const keys = category.attributes.map((a) => a.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it('every attribute has at least one synonym', () => {
    for (const { attribute } of allAttributes()) {
      expect(attribute.synonyms.length).toBeGreaterThan(0);
    }
  });

  it('finds a known attribute by category+attribute key', () => {
    const attr = findAttribute('bathroom', 'clawfoot_tub');
    expect(attr?.label).toBe('Clawfoot tub');
  });

  it('keeps confirmed historic designation separate from AI-inferred historic character', () => {
    const designation = findAttribute('historic_character', 'confirmed_historic_designation');
    const character = findAttribute('historic_character', 'historic_character');
    expect(designation).toBeDefined();
    expect(character).toBeDefined();
    expect(designation?.key).not.toBe(character?.key);
    expect(designation?.highEvidenceBar).toBe(true);
  });

  it('requires a high evidence bar for brand claims', () => {
    const subZero = findAttribute('appliances', 'sub_zero');
    expect(subZero?.highEvidenceBar).toBe(true);
  });
});
