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
  Image,
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
  ShieldCheck,
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
import { useAppTheme } from '../../theme/useAppTheme';

interface HomeSummary {
  greeting: string;
  next_reminder?: {
    id?: string;
    title?: string;
    category?: string;
    scheduled_time?: string;
  } | null;
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
  const { fontScale, highContrast, colors, scale, hcStyles } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeReminderDone, setActiveReminderDone] = useState(false);

  const handleMarkTaken = async () => {
    setActiveReminderDone(true);
    const remId = summary?.next_reminder?.id || 'med-1';
    try {
      await offlineStore.toggleReminderTaken(remId, true);
    } catch {}
  };

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

  const handleReadAloud = () => {
    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    setTimeout(() => setIsSpeaking(false), 3000);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { fontSize: scale(16), color: colors.textSecondary }]}>
          {t('reminders.loading') || 'Loading today’s schedule…'}
        </Text>
      </View>
    );
  }

  const now = new Date();
  const dayStr = now.toLocaleDateString([], { weekday: 'long' });
  const dateFormatted = now.toLocaleDateString([], { month: 'long', day: 'numeric' });

  const greetingPrefix =
    now.getHours() < 12
      ? t('home.goodMorning') || 'Good morning'
      : now.getHours() < 17
      ? t('home.goodAfternoon') || 'Good afternoon'
      : t('home.goodEvening') || 'Good evening';
  const greetingFull = `${greetingPrefix}, ${user?.name || 'Friend'}`;

  const totalReminders = summary?.reminders_today_count || 3;
  const rawPending = summary?.reminders_pending_count ?? 1;
  const completedReminders = Math.min(
    totalReminders,
    Math.max(0, totalReminders - rawPending) + (activeReminderDone ? 1 : 0)
  );

  const nextActivityTitle = summary?.next_action?.game_name || t('games.memoryMatching') || 'Memory Matching';
  const nextActivitySubtitle =
    summary?.next_action?.message || t('games.subtitle') || 'A gentle 5-minute exercise for focus';

  const upcomingMedTitle =
    summary?.next_reminder?.title || (t('reminders.categories.medication') ? `${t('reminders.categories.medication')} - 08:00 AM` : 'Blood Pressure Medicine');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        <View style={styles.header}>
          {/* SMRITI+ Brand Header & Profile from Serene Heritage Design */}
          <View style={styles.brandRow}>
            <View style={styles.brandLeft}>
              <Image
                source={require('../../../assets/emblem.png')}
                style={styles.brandEmblem}
                resizeMode="contain"
              />
              <View>
                <Text style={styles.brandTitle}>SMRITI+</Text>
                <Text style={styles.culturalPackTag}>Heritage Companion</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              style={styles.avatarWrap}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="View settings and profile"
            >
              <Image
                source={require('../../../assets/elderly_avatar.png')}
                style={styles.avatarImg}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.dateRow}>
            <View style={styles.dateWrap}>
              <Calendar size={15} color={colors.textSecondary} strokeWidth={2.2} style={{ marginRight: 6 }} />
              <Text style={[styles.dateLabel, { fontSize: scale(14), color: colors.textSecondary }]}>
                {dayStr}, {dateFormatted}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleReadAloud}
              style={[
                styles.readAloudButton,
                { backgroundColor: colors.surfaceSecondary, borderColor: colors.border },
                hcStyles.buttonBorder,
              ]}
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
              <Text
                style={[
                  styles.readAloudText,
                  { fontSize: scale(13), color: isSpeaking ? colors.primary : colors.textSecondary },
                  isSpeaking && styles.readAloudActive,
                ]}
              >
                {isSpeaking ? t('home.reading') || 'Reading…' : t('home.listen') || 'Listen'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text
            style={[
              styles.greetingTitle,
              { fontSize: scale(26), lineHeight: scale(32), color: colors.textDark },
              hcStyles.boldText,
            ]}
          >
            {greetingFull}
          </Text>
          <Text style={[styles.greetingSubtitle, { fontSize: scale(15), lineHeight: scale(21), color: colors.textSecondary }]}>
            Welcome to SMRITI+ — Your daily companion
          </Text>
        </View>

        {error ? <AlertBanner type="warning" message={error} /> : null}

        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { fontSize: scale(12), color: colors.muted }]}>
            {t('home.today') || 'TODAY'}
          </Text>
          <HealthCard style={[styles.routineCard, hcStyles.cardBorder]}>
            <View style={styles.routineHeaderRow}>
              <View style={[styles.routineIconWrap, { backgroundColor: colors.successBg }]}>
                <CheckCircle2 size={24} color={colors.success} strokeWidth={2.2} />
              </View>
              <View style={styles.routineTextGroup}>
                <Text style={[styles.routineTitle, { fontSize: scale(19), color: colors.textDark }]}>
                  {t('home.dailyRoutine') || 'Daily Routine'}
                </Text>
                <Text style={[styles.routineSubtitle, { fontSize: scale(14), color: colors.textSecondary }]}>
                  {completedReminders} of {totalReminders} completed
                </Text>
              </View>
            </View>

            {!activeReminderDone ? (
              <View style={[styles.interactiveReminderBox, { borderColor: colors.borderLight }]}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.reminderPillLabel, { fontSize: scale(11), color: colors.primary }]}>
                    NEXT REMINDER
                  </Text>
                  <Text style={[styles.reminderItemTitle, { fontSize: scale(15), color: colors.textDark }]} numberOfLines={1}>
                    {upcomingMedTitle}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.markTakenBtn, { backgroundColor: colors.success }, hcStyles.buttonBorder]}
                  onPress={handleMarkTaken}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Mark reminder completed"
                >
                  <CheckCircle2 size={16} color="#FFFFFF" strokeWidth={2.4} style={{ marginRight: 4 }} />
                  <Text style={[styles.markTakenBtnText, { fontSize: scale(13) }]}>
                    Mark Taken
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.reminderSuccessBox, { backgroundColor: colors.successBg }]}>
                <CheckCircle2 size={18} color={colors.success} strokeWidth={2.4} style={{ marginRight: 6 }} />
                <Text style={[styles.reminderSuccessText, { fontSize: scale(14), color: colors.successDark }]}>
                  {t('home.completedBadge') || 'Done ✓'} — {upcomingMedTitle}
                </Text>
              </View>
            )}

            <ProgressBar
              current={completedReminders}
              total={totalReminders}
              style={{ marginTop: spacing.md, marginBottom: spacing.md }}
            />

            <SecondaryButton
              title={t('home.viewSchedule') || 'View Today’s Schedule'}
              onPress={() => navigation.navigate('Reminders')}
              accessibilityLabel="View today's reminders schedule"
            />
          </HealthCard>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { fontSize: scale(12), color: colors.muted }]}>
            {t('home.recommendedForYou') || 'RECOMMENDED FOR YOU'}
          </Text>
          <HealthCard style={[styles.activityCard, hcStyles.cardBorder]}>
            <View style={styles.activityBadgeRow}>
              <View style={[styles.activityPill, { backgroundColor: colors.primaryMuted }]}>
                <Brain size={14} color={colors.primary} strokeWidth={2.2} style={{ marginRight: 5 }} />
                <Text style={[styles.activityPillText, { fontSize: scale(13), color: colors.primary }]}>
                  5 minutes
                </Text>
              </View>
            </View>

            <Text style={[styles.activityTitle, { fontSize: scale(22), lineHeight: scale(28), color: colors.textDark }]}>
              {nextActivityTitle}
            </Text>
            <Text style={[styles.activityDesc, { fontSize: scale(15), lineHeight: scale(22), color: colors.textSecondary }]}>
              Choose a game to exercise your mind
            </Text>

            <PrimaryButton
              title={t('home.startActivity') || 'Start Today’s Activity'}
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
              accessibilityLabel="Explore more activities"
            >
              <Text style={[styles.moreActivitiesText, { fontSize: scale(15), color: colors.primary }]}>
                {t('home.moreActivities') || 'Explore More Activities'}
              </Text>
              <ChevronRight size={16} color={colors.primary} strokeWidth={2.2} />
            </TouchableOpacity>
          </HealthCard>
        </View>

        {/* ── Quick Help ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { fontSize: scale(12), color: colors.muted }]}>
            {t('home.quickHelp') || 'QUICK HELP'}
          </Text>
          <View style={styles.helpRow}>
            <TouchableOpacity
              onPress={() => navigation.navigate('CaregiverHelp')}
              style={[styles.quickHelpButton, { backgroundColor: colors.surface, borderColor: colors.border }, hcStyles.cardBorder]}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Call caregiver for help"
            >
              <View style={[styles.quickHelpIconWrap, { backgroundColor: colors.primaryMuted }]}>
                <Phone size={22} color={colors.primary} strokeWidth={2.2} />
              </View>
              <View style={styles.quickHelpTextGroup}>
                <Text style={[styles.quickHelpTitle, { fontSize: scale(17), color: colors.textDark }]}>
                  {t('home.callCaregiver') || 'Call Caregiver'}
                </Text>
                <Text style={[styles.quickHelpSubtitle, { fontSize: scale(13), color: colors.textSecondary }]}>
                  Tap to connect with family
                </Text>
              </View>
              <ChevronRight size={18} color={colors.muted} strokeWidth={2.2} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('VoiceAssistant')}
              style={[styles.quickHelpButton, { backgroundColor: colors.surface, borderColor: colors.border }, hcStyles.cardBorder]}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Voice assistant help"
            >
              <View style={[styles.quickHelpIconWrap, { backgroundColor: colors.primaryMuted }]}>
                <Mic size={22} color={colors.primary} strokeWidth={2.2} />
              </View>
              <View style={styles.quickHelpTextGroup}>
                <Text style={[styles.quickHelpTitle, { fontSize: scale(17), color: colors.textDark }]}>
                  {t('home.talkSmriti') || 'Talk to SMRITI+'}
                </Text>
                <Text style={[styles.quickHelpSubtitle, { fontSize: scale(13), color: colors.textSecondary }]}>
                  Ask questions with your voice
                </Text>
              </View>
              <ChevronRight size={18} color={colors.muted} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Serene Heritage Daily Whisper Footer Banner */}
        <View style={styles.serenityFooter}>
          <Text style={styles.serenityQuoteMark}>“</Text>
          <Text style={styles.serenityQuoteText}>
            A calm mind is a healthy mind. Take your time, there is no hurry.
          </Text>
          <Text style={styles.serenityAuthorText}>— SMRITI+ Daily Companion</Text>
        </View>

        <View style={styles.privacyNote}>
          <ShieldCheck size={16} color={colors.muted} strokeWidth={2} style={{ marginRight: 6 }} />
          <Text style={[styles.privacyNoteText, { fontSize: scale(13), color: colors.muted }]}>
            Your health details are strictly private.
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
    paddingBottom: Platform.OS === 'ios' ? 160 : 135,
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
    letterSpacing: 0,
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
  interactiveReminderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
    padding: 12,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  reminderPillLabel: {
    fontFamily: fontFamily.display,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0,
    marginBottom: 2,
  },
  reminderItemTitle: {
    fontFamily: fontFamily.display,
    fontWeight: '700',
  },
  markTakenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: borderRadius.pill,
    minHeight: 42,
    ...shadows.subtle,
  },
  markTakenBtnText: {
    fontFamily: fontFamily.display,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  reminderSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  reminderSuccessText: {
    fontFamily: fontFamily.display,
    fontWeight: '700',
    flex: 1,
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

  // ── Serene Heritage Design Additions ──
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandEmblem: {
    width: 38,
    height: 38,
    borderRadius: 8,
  },
  brandTitle: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0,
    lineHeight: 20,
  },
  culturalPackTag: {
    fontFamily: fontFamily.display,
    fontSize: 12,
    fontWeight: '600',
    color: colors.teal,
    letterSpacing: 0,
  },
  avatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.teal,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  serenityFooter: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
    ...shadows.card,
  },
  serenityQuoteMark: {
    fontFamily: fontFamily.display,
    fontSize: 28,
    lineHeight: 28,
    color: colors.teal,
    fontWeight: '800',
    marginBottom: 2,
  },
  serenityQuoteText: {
    fontFamily: fontFamily.text,
    fontSize: 15,
    fontStyle: 'italic',
    color: colors.textDark,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 4,
    letterSpacing: 0,
  },
  serenityAuthorText: {
    fontFamily: fontFamily.display,
    fontSize: 12,
    fontWeight: '700',
    color: colors.teal,
    letterSpacing: 0,
  },
});
