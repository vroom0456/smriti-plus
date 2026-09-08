/**
 * SMRITI+ — Daily Routine & Reminders Screen
 *
 * Production-grade mobile healthcare schedule screen designed for elderly users:
 * - Clear human language ("Daily Routine", "Upcoming Today", "Completed")
 * - 56px+ tap targets with explicit status badges
 * - Visual progress indicator ("2 of 4 done today")
 * - Seamless offline caching with SQLite
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import { ArrowLeft, Clock, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { v4 as uuidv4 } from 'uuid';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  touchTargets,
  fontFamily,
} from '../../theme/tokens';
import { ReminderCard, AlertBanner, ProgressBar } from '../../components/UIComponents';
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

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const handleDone = async (reminderId: string) => {
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

    setReminders((prev) =>
      prev.map((r) => (r.id === reminderId ? { ...r, today_status: 'done' } : r))
    );

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
  const total = reminders.length;
  const completedCount = completed.length;

  if (loading) {
    return (
      <View style={[styles.container, styles.center]} {...panHandlers}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading today’s schedule…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} {...panHandlers}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchReminders();
            }}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={goBackSafe}
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
          activeOpacity={0.75}
        >
          <ArrowLeft size={18} color={colors.textDark} strokeWidth={2.4} style={{ marginRight: 6 }} />
          <Text style={styles.backText}>Home</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t('reminders.title') || 'Daily Routine'}</Text>
        <Text style={styles.subtitle}>Your medicine and activity schedule for today</Text>

        {/* Progress summary banner */}
        {total > 0 && (
          <View style={[styles.progressCard, shadows.card]}>
            <ProgressBar
              current={completedCount}
              total={total}
              label={`${completedCount} of ${total} items completed`}
            />
          </View>
        )}

        {total === 0 && (
          <AlertBanner
            type="info"
            message={t('reminders.noReminders') || 'No scheduled activities for today. Enjoy your day!'}
          />
        )}

        {/* Pending Items */}
        {pending.length > 0 && (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeading}>UPCOMING TODAY</Text>
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
          </View>
        )}

        {/* Completed Items */}
        {completed.length > 0 && (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionHeading}>COMPLETED</Text>
            {completed.map((r) => (
              <ReminderCard
                key={r.id}
                title={r.title}
                category={r.category}
                scheduledTime={r.scheduled_time}
                status={r.today_status as any}
              />
            ))}
          </View>
        )}
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
    paddingBottom: 110,
  },
  loadingText: {
    ...typography.elderly.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.pill,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: touchTargets.buttonHeightSecondary,
    ...shadows.subtle,
  },
  backText: {
    fontFamily: fontFamily.display,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
  },
  title: {
    ...typography.elderly.screenTitle,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.elderly.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    padding: spacing.md + 2,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  sectionWrap: {
    marginBottom: spacing.xl,
  },
  sectionHeading: {
    fontFamily: fontFamily.display,
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
  },
});
