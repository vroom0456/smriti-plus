/**
 * SMRITI+ Activity Card Component
 *
 * Implements Section 8 & 9 of Production UX:
 * - Cognitive session context (Duration, Category, Difficulty)
 * - Clear, encouraging purpose statement
 * - 56px large interactive start/continue button
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
  Brain,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react-native';
import { colors, fontFamily, spacing } from '../../theme/tokens';
import { SMRITIButton } from './SMRITIComponents';

interface SMRITIActivityCardProps {
  title: string;
  category?: string;
  durationMinutes?: number;
  level?: number;
  description?: string;
  onStart: () => void;
  onExploreAll?: () => void;
}

export function SMRITIActivityCard({
  title,
  category = 'Memory & Focus',
  durationMinutes = 5,
  level = 2,
  description = 'A gentle activity to keep your memory sharp and peaceful.',
  onStart,
  onExploreAll,
}: SMRITIActivityCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeading}>CONTINUE ACTIVITY</Text>

      <View style={styles.card}>
        {/* Badges Row */}
        <View style={styles.badgeRow}>
          <View style={styles.categoryBadge}>
            <Brain size={15} color={colors.primary} strokeWidth={2.4} style={{ marginRight: 6 }} />
            <Text style={styles.categoryBadgeText}>{category}</Text>
          </View>

          <View style={styles.timeBadge}>
            <Clock size={14} color={colors.textSecondary} strokeWidth={2.2} style={{ marginRight: 4 }} />
            <Text style={styles.timeBadgeText}>{durationMinutes} mins</Text>
          </View>

          <View style={styles.levelBadge}>
            <Sparkles size={14} color="#D97706" strokeWidth={2.4} style={{ marginRight: 4 }} />
            <Text style={styles.levelBadgeText}>Level {level}</Text>
          </View>
        </View>

        {/* Title & Description */}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        {/* Big Action Button */}
        <SMRITIButton
          title="Start Activity ➔"
          onPress={onStart}
          variant="primary"
          size="large"
          style={styles.actionBtn}
          accessibilityLabel={`Start ${title} activity`}
        />

        {onExploreAll ? (
          <TouchableOpacity
            style={styles.exploreLink}
            onPress={onExploreAll}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Explore all mind activities"
          >
            <Text style={styles.exploreLinkText}>Explore all activities</Text>
            <ChevronRight size={17} color={colors.primary} strokeWidth={2.4} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
    width: '100%',
  },
  sectionHeading: {
    fontFamily: fontFamily.display,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm + 2,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: spacing.xl,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 14,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  categoryBadgeText: {
    fontFamily: fontFamily.text,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },
  timeBadgeText: {
    fontFamily: fontFamily.text,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
  },
  levelBadgeText: {
    fontFamily: fontFamily.text,
    fontSize: 13,
    color: '#92400E',
    fontWeight: '700',
  },
  title: {
    fontFamily: fontFamily.display,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.textDark,
    marginBottom: 6,
  },
  description: {
    fontFamily: fontFamily.text,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  actionBtn: {
    width: '100%',
    minHeight: 58,
  },
  exploreLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingVertical: 6,
  },
  exploreLinkText: {
    fontFamily: fontFamily.text,
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 4,
  },
});
