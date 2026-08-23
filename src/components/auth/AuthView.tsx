'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AuthViewProps {
  defaultMode?: 'login' | 'register';
  onSuccess?: () => void;
  onOpenTasteProfiler?: () => void;
  isModal?: boolean;
}

export function AuthView({
  defaultMode = 'login',
  onSuccess,
  onOpenTasteProfiler,
  isModal = false,
}: AuthViewProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const { signInWithOAuth } = useAuth();

  const handleOAuth = async (provider: 'google' | 'github') => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await signInWithOAuth(provider);
      if (error) {
        setErrorMsg(error);
        setLoading(false);
      }
      // If successful, the page will redirect to OAuth provider
    } catch (err: any) {
      setErrorMsg(err.message || 'Bir hata oluştu.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full space-y-4">
      {/* Error Message */}
      {errorMsg && (
        <div className="p-3 bg-red-500/10 border-l-4 border-red-500  text-red-400 text-xs font-bold font-mono">
          {errorMsg}
        </div>
      )}

      {/* Google OAuth Button */}
      <button
        type="button"
        onClick={() => handleOAuth('google')}
        disabled={loading}
        className="w-full py-4 min-h-[56px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm font-black uppercase tracking-wider font-mono border-2  border-white  shadow-[4px_4px_0px_#000000] cursor-pointer flex items-center justify-center gap-3 transition-transform active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>{loading ? 'YÖNLENDİRİLİYOR...' : 'GOOGLE İLE GİRİŞ YAP'}</span>
      </button>

      {/* Security & Terms Footnote */}
      <div className="pt-4 text-center text-[11px] text-neutral-500 font-mono space-y-1.5">
        <p className="flex items-center justify-center gap-1">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>256-Bit SSL Güvenli Sinefil Doğrulaması</span>
        </p>
        <p className="leading-relaxed px-4">
          Devam ederek{' '}
          <Link href="/kullanim" className=" text-[#EF4444] underline font-bold">
            Kullanım Şartları
          </Link>{' '}
          ve{' '}
          <Link href="/gizlilik" className=" text-[#EF4444] underline font-bold">
            Gizlilik İlkeleri
          </Link>
          &apos;ni kabul etmiş olursunuz.
        </p>
      </div>
    </div>
  );
}
