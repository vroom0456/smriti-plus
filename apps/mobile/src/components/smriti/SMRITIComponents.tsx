/**
 * SMRITI+ Design System — Base Reusable Components
 *
 * Designed according to Apple Health + Calm + Google Assistant principles:
 * - 24-28px card radius
 * - 52-64px minimum touch targets
 * - Generous whitespace
 * - Subtle elevation and borders
 * - Accessible high-contrast typography
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { colors, fontFamily, spacing, borderRadius, shadows } from '../../theme/tokens';

// ── SMRITICard ──────────────────────────────────────────────────────────────
interface SMRITICardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  accessibilityLabel?: string;
  variant?: 'elevated' | 'tinted' | 'flat';
}

export function SMRITICard({
  children,
  style,
  onPress,
  accessibilityLabel,
  variant = 'elevated',
}: SMRITICardProps) {
  const variantStyles = {
    elevated: styles.cardElevated,
    tinted: styles.cardTinted,
    flat: styles.cardFlat,
  }[variant];

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.cardBase, variantStyles, style]}
        onPress={onPress}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.cardBase, variantStyles, style]}>{children}</View>;
}

// ── SMRITIButton ────────────────────────────────────────────────────────────
interface SMRITIButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
  size?: 'normal' | 'large';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
}

export function SMRITIButton({
  title,
  onPress,
  variant = 'primary',
  size = 'normal',
  icon,
  loading = false,
  disabled = false,
  accessibilityLabel,
  style,
  textStyle,
}: SMRITIButtonProps) {
  const isLarge = size === 'large';

  const containerVariant = {
    primary: styles.btnPrimary,
    secondary: styles.btnSecondary,
    accent: styles.btnAccent,
    outline: styles.btnOutline,
    ghost: styles.btnGhost,
  }[variant];

  const textVariant = {
    primary: styles.btnPrimaryText,
    secondary: styles.btnSecondaryText,
    accent: styles.btnAccentText,
    outline: styles.btnOutlineText,
    ghost: styles.btnGhostText,
  }[variant];

  return (
    <TouchableOpacity
      style={[
        styles.btnBase,
        isLarge ? styles.btnLarge : styles.btnNormal,
        containerVariant,
        disabled && styles.btnDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'accent' ? '#FFFFFF' : colors.primary}
          size={isLarge ? 'small' : 'small'}
        />
      ) : (
        <View style={styles.btnContent}>
          {icon ? <View style={styles.btnIconWrap}>{icon}</View> : null}
          <Text
            style={[
              styles.btnTextBase,
              isLarge ? styles.btnLargeText : styles.btnNormalText,
              textVariant,
              disabled && styles.btnDisabledText,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── SMRITIEmptyState ────────────────────────────────────────────────────────
interface SMRITIEmptyStateProps {
  title: string;
  subtitle: string;
  actionTitle?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function SMRITIEmptyState({
  title,
  subtitle,
  actionTitle,
  onAction,
  icon,
  style,
}: SMRITIEmptyStateProps) {
  return (
    <View style={[styles.emptyWrap, style]}>
      {icon ? <View style={styles.emptyIcon}>{icon}</View> : null}
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
      {actionTitle && onAction ? (
        <SMRITIButton
          title={actionTitle}
          onPress={onAction}
          variant="secondary"
          size="normal"
          style={styles.emptyAction}
        />
      ) : null}
    </View>
  );
}

// ── SMRITIErrorState ────────────────────────────────────────────────────────
interface SMRITIErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryTitle?: string;
  style?: ViewStyle;
}

export function SMRITIErrorState({
  title = "I couldn't connect right now.",
  message = "Your saved activities are still available offline.",
  onRetry,
  retryTitle = 'Try again',
  style,
}: SMRITIErrorStateProps) {
  return (
    <View style={[styles.errorWrap, style]}>
      <Text style={styles.errorTitle}>{title}</Text>
      <Text style={styles.errorMessage}>{message}</Text>
      {onRetry ? (
        <SMRITIButton
          title={retryTitle}
          onPress={onRetry}
          variant="primary"
          style={styles.errorAction}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Cards
  cardBase: {
    borderRadius: 24,
    padding: spacing.xl,
    marginVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardElevated: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E5EA',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
      },
    }),
  },
  cardTinted: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  cardFlat: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F2F2F7',
    borderWidth: 1,
  },

  // Buttons
  btnBase: {
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnNormal: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  btnLarge: {
    minHeight: 64,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md + 2,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIconWrap: {
    marginRight: 8,
  },
  btnTextBase: {
    fontFamily: fontFamily.display,
    fontWeight: '700',
    textAlign: 'center',
  },
  btnNormalText: {
    fontSize: 17,
    letterSpacing: -0.2,
  },
  btnLargeText: {
    fontSize: 19,
    letterSpacing: -0.3,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
  },
  btnSecondary: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  btnSecondaryText: {
    color: colors.textDark,
  },
  btnAccent: {
    backgroundColor: '#0E7490', // Calm Deep Teal
  },
  btnAccentText: {
    color: '#FFFFFF',
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  btnOutlineText: {
    color: colors.primary,
  },
  btnGhost: {
    backgroundColor: 'transparent',
  },
  btnGhostText: {
    color: colors.primary,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnDisabledText: {
    color: colors.muted,
  },

  // Empty State
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    borderRadius: 24,
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginVertical: spacing.md,
  },
  emptyIcon: {
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: fontFamily.display,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontFamily: fontFamily.text,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  emptyAction: {
    minWidth: 180,
  },

  // Error State
  errorWrap: {
    padding: spacing.xl,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginVertical: spacing.md,
  },
  errorTitle: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 4,
  },
  errorMessage: {
    fontFamily: fontFamily.text,
    fontSize: 15,
    color: '#B91C1C',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  errorAction: {
    alignSelf: 'flex-start',
    minHeight: 46,
  },
});
