/**
 * SMRITI+ — Production UI Component System
 *
 * Designed in accordance with Apple iOS Health UX & Elderly Accessibility standards:
 * - 48-64px touch targets
 * - 17-18px body typography, 15px minimum for any critical information
 * - Icons always paired with visible text labels
 * - Strict 3-tier button system (Primary, Secondary, Destructive)
 * - Restrained healthcare color palette (#0071E3 calm blue, #34C759 soft green, #FF9500 amber, #FF3B30 red)
 * - 1px subtle borders (#E5E5EA) & minimal elevation shadows (no neon or glassmorphism clutter)
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
  Platform,
} from 'react-native';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  touchTargets,
  fontFamily,
} from '../theme/tokens';
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
// 1. PRIMARY BUTTON (Section 8: 52–56px, 14–16px radius, 17px/600)
// ──────────────────────────────────────────────

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'danger';
  size?: 'large' | 'medium';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

export function PrimaryButton({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
}: PrimaryButtonProps) {
  const isOutline = variant === 'outline';
  const isDanger = variant === 'danger' || variant === 'accent';
  const isSecondary = variant === 'secondary';

  let backgroundColor = colors.primary;
  let textColor = colors.white;
  let borderColor = 'transparent';

  if (isSecondary) {
    backgroundColor = colors.surfaceSecondary;
    textColor = colors.textDark;
    borderColor = colors.border;
  } else if (isDanger) {
    backgroundColor = colors.danger;
    textColor = colors.white;
  } else if (isOutline) {
    backgroundColor = 'transparent';
    textColor = colors.primary;
    borderColor = colors.primary;
  }

  if (disabled) {
    backgroundColor = colors.surfaceSecondary;
    textColor = colors.muted;
    borderColor = colors.border;
  }

  const minHeight = size === 'large' ? touchTargets.buttonHeightLarge : touchTargets.buttonHeightPrimary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.78}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      style={[
        styles.primaryButton,
        !isOutline && !disabled ? shadows.subtle : null,
        {
          backgroundColor,
          borderColor,
          borderWidth: isOutline || isSecondary ? 1 : 0,
          minHeight,
          borderRadius: size === 'large' ? borderRadius.buttonLarge : borderRadius.button,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.buttonContentRow}>
          {icon ? <View style={styles.buttonIconWrap}>{icon}</View> : null}
          <Text style={[styles.primaryButtonText, { color: textColor }, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ──────────────────────────────────────────────
// 2. SECONDARY BUTTON (Section 8: 48–52px, 14px radius, 1px border)
// ──────────────────────────────────────────────

interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

export function SecondaryButton({
  title,
  onPress,
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
}: SecondaryButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.78}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      style={[
        styles.secondaryButton,
        {
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} size="small" />
      ) : (
        <View style={styles.buttonContentRow}>
          {icon ? <View style={styles.buttonIconWrap}>{icon}</View> : null}
          <Text style={[styles.secondaryButtonText, textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ──────────────────────────────────────────────
// 3. DESTRUCTIVE BUTTON (Section 8: dangerous actions only)
// ──────────────────────────────────────────────

interface DestructiveButtonProps {
  title: string;
  onPress: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function DestructiveButton({ title, onPress, icon, style }: DestructiveButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.78}
      accessibilityRole="button"
      style={[styles.destructiveButton, style]}
    >
      <View style={styles.buttonContentRow}>
        {icon ? <View style={styles.buttonIconWrap}>{icon}</View> : null}
        <Text style={styles.destructiveButtonText}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ──────────────────────────────────────────────
// 4. HEALTH CARD (Section 13: 20-24px padding, 18px radius, subtle border)
// ──────────────────────────────────────────────

interface HealthCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export function HealthCard({ children, style, onPress }: HealthCardProps) {
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={[styles.healthCard, shadows.card, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return (
    <View style={[styles.healthCard, shadows.card, style]}>
      {children}
    </View>
  );
}

// ──────────────────────────────────────────────
// 5. ACCESSIBLE INPUT (Section 28 & 29: 52px height, permanent external label)
// ──────────────────────────────────────────────

interface AccessibleInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  helperText?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  editable?: boolean;
  style?: ViewStyle;
}

export function AccessibleInput({
  label,
  value,
  onChangeText,
  placeholder,
  helperText,
  error,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  editable = true,
  style,
}: AccessibleInputProps) {
  const [focused, setFocused] = React.useState(false);

  return (
    <View style={[styles.inputGroup, style]}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View
        style={[
          styles.inputContainer,
          focused && styles.inputContainerFocused,
          error ? styles.inputContainerError : null,
          !editable && styles.inputContainerDisabled,
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.textInputField}
        />
      </View>
      {error ? (
        <View style={styles.inputFeedbackRow}>
          <AlertTriangle size={14} color={colors.danger} strokeWidth={2.2} />
          <Text style={styles.inputErrorText}>{error}</Text>
        </View>
      ) : helperText ? (
        <Text style={styles.inputHelperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

// ──────────────────────────────────────────────
// 6. ICON TILE (Elderly Navigation / Activities)
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

export function IconTile({
  icon,
  renderIcon,
  label,
  subtitle,
  onPress,
  badge,
  color = colors.primary,
  style,
}: IconTileProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.78}
      accessibilityRole="button"
      accessibilityLabel={`${label}${subtitle ? `, ${subtitle}` : ''}`}
      style={[styles.iconTile, shadows.card, style]}
    >
      <View style={[styles.iconCircle, { backgroundColor: color + '12' }]}>
        {renderIcon ? renderIcon() : <Text style={styles.iconEmoji}>{icon}</Text>}
      </View>
      <Text style={styles.iconTileLabel} numberOfLines={2}>
        {label}
      </Text>
      {subtitle ? (
        <Text style={styles.iconTileSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ──────────────────────────────────────────────
// 7. STAT CARD (Section 33: Simple Healthcare Metrics)
// ──────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  renderIcon?: () => React.ReactNode;
  color?: string;
  subtitle?: string;
  style?: ViewStyle;
}

export function StatCard({
  label,
  value,
  icon,
  renderIcon,
  color = colors.primary,
  subtitle,
  style,
}: StatCardProps) {
  return (
    <View style={[styles.statCard, shadows.card, style]}>
      {(renderIcon || icon) && (
        <View style={[styles.statIconWrap, { backgroundColor: color + '14' }]}>
          {renderIcon ? renderIcon() : <Text style={styles.statIcon}>{icon}</Text>}
        </View>
      )}
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {subtitle ? <Text style={styles.statSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

// ──────────────────────────────────────────────
// 8. REMINDER CARD (Section 35: Routine Item)
// ──────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  medicine: { color: colors.danger, bg: colors.dangerBg, label: 'Medicine' },
  hydration: { color: colors.primary, bg: colors.primaryMuted, label: 'Water' },
  meal: { color: colors.success, bg: colors.successBg, label: 'Meal' },
  activity: { color: colors.warning, bg: colors.warningBg, label: 'Exercise' },
  appointment: { color: colors.primary, bg: colors.primaryMuted, label: 'Appointment' },
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
  doneLabel?: string;
}

export function ReminderCard({
  title,
  category,
  scheduledTime,
  status,
  onDone,
  doneLabel,
}: ReminderCardProps) {
  const config = CATEGORY_CONFIG[category] || {
    color: colors.muted,
    bg: colors.surfaceSecondary,
    label: 'Reminder',
  };
  const isDone = status === 'done';
  const isMissed = status === 'missed';

  return (
    <View
      style={[
        styles.reminderCard,
        shadows.card,
        isDone && styles.reminderDone,
        isMissed && styles.reminderMissed,
      ]}
    >
      <View style={styles.reminderLeft}>
        <View style={[styles.reminderIconWrap, { backgroundColor: config.bg }]}>
          {renderReminderCategoryIcon(category, config.color)}
        </View>
        <View style={styles.reminderInfo}>
          <Text
            style={[styles.reminderTitle, isDone && styles.reminderTitleDone]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          <Text style={styles.reminderTime} numberOfLines={1}>
            {scheduledTime}
          </Text>
        </View>
      </View>

      {status === 'pending' && onDone && (
        <TouchableOpacity
          onPress={onDone}
          style={styles.doneButton}
          activeOpacity={0.78}
          accessibilityRole="button"
          accessibilityLabel={`Mark ${title} as completed`}
        >
          <Check size={16} color={colors.white} strokeWidth={2.5} style={{ marginRight: 6 }} />
          <Text style={styles.doneButtonText}>{doneLabel || 'Done'}</Text>
        </TouchableOpacity>
      )}

      {isDone && (
        <View style={styles.statusCompletedBadge}>
          <Check size={14} color={colors.success} strokeWidth={2.5} style={{ marginRight: 4 }} />
          <Text style={styles.statusCompletedText}>Done</Text>
        </View>
      )}

      {isMissed && (
        <View style={styles.statusMissedBadge}>
          <AlertTriangle size={14} color={colors.danger} strokeWidth={2.2} style={{ marginRight: 4 }} />
          <Text style={styles.statusMissedText}>Missed</Text>
        </View>
      )}
    </View>
  );
}

// ──────────────────────────────────────────────
// 9. ALERT BANNER (Accessible High-Contrast)
// ──────────────────────────────────────────────

interface AlertBannerProps {
  type: 'warning' | 'info' | 'success';
  message: string;
}

export function AlertBanner({ type, message }: AlertBannerProps) {
  const config = {
    warning: {
      bg: colors.warningBg,
      color: colors.warningDark,
      border: 'rgba(255, 149, 0, 0.3)',
      Icon: AlertTriangle,
    },
    info: {
      bg: colors.primaryMuted,
      color: colors.primaryDark,
      border: 'rgba(0, 113, 227, 0.25)',
      Icon: Info,
    },
    success: {
      bg: colors.successBg,
      color: colors.successDark,
      border: 'rgba(52, 199, 89, 0.25)',
      Icon: CheckCircle2,
    },
  }[type];

  const IconComponent = config.Icon;

  return (
    <View style={[styles.alertBanner, { backgroundColor: config.bg, borderColor: config.border }]}>
      <View style={{ marginRight: spacing.sm }}>
        <IconComponent size={18} color={config.color} strokeWidth={2.2} />
      </View>
      <Text style={[styles.alertText, { color: config.color }]}>{message}</Text>
    </View>
  );
}

// ──────────────────────────────────────────────
// 10. GAME CARD (Section 56 & 57: Cognitive Activity Card)
// ──────────────────────────────────────────────

interface GameCardProps {
  name: string;
  icon?: string;
  description: string;
  onPress: () => void;
  comingSoon?: boolean;
}

function renderGameCategoryIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('matching') || lower.includes('cards')) {
    return <Sparkles size={24} color={colors.primary} strokeWidth={2.2} />;
  }
  if (lower.includes('recall') || lower.includes('memory')) {
    return <Brain size={24} color={colors.primary} strokeWidth={2.2} />;
  }
  if (lower.includes('attention') || lower.includes('focus')) {
    return <Eye size={24} color={colors.primary} strokeWidth={2.2} />;
  }
  if (lower.includes('pattern') || lower.includes('puzzle')) {
    return <Puzzle size={24} color={colors.primary} strokeWidth={2.2} />;
  }
  return <Gamepad2 size={24} color={colors.primary} strokeWidth={2.2} />;
}

export function GameCard({ name, description, onPress, comingSoon }: GameCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={comingSoon}
      activeOpacity={0.78}
      accessibilityRole="button"
      accessibilityLabel={`${name}: ${description}`}
      style={[styles.gameCard, shadows.card, comingSoon && styles.gameCardDisabled]}
    >
      <View style={styles.gameIconWrap}>
        {renderGameCategoryIcon(name)}
      </View>
      <View style={styles.gameInfo}>
        <Text style={styles.gameName} numberOfLines={1} ellipsizeMode="tail">
          {name}
        </Text>
        <Text style={styles.gameDesc} numberOfLines={2} ellipsizeMode="tail">
          {description}
        </Text>
      </View>
      {comingSoon ? (
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </View>
      ) : (
        <View style={styles.gameArrowWrap}>
          <ChevronRight size={20} color={colors.muted} strokeWidth={2.2} />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ──────────────────────────────────────────────
// 11. PROGRESS BAR (Section 34: "3 of 5 activities completed")
// ──────────────────────────────────────────────

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  style?: ViewStyle;
}

export function ProgressBar({ current, total, label, style }: ProgressBarProps) {
  const percent = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;

  return (
    <View style={[styles.progressContainer, style]}>
      <View style={styles.progressHeaderRow}>
        <Text style={styles.progressTextLabel}>
          {label || `${current} of ${total} completed`}
        </Text>
        <Text style={styles.progressPercentageText}>{Math.round(percent)}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%` }]} />
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────
// 12. PROGRESS RING
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
  color = colors.primary,
  label,
}: ProgressRingProps) {
  const percentage = Math.round(progress * 100);

  return (
    <View style={[styles.progressRing, { width: size, height: size }]}>
      <View
        style={[
          styles.progressCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: color + '25',
            borderWidth: 6,
          },
        ]}
      >
        <Text style={[styles.progressValue, { color, fontSize: size * 0.25 }]}>
          {percentage}%
        </Text>
        {label ? (
          <Text style={[styles.progressRingLabel, { fontSize: size * 0.13 }]}>
            {label}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────
// 13. ROLE BADGE
// ──────────────────────────────────────────────

interface RoleBadgeProps {
  role: 'elderly' | 'caregiver' | 'health_worker';
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const config = {
    elderly: {
      label: 'Elder Member',
      color: colors.primary,
      bg: colors.primaryMuted,
      border: 'rgba(0, 113, 227, 0.2)',
    },
    caregiver: {
      label: 'Family Caregiver',
      color: colors.textDark,
      bg: colors.surfaceSecondary,
      border: colors.border,
    },
    health_worker: {
      label: 'Healthcare Worker',
      color: colors.successDark,
      bg: colors.successBg,
      border: 'rgba(52, 199, 89, 0.25)',
    },
  }[role];

  return (
    <View style={[styles.roleBadge, { backgroundColor: config.bg, borderColor: config.border }]}>
      <Text style={[styles.roleBadgeText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

// ──────────────────────────────────────────────
// 14. EMPTY STATE (Section 46: Warm, human microcopy)
// ──────────────────────────────────────────────

interface EmptyStateProps {
  title?: string;
  message: string;
  actionTitle?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  title = 'Nothing here yet',
  message,
  actionTitle,
  onAction,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.emptyStateContainer, style]}>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateMessage}>{message}</Text>
      {actionTitle && onAction ? (
        <SecondaryButton
          title={actionTitle}
          onPress={onAction}
          style={{ marginTop: spacing.md, alignSelf: 'center' }}
        />
      ) : null}
    </View>
  );
}

// ──────────────────────────────────────────────
// STYLES (Apple iOS Health Guidelines)
// ──────────────────────────────────────────────

const styles = StyleSheet.create({
  // Button Row & Icon helpers
  buttonContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIconWrap: {
    marginRight: 8,
  },

  // Primary Button (54px height, 14-16px radius)
  primaryButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    minHeight: touchTargets.buttonHeightPrimary,
  },
  primaryButtonText: {
    ...typography.elderly.buttonPrimary,
    textAlign: 'center',
  },

  // Secondary Button (48px height, 14px radius, subtle border)
  secondaryButton: {
    width: '100%',
    minHeight: touchTargets.buttonHeightSecondary,
    borderRadius: borderRadius.button,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonText: {
    ...typography.elderly.buttonSecondary,
    color: colors.textDark,
    textAlign: 'center',
  },

  // Destructive Button
  destructiveButton: {
    width: '100%',
    minHeight: touchTargets.buttonHeightSecondary,
    borderRadius: borderRadius.button,
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  destructiveButtonText: {
    ...typography.elderly.buttonSecondary,
    color: colors.danger,
    textAlign: 'center',
  },

  // Health Card Container
  healthCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Accessible Input Form Group
  inputGroup: {
    marginBottom: spacing.md,
    width: '100%',
  },
  inputLabel: {
    fontFamily: fontFamily.display,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  inputContainer: {
    minHeight: touchTargets.inputHeight,
    borderRadius: borderRadius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  inputContainerFocused: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  inputContainerError: {
    borderColor: colors.danger,
    borderWidth: 1.5,
  },
  inputContainerDisabled: {
    backgroundColor: colors.surfaceSecondary,
  },
  textInputField: {
    fontFamily: fontFamily.text,
    fontSize: 17,
    color: colors.textDark,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  inputFeedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  inputErrorText: {
    fontFamily: fontFamily.text,
    fontSize: 14,
    color: colors.danger,
  },
  inputHelperText: {
    fontFamily: fontFamily.text,
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
  },

  // Icon Tile
  iconTile: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    flex: 1,
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  iconEmoji: {
    fontSize: 32,
  },
  iconTileLabel: {
    fontFamily: fontFamily.display,
    fontSize: 17,
    fontWeight: '600',
    color: colors.textDark,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  iconTileSubtitle: {
    fontFamily: fontFamily.text,
    fontSize: 14,
    color: colors.muted,
    marginTop: 2,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.warning,
    borderRadius: borderRadius.pill,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },

  // Stat Card
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statIcon: {
    fontSize: 20,
  },
  statValue: {
    fontFamily: fontFamily.display,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  statLabel: {
    fontFamily: fontFamily.text,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statSubtitle: {
    fontFamily: fontFamily.text,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },

  // Reminder Card
  reminderCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm + 4,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 64,
  },
  reminderDone: {
    backgroundColor: '#FAFBF9',
    borderColor: 'rgba(52, 199, 89, 0.25)',
  },
  reminderMissed: {
    borderColor: 'rgba(255, 59, 48, 0.25)',
  },
  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  reminderIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontFamily: fontFamily.display,
    fontSize: 17,
    fontWeight: '600',
    color: colors.textDark,
    letterSpacing: -0.2,
  },
  reminderTitleDone: {
    color: colors.muted,
    textDecorationLine: 'line-through',
  },
  reminderTime: {
    fontFamily: fontFamily.text,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  doneButton: {
    backgroundColor: colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.pill,
    minHeight: 46,
    ...shadows.subtle,
  },
  doneButtonText: {
    fontFamily: fontFamily.display,
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  statusCompletedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
  },
  statusCompletedText: {
    fontFamily: fontFamily.display,
    fontSize: 13,
    fontWeight: '600',
    color: colors.successDark,
  },
  statusMissedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
  },
  statusMissedText: {
    fontFamily: fontFamily.display,
    fontSize: 13,
    fontWeight: '600',
    color: colors.danger,
  },

  // Alert Banner
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  alertText: {
    fontFamily: fontFamily.text,
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },

  // Game Card
  gameCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    padding: spacing.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm + 4,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 76,
  },
  gameCardDisabled: {
    opacity: 0.55,
  },
  gameIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  gameInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  gameName: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
    letterSpacing: -0.2,
  },
  gameDesc: {
    fontFamily: fontFamily.text,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 19,
  },
  gameArrowWrap: {
    paddingLeft: 4,
  },
  comingSoonBadge: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
  },
  comingSoonText: {
    fontFamily: fontFamily.text,
    fontSize: 12,
    color: colors.muted,
  },

  // Progress Bar
  progressContainer: {
    width: '100%',
    marginVertical: spacing.xs,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressTextLabel: {
    fontFamily: fontFamily.text,
    fontSize: 15,
    fontWeight: '500',
    color: colors.textDark,
  },
  progressPercentageText: {
    fontFamily: fontFamily.display,
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
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
    fontFamily: fontFamily.display,
    fontWeight: '700',
  },
  progressRingLabel: {
    fontFamily: fontFamily.text,
    color: colors.muted,
    marginTop: 2,
  },

  // Role Badge
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    fontFamily: fontFamily.display,
    fontSize: 13,
    fontWeight: '600',
  },

  // Empty State
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyStateTitle: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontFamily: fontFamily.text,
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
});
