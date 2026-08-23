import { createClient } from '@/lib/supabase/client';

export type ReportReason = 'intent_breach' | 'false_profile' | 'harassment';

export interface ReportResult {
  accepted: boolean;
  targetBlocked: boolean;
}

/**
 * Files a report against another user through the submit_user_report RPC,
 * which atomically:
 *   1. stores the report (one per reporter→target pair),
 *   2. maintains strike/integrity metrics server-side (first report only —
 *      duplicates are NOT re-penalized),
 *   3. terminates ("blocks") this reporter's match row with the target.
 *
 * Returns:
 *   - accepted=false → duplicate: this reporter already filed against the target.
 *   - targetBlocked=true → the target just crossed the 3-strike threshold and
 *     was auto-suspended by the server.
 * or null on failure.
 */
export async function submitUserReport(
  reportedUserId: string,
  reason: ReportReason,
  matchId?: string
): Promise<ReportResult | null> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('submit_user_report', {
    p_reported_user_id: reportedUserId,
    p_reason: reason,
    p_match_id: matchId ?? null,
  });

  if (error) {
    console.error('submit_user_report failed:', error.message);
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;

  return {
    accepted: Boolean(row.accepted),
    targetBlocked: Boolean(row.target_blocked),
  };
}
