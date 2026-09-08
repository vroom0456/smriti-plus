/**
 * SMRITI+ — Reusable UI Components
 *
 * Design system components following Section 4 requirements:
 * - 56dp minimum tap targets
 * - 20px+ body text for elderly
 * - Icons always paired with text labels
 * - No icon-only navigation
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, typography, spacing, borderRadius, shadows, touchTargets, fontFamily, glass, animation } from '../theme/tokens';
import {
  Pill,
  Droplets,
  Utensils,
  Activity,
  Calendar,
  Clock,
  Check,
  ChevronRight,
  Brain,
  Sparkles,
  Eye,
  Puzzle,
  Gamepad2,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react-native';

// ──────────────────────────────────────────────
// PRIMARY BUTTON
// ──────────────────────────────────────────────

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline';
  size?: 'large' | 'medium';
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function PrimaryButton({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  loading = false,
  disabled = false,
  style,
}: PrimaryButtonProps) {
  const bgColor = {
    primary: colors.teal,
    secondary: colors.navy,
    accent: colors.accent,
    outline: 'transparent',
  }[variant];

  const textColor = variant === 'outline' ? colors.teal : colors.white;
  const borderColor = variant === 'outline' ? colors.teal : 'rgba(255, 255, 255, 0.25)';

  const shadowStyle = variant === 'outline'
    ? {}
    : variant === 'accent'
    ? shadows.elevated
    : shadows.glowTeal;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.80}
      style={[
        styles.button,
        shadowStyle,
        {
          backgroundColor: disabled ? colors.muted : bgColor,
          borderColor,
          borderWidth: variant === 'outline' ? 2 : 1,
          minHeight: size === 'large' ? 64 : touchTargets.minSize,
          paddingHorizontal: size === 'large' ? spacing.xl : spacing.lg,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

// ──────────────────────────────────────────────
// ICON TILE (Home screen tiles)
// ──────────────────────────────────────────────

interface IconTileProps {
  icon?: string;
  renderIcon?: () => React.ReactNode;
  label: string;
  subtitle?: string;
  onPress: () => void;
  badge?: number;
  color?: string;
  style?: ViewStyle;
}

export function IconTile({ icon, renderIcon, label, subtitle, onPress, badge, color = colors.teal, style }: IconTileProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.78}
      style={[styles.iconTile, shadows.card, style]}
    >
      <View style={[styles.iconCircle, { backgroundColor: color + '14' }]}>
        {renderIcon ? renderIcon() : <Text style={[styles.iconEmoji]}>{icon}</Text>}
      </View>
      <Text style={styles.iconTileLabel} numberOfLines={2}>{label}</Text>
      {subtitle ? <Text style={styles.iconTileSubtitle} numberOfLines={1}>{subtitle}</Text> : null}
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ──────────────────────────────────────────────
// STAT CARD (Dashboard)
// ──────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  renderIcon?: () => React.ReactNode;
  color?: string;
  subtitle?: string;
}

export function StatCard({ label, value, icon, renderIcon, color = colors.teal, subtitle }: StatCardProps) {
  return (
    <View style={[styles.statCard, shadows.card]}>
      {(renderIcon || icon) && (
        <View style={[styles.statIconWrap, { backgroundColor: color + '15' }]}>
          {renderIcon ? renderIcon() : <Text style={styles.statIcon}>{icon}</Text>}
        </View>
      )}
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );
}

// ──────────────────────────────────────────────
// REMINDER CARD
// ──────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { color: string; bg: string }> = {
  medicine: { color: colors.accent, bg: colors.accentBg },
  hydration: { color: colors.teal, bg: colors.tealBg },
  meal: { color: colors.success, bg: colors.successBg },
  activity: { color: colors.navy, bg: 'rgba(15, 23, 42, 0.08)' },
  appointment: { color: colors.accent, bg: colors.accentBg },
};

function renderReminderCategoryIcon(category: string, color: string) {
  switch (category) {
    case 'medicine':
      return <Pill size={22} color={color} strokeWidth={2.2} />;
    case 'hydration':
      return <Droplets size={22} color={color} strokeWidth={2.2} />;
    case 'meal':
      return <Utensils size={22} color={color} strokeWidth={2.2} />;
    case 'activity':
      return <Activity size={22} color={color} strokeWidth={2.2} />;
    case 'appointment':
      return <Calendar size={22} color={color} strokeWidth={2.2} />;
    default:
      return <Clock size={22} color={color} strokeWidth={2.2} />;
  }
}

interface ReminderCardProps {
  title: string;
  category: string;
  scheduledTime: string;
  status: 'pending' | 'done' | 'missed' | 'snoozed';
  onDone?: () => void;
}

export function ReminderCard({ title, category, scheduledTime, status, onDone }: ReminderCardProps) {
  const config = CATEGORY_CONFIG[category] || { color: colors.muted, bg: colors.surfaceAlt };
  const isDone = status === 'done';
  const isMissed = status === 'missed';

  return (
    <View style={[
      styles.reminderCard,
      shadows.card,
      isDone && styles.reminderDone,
      isMissed && styles.reminderMissed,
    ]}>
      <View style={styles.reminderLeft}>
        <View style={[styles.reminderIconWrap, { backgroundColor: config.bg }]}>
          {renderReminderCategoryIcon(category, config.color)}
        </View>
        <View style={styles.reminderInfo}>
          <Text
            style={[
              styles.reminderTitle,
              isDone && styles.reminderTitleDone,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          <Text style={styles.reminderTime} numberOfLines={1}>{scheduledTime}</Text>
        </View>
      </View>

      {status === 'pending' && onDone && (
        <TouchableOpacity
          onPress={onDone}
          style={[styles.doneButton, shadows.subtle]}
          activeOpacity={0.78}
        >
          <Check size={16} color={colors.white} strokeWidth={2.5} style={{ marginRight: 6 }} />
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      )}

      {isDone && (
        <View style={[styles.statusBadge, { backgroundColor: colors.successBg, flexDirection: 'row', alignItems: 'center' }]}>
          <Check size={13} color={colors.success} strokeWidth={2.5} style={{ marginRight: 4 }} />
          <Text style={[styles.statusText, { color: colors.success }]}>Done</Text>
        </View>
      )}

      {isMissed && (
        <View style={[styles.statusBadge, { backgroundColor: colors.errorBg }]}>
          <Text style={[styles.statusText, { color: colors.error }]}>Missed</Text>
        </View>
      )}
    </View>
  );
}

// ──────────────────────────────────────────────
// ALERT BANNER
// ──────────────────────────────────────────────

interface AlertBannerProps {
  type: 'warning' | 'info' | 'success';
  message: string;
}

export function AlertBanner({ type, message }: AlertBannerProps) {
  const config = {
    warning: { bg: colors.accentBg, color: colors.accent, border: 'rgba(255, 59, 48, 0.25)' },
    info: { bg: colors.tealBg, color: colors.teal, border: 'rgba(0, 113, 227, 0.25)' },
    success: { bg: colors.successBg, color: colors.success, border: 'rgba(52, 199, 89, 0.25)' },
  }[type];

  return (
    <View style={[styles.alertBanner, { backgroundColor: config.bg, borderColor: config.border }]}>
      <View style={{ marginRight: spacing.sm }}>
        {type === 'warning' ? (
          <AlertTriangle size={18} color={config.color} strokeWidth={2.2} />
        ) : type === 'info' ? (
          <Info size={18} color={config.color} strokeWidth={2.2} />
        ) : (
          <CheckCircle2 size={18} color={config.color} strokeWidth={2.2} />
        )}
      </View>
      <Text style={[styles.alertText, { color: config.color }]}>{message}</Text>
    </View>
  );
}

// ──────────────────────────────────────────────
// GAME CARD
// ──────────────────────────────────────────────

interface GameCardProps {
  name: string;
  icon: string;
  description: string;
  onPress: () => void;
  comingSoon?: boolean;
}

function renderGameCategoryIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('matching') || lower.includes('cards')) {
    return <Sparkles size={24} color={colors.teal} strokeWidth={2.2} />;
  }
  if (lower.includes('recall') || lower.includes('memory')) {
    return <Brain size={24} color={colors.teal} strokeWidth={2.2} />;
  }
  if (lower.includes('attention') || lower.includes('focus')) {
    return <Eye size={24} color={colors.teal} strokeWidth={2.2} />;
  }
  if (lower.includes('pattern') || lower.includes('puzzle')) {
    return <Puzzle size={24} color={colors.teal} strokeWidth={2.2} />;
  }
  return <Gamepad2 size={24} color={colors.teal} strokeWidth={2.2} />;
}

export function GameCard({ name, icon, description, onPress, comingSoon }: GameCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={comingSoon}
      activeOpacity={0.78}
      style={[styles.gameCard, shadows.card, comingSoon && styles.gameCardDisabled]}
    >
      <View style={styles.gameIconWrap}>
        {renderGameCategoryIcon(name)}
      </View>
      <View style={styles.gameInfo}>
        <Text style={styles.gameName} numberOfLines={1} ellipsizeMode="tail">{name}</Text>
        <Text style={styles.gameDesc} numberOfLines={2} ellipsizeMode="tail">{description}</Text>
      </View>
      {comingSoon ? (
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </View>
      ) : (
        <View style={styles.gameArrowWrap}>
          <ChevronRight size={18} color={colors.muted} strokeWidth={2.2} />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ──────────────────────────────────────────────
// PROGRESS RING
// ──────────────────────────────────────────────

interface ProgressRingProps {
  progress: number; // 0-1
  size?: number;
  color?: string;
  label?: string;
}

export function ProgressRing({
  progress,
  size = 80,
  color = colors.teal,
  label,
}: ProgressRingProps) {
  const percentage = Math.round(progress * 100);

  return (
    <View style={[styles.progressRing, { width: size, height: size }]}>
      <View style={[
        styles.progressCircle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color + '25',
          borderWidth: 6,
        },
      ]}>
        <Text style={[styles.progressValue, { color, fontSize: size * 0.25 }]}>
          {percentage}%
        </Text>
        {label && (
          <Text style={[styles.progressLabel, { fontSize: size * 0.13 }]}>
            {label}
          </Text>
        )}
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────
// ROLE BADGE
// ──────────────────────────────────────────────

interface RoleBadgeProps {
  role: 'elderly' | 'caregiver' | 'health_worker';
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const config = {
    elderly: { label: 'Elder', color: colors.teal, bg: colors.tealBg, border: colors.teal + '30' },
    caregiver: { label: 'Caregiver', color: colors.navy, bg: colors.navy + '12', border: colors.navy + '25' },
    health_worker: { label: 'Health Worker', color: colors.accent, bg: colors.accentBg, border: colors.accent + '30' },
  }[role];

  return (
    <View style={[styles.roleBadge, { backgroundColor: config.bg, borderColor: config.border }]}>
      <Text style={[styles.roleBadgeText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

// ──────────────────────────────────────────────
// STYLES
// ──────────────────────────────────────────────

const styles = StyleSheet.create({
  // Button
  button: {
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  buttonText: {
    ...typography.elderly.button,
    letterSpacing: -0.2,
  },

  // Icon Tile — Apple Health style rounded cards
  iconTile: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
    flex: 1,
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  iconEmoji: {
    fontSize: 34,
  },
  iconTileLabel: {
    ...typography.elderly.bodyBold,
    color: colors.textDark,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  iconTileSubtitle: {
    fontFamily: fontFamily.text,
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.pill,
    minWidth: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  badgeText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },

  // Stat Card — Apple Health metric tile
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md,
    alignItems: 'center',
    flex: 1,
    margin: spacing.xs,
    minWidth: 84,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statIcon: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  statLabel: {
    ...typography.standard.caption,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '600',
  },
  statSubtitle: {
    ...typography.standard.caption,
    color: colors.mutedLight,
    textAlign: 'center',
    fontSize: 11,
  },

  // Reminder Card — Apple minimalist list item
  reminderCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md + 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    minHeight: 84,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reminderDone: {
    opacity: 0.60,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.borderLight,
  },
  reminderMissed: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  reminderIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  reminderIcon: {
    fontSize: 24,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    ...typography.elderly.bodyBold,
    color: colors.textDark,
    fontSize: 19,
    lineHeight: 25,
    letterSpacing: -0.3,
  },
  reminderTitleDone: {
    textDecorationLine: 'line-through',
    color: colors.muted,
  },
  reminderTime: {
    ...typography.elderly.caption,
    color: colors.muted,
    marginTop: 2,
    fontWeight: '500',
  },
  doneButton: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.pill,
    minHeight: touchTargets.minSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    color: colors.white,
    fontFamily: fontFamily.display,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.pill,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Alert Banner
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 16,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  alertIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  alertText: {
    ...typography.standard.body,
    fontWeight: '600',
    flex: 1,
  },

  // Game Card
  gameCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    minHeight: 96,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gameCardDisabled: {
    opacity: 0.45,
  },
  gameIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.tealBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  gameIcon: {
    fontSize: 30,
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    ...typography.elderly.bodyBold,
    color: colors.textDark,
    fontSize: 20,
    letterSpacing: -0.4,
  },
  gameDesc: {
    ...typography.elderly.caption,
    color: colors.muted,
    marginTop: 3,
    fontSize: 15,
  },
  gameArrowWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameArrow: {
    fontSize: 20,
    color: colors.muted,
    fontWeight: '600',
    marginTop: -2,
  },
  comingSoonBadge: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.pill,
  },
  comingSoonText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },

  // Progress Ring
  progressRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressValue: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  progressLabel: {
    color: colors.muted,
    fontWeight: '600',
  },

  // Role Badge
  roleBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
