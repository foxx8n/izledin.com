import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * S15 weekly İZDAŞ radar digest (Vercel Cron → vercel.json).
 *
 * Monday 06:00 UTC = 09:00 TR. Sends ONE email per opted-in user
 * (profiles.digest_opt_in — explicit KVKK consent, default OFF) counting the
 * radar activity from the last 7 days. last_digest_sent_at is the idempotency
 * guard: a retry or overlap can never double-send within a week.
 *
 * Security: Vercel Cron automatically sends `Authorization: Bearer $CRON_SECRET`;
 * requests without it get 401. Missing RESEND_API_KEY = graceful no-op so a
 * misconfigured env never 500s the schedule.
 */

const SENDER = 'İzledin Bülten <bulten@izledin.com>';
const MAX_EMAILS_PER_RUN = 200;
const MAX_AUTH_PAGES = 20;
const DIGEST_MIN_INTERVAL_DAYS = 6;

function countTurkish(n: number): string {
  return `${n} yeni izdaş`;
}

function buildEmail(fullName: string, newIzdas: number, pendingForMe: number) {
  const lines: string[] = [];
  if (newIzdas > 0) {
    lines.push(
      `Radarında son bir haftada ${countTurkish(newIzdas)} belirdi. Sinema frekansın kesişen ${newIzdas > 1 ? 'kişiler' : 'kişi'} seni bekliyor.`,
    );
  } else {
    lines.push('Bu hafta radarında yeni bir kesişim yok — desteyi doldurmak KEŞİF sayfasındaki başyapıtlara bağlı.');
  }
  if (pendingForMe > 0) {
    lines.push(`Ayrıca onayını bekleyen ${pendingForMe} mesaj isteğin var.`);
  }

  const subject =
    newIzdas > 0
      ? `İZLEDİN — Radarında ${countTurkish(newIzdas)} var`
      : 'İZLEDİN — Haftalık radar özeti';

  const text = [
    `MERHABA ${fullName.toUpperCase()},`,
    '',
    ...lines,
    '',
    'PERDE — https://www.izledin.com/',
    'KEŞİF — https://www.izledin.com/kesif',
    '',
    'Bu e-postayı istediğin için alıyorsun. Profil ayarlarından kapatabilirsin.',
  ].join('\n');

  const html = `<div style="font-family:monospace;background:#0a0a0a;color:#fafafa;padding:32px">
  <p style="color:#ef4444;font-weight:bold;letter-spacing:2px;margin:0 0 16px">İZLEDİN.COM</p>
  <h1 style="font-size:18px;text-transform:uppercase;margin:0 0 16px">Merhaba ${escapeHtml(fullName)},</h1>
  ${lines.map((l) => `<p style="font-size:14px;line-height:1.6">${escapeHtml(l)}</p>`).join('\n  ')}
  <p style="margin-top:24px">
    <a href="https://www.izledin.com/" style="background:#dc2626;color:#fff;padding:12px 20px;text-decoration:none;font-weight:bold">PERDEYE DEVAM ET</a>
  </p>
  <p style="color:#737373;font-size:11px;margin-top:32px">Bu e-postayı istediğin için alıyorsun. Profil ayarlarından kapatabilirsin.</p>
</div>`;

  return { subject, text, html };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function GET(request: NextRequest) {
  // Vercel Cron injects this header from the CRON_SECRET env var.
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[digest] RESEND_API_KEY not configured — skipping run.');
    return NextResponse.json({ ok: true, skipped: 'RESEND_API_KEY missing' });
  }

  const admin = createAdminClient();

  // 1. Opted-in, non-banned profiles (ban filter here — auth User type does
  // not reliably expose the flag client-side).
  const { data: profiles, error: profilesError } = await admin
    .from('profiles')
    .select('id, username, full_name, digest_opt_in, last_digest_sent_at')
    .eq('digest_opt_in', true)
    .eq('is_banned', false)
    .limit(MAX_EMAILS_PER_RUN);

  if (profilesError || !profiles) {
    console.error('[digest] profile query failed:', profilesError);
    return NextResponse.json({ error: 'profile query failed' }, { status: 500 });
  }

  // 2. Emails live in auth.users — service role read via admin listUsers.
  const emailByUserId = new Map<string, string>();
  for (let page = 1; page <= MAX_AUTH_PAGES; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 500 });
    if (error || !data?.users?.length) break;
    for (const u of data.users) {
      if (u.email) emailByUserId.set(u.id, u.email);
    }
    if (data.users.length < 500) break;
  }

  const weekAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  // Constructed after the key check, so a missing key never throws here.
  const resend = new Resend(apiKey);

  let sent = 0;
  let skippedRecent = 0;
  let skippedNoEmail = 0;
  const failures: Array<{ id: string; reason: string }> = [];

  for (const p of profiles) {
    if (sent >= MAX_EMAILS_PER_RUN) break;

    const email = emailByUserId.get(p.id);
    if (!email) {
      skippedNoEmail++;
      continue;
    }
    if (
      p.last_digest_sent_at &&
      Date.now() - new Date(p.last_digest_sent_at).getTime() <
        DIGEST_MIN_INTERVAL_DAYS * 24 * 60 * 60 * 1000
    ) {
      skippedRecent++;
      continue;
    }

    // 3. Radar activity: pairs touched in the last 7 days that are matched or
    // pending — counts only, no partner names leave the platform.
    let newIzdas = 0;
    let pendingForMe = 0;
    try {
      const { data: rows, error } = await admin
        .from('movie_mate_matches')
        .select('id, status, user_id_1, user_id_2, initiator_id, updated_at')
        .or(`user_id_1.eq.${p.id},user_id_2.eq.${p.id}`)
        .in('status', ['matched', 'pending'])
        .gte('updated_at', weekAgoIso)
        .limit(500);
      if (error) throw error;
      newIzdas = rows?.length ?? 0;
      pendingForMe =
        rows?.filter(
          (r) => r.status === 'pending' && r.initiator_id !== p.id,
        ).length ?? 0;
    } catch (err) {
      failures.push({ id: p.id, reason: String(err) });
      continue;
    }

    // Zero-activity weeks still mail only when there is something pending;
    // otherwise stay silent — respect the inbox, earn the open rate.
    if (newIzdas === 0 && pendingForMe === 0) continue;

    const fullName = (p.full_name || '').trim() || p.username || 'Sinefil';
    const { subject, text, html } = buildEmail(fullName, newIzdas, pendingForMe);

    try {
      const { error: sendError } = await resend.emails.send({
        from: SENDER,
        to: [email],
        subject,
        text,
        html,
      });
      if (sendError) throw sendError;
    } catch (err) {
      failures.push({ id: p.id, reason: String(err) });
      continue;
    }

    await admin
      .from('profiles')
      .update({ last_digest_sent_at: new Date().toISOString() })
      .eq('id', p.id);
    sent++;
  }

  return NextResponse.json({
    ok: true,
    optedIn: profiles.length,
    sent,
    skippedNoEmail,
    skippedRecent,
    failures: failures.length,
  });
}
