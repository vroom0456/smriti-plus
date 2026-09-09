/**
 * SMRITI+ — Elder Home Screen
 *
 * Production-grade mobile healthcare experience designed for elderly users
 * living with cognitive conditions, inspired by Apple iOS Health.
 *
 * Core Principle: ONE SCREEN = ONE PRIMARY PURPOSE
 * Structure:
 * 1. Warm Greeting ("Good morning, Varun — How are you feeling today?")
 * 2. TODAY'S ROUTINE: Single clear progress card ("2 of 3 completed")
 * 3. YOUR NEXT ACTIVITY: ONE primary recommended activity with a large full-width action button
 * 4. QUICK HELP: Accessible 52px actions for Caregiver & Voice Assistance
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  Phone,
  Mic,
  Brain,
  CheckCircle2,
  Calendar,
  Volume2,
  ChevronRight,
  Clock,
  HeartHandshake,
} from 'lucide-react-native';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  touchTargets,
  fontFamily,
} from '../../theme/tokens';
import {
  PrimaryButton,
  SecondaryButton,
  HealthCard,
  ProgressBar,
  AlertBanner,
} from '../../components/UIComponents';
import { useAuthStore } from '../../state/authStore';
import { api } from '../../services/api';
import { offlineStore } from '../../services/offlineStore';
import { defaultVoiceOrchestrator } from '../../services/voice/VoiceOrchestrator';
import { useTranslation } from '../../i18n';

interface HomeSummary {
  greeting: string;
  next_action: {
    message: string;
    game_id: string;
    game_name: string;
    difficulty: number;
    reason: string;
  } | null;
  reminders_today_count: number;
  reminders_pending_count: number;
  current_streak: number;
  care_stage?: number;
  stage_label?: string;
}

export default function ElderHomeScreen({ navigation }: any) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const fetchSummary = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const data = await api.get<HomeSummary>(`/elders/${user.id}/home-summary`);
      setSummary(data);
    } catch (err: any) {
      console.log('HomeScreen online fetch failed, using local offline store:', err);
      try {
        const offlineData = await offlineStore.getOfflineHomeSummary(user.id);
        setSummary(offlineData);
      } catch (localErr) {
        setError('Could not load today’s schedule. Please pull down to refresh.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Connect Voice Orchestrator to HomeScreen navigation and actions
  useEffect(() => {
    defaultVoiceOrchestrator.setCurrentScreen('home');
    defaultVoiceOrchestrator.registerActionHandlers({
      startGame: () => {
        navigation.navigate('Games');
        return true;
      },
      openReminders: () => {
        navigation.navigate('Reminders');
      },
      openProgress: () => {
        navigation.navigate('Reminders');
      },
      navigate: (screen: string) => {
        navigation.navigate(screen);
      },
    });
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSummary();
  };

  // Voice readout simulation / accessibility feature (Section 37)
  const handleReadAloud = () => {
    setIsSpeaking(true);
    setTimeout(() => setIsSpeaking(false), 3000);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Preparing today’s companion…</Text>
      </View>
    );
  }

  const now = new Date();
  const dayStr = now.toLocaleDateString([], { weekday: 'long' });
  const dateFormatted = now.toLocaleDateString([], { month: 'long', day: 'numeric' });

  // Today progress metrics
  const totalReminders = summary?.reminders_today_count || 3;
  const pendingReminders = summary?.reminders_pending_count ?? 1;
  const completedReminders = Math.max(0, totalReminders - pendingReminders);

  const nextActivityTitle = summary?.next_action?.game_name || 'Memory Check';
  const nextActivitySubtitle = summary?.next_action?.message || 'A gentle 5-minute exercise for focus';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── 1. HEADER / GREETING (Calm, Human, Accessible) ────── */}
        <View style={styles.header}>
          <View style={styles.dateRow}>
            <View style={styles.dateWrap}>
              <Calendar size={15} color={colors.textSecondary} strokeWidth={2.2} style={{ marginRight: 6 }} />
              <Text style={styles.dateLabel}>
                {dayStr}, {dateFormatted}
              </Text>
            </View>

            {/* Read Aloud Accessible Trigger (Section 37) */}
            <TouchableOpacity
              onPress={handleReadAloud}
              style={styles.readAloudButton}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Listen to screen instructions"
            >
              <Volume2
                size={16}
                color={isSpeaking ? colors.primary : colors.textSecondary}
                strokeWidth={2.2}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.readAloudText, isSpeaking && styles.readAloudActive]}>
                {isSpeaking ? 'Reading…' : 'Listen'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.greetingTitle}>
            {summary?.greeting || `Good morning, ${user?.name || 'Friend'}`}
          </Text>
          <Text style={styles.greetingSubtitle}>How are you feeling today?</Text>
        </View>

        {error ? <AlertBanner type="warning" message={error} /> : null}

        {/* ── 2. TODAY'S ROUTINE (Large Card, Single Purpose) ────── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>TODAY</Text>
          <HealthCard style={styles.routineCard}>
            <View style={styles.routineHeaderRow}>
              <View style={styles.routineIconWrap}>
                <CheckCircle2 size={24} color={colors.success} strokeWidth={2.2} />
              </View>
              <View style={styles.routineTextGroup}>
                <Text style={styles.routineTitle}>Daily Routine</Text>
                <Text style={styles.routineSubtitle}>
                  {completedReminders} of {totalReminders} activities completed
                </Text>
              </View>
            </View>

            <ProgressBar
              current={completedReminders}
              total={totalReminders}
              style={{ marginTop: spacing.md, marginBottom: spacing.md }}
            />

            <SecondaryButton
              title="View Today’s Schedule"
              onPress={() => navigation.navigate('Reminders')}
              accessibilityLabel="View today's reminders schedule"
            />
          </HealthCard>
        </View>

        {/* ── 3. YOUR NEXT ACTIVITY (Primary Focus, Full-Width Action) ────── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>RECOMMENDED FOR YOU</Text>
          <HealthCard style={styles.activityCard}>
            <View style={styles.activityBadgeRow}>
              <View style={styles.activityPill}>
                <Brain size={14} color={colors.primary} strokeWidth={2.2} style={{ marginRight: 5 }} />
                <Text style={styles.activityPillText}>5 minutes</Text>
              </View>
            </View>

            <Text style={styles.activityTitle}>{nextActivityTitle}</Text>
            <Text style={styles.activityDesc}>{nextActivitySubtitle}</Text>

            {/* ONE PRIMARY ACTION BUTTON (Section 10: Full Width, 56px height) */}
            <PrimaryButton
              title="Start Today’s Activity"
              size="large"
              onPress={() => navigation.navigate('Games')}
              accessibilityLabel={`Start today's activity: ${nextActivityTitle}`}
              style={{ marginTop: spacing.lg }}
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('Games')}
              style={styles.moreActivitiesLink}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="View more activities"
            >
              <Text style={styles.moreActivitiesText}>Explore other activities</Text>
              <ChevronRight size={16} color={colors.primary} strokeWidth={2.2} />
            </TouchableOpacity>
          </HealthCard>
        </View>

        {/* ── 4. QUICK HELP (Caregiver & Voice Assistance) ────── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>QUICK HELP</Text>
          <View style={styles.helpRow}>
            <TouchableOpacity
              onPress={() => navigation.navigate('FamilyCorner')}
              style={styles.quickHelpButton}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Call caregiver"
            >
              <View style={[styles.quickHelpIconWrap, { backgroundColor: 'rgba(52, 199, 89, 0.12)' }]}>
                <Phone size={22} color={colors.successDark} strokeWidth={2.2} />
              </View>
              <View style={styles.quickHelpTextGroup}>
                <Text style={styles.quickHelpTitle}>Call Caregiver</Text>
                <Text style={styles.quickHelpSubtitle}>Tap to connect with family</Text>
              </View>
              <ChevronRight size={18} color={colors.muted} strokeWidth={2.2} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('VoiceAssistant')}
              style={styles.quickHelpButton}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Voice assistant help"
            >
              <View style={[styles.quickHelpIconWrap, { backgroundColor: colors.primaryMuted }]}>
                <Mic size={22} color={colors.primary} strokeWidth={2.2} />
              </View>
              <View style={styles.quickHelpTextGroup}>
                <Text style={styles.quickHelpTitle}>Talk to SMRITI+</Text>
                <Text style={styles.quickHelpSubtitle}>Ask questions with your voice</Text>
              </View>
              <ChevronRight size={18} color={colors.muted} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 5. SUBTLE PRIVACY NOTE (Section 53) ────── */}
        <View style={styles.privacyNote}>
          <HeartHandshake size={15} color={colors.muted} strokeWidth={2} style={{ marginRight: 6 }} />
          <Text style={styles.privacyNoteText}>
            Your health details are private and shared only with your chosen caregiver.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: spacing.screenMargin,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 100,
  },
  loadingText: {
    ...typography.elderly.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },

  // ── Header Section ──
  header: {
    marginBottom: spacing.xl,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  dateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateLabel: {
    fontFamily: fontFamily.text,
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  readAloudButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  readAloudText: {
    fontFamily: fontFamily.text,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  readAloudActive: {
    color: colors.primary,
  },
  greetingTitle: {
    ...typography.elderly.screenTitle,
    marginTop: 4,
  },
  greetingSubtitle: {
    ...typography.elderly.body,
    color: colors.textSecondary,
    marginTop: 4,
  },

  // ── Sections ──
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeading: {
    fontFamily: fontFamily.display,
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.xs + 2,
    paddingHorizontal: 4,
  },

  // ── Routine Card ──
  routineCard: {
    padding: spacing.lg,
  },
  routineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routineIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  routineTextGroup: {
    flex: 1,
  },
  routineTitle: {
    ...typography.elderly.cardHeading,
  },
  routineSubtitle: {
    ...typography.elderly.secondary,
    marginTop: 2,
  },

  // ── Activity Card ──
  activityCard: {
    padding: spacing.lg,
  },
  activityBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  activityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
  },
  activityPillText: {
    fontFamily: fontFamily.display,
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  activityTitle: {
    ...typography.elderly.cardHeading,
    fontSize: 22,
    lineHeight: 28,
  },
  activityDesc: {
    ...typography.elderly.body,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 24,
  },
  moreActivitiesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingVertical: 8,
  },
  moreActivitiesText: {
    fontFamily: fontFamily.display,
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 4,
  },

  // ── Quick Help Buttons ──
  helpRow: {
    gap: 12,
  },
  quickHelpButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 64,
    ...shadows.subtle,
  },
  quickHelpIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  quickHelpTextGroup: {
    flex: 1,
  },
  quickHelpTitle: {
    fontFamily: fontFamily.display,
    fontSize: 17,
    fontWeight: '600',
    color: colors.textDark,
  },
  quickHelpSubtitle: {
    fontFamily: fontFamily.text,
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // ── Privacy Note ──
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  privacyNoteText: {
    fontFamily: fontFamily.text,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
});
