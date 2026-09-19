'use client';

import { useMemo, useState } from 'react';
import { TAXONOMY, findAttribute } from '../../../../../lib/design-scout/taxonomy';
import type { Requirement } from '../../../../../lib/design-scout/types';
import { parsePreferencesAction, createWatchAction, type CriterionInput } from '../../actions';

type Row = CriterionInput & { evidence?: string };

function label(categoryKey: string, attributeKey: string) {
  if (categoryKey === 'budget') return 'Price ceiling';
  return findAttribute(categoryKey, attributeKey)?.label ?? attributeKey;
}

export default function WatchForm({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [name, setName] = useState(`${clientName}'s Design Scout`);
  const [rawText, setRawText] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [criteria, setCriteria] = useState<Row[]>([]);
  const [interpreting, setInterpreting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [manualCategory, setManualCategory] = useState(TAXONOMY[0].key);
  const [manualRequirement, setManualRequirement] = useState<Requirement>('PREFER');
  const manualAttributes = useMemo(() => TAXONOMY.find((c) => c.key === manualCategory)?.attributes ?? [], [manualCategory]);
  const [manualAttribute, setManualAttribute] = useState(manualAttributes[0]?.key ?? '');

  async function interpret() {
    if (!rawText.trim()) return;
    setInterpreting(true);
    setError('');
    try {
      const parsed = await parsePreferencesAction(rawText);
      const nextRows: Row[] = parsed.criteria.map((c) => ({
        categoryKey: c.categoryKey,
        attributeKey: c.attributeKey,
        requirement: c.requirement,
        targetValue: c.targetValue,
        evidence: c.evidence,
      }));
      setCriteria((existing) => {
        const existingKeys = new Set(existing.map((r) => `${r.categoryKey}:${r.attributeKey}`));
        const merged = [...existing];
        for (const row of nextRows) {
          const key = `${row.categoryKey}:${row.attributeKey}`;
          if (!existingKeys.has(key)) merged.push(row);
        }
        return merged;
      });
      if (parsed.priceMax !== undefined && !priceMax) setPriceMax(String(parsed.priceMax));
      if (parsed.priceMin !== undefined && !priceMin) setPriceMin(String(parsed.priceMin));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not interpret that description.');
    } finally {
      setInterpreting(false);
    }
  }

  function addManual() {
    if (!manualAttribute) return;
    const key = `${manualCategory}:${manualAttribute}`;
    if (criteria.some((r) => `${r.categoryKey}:${r.attributeKey}` === key)) return;
    setCriteria((existing) => [...existing, { categoryKey: manualCategory, attributeKey: manualAttribute, requirement: manualRequirement }]);
  }

  function removeCriterion(index: number) {
    setCriteria((existing) => existing.filter((_, i) => i !== index));
  }

  function changeRequirement(index: number, requirement: Requirement) {
    setCriteria((existing) => existing.map((r, i) => (i === index ? { ...r, requirement } : r)));
  }

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      await createWatchAction({
        clientId,
        name,
        rawPreferences: rawText,
        priceMin: priceMin ? Number(priceMin) : undefined,
        priceMax: priceMax ? Number(priceMax) : undefined,
        criteria: criteria.map(({ evidence: _evidence, ...rest }) => rest),
      });
    } catch (e) {
      if (e instanceof Error && e.message !== 'NEXT_REDIRECT') setError(e.message);
      setSubmitting(false);
    }
  }

  const grouped: Record<Requirement, Row[]> = { MUST: [], PREFER: [], AVOID: [] };
  criteria.forEach((row) => grouped[row.requirement].push(row));

  return (
    <div className="ds-watch-form">
      <section className="panel">
        <label htmlFor="watch-name">Watch name</label>
        <input id="watch-name" value={name} onChange={(e) => setName(e.target.value)} />

        <label htmlFor="raw-text">Describe the home {clientName.split(' ')[0]} is waiting for</label>
        <textarea
          id="raw-text"
          rows={5}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Susan wants a turnkey architectural home in Willow Bend under $2 million. She likes Frank Lloyd Wright/Prairie influence, mature trees, warm natural-wood kitchens, Sub-Zero appliances, a refrigerated glass wine room and a movie/media room..."
        />
        <div className="form-actions">
          <button type="button" className="button button-secondary" onClick={interpret} disabled={interpreting || !rawText.trim()}>
            {interpreting ? 'Interpreting…' : 'Interpret description'}
          </button>
        </div>

        <div className="ds-price-row">
          <div>
            <label htmlFor="price-min">Price min (optional)</label>
            <input id="price-min" type="number" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
          </div>
          <div>
            <label htmlFor="price-max">Price max</label>
            <input id="price-max" type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
          </div>
        </div>
      </section>

      <section className="panel">
        <p className="eyebrow">Or select attributes manually</p>
        <div className="ds-manual-row">
          <select
            value={manualCategory}
            onChange={(e) => {
              setManualCategory(e.target.value);
              setManualAttribute(TAXONOMY.find((c) => c.key === e.target.value)?.attributes[0]?.key ?? '');
            }}
          >
            {TAXONOMY.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
          <select value={manualAttribute} onChange={(e) => setManualAttribute(e.target.value)}>
            {manualAttributes.map((a) => (
              <option key={a.key} value={a.key}>{a.label}</option>
            ))}
          </select>
          <select value={manualRequirement} onChange={(e) => setManualRequirement(e.target.value as Requirement)}>
            <option value="MUST">Must have</option>
            <option value="PREFER">Preferred</option>
            <option value="AVOID">Avoid</option>
          </select>
          <button type="button" className="button button-secondary" onClick={addManual}>Add</button>
        </div>
      </section>

      <section className="panel" aria-labelledby="interpretation-title">
        <p className="eyebrow">Interpretation -- review before starting</p>
        <h2 id="interpretation-title">Structured criteria</h2>
        {criteria.length === 0 && <p className="lede">Nothing yet. Interpret a description or add attributes manually above.</p>}
        {(['MUST', 'PREFER', 'AVOID'] as Requirement[]).map((req) =>
          grouped[req].length > 0 ? (
            <div key={req} className="ds-criteria-group">
              <h3 className={`ds-tag ds-tag-${req.toLowerCase()}`}>{req}</h3>
              <ul className="ds-criteria-list">
                {criteria.map((row, index) =>
                  row.requirement === req ? (
                    <li key={`${row.categoryKey}:${row.attributeKey}`}>
                      <span>{label(row.categoryKey, row.attributeKey)}</span>
                      <select value={row.requirement} onChange={(e) => changeRequirement(index, e.target.value as Requirement)}>
                        <option value="MUST">Must have</option>
                        <option value="PREFER">Preferred</option>
                        <option value="AVOID">Avoid</option>
                      </select>
                      <button type="button" className="icon-button" onClick={() => removeCriterion(index)} aria-label={`Remove ${label(row.categoryKey, row.attributeKey)}`}>Remove</button>
                    </li>
                  ) : null
                )}
              </ul>
            </div>
          ) : null
        )}

        {error && <p className="error" role="alert">{error}</p>}
        <div className="form-actions">
          <button type="button" className="button button-primary" onClick={submit} disabled={submitting || criteria.length === 0}>
            {submitting ? 'Starting…' : 'Start Design Scout'}
          </button>
        </div>
      </section>
    </div>
  );
}
