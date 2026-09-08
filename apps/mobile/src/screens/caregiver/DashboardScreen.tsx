import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Platform,
} from 'react-native';
import { Gamepad2, CheckCircle2, AlertCircle, Flame } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows, fontFamily } from '../../theme/tokens';
import { StatCard, AlertBanner, RoleBadge, ReminderCard } from '../../components/UIComponents';
import { useAuthStore } from '../../state/authStore';
import { api } from '../../services/api';

interface DashboardData {
  elder: { id: string; name: string; language: string };
  stats: {
    engagement_this_week: number;
    reminder_adherence_pct: number;
    missed_activities: number;
    current_streak: number;
  };
  trends: { date: string; accuracy: number | null; sessions_count: number }[];
  alerts: { type: 'warning' | 'info' | 'success'; message: string }[];
  recent_sessions: any[];
  reminders: any[];
}

export default function CaregiverDashboardScreen() {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    if (!user) return;
    try {
      const result = await api.get<DashboardData>(`/caregiver/${user.id}/dashboard`);
      setData(result);
    } catch (err: any) {
      console.log('Dashboard error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.teal} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>No linked elders found. Link an elder to view the dashboard.</Text>
      </View>
    );
  }

  const { elder, stats, trends, alerts, recent_sessions, reminders } = data;

  // Simple bar chart visualization
  const maxSessions = Math.max(...trends.map(t => t.sessions_count), 1);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboard(); }} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Caregiver Overview</Text>
          <Text style={styles.elderName}>Monitoring: {elder.name}</Text>
        </View>
        <RoleBadge role="caregiver" />
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatCard
          renderIcon={() => <Gamepad2 size={20} color={colors.teal} strokeWidth={2.2} />}
          label="Sessions"
          value={stats.engagement_this_week}
          subtitle="This week"
        />
        <StatCard
          renderIcon={() => <CheckCircle2 size={20} color={stats.reminder_adherence_pct >= 70 ? colors.success : colors.accent} strokeWidth={2.2} />}
          label="Adherence"
          value={`${stats.reminder_adherence_pct}%`}
          color={stats.reminder_adherence_pct >= 70 ? colors.success : colors.accent}
        />
        <StatCard
          renderIcon={() => <AlertCircle size={20} color={colors.accent} strokeWidth={2.2} />}
          label="Missed"
          value={stats.missed_activities}
          color={colors.accent}
        />
        <StatCard
          renderIcon={() => <Flame size={20} color="#D97706" strokeWidth={2.2} />}
          label="Streak"
          value={`${stats.current_streak}d`}
          color="#D97706"
        />
      </View>

      {/* Alerts */}
      {alerts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Observation Alerts</Text>
          {alerts.map((alert, i) => (
            <AlertBanner key={i} type={alert.type} message={alert.message} />
          ))}
        </View>
      )}

      {/* 14-Day Activity Trend */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>14-Day Activity & Interaction Complexity Trend</Text>
        <View style={[styles.chartContainer, shadows.card]}>
          <View style={styles.chartBars}>
            {trends.map((t, i) => (
              <View key={i} style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(4, (t.sessions_count / maxSessions) * 80),
                      backgroundColor: t.sessions_count > 0
                        ? (t.accuracy && t.accuracy >= 0.7 ? colors.success : colors.teal)
                        : colors.border,
                    },
                  ]}
                />
                <Text style={styles.barLabel}>
                  {new Date(t.date).getDate()}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={styles.legendText}>Comfortable pace</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.teal }]} />
              <Text style={styles.legendText}>Active session</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Recent Sessions */}
      {recent_sessions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Game Sessions</Text>
          {recent_sessions.slice(0, 5).map((s: any) => (
            <View key={s.id} style={[styles.sessionCard, shadows.card]}>
              <View>
                <Text style={styles.sessionTitle}>Cognitive Engagement Session</Text>
                <Text style={styles.sessionDetail}>
                  Accuracy: {Math.round(s.accuracy * 100)}% • Level {s.difficulty_level}
                </Text>
              </View>
              <Text style={styles.sessionTime}>
                {new Date(s.created_at).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Reminders */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Reminders</Text>
        {reminders.map((r: any) => (
          <ReminderCard
            key={r.id}
            title={r.title}
            category={r.category}
            scheduledTime={r.scheduled_time}
            status={r.today_status || 'pending'}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: {
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    padding: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 110,
  },
  errorText: { ...typography.standard.body, color: colors.muted, textAlign: 'center', padding: spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  headerTitle: { fontFamily: fontFamily.display, fontSize: 26, fontWeight: '800', color: colors.textDark, letterSpacing: -0.5 },
  elderName: { ...typography.standard.body, color: colors.muted, marginTop: 4 },
  statsRow: { flexDirection: 'row', marginBottom: spacing.lg, gap: spacing.xs },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    fontFamily: fontFamily.display,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },

  chartContainer: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 100 },
  barWrapper: { alignItems: 'center', flex: 1 },
  bar: { width: 12, borderRadius: 6, minHeight: 4 },
  barLabel: { ...typography.standard.caption, color: colors.muted, marginTop: 4, fontSize: 10 },
  chartLegend: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  legendText: { ...typography.standard.caption, color: colors.muted },
  sessionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle,
  },
  sessionTitle: { ...typography.standard.bodyBold, color: colors.textDark },
  sessionDetail: { ...typography.standard.caption, color: colors.muted, marginTop: 2 },
  sessionTime: { ...typography.standard.caption, color: colors.muted },
});
