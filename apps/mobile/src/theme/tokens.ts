/**
 * SMRITI+ Design System — Theme & Tokens
 *
 * Production-grade healthcare design system inspired by Apple iOS Health.
 * Tailored for elderly users & cognitive-health support.
 *
 * Principles:
 * - One Screen = One Primary Purpose
 * - SF Pro Display / Apple typography stack
 * - Strict type scale (32, 26, 24, 20, 18, 17, 15, 14px)
 * - 8-point spacing grid (8, 16, 24, 32, 40, 48, 56, 64)
 * - 24px screen margins
 * - 48-64px touch targets
 * - Calm, trustworthy, high-contrast healthcare palette
 */

import { Platform } from 'react-native';

export const fontFamily = {
  display: Platform.select({
    ios: 'SF Pro Display',
    web: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
    default: 'sans-serif',
  }),
  text: Platform.select({
    ios: 'SF Pro Text',
    web: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif',
    default: 'sans-serif',
  }),
  mono: Platform.select({
    ios: 'SF Mono',
    web: '"SF Mono", Menlo, Monaco, Consolas, monospace',
    default: 'monospace',
  }),
};

export const colors = {
  // ── Core Healthcare Palette (Section 17: Restrained, calm, trustworthy) ──
  primary: '#0071E3',          // Apple System Blue (Calm trust / primary action)
  primaryDark: '#0055B3',
  primaryLight: '#EBF5FF',
  primaryMuted: 'rgba(0, 113, 227, 0.08)',

  // Supporting status
  success: '#34C759',          // Soft Green (Positive / completed)
  successBg: 'rgba(52, 199, 89, 0.10)',
  successDark: '#248A3D',

  warning: '#FF9500',          // Warm Amber (Attention needed)
  warningBg: 'rgba(255, 149, 0, 0.10)',
  warningDark: '#C77700',

  danger: '#FF3B30',           // Accessible Red (Critical / destructive)
  dangerBg: 'rgba(255, 59, 48, 0.08)',
  dangerDark: '#D70015',

  // Surfaces & Backgrounds (Section 14: Small, clear surface hierarchy)
  background: '#F8F9FA',       // Warm neutral / near-white canvas
  surface: '#FFFFFF',          // Primary surface (white)
  surfaceSecondary: '#F2F2F7', // Slightly tinted neutral surface
  surfaceElevated: '#FFFFFF',  // Elevated surface + subtle shadow

  // Typography (Section 3: Deep charcoal, never pure black everywhere)
  textDark: '#1C1C1E',         // Deep charcoal primary text
  textMed: '#3A3A3C',          // Intermediate body
  textSecondary: '#636366',    // Secondary body text
  muted: '#8E8E93',            // Tertiary text / captions
  mutedLight: '#AEAEB2',

  // Hairlines & Borders (Section 13: 1px subtle borders)
  border: '#E5E5EA',           // Standard iOS separator
  borderLight: '#F2F2F7',      // Subtle separator
  borderActive: '#0071E3',

  // System & Neutral
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.35)',

  // Legacy aliases for backward compatibility across components
  teal: '#0071E3',
  tealLight: '#EBF5FF',
  tealDeep: '#0055B3',
  tealBg: 'rgba(0, 113, 227, 0.08)',
  navy: '#1C1C1E',
  navyDark: '#000000',
  navyMid: '#2C2C2E',
  accent: '#FF3B30',
  accentLight: '#FF453A',
  accentBg: 'rgba(255, 59, 48, 0.08)',
  error: '#FF3B30',
  errorBg: 'rgba(255, 59, 48, 0.08)',
  gold: '#FF9500',
  goldBg: 'rgba(255, 149, 0, 0.10)',
  cardBackground: '#FFFFFF',
  cardBg: '#FFFFFF',
  surfaceAlt: '#F2F2F7',

  // Calm Companion Tokens (Elderly First)
  cream: '#FAF9F6',
  creamWarm: '#F5F3EF',
  tealCalm: '#0E7490',
  tealCalmBg: 'rgba(14, 116, 144, 0.08)',
  greenCalm: '#15803D',
  greenCalmBg: 'rgba(21, 128, 61, 0.10)',
  amberWarm: '#D97706',
  amberWarmBg: 'rgba(217, 119, 6, 0.10)',

  // Extended compatibility aliases
  coral: '#FF6B6B',
  systemBlue: '#0071E3',
  mintBg: 'rgba(52, 199, 89, 0.10)',
  glassCard: '#FFFFFF',
  glassBorder: '#E5E5EA',
  glassTealBorder: 'rgba(0, 113, 227, 0.25)',
  systemPurple: '#AF52DE',
  coralBg: 'rgba(255, 107, 107, 0.12)',
};

