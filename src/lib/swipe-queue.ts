/**
 * S10 guest funnel (MATCHING-PIVOT-PLAN.md §S10): pre-auth title swipes are
 * queued in localStorage and replayed into private title_swipes on the next
 * successful Google sign-in (same origin — the OAuth round-trip preserves it).
 *
 * Semantics: latest swipe wins per media_id (mirrors the DB ON CONFLICT
 * DO UPDATE contract). Replay is idempotent by construction, so a failed
 * network attempt simply leaves the queue intact for the next login.
 */
const QUEUE_KEY = "izledin_guest_swipe_queue_v1";

export interface QueuedSwipe {
  mediaId: string;
  mediaType: string;
  direction: "like" | "pass" | "super";
}

function readQueue(): QueuedSwipe[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(q: QueuedSwipe[]): void {
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  } catch {
    // Private browsing / quota — the guest funnel degrades to session-only play.
  }
}

/** Upsert by mediaId — re-swiping the same title overwrites the direction. */
export function enqueueSwipe(
  mediaId: string,
  mediaType: string,
  direction: QueuedSwipe["direction"],
): void {
  const q = readQueue().filter((s) => s.mediaId !== mediaId);
  q.push({ mediaId, mediaType, direction });
  writeQueue(q);
}

export function getQueuedSwipes(): QueuedSwipe[] {
  return readQueue();
}

export function getQueuedSwipeCount(): number {
  return readQueue().length;
}

export function clearQueuedSwipes(): void {
  try {
    window.localStorage.removeItem(QUEUE_KEY);
  } catch {}
}
