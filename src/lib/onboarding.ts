import type { Profile } from '@/types';

/**
 * S11 canonical onboarding signal.
 *
 * A user counts as onboarded once their profile carries at least one Top-4
 * masterpiece — the single input every onboarding path has always required.
 * The genre questionnaire was removed in S11 (the S12 taste vector replaced
 * it as the matching signal), so genres/streaming services no longer gate
 * anything here. This predicate is the ONE source of truth: matches-page
 * auto-open and HomeDeck's needs-DNA card must never drift apart again.
 */
export function isOnboarded(profile?: Pick<Profile, 'top4Favorites'> | null): boolean {
  return Boolean(profile?.top4Favorites && profile.top4Favorites.length > 0);
}