/**
 * Strict Type Scale (Section 3)
 * - Large titles: Screen Title 32px/700, Large section 26px/700, Page heading 24px/700
 * - Section hierarchy: Section heading 20px/650, Card heading 18px/600
 * - Body: Primary body 17px/400-500, Secondary body 15-16px/400, Caption 13-14px/400
 * - Elderly: 17-18px body minimum; never make essential information < 15px.
 */
export const typography = {
  elderly: {
    screenTitle: {
      fontFamily: fontFamily.display,
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 38,
      letterSpacing: -0.6,
      color: colors.textDark,
    },
    sectionHeading: {
      fontFamily: fontFamily.display,
      fontSize: 22,
      fontWeight: '600' as const,
      lineHeight: 28,
      letterSpacing: -0.4,
      color: colors.textDark,
    },
    cardHeading: {
      fontFamily: fontFamily.display,
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 24,
      letterSpacing: -0.2,
      color: colors.textDark,
    },
    body: {
      fontFamily: fontFamily.text,
      fontSize: 17,
      fontWeight: '400' as const,
      lineHeight: 26,
      color: colors.textDark,
    },
    bodyBold: {
      fontFamily: fontFamily.display,
      fontSize: 17,
      fontWeight: '600' as const,
      lineHeight: 26,
      color: colors.textDark,
    },
    secondary: {
      fontFamily: fontFamily.text,
      fontSize: 15,
      fontWeight: '400' as const,
      lineHeight: 22,
      color: colors.textSecondary,
    },
    caption: {
      fontFamily: fontFamily.text,
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 18,
      color: colors.muted,
    },
    buttonPrimary: {
      fontFamily: fontFamily.display,
      fontSize: 17,
      fontWeight: '600' as const,
      lineHeight: 24,
      letterSpacing: -0.2,
    },
    buttonSecondary: {
      fontFamily: fontFamily.display,
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 22,
      letterSpacing: -0.1,
    },

    // Legacy compatibility aliases
    h1: {
      fontFamily: fontFamily.display,
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 38,
      letterSpacing: -0.6,
    },
    h2: {
      fontFamily: fontFamily.display,
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 30,
      letterSpacing: -0.4,
    },
    h3: {
      fontFamily: fontFamily.display,
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 26,
      letterSpacing: -0.3,
    },
    small: {
      fontFamily: fontFamily.text,
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    button: {
      fontFamily: fontFamily.display,
      fontSize: 17,
      fontWeight: '600' as const,
      lineHeight: 24,
      letterSpacing: -0.2,
    },
  },

  standard: {
    screenTitle: {
      fontFamily: fontFamily.display,
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 34,
      letterSpacing: -0.4,
      color: colors.textDark,
    },
    h1: {
      fontFamily: fontFamily.display,
      fontSize: 26,
      fontWeight: '700' as const,
      lineHeight: 32,
      letterSpacing: -0.4,
    },
    h2: {
      fontFamily: fontFamily.display,
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 26,
    },
    h3: {
      fontFamily: fontFamily.display,
      fontSize: 17,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    body: {
      fontFamily: fontFamily.text,
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
      color: colors.textDark,
    },
    bodyBold: {
      fontFamily: fontFamily.display,
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    caption: {
      fontFamily: fontFamily.text,
      fontSize: 13,
      fontWeight: '400' as const,
      lineHeight: 18,
      color: colors.muted,
    },
    button: {
      fontFamily: fontFamily.display,
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 22,
    },
  },
};

/**
 * Dynamic typography helper responding to fontScale & highContrast
 */
export function getScaledTypography(fontScale: number = 1.0, highContrast: boolean = false) {
  const contrastTextColor = highContrast ? '#000000' : colors.textDark;
  const contrastSecondaryColor = highContrast ? '#1C1C1E' : colors.textSecondary;

  return {
    elderly: {
      screenTitle: {
        ...typography.elderly.screenTitle,
        fontSize: Math.round(typography.elderly.screenTitle.fontSize * fontScale),
        lineHeight: Math.round(typography.elderly.screenTitle.lineHeight * fontScale),
        color: contrastTextColor,
      },
      sectionHeading: {
        ...typography.elderly.sectionHeading,
        fontSize: Math.round(typography.elderly.sectionHeading.fontSize * fontScale),
        lineHeight: Math.round(typography.elderly.sectionHeading.lineHeight * fontScale),
        color: contrastTextColor,
      },
      cardHeading: {
        ...typography.elderly.cardHeading,
        fontSize: Math.round(typography.elderly.cardHeading.fontSize * fontScale),
        lineHeight: Math.round(typography.elderly.cardHeading.lineHeight * fontScale),
        color: contrastTextColor,
      },
      body: {
        ...typography.elderly.body,
        fontSize: Math.round(typography.elderly.body.fontSize * fontScale),
        lineHeight: Math.round(typography.elderly.body.lineHeight * fontScale),
        color: contrastTextColor,
      },
      bodyBold: {
        ...typography.elderly.bodyBold,
        fontSize: Math.round(typography.elderly.bodyBold.fontSize * fontScale),
        lineHeight: Math.round(typography.elderly.bodyBold.lineHeight * fontScale),
        color: contrastTextColor,
      },
      secondary: {
        ...typography.elderly.secondary,
        fontSize: Math.round(typography.elderly.secondary.fontSize * fontScale),
        lineHeight: Math.round(typography.elderly.secondary.lineHeight * fontScale),
        color: contrastSecondaryColor,
      },
      caption: {
        ...typography.elderly.caption,
        fontSize: Math.round(typography.elderly.caption.fontSize * fontScale),
        lineHeight: Math.round(typography.elderly.caption.lineHeight * fontScale),
        color: contrastSecondaryColor,
      },
      buttonPrimary: {
        ...typography.elderly.buttonPrimary,
        fontSize: Math.round(typography.elderly.buttonPrimary.fontSize * fontScale),
        lineHeight: Math.round(typography.elderly.buttonPrimary.lineHeight * fontScale),
      },
      buttonSecondary: {
        ...typography.elderly.buttonSecondary,
        fontSize: Math.round(typography.elderly.buttonSecondary.fontSize * fontScale),
        lineHeight: Math.round(typography.elderly.buttonSecondary.lineHeight * fontScale),
      },
      h1: {
        ...typography.elderly.h1,
        fontSize: Math.round(typography.elderly.h1.fontSize * fontScale),
        lineHeight: Math.round(typography.elderly.h1.lineHeight * fontScale),
      },
      h2: {
        ...typography.elderly.h2,
        fontSize: Math.round(typography.elderly.h2.fontSize * fontScale),
        lineHeight: Math.round(typography.elderly.h2.lineHeight * fontScale),
      },
      h3: {
        ...typography.elderly.h3,
        fontSize: Math.round(typography.elderly.h3.fontSize * fontScale),
        lineHeight: Math.round(typography.elderly.h3.lineHeight * fontScale),
      },
      small: {
        ...typography.elderly.small,
        fontSize: Math.round(typography.elderly.small.fontSize * fontScale),
        lineHeight: Math.round(typography.elderly.small.lineHeight * fontScale),
      },
      button: {
        ...typography.elderly.button,
        fontSize: Math.round(typography.elderly.button.fontSize * fontScale),
        lineHeight: Math.round(typography.elderly.button.lineHeight * fontScale),
      },
    },
    standard: typography.standard,
  };
}

/**
 * 8-Point Spacing Grid (Section 11)
 * 8, 16, 24, 32, 40, 48, 56, 64
 * Screen margins: 24px (Section 12)
 */
export const spacing = {
  xs: 8,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  screenMargin: 24,
};

/**
 * Touch Targets (Section 7)
 * Min: 48x48px
 * Primary buttons: 52-56px
 * Large patient actions: 56-64px
 */
export const touchTargets = {
  minSize: 48,
  buttonHeightPrimary: 54,
  buttonHeightLarge: 60,
  buttonHeightSecondary: 48,
  inputHeight: 52,
  minSpacing: 16,
};

/**
 * Border Radii (Section 8, 13)
 * Buttons: 14-16px
 * Cards: 16-20px
 * Inputs: 12-14px
 */
export const borderRadius = {
  xs: 6,
  sm: 10,
  input: 14,
  button: 14,
  buttonLarge: 16,
  card: 18,
  pill: 9999,
  full: 9999,
  // legacy aliases
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
};

/**
 * Subtle iOS Elevation Shadows (Section 50)
 * Extremely subtle, functional, no dramatic glowing effects.
 */
export const shadows = {
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  // Replaced heavy neon glows with clean subtle tints
  glowTeal: {
    shadowColor: '#0071E3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  glowCoral: {
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  glowBlue: {
    shadowColor: '#0071E3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  floating: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
};

/**
 * Translucency helpers (Section 15: Functional, only for bars & sheets)
 */
export const glass = {
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E5EA',
    borderWidth: 1,
  },
  translucentTeal: {
    backgroundColor: 'rgba(0, 113, 227, 0.06)',
    borderColor: 'rgba(0, 113, 227, 0.18)',
    borderWidth: 1,
  },
  translucentBlue: {
    backgroundColor: 'rgba(0, 113, 227, 0.06)',
    borderColor: 'rgba(0, 113, 227, 0.18)',
    borderWidth: 1,
  },
};

export const animation = {
  fast: 150,
  normal: 240,
  slow: 320,
};
