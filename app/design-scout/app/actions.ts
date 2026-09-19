'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '../../../lib/supabase/server';
import { getOrCreateWorkspaceId } from '../../../lib/workspace';
import { createKeywordPreferenceParser } from '../../../lib/design-scout/parser';
import { createSyntheticListingSource, createKeywordTraitExtractor } from '../../../lib/design-scout/listing-adapter';
import { resolveEffectiveContent, applyCarryoverProvenance } from '../../../lib/design-scout/media-carryover';
import { scoreProperty, shouldAlert, shouldSuppressDuplicateAlert } from '../../../lib/design-scout/matching';
import { buildBuyerAlertEmail, buildAgentAlertNotice, createNotificationAdapter } from '../../../lib/design-scout/notify';
import type { ParsedPreferences, WatchCriterion } from '../../../lib/design-scout/types';

async function requireWorkspace() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/design-scout/app');
  const workspaceId = await getOrCreateWorkspaceId(supabase, user.id, user.email ?? 'agent');
  return { supabase, user, workspaceId };
}

export async function enableDesignScoutBeta() {
  const { supabase, workspaceId } = await requireWorkspace();
  const { error } = await supabase
    .from('product_subscriptions')
    .upsert({ workspace_id: workspaceId, product: 'design_scout', status: 'active' }, { onConflict: 'workspace_id,product' });
  if (error) throw new Error(error.message);
  revalidatePath('/design-scout/app');
}

export async function parsePreferencesAction(rawText: string): Promise<ParsedPreferences> {
  return createKeywordPreferenceParser().parse(rawText);
}

