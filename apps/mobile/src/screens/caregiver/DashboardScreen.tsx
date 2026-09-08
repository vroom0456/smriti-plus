import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Platform,
  TouchableOpacity, TextInput, Modal, Alert,
} from 'react-native';
import { Gamepad2, CheckCircle2, AlertCircle, Flame, UserPlus, ShieldCheck, X, ArrowRight } from 'lucide-react-native';
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

  // Flo-style patient pairing state
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [linkCodeInput, setLinkCodeInput] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [connectError, setConnectError] = useState('');

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

  const handleConnectPatient = async () => {
    const trimmed = linkCodeInput.trim();
    if (!trimmed) {
      setConnectError('Please enter the patient code');
      return;
    }
    setConnectError('');
    setIsLinking(true);
    try {
      await api.post('/auth/link-caregiver', {
        link_code: trimmed,
        relationship: 'Caregiver',
      });
      setShowConnectModal(false);
      setLinkCodeInput('');
      setLoading(true);
      await fetchDashboard();
      Alert.alert('Connected!', 'You now have full access to the patient’s health overview.');
    } catch (err: any) {
      setConnectError(err?.message || 'Invalid or expired code. Try SMR-842.');
    } finally {
      setIsLinking(false);
    }
  };

  const renderConnectModal = () => (
    <Modal
      visible={showConnectModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowConnectModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <ShieldCheck size={24} color={colors.teal} />
              <Text style={styles.modalTitle}>Connect to Patient</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowConnectModal(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSub}>
            Ask the patient or family for their unique pairing code (e.g. from Family Corner: SMR-842) to connect directly.
          </Text>

          <View style={styles.codeInputWrapper}>
            <TextInput
              style={styles.codeInput}
              placeholder="e.g. SMR-842"
              placeholderTextColor={colors.muted}
              value={linkCodeInput}
              onChangeText={(t) => {
                setLinkCodeInput(t.toUpperCase());
                if (connectError) setConnectError('');
              }}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>

          {!!connectError && (
            <Text style={styles.errorTextModal}>{connectError}</Text>
          )}

          <TouchableOpacity
            style={[styles.connectSubmitBtn, isLinking && styles.btnDisabled]}
            onPress={handleConnectPatient}
            disabled={isLinking}
            activeOpacity={0.8}
          >
            {isLinking ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.connectSubmitBtnText}>Connect to Patient</Text>
                <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

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
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <UserPlus size={36} color={colors.teal} strokeWidth={2.2} />
          </View>
          <Text style={styles.emptyTitle}>Connect to a Patient</Text>
          <Text style={styles.emptySub}>
            Just like Flo app, enter the patient’s special pairing code to instantly access their health adherence, reminders, and activities.
          </Text>

          <View style={styles.codeInputWrapper}>
            <TextInput
              style={styles.codeInput}
              placeholder="Enter code (e.g. SMR-842)"
              placeholderTextColor={colors.muted}
              value={linkCodeInput}
              onChangeText={(t) => {
                setLinkCodeInput(t.toUpperCase());
                if (connectError) setConnectError('');
              }}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>

          {!!connectError && (
            <Text style={styles.errorTextModal}>{connectError}</Text>
          )}

          <TouchableOpacity
            style={[styles.connectSubmitBtn, isLinking && styles.btnDisabled]}
            onPress={handleConnectPatient}
            disabled={isLinking}
            activeOpacity={0.8}
          >
            {isLinking ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.connectSubmitBtnText}>Link Patient Account</Text>
                <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.5} />
              </>
            )}
          </TouchableOpacity>
        </View>
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
      {renderConnectModal()}

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>Caregiver Overview</Text>
          <Text style={styles.elderName} numberOfLines={1}>Monitoring: {elder.name}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerAddBtn}
            onPress={() => setShowConnectModal(true)}
            activeOpacity={0.8}
          >
            <UserPlus size={15} color={colors.teal} strokeWidth={2.2} />
            <Text style={styles.headerAddText}>Switch / Add</Text>
          </TouchableOpacity>
          <RoleBadge role="caregiver" />
        </View>
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

  /* Flo-style connect modal & card styles */
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDFA',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  headerAddText: {
    fontFamily: fontFamily.display,
    fontSize: 12,
    fontWeight: '700',
    color: colors.teal,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    width: '90%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: fontFamily.display,
    fontSize: 22,
    fontWeight: '800',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySub: {
    fontFamily: fontFamily.text,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...shadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    fontWeight: '800',
    color: colors.textDark,
  },
  modalSub: {
    fontFamily: fontFamily.text,
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  codeInputWrapper: {
    width: '100%',
    marginBottom: spacing.md,
  },
  codeInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    fontSize: 22,
    fontFamily: fontFamily.display,
    fontWeight: '800',
    color: colors.textDark,
    textAlign: 'center',
    letterSpacing: 3,
  },
  errorTextModal: {
    fontFamily: fontFamily.text,
    fontSize: 12,
    color: colors.coral,
    marginBottom: spacing.md,
    textAlign: 'center',
    fontWeight: '600',
  },
  connectSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.teal,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    width: '100%',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  connectSubmitBtnText: {
    fontFamily: fontFamily.display,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
