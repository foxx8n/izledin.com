/**
 * NATIVE BRIDGE FOR CAPACITOR (iOS & Android)
 *
 * Provides safe, universal bridges to native device capabilities:
 * - Native Taptic Engine & Haptics (replaces Apple-blocked navigator.vibrate)
 * - Status bar styling & safe area alignment
 * - Native Splash Screen dismissal
 * - Android hardware back-button navigation
 */

import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapApp } from '@capacitor/app';

export const isNativeApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  return Capacitor.isNativePlatform();
};

export const getNativePlatform = (): 'ios' | 'android' | 'web' => {
  if (typeof window === 'undefined') return 'web';
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
};

/**
 * Universal Haptic Trigger
 * Uses Apple Taptic Engine / Android Haptics when inside native app,
 * and falls back to navigator.vibrate on web.
 */
export async function triggerHaptic(
  level: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'medium'
): Promise<void> {
  if (typeof window === 'undefined') return;

  if (isNativeApp()) {
    try {
      switch (level) {
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'success':
          await Haptics.notification({ type: NotificationType.Success });
          break;
        case 'warning':
          await Haptics.notification({ type: NotificationType.Warning });
          break;
        case 'error':
          await Haptics.notification({ type: NotificationType.Error });
          break;
      }
      return;
    } catch {
      // Ignore native haptics failure
    }
  }

  // Web fallback (Android Chrome, etc.)
  if ('vibrate' in navigator) {
    try {
      const patterns: Record<string, number | number[]> = {
        light: 15,
        medium: 30,
        heavy: 60,
        success: [20, 40, 20],
        warning: [40, 60, 40],
        error: [60, 40, 60, 40, 60],
      };
      navigator.vibrate(patterns[level] || 30);
    } catch {
      // Ignore web vibration failure
    }
  }
}

/**
 * Initialize Native App Shell (Status Bar, Splash Screen, Back Button)
 * Safe to call on client-side root mount.
 */
export async function initializeNativeShell(): Promise<void> {
  if (!isNativeApp()) return;

  try {
    // 1. Configure Dark Status Bar
    await StatusBar.setStyle({ style: Style.Dark });
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#0A0A0A' });
      await StatusBar.setOverlaysWebView({ overlay: false });
    }

    // 2. Hide Splash Screen smoothly
    await SplashScreen.hide({ fadeOutDuration: 300 });

    // 3. Android Back Button handling
    CapApp.addListener('backButton', ({ canGoBack }) => {
      // If modal or sheet is open, Esc triggers it; otherwise navigate back
      if (canGoBack && window.location.pathname !== '/') {
        window.history.back();
      } else {
        CapApp.exitApp();
      }
    });
  } catch (err) {
    console.warn('[NativeBridge] Init warning:', err);
  }
}