export async function createClientAction(formData: FormData) {
  const { supabase, user, workspaceId } = await requireWorkspace();
  const fullName = String(formData.get('fullName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim() || null;
  if (!fullName || !email) throw new Error('Name and email are required.');

  const { data, error } = await supabase
    .from('ds_clients')
    .insert({ workspace_id: workspaceId, full_name: fullName, email, phone, created_by: user.id })
    .select('id')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Could not create client.');

  revalidatePath('/design-scout/app');
  redirect(`/design-scout/app/watches/new?clientId=${data.id}`);
}

export type CriterionInput = {
  categoryKey: string;
  attributeKey: string;
  targetValue?: string;
  requirement: 'MUST' | 'PREFER' | 'AVOID';
  weight?: number;
  confidenceThreshold?: number;
};

export async function createWatchAction(input: {
  clientId: string;
  name: string;
  rawPreferences: string;
  priceMin?: number;
  priceMax?: number;
  alertThreshold?: number;
  criteria: CriterionInput[];
}) {
  const { supabase, user, workspaceId } = await requireWorkspace();

  const { data: watch, error } = await supabase
    .from('ds_watches')
    .insert({
      workspace_id: workspaceId,
      client_id: input.clientId,
      name: input.name,
      raw_preferences: input.rawPreferences,
      price_min: input.priceMin ?? null,
      price_max: input.priceMax ?? null,
      alert_threshold: input.alertThreshold ?? 70,
      created_by: user.id,
    })
    .select('id')
    .single();
  if (error || !watch) throw new Error(error?.message ?? 'Could not create watch.');

  if (input.criteria.length > 0) {
    const rows = input.criteria.map((c) => ({
      watch_id: watch.id,
      category_key: c.categoryKey,
      attribute_key: c.attributeKey,
      target_value: c.targetValue ?? null,
      requirement: c.requirement,
      weight: c.weight ?? 1,
      confidence_threshold: c.confidenceThreshold ?? 0.6,
    }));
    const { error: criteriaError } = await supabase.from('ds_watch_criteria').insert(rows);
    if (criteriaError) throw new Error(criteriaError.message);
  }

  revalidatePath('/design-scout/app');
  redirect(`/design-scout/app/watches/${watch.id}`);
}

export async function updateWatchStatusAction(watchId: string, status: 'active' | 'paused' | 'archived') {
  const { supabase } = await requireWorkspace();
  const { error } = await supabase.from('ds_watches').update({ status }).eq('id', watchId);
  if (error) throw new Error(error.message);
  revalidatePath('/design-scout/app');
  revalidatePath(`/design-scout/app/watches/${watchId}`);
}

/**
 * Agent-facing override for the photo/remarks carryover behavior on one
 * property. Off means: only ever use what a check actually returns, even
 * if that's less evidence than before (e.g. the agent knows the home was
 * renovated since the last photos and doesn't want stale evidence reused).
 */
export async function setPropertyMediaReuseAction(propertyId: string, reuse: boolean, watchId: string) {
  const { supabase } = await requireWorkspace();
  const { error } = await supabase.from('ds_properties').update({ reuse_previous_media: reuse }).eq('id', propertyId);
  if (error) throw new Error(error.message);
  revalidatePath(`/design-scout/app/watches/${watchId}`);
}

export async function duplicateWatchAction(watchId: string) {
  const { supabase, user, workspaceId } = await requireWorkspace();

  const { data: original, error: fetchError } = await supabase.from('ds_watches').select('*').eq('id', watchId).single();
  if (fetchError || !original) throw new Error(fetchError?.message ?? 'Watch not found.');

  const { data: criteria, error: criteriaFetchError } = await supabase
    .from('ds_watch_criteria')
    .select('category_key, attribute_key, target_value, requirement, weight, confidence_threshold')
    .eq('watch_id', watchId);
  if (criteriaFetchError) throw new Error(criteriaFetchError.message);

  const { data: copy, error: insertError } = await supabase
    .from('ds_watches')
    .insert({
      workspace_id: workspaceId,
      client_id: original.client_id,
      name: `${original.name} (copy)`,
      raw_preferences: original.raw_preferences,
      price_min: original.price_min,
      price_max: original.price_max,
      alert_threshold: original.alert_threshold,
      created_by: user.id,
    })
    .select('id')
    .single();
  if (insertError || !copy) throw new Error(insertError?.message ?? 'Could not duplicate watch.');

  if (criteria && criteria.length > 0) {
    await supabase.from('ds_watch_criteria').insert(criteria.map((c) => ({ ...c, watch_id: copy.id })));
  }

  revalidatePath('/design-scout/app');
  redirect(`/design-scout/app/watches/${copy.id}`);
}

/**
 * Demo/vertical-slice action: runs the full pipeline against synthetic test
 * listings only (no live MLS feed is connected -- see
 * docs/design-scout/DATA_SOURCE_ABSTRACTION.md). A property is analyzed
 * once and stored on ds_properties/ds_property_traits, then scored against
 * this one watch; the same stored traits would be reused for every other
 * watch in the workspace rather than re-analyzed per client.
 */
export async function runDemoMatchingAction(watchId: string) {
  const { supabase, workspaceId } = await requireWorkspace();

  const { data: watch, error: watchError } = await supabase.from('ds_watches').select('*').eq('id', watchId).single();
  if (watchError || !watch) throw new Error(watchError?.message ?? 'Watch not found.');

  const { data: client } = await supabase.from('ds_clients').select('id, full_name, email').eq('id', watch.client_id).single();
  const { data: criteriaRows, error: criteriaError } = await supabase
    .from('ds_watch_criteria')
    .select('id, category_key, attribute_key, target_value, requirement, weight, confidence_threshold')
    .eq('watch_id', watchId);
  if (criteriaError) throw new Error(criteriaError.message);

  const criteria: WatchCriterion[] = (criteriaRows ?? []).map((c) => ({
    id: c.id,
    categoryKey: c.category_key,
    attributeKey: c.attribute_key,
    targetValue: c.target_value ?? undefined,
    requirement: c.requirement,
    weight: Number(c.weight),
    confidenceThreshold: Number(c.confidence_threshold),
  }));

  const listingSource = createSyntheticListingSource();
  const traitExtractor = createKeywordTraitExtractor();
  const listings = await listingSource.fetchEligibleListings();

  const summaries: Array<{ address: string; score: number; passed: boolean; alerted: boolean }> = [];

  for (const listing of listings) {
    const { data: existingProperty } = await supabase
      .from('ds_properties')
      .select('raw_source, reuse_previous_media')
      .eq('workspace_id', workspaceId)
      .eq('external_listing_id', listing.externalId)
      .maybeSingle();

    const previousContent = existingProperty?.raw_source
      ? { remarks: existingProperty.raw_source.remarks ?? '', photoCaptions: existingProperty.raw_source.photoCaptions ?? [] }
      : null;
    const reusePreviousMedia = existingProperty?.reuse_previous_media ?? true;
    const effective = resolveEffectiveContent(listing, previousContent, reusePreviousMedia);

    const { data: property, error: propertyError } = await supabase
      .from('ds_properties')
      .upsert(
        {
          workspace_id: workspaceId,
          external_listing_id: listing.externalId,
          address_line1: listing.addressLine1,
          city: listing.city,
          state: listing.state,
          postal_code: listing.postalCode ?? null,
          price: listing.price,
          status: listing.status,
          list_date: listing.listDate,
          raw_source: listing, // the true, unmerged record of what this pass actually received
          reuse_previous_media: reusePreviousMedia,
          last_remarks_source: effective.remarksSource,
          last_photo_captions_source: effective.photoCaptionsSource,
        },
        { onConflict: 'workspace_id,external_listing_id' }
      )
      .select('id')
      .single();
    if (propertyError || !property) throw new Error(propertyError?.message ?? 'Could not store property.');

    // Re-derive traits each pass from the effective (new-or-carried-over) content rather than
    // only extracting once ever -- this is what lets a genuine update supersede stale evidence
    // while a no-new-photos recheck keeps reusing the last known content instead of going blank.
    const extracted = applyCarryoverProvenance(
      traitExtractor.extractTraits(effective.listing, property.id),
      effective.remarksSource,
      effective.photoCaptionsSource
    );

    await supabase.from('ds_property_traits').delete().eq('property_id', property.id);
    if (extracted.length > 0) {
      const { error: traitsError } = await supabase.from('ds_property_traits').insert(
        extracted.map((t) => ({
          property_id: t.propertyId,
          category_key: t.categoryKey,
          attribute_key: t.attributeKey,
          value: t.value,
          confidence: t.confidence,
          source_type: t.sourceType,
          evidence: t.evidence,
          model_version: t.modelVersion,
          analyzed_at: t.analyzedAt,
        }))
      );
      if (traitsError) throw new Error(traitsError.message);
    }
    const traits = extracted;

    const result = scoreProperty(watchId, criteria, traits.length > 0 ? traits.map((t) => ({ ...t, propertyId: property.id })) : []);

    const { data: matchRow, error: matchError } = await supabase
      .from('ds_match_results')
      .insert({
        watch_id: watchId,
        property_id: property.id,
        score: result.score,
        passed: result.passed,
        reasons: result.reasons,
        must_failures: result.mustFailures,
        avoid_matches: result.avoidMatches,
        missing_preferred: result.missingPreferred,
        scored_at: result.scoredAt,
      })
      .select('id')
      .single();
    if (matchError || !matchRow) throw new Error(matchError?.message ?? 'Could not store match result.');

    let alerted = false;
    if (shouldAlert(result, Number(watch.alert_threshold)) && client) {
      const { data: priorAlerts } = await supabase
        .from('ds_alerts')
        .select('sent_at, ds_match_results!inner(watch_id, property_id, score)')
        .eq('client_id', client.id);

      const priorForDedupe = (priorAlerts ?? [])
        .filter((a: any) => a.ds_match_results?.watch_id === watchId && a.ds_match_results?.property_id === property.id && a.sent_at)
        .map((a: any) => ({ propertyId: property.id, watchId, score: Number(a.ds_match_results.score), sentAt: a.sent_at }));

      if (!shouldSuppressDuplicateAlert(result, priorForDedupe)) {
        const notifier = createNotificationAdapter();
        const buyerEmail = buildBuyerAlertEmail(
          result,
          { id: property.id, addressLine1: listing.addressLine1, city: listing.city, state: listing.state, price: listing.price },
          { id: client.id, fullName: client.full_name, email: client.email },
          { id: 'agent', fullName: 'Your agent', email: 'agent@example.com', brandName: "Drake's Pricing" },
          `/design-scout/app/watches/${watchId}?property=${property.id}`
        );
        const agentNotice = buildAgentAlertNotice(result, { id: property.id, addressLine1: listing.addressLine1, city: listing.city, state: listing.state, price: listing.price }, { id: client.id, fullName: client.full_name, email: client.email });
        agentNotice.to = 'agent@example.com';

        const buyerSend = await notifier.sendBuyerAlert(buyerEmail);
        const agentSend = await notifier.sendAgentNotice(agentNotice);

        await supabase.from('ds_alerts').insert({
          match_result_id: matchRow.id,
          client_id: client.id,
          status: 'delivered',
          buyer_email_id: buyerSend.id,
          agent_email_id: agentSend.id,
          sent_at: new Date().toISOString(),
        });
        await supabase.from('ds_watches').update({ last_alert_at: new Date().toISOString() }).eq('id', watchId);
        alerted = true;
      }
    }

    summaries.push({ address: listing.addressLine1, score: result.score, passed: result.passed, alerted });
  }

  revalidatePath(`/design-scout/app/watches/${watchId}`);
  return summaries;
}
