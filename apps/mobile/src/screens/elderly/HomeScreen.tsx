/**
 * SMRITI+ — Elder Home Screen (Apple Health + Calm + Google Assistant Experience)
 *
 * Implements the Production UX Vision:
 * 1. The Home screen answers only ONE question: "What can I do right now?"
 * 2. Hierarchy:
 *    - Header: Personalized Greeting ("Good morning, Amma"), Today's Date, Profile/Settings Avatar
 *    - HERO: SMRITI Voice Assistant Orb (Interactive companion right on the home page)
 *    - TODAY'S PLAN: Tabular numeral timeline (10:00 Memory, 12:30 Medicine, 18:00 Family)
 *    - CONTINUE: Recommended cognitive activity card with large 58px action button
 *    - QUICK ACTIONS: Exactly 4 distinct tiles (Play, Reminders, Journal, Family)
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
  Calendar,
  Settings,
  AlertCircle,
} from 'lucide-react-native';
import { colors, fontFamily, spacing } from '../../theme/tokens';
import { useAuthStore } from '../../state/authStore';
import { api } from '../../services/api';
import { offlineStore } from '../../services/offlineStore';
import { defaultVoiceOrchestrator } from '../../services/voice/VoiceOrchestrator';
import { useTranslation } from '../../i18n';
import { useAppTheme } from '../../theme/useAppTheme';

// SMRITI+ Production Design System
import {
  SMRITIVoiceOrb,
  VoiceState,
  SMRITITimeline,
  TimelineItem,
  SMRITIActivityCard,
  SMRITIQuickActions,
  SMRITIErrorState,
} from '../../components/smriti';

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
}

export default function ElderHomeScreen({ navigation }: any) {
  const { t } = useTranslation();
  const { scale } = useAppTheme();
  const user = useAuthStore((s) => s.user);

  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // SMRITI Voice Companion Hero State
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [companionReply, setCompanionReply] = useState<string | null>(null);
  const [actionSuggestion, setActionSuggestion] = useState<{ label: string; onAction: () => void } | null>(null);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const data = await api.get<HomeSummary>(`/elders/${user.id}/home-summary`);
      setSummary(data);
    } catch {
      try {
        const offlineData = await offlineStore.getOfflineHomeSummary(user.id);
        setSummary(offlineData);
      } catch {
        setError("I couldn't refresh today's plan. Your saved activities are still ready.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Register voice action routing
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
      navigate: (screen: string) => {
        navigation.navigate(screen);
      },
    });
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSummary();
  };

  // ── SMRITI Hero Voice Orb Interaction ──────────────────────────────────────
  const handleOrbPress = async () => {
    if (voiceState === 'listening' || voiceState === 'speaking') {
      // Toggle to idle
      setVoiceState('idle');
      setTranscript('');
      setCompanionReply(null);
      setActionSuggestion(null);
      return;
    }

    // Step 1: Start Listening
    setVoiceState('listening');
    setTranscript('Checking in with SMRITI…');
    setCompanionReply(null);
    setActionSuggestion(null);

    // Simulate speech recognition & backend conversational brain
    setTimeout(async () => {
      setTranscript('What should I do today?');
      setVoiceState('thinking');

      try {
        const payload = {
          elder_id: user?.id || 'demo-elder',
          message: 'What should I do today?',
          language: (user as any)?.preferred_language || 'te-IN',
          elder_name: (user as any)?.preferred_name || user?.name || 'Amma',
        };
        const res: any = await api.post('/voice/companion-chat', payload);

        setVoiceState('speaking');
        setCompanionReply(res.reply || 'You have your memory game at 10:00 AM and medicine at 12:30 PM. Would you like to start?');

        if (res.suggested_action) {
          if (res.suggested_action.type === 'start_game') {
            setActionSuggestion({
              label: res.suggested_action.label || 'Start Memory Activity',
              onAction: () => navigation.navigate('Games'),
            });
          } else if (res.suggested_action.type === 'call_family') {
            setActionSuggestion({
              label: res.suggested_action.label || 'Call Family',
              onAction: () => navigation.navigate('FamilyCorner'),
            });
          }
        }
      } catch {
        setVoiceState('speaking');
        setCompanionReply(
          'Good morning. You have your picture memory activity ready for today. Shall we begin?'
        );
        setActionSuggestion({
          label: 'Start Memory Activity',
          onAction: () => navigation.navigate('Games'),
        });
      }
    }, 1400);
  };

  const handleStopVoice = () => {
    setVoiceState('idle');
  };

  const handleRepeatVoice = () => {
    setVoiceState('speaking');
  };

  const handleSlowDownVoice = () => {
    setCompanionReply('Understood. I will speak more slowly and clearly for you.');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { fontSize: scale(16), color: colors.textSecondary }]}>
          Preparing your morning…
        </Text>
      </View>
    );
  }

  // Date formatting
  const now = new Date();
  const dayStr = now.toLocaleDateString([], { weekday: 'long' });
  const dateFormatted = now.toLocaleDateString([], { month: 'long', day: 'numeric' });

  const greetingPrefix =
    now.getHours() < 12
      ? t('home.goodMorning') || 'Good morning'
      : now.getHours() < 17
      ? t('home.goodAfternoon') || 'Good afternoon'
      : t('home.goodEvening') || 'Good evening';

  const preferredName = (user as any)?.preferred_name || user?.name || 'Amma';
  const greetingFull = `${greetingPrefix}, ${preferredName}`;

  // Today's Plan Timeline Items
  const timelineItems: TimelineItem[] = [
    {
      id: 'routine-1',
      time: '09:00',
      title: t('home.morningRoutine') || 'Morning routine & water',
      category: 'routine',
      status: 'completed',
    },
    {
      id: 'plan-1',
      time: '10:00',
      title: summary?.next_action?.game_name ? (t(`games.${summary.next_action.game_id}`) || summary.next_action.game_name) : (t('games.matchingName') || 'Picture Memory'),
      subtitle: t('home.memoryTraining') || '5-minute memory training',
      category: 'memory',
      status: 'active',
      onPress: () => navigation.navigate('Games'),
      onAction: () => navigation.navigate('Games'),
      actionTitle: t('home.startActivityBtn') || 'Start Activity',
    },
    {
      id: 'plan-2',
      time: '12:30',
      title: summary?.next_reminder?.title || t('home.afternoonMedicine') || 'Blood Pressure Medicine',
      subtitle: t('home.takeWithWater') || 'Take with warm water',
      category: 'medicine',
      status: 'upcoming',
      onPress: () => navigation.navigate('Reminders'),
    },
    {
      id: 'plan-3',
      time: '18:00',
      title: t('home.familyCall') || 'Call Loved Ones',
      subtitle: t('home.catchUpFamily') || 'Evening family check-in',
      category: 'family',
      status: 'upcoming',
      onPress: () => navigation.navigate('FamilyCorner'),
    },
  ];

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
        {/* ── 1. Clean Header (Greeting & Settings Avatar) ── */}
        <View style={styles.headerRow}>
          <View style={styles.headerTextGroup}>
            <View style={styles.dateBadge}>
              <Calendar size={14} color={colors.textSecondary} strokeWidth={2.4} style={{ marginRight: 6 }} />
              <Text style={styles.dateText}>
                {dayStr}, {dateFormatted}
              </Text>
            </View>
            <Text style={styles.greetingTitle}>{greetingFull}</Text>
          </View>

          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel="Settings and Preferences"
          >
            <Image
              source={require('../../../assets/elderly_avatar.png')}
              style={styles.avatarImg}
            />
          </TouchableOpacity>
        </View>

        {error ? <SMRITIErrorState message={error} onRetry={fetchSummary} /> : null}

        {/* ── 2. HERO: SMRITI Voice Assistant Orb ── */}
        <View style={styles.heroSection}>
          <SMRITIVoiceOrb
            state={voiceState}
            transcript={transcript}
            responseMessage={companionReply || undefined}
            onPressOrb={handleOrbPress}
            onStop={handleStopVoice}
            onRepeat={handleRepeatVoice}
            onSlowDown={handleSlowDownVoice}
            actionSuggestion={actionSuggestion}
          />
        </View>

        {/* ── 3. TODAY'S PLAN: Clear Tabular Timeline ── */}
        <SMRITITimeline
          items={timelineItems}
          onViewAll={() => navigation.navigate('Reminders')}
        />

        {/* ── 4. CONTINUE: Recommended Cognitive Exercise ── */}
        <SMRITIActivityCard
          title={summary?.next_action?.game_name || t('games.matchingName') || 'Picture Memory'}
          category={t('home.memoryAndFocus') || 'Memory & Recognition'}
          durationMinutes={5}
          level={summary?.next_action?.difficulty || 2}
          description={t('home.activityDescription') || 'A calm, enjoyable picture exercise designed to strengthen memory recognition.'}
          onStart={() => navigation.navigate('Games')}
          onExploreAll={() => navigation.navigate('Games')}
        />

        {/* ── 5. QUICK ACTIONS: Exactly 4 Clear Destinations ── */}
        <SMRITIQuickActions
          onPlay={() => navigation.navigate('Games')}
          onReminders={() => navigation.navigate('Reminders')}
          onJournal={() => navigation.navigate('PatientIdentityStory')}
          onFamily={() => navigation.navigate('FamilyCorner')}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontFamily: fontFamily.text,
    marginTop: spacing.md,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 60,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerTextGroup: {
    flex: 1,
    marginRight: 12,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dateText: {
    fontFamily: fontFamily.text,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: -0.1,
  },
  greetingTitle: {
    fontFamily: fontFamily.display,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: colors.textDark,
  },
  avatarButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      },
    }),
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: spacing.xl,
    marginVertical: spacing.sm,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 14,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.04)',
      },
    }),
  },
});
