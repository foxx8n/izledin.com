'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

/**
 * S15: persists the KVKK e-posta açık rızası (/acik-riza §3) into
 * profiles.digest_opt_in. The consent copy lives on the server-rendered page;
 * this island only owns the write.
 */
export function DigestConsentButton() {
  const { user, profile, updateUserProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <p className="text-xs text-neutral-400 font-mono">
        Onayı kaydetmek için üye girişi yapmış olmalısın.
      </p>
    );
  }

  const opted = profile?.digestOptIn || saved;

  if (opted) {
    return (
      <p
        className="text-xs font-black uppercase tracking-wider text-emerald-400"
        role="status"
      >
        Açık rızan kayıtlı — haftalık bülten aktif.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={saving}
        onClick={async () => {
          setError(null);
          setSaving(true);
          try {
            const result = await updateUserProfile({ digestOptIn: true });
            if (result.success) setSaved(true);
            else setError(result.error || 'Kaydedilemedi.');
          } catch {
            setError('Kaydedilemedi. Lütfen tekrar deneyin.');
          } finally {
            setSaving(false);
          }
        }}
        className="px-6 py-3 min-h-[44px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-black uppercase tracking-wider border-2 border-[#404040] shadow-[3px_3px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
      >
        {saving ? 'Kaydediliyor...' : 'Bu rızaya onay veriyorum'}
      </button>
      {error && (
        <p className="text-xs font-bold text-red-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
