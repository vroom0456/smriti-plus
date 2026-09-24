/**
 * SMRITI+ Today's Plan Timeline Component
 *
 * Implements Section 12 of Production UX:
 * - Clear tabular numeral time presentation (10:00, 12:30, 18:00)
 * - State badges: Completed (✓), Up Next (Active Highlight), Upcoming
 * - The current active item receives strong visual emphasis
 * - Single-tap action trigger (e.g. start game, mark taken, call family)
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  CheckCircle2,
  Clock,
  Brain,
  Pill,
  Phone,
  Heart,
  ChevronRight,
} from 'lucide-react-native';
import { colors, fontFamily, spacing } from '../../theme/tokens';
import { useTranslation } from '../../i18n';

export interface TimelineItem {
  id: string;
  time: string;           // e.g. "10:00 AM" or "10:00"
  title: string;          // e.g. "Picture Memory"
  category: 'memory' | 'medicine' | 'family' | 'routine';
  status: 'completed' | 'active' | 'upcoming';
  subtitle?: string;
  onPress?: () => void;
  onAction?: () => void;
  actionTitle?: string;
}

interface SMRITITimelineProps {
  items: TimelineItem[];
  onViewAll?: () => void;
}

export function SMRITITimeline({ items, onViewAll }: SMRITITimelineProps) {
  const { t } = useTranslation();

  const getCategoryIcon = (category: TimelineItem['category'], status: TimelineItem['status']) => {
    const isDone = status === 'completed';
    const color = isDone
      ? '#16A34A'
      : status === 'active'
      ? colors.primary
      : colors.textSecondary;

    switch (category) {
      case 'memory':
        return <Brain size={22} color={color} strokeWidth={2.4} />;
      case 'medicine':
        return <Pill size={22} color={color} strokeWidth={2.4} />;
      case 'family':
        return <Phone size={22} color={color} strokeWidth={2.4} />;
      case 'routine':
      default:
        return <Heart size={22} color={color} strokeWidth={2.4} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Clock size={18} color={colors.primary} strokeWidth={2.4} style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>{t('home.todaysPlan') || "TODAY'S PLAN"}</Text>
        </View>
        {onViewAll ? (
          <TouchableOpacity
            onPress={onViewAll}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="View full schedule"
          >
            <Text style={styles.viewAllText}>{t('home.seeAll') || 'See all'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.timelineList}>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          const isActive = item.status === 'active';
          const isDone = item.status === 'completed';

          return (
            <View key={item.id} style={styles.itemRow}>
              {/* Left Column: Time with Tabular Numerals */}
              <View style={styles.timeColumn}>
                <Text
                  style={[
                    styles.timeText,
                    isActive && styles.activeTimeText,
                    isDone && styles.doneTimeText,
                  ]}
                >
                  {item.time}
                </Text>
              </View>

              {/* Middle Column: Vertical Track & Node */}
              <View style={styles.trackColumn}>
                <View
                  style={[
                    styles.nodeCircle,
                    isDone && styles.nodeCircleDone,
                    isActive && styles.nodeCircleActive,
                  ]}
                >
                  {isDone ? (
                    <CheckCircle2 size={16} color="#FFFFFF" strokeWidth={3} />
                  ) : (
                    <View style={[styles.nodeDot, isActive && styles.nodeDotActive]} />
                  )}
                </View>
                {!isLast && (
                  <View
                    style={[
                      styles.verticalLine,
                      isDone && styles.verticalLineDone,
                    ]}
                  />
                )}
              </View>

              {/* Right Column: Card Content */}
              <TouchableOpacity
                style={[
                  styles.contentCard,
                  isActive && styles.activeContentCard,
                  isDone && styles.doneContentCard,
                ]}
                onPress={item.onPress}
                activeOpacity={item.onPress ? 0.8 : 1}
                disabled={!item.onPress}
                accessibilityRole="button"
                accessibilityLabel={`${item.title} at ${item.time}, status: ${item.status}`}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.iconBadge}>
                    {getCategoryIcon(item.category, item.status)}
                  </View>
                  <View style={styles.textGroup}>
                    <Text
                      style={[
                        styles.itemTitle,
                        isActive && styles.activeItemTitle,
                        isDone && styles.doneItemTitle,
                      ]}
                    >
                      {item.title}
                    </Text>
                    {item.subtitle ? (
                      <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                    ) : null}
                  </View>

                  {/* Status Badge */}
                  <View
                    style={[
                      styles.statusBadge,
                      isDone && styles.statusBadgeDone,
                      isActive && styles.statusBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isDone && styles.statusBadgeTextDone,
                        isActive && styles.statusBadgeTextActive,
                      ]}
                    >
                      {isDone ? (t('home.done') || 'Completed') : isActive ? (t('home.upNext') || 'Up next') : (t('home.upcoming') || 'Upcoming')}
                    </Text>
                  </View>
                </View>

                {/* Inline Action Button for Active Task */}
                {isActive && item.onAction && item.actionTitle ? (
                  <TouchableOpacity
                    style={styles.inlineActionBtn}
                    onPress={item.onAction}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.inlineActionBtnText}>{item.actionTitle}</Text>
                    <ChevronRight size={18} color="#FFFFFF" strokeWidth={2.4} />
                  </TouchableOpacity>
                ) : null}
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: 4,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: fontFamily.display,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  viewAllText: {
    fontFamily: fontFamily.text,
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  timelineList: {
    width: '100%',
  },
  itemRow: {
    flexDirection: 'row',
    minHeight: 88,
  },
  timeColumn: {
    width: 64,
    paddingTop: 12,
    alignItems: 'flex-start',
  },
  timeText: {
    fontFamily: fontFamily.mono,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: -0.2,
  },
  activeTimeText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 16,
  },
  doneTimeText: {
    color: colors.muted,
  },
  trackColumn: {
    width: 28,
    alignItems: 'center',
  },
  nodeCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    zIndex: 2,
  },
  nodeCircleActive: {
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  nodeCircleDone: {
    backgroundColor: '#16A34A',
  },
  nodeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#94A3B8',
  },
  nodeDotActive: {
    backgroundColor: colors.primary,
  },
  verticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  verticalLineDone: {
    backgroundColor: '#BBF7D0',
  },
  contentCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    marginBottom: spacing.md,
    marginLeft: 8,
  },
  activeContentCard: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.primary,
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 16px rgba(0, 113, 227, 0.12)',
      },
    }),
  },
  doneContentCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textGroup: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    fontFamily: fontFamily.display,
    fontSize: 17,
    fontWeight: '700',
    color: colors.textDark,
  },
  activeItemTitle: {
    color: colors.primaryDark,
    fontSize: 18,
    fontWeight: '800',
  },
  doneItemTitle: {
    color: colors.muted,
    textDecorationLine: 'line-through',
  },
  itemSubtitle: {
    fontFamily: fontFamily.text,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  statusBadgeActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  statusBadgeDone: {
    backgroundColor: '#DCFCE7',
  },
  statusBadgeText: {
    fontFamily: fontFamily.text,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  statusBadgeTextActive: {
    color: colors.primary,
  },
  statusBadgeTextDone: {
    color: '#15803D',
  },
  inlineActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginTop: spacing.md,
    minHeight: 46,
  },
  inlineActionBtnText: {
    fontFamily: fontFamily.display,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
