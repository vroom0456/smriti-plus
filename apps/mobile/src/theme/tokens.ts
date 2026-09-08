/**
 * SMRITI+ Design System — Theme & Tokens
 *
 * Apple HIG–inspired, elderly-first design.
 * High-contrast palette, SF Pro Display, 56dp+ touch targets.
 */

import { Platform } from 'react-native';

export const fontFamily = {
  display: Platform.select({
    ios: 'SF Pro Display',
    web: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    default: 'sans-serif',
  }),
  text: Platform.select({
    ios: 'SF Pro Text',
    web: '"SF Pro Text", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    default: 'sans-serif',
  }),
  mono: Platform.select({
    ios: 'SF Mono',
    web: '"SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    default: 'monospace',
  }),
};

export const colors = {
  // Core brand — Apple Minimalist
  navy: '#0F172A',
  navyDark: '#020617',
  navyMid: '#1E293B',
  teal: '#0071E3',             // Apple System Blue (signature primary)
  tealLight: '#38BDF8',
  tealDeep: '#0055B3',

  // Backgrounds — Clean Apple Canvas (No muddy tints)
  background: '#F8F9FB',       // Crisp, ultra-clean off-white Apple canvas
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  mintBg: '#F1F5F9',           // Neutral light surface
  mintBgLight: '#F8FAFC',

  // Text — High clarity typography
  textDark: '#0F172A',
  textMed: '#334155',
  muted: '#64748B',
  mutedLight: '#94A3B8',

  // Status / feedback — Apple HIG
  success: '#34C759',          // Apple System Green
  successLight: '#4ADE80',
  successBg: 'rgba(52, 199, 89, 0.10)',
  accent: '#FF3B30',           // Apple System Red
  accentLight: '#FF6961',
  accentBg: 'rgba(255, 59, 48, 0.08)',
  error: '#FF3B30',
  errorBg: 'rgba(255, 59, 48, 0.08)',
  gold: '#FF9500',            // Apple System Amber/Orange
  goldBg: 'rgba(255, 149, 0, 0.10)',

  // Apple system palette
  systemBlue: '#0071E3',
  systemBlueBg: 'rgba(0, 113, 227, 0.08)',
  systemIndigo: '#5856D6',
  systemPurple: '#AF52DE',
  coral: '#FF2D55',
  coralBg: 'rgba(255, 45, 85, 0.08)',

  // Borders & Glass
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(15, 23, 42, 0.45)',

  // Glass surfaces
  glassWhite: 'rgba(255, 255, 255, 0.94)',
  glassCard: 'rgba(255, 255, 255, 0.98)',
  glassBorder: 'rgba(226, 232, 240, 0.80)',
  glassTeal: 'rgba(0, 113, 227, 0.06)',
  glassTealBorder: 'rgba(0, 113, 227, 0.18)',
  glassBlue: 'rgba(0, 113, 227, 0.06)',

  // Computed convenience
  tealBg: 'rgba(0, 113, 227, 0.08)',
  cardBackground: '#FFFFFF',
  cardBg: '#FFFFFF',
};

export const typography = {
  // ── Elderly scale ── generous 20px+ body, 28-36px headings
  elderly: {
    h1: {
      fontFamily: fontFamily.display,
      fontSize: 34,
      fontWeight: '800' as const,
      lineHeight: 42,
      letterSpacing: -0.7,
    },
    h2: {
      fontFamily: fontFamily.display,
      fontSize: 27,
      fontWeight: '700' as const,
      lineHeight: 35,
      letterSpacing: -0.5,
    },
    h3: {
      fontFamily: fontFamily.display,
      fontSize: 22,
      fontWeight: '700' as const,
      lineHeight: 30,
      letterSpacing: -0.3,
    },
    body: {
      fontFamily: fontFamily.text,
      fontSize: 20,
      fontWeight: '400' as const,
      lineHeight: 30,
    },
    bodyBold: {
      fontFamily: fontFamily.display,
      fontSize: 20,
      fontWeight: '700' as const,
      lineHeight: 30,
    },
    caption: {
      fontFamily: fontFamily.text,
      fontSize: 16,
      fontWeight: '500' as const,
      lineHeight: 24,
    },
    small: {
      fontFamily: fontFamily.text,
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    button: {
      fontFamily: fontFamily.display,
      fontSize: 20,
      fontWeight: '700' as const,
      lineHeight: 28,
      letterSpacing: 0.2,
    },
  },
  // ── Caregiver / Health Worker scale ──
  standard: {
    h1: {
      fontFamily: fontFamily.display,
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 36,
      letterSpacing: -0.4,
    },
    h2: {
      fontFamily: fontFamily.display,
      fontSize: 22,
      fontWeight: '700' as const,
      lineHeight: 30,
    },
    h3: {
      fontFamily: fontFamily.display,
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 26,
    },
    body: {
      fontFamily: fontFamily.text,
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    bodyBold: {
      fontFamily: fontFamily.display,
      fontSize: 16,
      fontWeight: '700' as const,
      lineHeight: 24,
    },
    caption: {
      fontFamily: fontFamily.text,
      fontSize: 13,
      fontWeight: '400' as const,
      lineHeight: 18,
    },
    button: {
      fontFamily: fontFamily.display,
      fontSize: 16,
      fontWeight: '700' as const,
      lineHeight: 24,
    },
  },
};

export const textSizeMultipliers = {
  standard: 1.0,
  large: 1.0,
  extra_large: 1.25,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// 56dp minimum touch targets
export const touchTargets = {
  minSize: 56,
  minSpacing: 16,
};

// Apple-style squircle border radii
export const borderRadius = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  xxl: 36,
  full: 9999,
  pill: 9999,
};

// Apple elevation shadows + diffused glow effects
export const shadows = {
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  elevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 22,
    elevation: 6,
  },
  floating: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.09,
    shadowRadius: 28,
    elevation: 8,
  },
  glowTeal: {
    shadowColor: '#0071E3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 16,
    elevation: 4,
  },
  glowCoral: {
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 16,
    elevation: 4,
  },
  glowBlue: {
    shadowColor: '#0071E3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 5,
  },
};

// Glassmorphic translucent surface helpers
export const glass = {
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: 'rgba(255, 255, 255, 0.80)',
    borderWidth: 1.5,
  },
  translucentTeal: {
    backgroundColor: 'rgba(11, 143, 132, 0.08)',
    borderColor: 'rgba(11, 143, 132, 0.22)',
    borderWidth: 1.5,
  },
  translucentBlue: {
    backgroundColor: 'rgba(0, 113, 227, 0.07)',
    borderColor: 'rgba(0, 113, 227, 0.20)',
    borderWidth: 1.5,
  },
};

export const animation = {
  fast: 140,
  normal: 240,
  slow: 380,
};
