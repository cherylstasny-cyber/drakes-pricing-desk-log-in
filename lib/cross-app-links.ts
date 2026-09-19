/**
 * Design Scout is deployed separately from Drake's Pricing Desk, so links to
 * it have to be absolute URLs to another app, not an internal route. Set
 * NEXT_PUBLIC_DESIGN_SCOUT_APP_URL once it has a real deployment URL; until
 * then this falls back to a clearly-fake placeholder so a missed env var is
 * obvious in the rendered page rather than silently broken.
 */
export const DESIGN_SCOUT_APP_URL = (process.env.NEXT_PUBLIC_DESIGN_SCOUT_APP_URL || 'https://design-scout.example.com').replace(/\/$/, '');
