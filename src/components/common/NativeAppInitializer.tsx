'use client';

import { useEffect } from 'react';
import { initializeNativeShell } from '@/lib/native-bridge';

export function NativeAppInitializer() {
  useEffect(() => {
    initializeNativeShell();
  }, []);

  return null;
}
