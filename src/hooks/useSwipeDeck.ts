"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MovieMateMatch } from "@/types";

/**
 * Shared swipe-deck mechanics for every İzdaş deck surface (matches page +
 * home). Owns: index advancement rules, typed undo history, and DELAYED
 * COMMIT of swipe side effects.
 *
 * Why delayed commits (S3, MATCHING-PIVOT-PLAN.md §S3): the previous decks
 * persisted likes/passes to Postgres INSTANTLY, so the undo button was a
 * visual lie — undoing a pass re-showed a card whose 'passed' pair row
 * survived server-side (gone from the radar on next fetch), and undoing a
 * like left a pending match request the other person could see. Here, every
 * swipe starts a short undo window; the network write runs only when the
 * window closes. Undo inside the window cancels the write BEFORE any row
 * exists: like->undo leaves no pending row (network-tab verifiable).
 *
 * Index contract (mirrors the original deck semantics):
 *  - LIKE: card stays in the caller's array; index advances past it.
 *  - PASS: caller removes the card from the array via onPassGesture, so the
 *          next card slides into the same slot; index does NOT move.
 */

export type DeckSwipeType = "like" | "pass";

export interface DeckHistoryEntry {
  key: string;
  type: DeckSwipeType;
  /** Slot the card occupied when the gesture happened. */
  index: number;
  match: MovieMateMatch;
}

interface PendingSwipe {
  timer: ReturnType<typeof setTimeout>;
  fired: boolean;
  type: DeckSwipeType;
  match: MovieMateMatch;
}

interface UseSwipeDeckParams {
  /**
   * Runs once, undoWindowMs after the gesture. Persist the like here
   * (requestMatch 'pending'). Must not throw into the hook.
   */
  onLikeCommit: (match: MovieMateMatch) => void | Promise<void>;
  /**
   * Visual removal from the caller's card array — runs immediately on the
   * gesture so the UI reacts instantly.
   */
  onPassGesture: (match: MovieMateMatch) => void;
  /**
   * Runs once, undoWindowMs after the gesture. Persist the pass here.
   */
  onPassCommit: (match: MovieMateMatch) => void | Promise<void>;
  /**
   * Runs on EVERY pass-undo: the caller must re-insert entry.match back into
   * their card array at entry.index. Fires whether or not the commit had
   * already run (a re-like of a committed pass surfaces the existing
   * sticky-rejection notice, which is honest UX).
   */
  onPassUndo: (entry: DeckHistoryEntry) => void;
  undoWindowMs?: number;
}

let swipeSeq = 0;

export function useSwipeDeck({
  onLikeCommit,
  onPassGesture,
  onPassCommit,
  onPassUndo,
  undoWindowMs = 2500,
}: UseSwipeDeckParams) {
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState<DeckHistoryEntry[]>([]);

  const pendingRef = useRef<Map<string, PendingSwipe>>(new Map());

  // Latest-callback refs: callers pass inline closures; timers must never
  // fire a stale one.
  const likeRef = useRef(onLikeCommit);
  const passGestureRef = useRef(onPassGesture);
  const passCommitRef = useRef(onPassCommit);
  const passUndoRef = useRef(onPassUndo);
  likeRef.current = onLikeCommit;
  passGestureRef.current = onPassGesture;
  passCommitRef.current = onPassCommit;
  passUndoRef.current = onPassUndo;

  // Flush any pending swipe commits immediately (e.g. on unmount or beforeunload)
  const flushPending = useCallback(() => {
    pendingRef.current.forEach((pending) => {
      if (!pending.fired) {
        clearTimeout(pending.timer);
        pending.fired = true;
        if (pending.type === "like") {
          likeRef.current(pending.match);
        } else {
          passCommitRef.current(pending.match);
        }
      }
    });
    pendingRef.current.clear();
  }, []);

  // Flush on unmount and before page reload/navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushPending();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      flushPending();
    };
  }, [flushPending]);

  const registerSwipe = useCallback(
    (type: DeckSwipeType, match: MovieMateMatch, atIndex: number) => {
      swipeSeq += 1;
      const key = `swipe_${swipeSeq}`;
      const entry: DeckHistoryEntry = { key, type, index: atIndex, match };

      const pending: PendingSwipe = {
        fired: false,
        type,
        match,
        timer: setTimeout(() => {
          pendingRef.current.delete(key);
          pending.fired = true;
          if (type === "like") likeRef.current(match);
          else passCommitRef.current(match);
        }, undoWindowMs),
      };
      pendingRef.current.set(key, pending);

      setHistory((prev) => [...prev, entry]);
      // Like advances past the stationary card; pass lets the next card
      // slide into the vacated slot, so the index holds.
      if (type === "like") setIndex(atIndex + 1);

      if (type === "pass") passGestureRef.current(match);
    },
    [undoWindowMs],
  );

  /** Like the card at `atIndex` (defaults to the current index). */
  const swipeLike = useCallback(
    (match: MovieMateMatch, atIndex?: number) =>
      registerSwipe("like", match, atIndex ?? index),
    [registerSwipe, index],
  );

  /** Pass the card at `atIndex` (defaults to the current index). */
  const swipePass = useCallback(
    (match: MovieMateMatch, atIndex?: number) =>
      registerSwipe("pass", match, atIndex ?? index),
    [registerSwipe, index],
  );

  // Mirror for synchronous reads inside undo() (state updates are async).
  const historyRef = useRef<DeckHistoryEntry[]>([]);
  historyRef.current = history;

  const undo = useCallback((): boolean => {
    const prev = historyRef.current;
    if (prev.length === 0) return false;
    const last = prev[prev.length - 1];
    historyRef.current = prev.slice(0, -1);
    setHistory(prev.slice(0, -1));

    // Cancel the deferred write if it has not run yet — this is the whole
    // point of S3: an undone swipe leaves NO database row behind.
    const pending = pendingRef.current.get(last.key);
    if (pending && !pending.fired) {
      clearTimeout(pending.timer);
      pendingRef.current.delete(last.key);
      pending.fired = true;
    }

    if (last.type === "pass") {
      passUndoRef.current(last);
    }
    setIndex(last.index);
    return true;
  }, []);

  const reset = useCallback(() => {
    pendingRef.current.forEach((p) => clearTimeout(p.timer));
    pendingRef.current.clear();
    setHistory([]);
    setIndex(0);
  }, []);

  return {
    index,
    setIndex,
    history,
    canUndo: history.length > 0,
    swipeLike,
    swipePass,
    undo,
    reset,
  };
}
