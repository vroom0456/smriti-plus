/**
 * SMRITI+ Quick Actions Component
 *
 * Implements Section 7 of Production UX:
 * 4 primary quick destinations only:
 * - Play (Cognitive training activities)
 * - Reminders (Schedule & medication)
 * - Journal (Tell SMRITI memories)
 * - Family (Call loved ones)
 *
 * Large 56-64px minimum accessible touch targets with clear text labels.
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
  Gamepad2,
  Bell,
  BookOpen,
  HeartHandshake,
} from 'lucide-react-native';
import { colors, fontFamily, spacing } from '../../theme/tokens';

interface QuickActionItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  bgColor: string;
  borderColor: string;
  textColor: string;
  onPress: () => void;
}

interface SMRITIQuickActionsProps {
  onPlay: () => void;
  onReminders: () => void;
  onJournal: () => void;
  onFamily: () => void;
}

export function SMRITIQuickActions({
  onPlay,
  onReminders,
  onJournal,
  onFamily,
}: SMRITIQuickActionsProps) {
  const actions: QuickActionItem[] = [
    {
      id: 'play',
      title: 'Play',
      subtitle: 'Mind games',
      icon: <Gamepad2 size={26} color="#0284C7" strokeWidth={2.4} />,
      bgColor: '#F0F9FF',
      borderColor: '#BAE6FD',
      textColor: '#0369A1',
      onPress: onPlay,
    },
    {
      id: 'reminders',
      title: 'Reminders',
      subtitle: 'Meds & water',
      icon: <Bell size={26} color="#D97706" strokeWidth={2.4} />,
      bgColor: '#FFFBEB',
      borderColor: '#FDE68A',
      textColor: '#B45309',
      onPress: onReminders,
    },
    {
      id: 'journal',
      title: 'Journal',
      subtitle: 'Save memories',
      icon: <BookOpen size={26} color="#0D9488" strokeWidth={2.4} />,
      bgColor: '#F0FDFA',
      borderColor: '#99F6E4',
      textColor: '#0F766E',
      onPress: onJournal,
    },
    {
      id: 'family',
      title: 'Family',
      subtitle: 'Call loved ones',
      icon: <HeartHandshake size={26} color="#E11D48" strokeWidth={2.4} />,
      bgColor: '#FFF1F2',
      borderColor: '#FECDD3',
      textColor: '#BE123C',
      onPress: onFamily,
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeading}>QUICK ACTIONS</Text>
      <View style={styles.grid}>
        {actions.map((act) => (
          <TouchableOpacity
            key={act.id}
            style={[
              styles.tile,
              { backgroundColor: act.bgColor, borderColor: act.borderColor },
            ]}
            onPress={act.onPress}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel={`${act.title} — ${act.subtitle}`}
          >
            <View style={styles.iconWrap}>{act.icon}</View>
            <Text style={[styles.tileTitle, { color: act.textColor }]}>{act.title}</Text>
            <Text style={styles.tileSubtitle}>{act.subtitle}</Text>
          </TouchableOpacity>
        ))}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  tile: {
    width: '48%',
    minHeight: 104,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: spacing.md,
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
      },
    }),
  },
  iconWrap: {
    marginBottom: 6,
  },
  tileTitle: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  tileSubtitle: {
    fontFamily: fontFamily.text,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
