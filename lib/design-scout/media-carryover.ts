import type { ListingRaw, PropertyTrait } from './types';

export type ContentSource = 'current' | 'carried_over';

export type PreviousListingContent = {
  remarks: string;
  photoCaptions: string[];
};

export type EffectiveListingContent = {
  listing: ListingRaw;
  remarksSource: ContentSource;
  photoCaptionsSource: ContentSource;
};

/**
 * Each time a listing is checked, prefer whatever data actually came back
 * this pass. When a re-check turns up no new remarks or no new photos
 * (e.g. an agent hasn't updated the listing since the last check), fall
 * back to the last known content for that field instead of losing the
 * evidence -- unless the agent has turned that fallback off for this
 * property (reusePreviousMedia = false), in which case only what came
 * back this pass is used, even if that means less evidence than before.
 */
export function resolveEffectiveContent(
  current: ListingRaw,
  previous: PreviousListingContent | null,
  reusePreviousMedia: boolean
): EffectiveListingContent {
  const hasNewRemarks = current.remarks.trim().length > 0;
  const hasNewPhotos = current.photoCaptions.length > 0;
  const canFallBack = reusePreviousMedia && previous !== null;

  const remarksSource: ContentSource = hasNewRemarks || !canFallBack ? 'current' : 'carried_over';
  const photoCaptionsSource: ContentSource = hasNewPhotos || !canFallBack ? 'current' : 'carried_over';

  return {
    listing: {
      ...current,
      remarks: remarksSource === 'carried_over' ? previous!.remarks : current.remarks,
      photoCaptions: photoCaptionsSource === 'carried_over' ? previous!.photoCaptions : current.photoCaptions,
    },
    remarksSource,
    photoCaptionsSource,
  };
}

/**
 * Traits derived from carried-over content aren't fresh evidence, even
 * though they're still the best evidence available -- retag them as
 * 'historical' (rather than 'photo'/'remarks'/'structured') so the
 * Property Intelligence Record is honest about what was actually checked
 * this pass versus what's being carried forward.
 */
export function applyCarryoverProvenance(
  traits: PropertyTrait[],
  remarksSource: ContentSource,
  photoCaptionsSource: ContentSource
): PropertyTrait[] {
  if (remarksSource === 'current' && photoCaptionsSource === 'current') return traits;

  return traits.map((trait) => {
    const fromCarriedOverPhoto = trait.sourceType === 'photo' && photoCaptionsSource === 'carried_over';
    const fromCarriedOverRemarks = trait.sourceType === 'remarks' && remarksSource === 'carried_over';
    const fromCarriedOverEither = trait.sourceType === 'structured' && (remarksSource === 'carried_over' || photoCaptionsSource === 'carried_over');

    if (!fromCarriedOverPhoto && !fromCarriedOverRemarks && !fromCarriedOverEither) return trait;

    return {
      ...trait,
      sourceType: 'historical',
      evidence: `${trait.evidence} (carried over -- no new photos/remarks on this check)`,
    };
  });
}
