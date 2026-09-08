/**
 * SMRITI+ — Elder Home Screen
 *
 * Minimalist Apple HIG aesthetic:
 * - Authentic vector icons (no cartoon emojis)
 * - Clear visual hierarchy & generous touch targets (56dp+)
 * - Single, unified, non-overwhelming UI for all elders
 * - Spacious 2x2 action grid
 * - Integrated voice assistant floating card
 * - Dynamic data via API with local SQLite offline cache
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
  Gamepad2,
  Bell,
  Users,
  Image as ImageIcon,
  Mic,
  Flame,
} from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows, fontFamily } from '../../theme/tokens';
import { IconTile, AlertBanner } from '../../components/UIComponents';
import { useAuthStore } from '../../state/authStore';
import { api } from '../../services/api';
import { offlineStore } from '../../services/offlineStore';

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
  assistance_level?: number;
  effective_level?: number;
  stage_label?: string;
}

export default function ElderHomeScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const data = await api.get<HomeSummary>(`/elders/${user.id}/home-summary`);
      setSummary(data);
    } catch (err: any) {
      console.log('HomeScreen online fetch failed, loading offline local state:', err);
      try {
        const offlineData = await offlineStore.getOfflineHomeSummary(user.id);
        setSummary(offlineData);
      } catch (localErr) {
        setError(err.message || 'Could not load home screen');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSummary();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.teal} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const now = new Date();
  const dayStr = now.toLocaleDateString([], { weekday: 'long' });
  const dateFormatted = now.toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.teal]} />
      }
    >
      {/* ── Top Header Section (Date, Warm Greeting, Streak) ────── */}
      <View style={styles.greetingHeader}>
        <View style={styles.greetingTextGroup}>
          <Text style={styles.dateLabel} numberOfLines={1}>{dayStr}, {dateFormatted}</Text>
          <Text style={styles.greeting} numberOfLines={1} ellipsizeMode="tail">
            {summary?.greeting || `Hello, ${user?.name}`}
          </Text>
        </View>
        {(summary?.current_streak ?? 0) > 0 && (
          <View style={styles.streakBadge}>
            <Flame size={16} color="#D97706" strokeWidth={2.5} />
            <Text style={styles.streakCount}>{summary?.current_streak}d streak</Text>
          </View>
        )}
      </View>

      {error && <AlertBanner type="warning" message={error} />}

      {/* ── 4 Large Primary Tiles — Apple Health 2x2 Grid ────── */}
      <View style={styles.tilesGrid}>
        <View style={styles.tilesRow}>
          <IconTile
            renderIcon={() => <Gamepad2 size={34} color={colors.teal} strokeWidth={2.2} />}
            label="Play a Game"
            subtitle="Daily exercises"
            onPress={() => navigation.navigate('Games')}
            color={colors.teal}
          />
          <IconTile
            renderIcon={() => <Bell size={34} color="#F59E0B" strokeWidth={2.2} />}
            label="Reminders"
            subtitle="Medicines & tasks"
            onPress={() => navigation.navigate('Reminders')}
            badge={summary?.reminders_pending_count}
            color="#F59E0B"
          />
        </View>

        <View style={styles.tilesRow}>
          <IconTile
            renderIcon={() => <Users size={34} color="#10B981" strokeWidth={2.2} />}
            label="Family Corner"
            subtitle="Calls & messages"
            onPress={() => navigation.navigate('FamilyCorner')}
            color="#10B981"
          />
          <IconTile
            renderIcon={() => <ImageIcon size={34} color="#8B5CF6" strokeWidth={2.2} />}
            label="Memory Vault"
            subtitle="Photos & stories"
            onPress={() => navigation.navigate('MemoryBox')}
            color="#8B5CF6"
          />
        </View>
      </View>

      {/* ── Voice Assistant Card ────────────────────────────── */}
      <View style={[styles.voiceCard, shadows.card]}>
        <View style={styles.voiceCardLeft}>
          <View style={styles.voiceIconWrap}>
            <Mic size={26} color={colors.teal} strokeWidth={2.2} />
          </View>
          <View style={styles.voiceTextGroup}>
            <Text style={styles.voiceCardTitle} numberOfLines={1} ellipsizeMode="tail">Talk to SMRITI+</Text>
            <Text style={styles.voiceCardSubtitle} numberOfLines={1} ellipsizeMode="tail">
              "Remind me medicine" or "Play game"
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.voiceCardButton}
          onPress={() => navigation.navigate('VoiceAssistant')}
          accessibilityRole="button"
          accessibilityLabel="Open voice assistant"
          activeOpacity={0.75}
        >
          <Mic size={16} color={colors.white} strokeWidth={2.5} style={{ marginRight: 6 }} />
          <Text style={styles.voiceCardButtonText} numberOfLines={1}>Speak</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 110,
  },
  loadingText: {
    ...typography.elderly.body,
    color: colors.muted,
    marginTop: spacing.md,
  },

  // ── Header (Date, Greeting, Streak) ──
  greetingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  greetingTextGroup: {
    flex: 1,
    marginRight: spacing.sm,
  },
  dateLabel: {
    fontFamily: fontFamily.text,
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  greeting: {
    ...typography.elderly.h1,
    fontSize: 30,
    fontWeight: '800',
    color: colors.textDark,
    letterSpacing: -0.6,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.12)',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 149, 0, 0.25)',
    gap: 6,
  },
  streakCount: {
    fontFamily: fontFamily.display,
    color: '#D97706',
    fontSize: 14,
    fontWeight: '700',
  },

  // ── 4 Primary Tiles Grid (2x2 Balanced) ──
  tilesGrid: {
    gap: 16,
    marginBottom: spacing.xl,
  },
  tilesRow: {
    flexDirection: 'row',
    gap: 16,
  },

  // ── Voice Assistant Card ──
  voiceCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  voiceCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  voiceIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.tealBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  voiceTextGroup: {
    flex: 1,
  },
  voiceCardTitle: {
    fontFamily: fontFamily.display,
    fontSize: 19,
    fontWeight: '700',
    color: colors.textDark,
    letterSpacing: -0.3,
  },
  voiceCardSubtitle: {
    fontFamily: fontFamily.text,
    fontSize: 14,
    color: colors.muted,
    marginTop: 2,
  },
  voiceCardButton: {
    backgroundColor: colors.teal,
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 5,
    borderRadius: borderRadius.pill,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.glowTeal,
  },
  voiceCardButtonText: {
    fontFamily: fontFamily.display,
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
