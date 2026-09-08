import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { v4 as uuidv4 } from 'uuid';
import { colors, typography, spacing, borderRadius, fontFamily } from '../../theme/tokens';
import { ReminderCard, AlertBanner } from '../../components/UIComponents';
import { useAuthStore } from '../../state/authStore';
import { api } from '../../services/api';
import { offlineStore } from '../../services/offlineStore';
import { useTranslation } from '../../i18n';
import { useBackNavigation } from '../../navigation/useBackNavigation';

interface ReminderData {
  id: string;
  category: string;
  title: string;
  scheduled_time: string;
  today_status: string;
  description?: string;
}

export default function RemindersScreen({ navigation }: any) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [reminders, setReminders] = useState<ReminderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { goBackSafe, panHandlers } = useBackNavigation(navigation, { fallbackTab: 'Home' });

  const fetchReminders = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.get<ReminderData[]>(`/elders/${user.id}/reminders/today`);
      setReminders(data);
      // Cache in SQLite for offline access
      if (Array.isArray(data)) {
        await offlineStore.cacheReminders(
          data.map((d) => ({
            id: d.id,
            elder_id: user.id,
            title: d.title,
            category: d.category,
            scheduled_time: d.scheduled_time,
            active: d.today_status === 'pending' ? 1 : 0,
            created_by: user.id,
            created_at: new Date().toISOString(),
          }))
        );
      }
    } catch (err) {
      console.log('Could not load reminders online, reading from local SQLite:', err);
      try {
        const cached = await offlineStore.getCachedReminders(user.id);
        setReminders(
          cached.map((c) => ({
            id: c.id,
            category: c.category,
            title: c.title,
            scheduled_time: c.scheduled_time,
            today_status: c.active === 1 ? 'pending' : 'done',
          }))
        );
      } catch (localErr) {
        console.warn('Failed to read cached reminders:', localErr);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { fetchReminders(); }, [fetchReminders]);

  const handleDone = async (reminderId: string) => {
    // 1. Offline-first: save action to SQLite & sync_queue
    try {
      await offlineStore.recordReminderAction({
        reminder_id: reminderId,
        elder_id: user?.id || 'demo-elder-id',
        scheduled_for: new Date().toISOString(),
        action: 'completed',
        confirmed_via: 'touch',
      });
    } catch (localErr) {
      console.warn('Failed to record local reminder action:', localErr);
    }

    // 2. Optimistically update local screen state
    setReminders((prev) =>
      prev.map((r) => (r.id === reminderId ? { ...r, today_status: 'done' } : r))
    );

    // 3. Attempt immediate online sync
    try {
      const logId = uuidv4();
      await api.post(`/reminders/${reminderId}/log`, {
        id: logId,
        status: 'done',
        responded_via: 'touch',
      });
    } catch (err: any) {
      console.log('Reminder logged locally; will sync when reconnected.');
    }
  };

  const pending = reminders.filter((r) => r.today_status === 'pending');
  const completed = reminders.filter((r) => r.today_status !== 'pending');

  if (loading) {
    return (
      <View style={[styles.container, styles.center]} {...panHandlers}>
        <ActivityIndicator size="large" color={colors.teal} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} {...panHandlers}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReminders(); }} />}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={goBackSafe}
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
          activeOpacity={0.75}
        >
          <ArrowLeft size={16} color={colors.textDark} strokeWidth={2.4} style={{ marginRight: 6 }} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t('reminders.title') || "Reminders"}</Text>

        {reminders.length === 0 && (
          <AlertBanner type="info" message={t('reminders.noReminders') || "No active reminders. Enjoy your day!"} />
        )}

        {pending.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('reminders.upcoming') || "Upcoming"}</Text>
            {pending.map((r) => (
              <ReminderCard
                key={r.id}
                title={r.title}
                category={r.category}
                scheduledTime={r.scheduled_time}
                status="pending"
                onDone={() => handleDone(r.id)}
              />
            ))}
          </>
        )}

        {completed.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('reminders.completedMissed') || "Completed / Missed"}</Text>
            {completed.map((r) => (
              <ReminderCard
                key={r.id}
                title={r.title}
                category={r.category}
                scheduledTime={r.scheduled_time}
                status={r.today_status as any}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
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
    paddingTop: 56,
    paddingBottom: 110,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.pill,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 44,
  },
  backText: {
    fontFamily: fontFamily.display,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
  },
  title: { ...typography.elderly.h1, fontSize: 30, fontWeight: '800', color: colors.textDark, marginBottom: spacing.lg, letterSpacing: -0.6 },
  sectionTitle: { ...typography.elderly.h3, fontSize: 20, fontWeight: '700', color: colors.textDark, marginBottom: spacing.md, marginTop: spacing.md, letterSpacing: -0.3 },
});
