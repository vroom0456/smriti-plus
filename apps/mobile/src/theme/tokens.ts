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
  // ── SMRITI+ Warm Cream Design System (Elderly-First) ──
  // Background: Warm cream — soft on elderly eyes, not clinical white
  primary: '#D98B6C',          // Muted peach — warm trust, not cold blue
  primaryDark: '#C07050',
  primaryLight: '#F5E6DE',
  primaryMuted: 'rgba(217, 139, 108, 0.12)',

  // Secondary: Soft sage green — nature, calm, progress
  secondary: '#A8B89A',
  secondaryDark: '#7A9068',
  secondaryLight: '#EDF2E9',
  secondaryMuted: 'rgba(168, 184, 154, 0.15)',

  // Accent: Warm golden yellow — highlights, attention, joy
  accentGold: '#D9B44A',
  accentGoldDark: '#B8941A',
  accentGoldBg: 'rgba(217, 180, 74, 0.14)',

  // Supporting status
  success: '#6BAA7A',          // Earthy green (Positive / completed)
  successBg: 'rgba(107, 170, 122, 0.14)',
  successDark: '#4A8A5A',

  warning: '#D9A84A',          // Warm amber (Attention needed)
  warningBg: 'rgba(217, 168, 74, 0.14)',
  warningDark: '#B88830',

  danger: '#C5614A',           // Terracotta red (Critical — not alarming)
  dangerBg: 'rgba(197, 97, 74, 0.12)',
  dangerDark: '#A04030',

  // Surfaces & Backgrounds — Warm, never cold clinical white
  background: '#F7F1E5',       // Warm cream canvas (main background)
  surface: '#FDF9F3',          // Warm white surface
  surfaceSecondary: '#F2EAD9', // Slightly toasted surface
  surfaceElevated: '#FFFFFF',  // Elevated card surface

  // Typography — Charcoal, warm, comfortable contrast
  textDark: '#333333',         // Dark charcoal (main text)
  textMed: '#4A3F35',          // Medium warm charcoal
  textSecondary: '#7A6E63',    // Warm secondary text
  muted: '#9E9085',            // Warm muted / captions
  mutedLight: '#BDB0A5',

  // Hairlines & Borders — Warm beige separators
  border: '#E0D5C5',           // Warm beige border
  borderLight: '#EDE6D8',      // Subtle warm separator
  borderActive: '#D98B6C',     // Active/focused border = primary

  // System & Neutral
  white: '#FFFFFF',
  black: '#333333',
  overlay: 'rgba(51, 40, 30, 0.40)',

  // Legacy aliases for backward compatibility across components
  teal: '#D98B6C',
  tealLight: '#F5E6DE',
  tealDeep: '#C07050',
  tealBg: 'rgba(217, 139, 108, 0.12)',
  navy: '#333333',
  navyDark: '#1A1310',
  navyMid: '#4A3F35',
  accent: '#C5614A',
  accentLight: '#D9896C',
  accentBg: 'rgba(197, 97, 74, 0.12)',
  error: '#C5614A',
  errorBg: 'rgba(197, 97, 74, 0.12)',
  gold: '#D9B44A',
  goldBg: 'rgba(217, 180, 74, 0.14)',
  cardBackground: '#FDF9F3',
  cardBg: '#FDF9F3',
  surfaceAlt: '#F2EAD9',

  // Warm Companion Tokens (Elderly First)
  cream: '#F7F1E5',
  creamWarm: '#EDE6D8',
  tealCalm: '#A8B89A',
  tealCalmBg: 'rgba(168, 184, 154, 0.15)',
  greenCalm: '#6BAA7A',
  greenCalmBg: 'rgba(107, 170, 122, 0.14)',
  amberWarm: '#D9A84A',
  amberWarmBg: 'rgba(217, 168, 74, 0.14)',

  // Extended compatibility aliases
  coral: '#D98B6C',
  systemBlue: '#D98B6C',
  mintBg: 'rgba(107, 170, 122, 0.14)',
  glassCard: '#FDF9F3',
  glassBorder: '#E0D5C5',
  glassTealBorder: 'rgba(217, 139, 108, 0.30)',
  systemPurple: '#9B8FBF',
  coralBg: 'rgba(217, 139, 108, 0.15)',
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
      letterSpacing: 0,
      color: colors.textDark,
    },
    sectionHeading: {
      fontFamily: fontFamily.display,
      fontSize: 22,
      fontWeight: '600' as const,
      lineHeight: 28,
      letterSpacing: 0,
      color: colors.textDark,
    },
    cardHeading: {
      fontFamily: fontFamily.display,
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 24,
      letterSpacing: 0,
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
      letterSpacing: 0,
    },
    buttonSecondary: {
      fontFamily: fontFamily.display,
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 22,
      letterSpacing: 0,
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
      letterSpacing: 0,
      color: colors.textDark,
    },
    h1: {
      fontFamily: fontFamily.display,
      fontSize: 26,
      fontWeight: '700' as const,
      lineHeight: 32,
      letterSpacing: 0,
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
