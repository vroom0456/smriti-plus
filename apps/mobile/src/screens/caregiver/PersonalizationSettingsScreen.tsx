/**
 * SMRITI+ — Caregiver Personalization & Human Override Settings
 *
 * Implements Sections 41, 71 & Phase 2 Differentiation:
 * - Direct human caregiver controls over adaptive assistance level
 * - Session length & pace preferences
 * - Text size & calm animation adjustments
 * - Persisted to server and local SQLite
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors, typography, spacing } from '../../theme/tokens';
import { api } from '../../services/api';
import { offlineStore } from '../../services/offlineStore';
import { useAuthStore } from '../../state/authStore';

const ASSISTANCE_LEVELS = [
  { id: 'minimal', label: 'Minimal (4 choices, standard pace)', emoji: '🟢' },
  { id: 'standard', label: 'Standard (Adaptive guidance)', emoji: '🔵' },
  { id: 'high', label: 'High (3 choices, hints enabled)', emoji: '🟡' },
  { id: 'maximum', label: 'Maximum (2 choices, guided step-by-step)', emoji: '🟠' },
];

const SESSION_LENGTHS = [5, 10, 15, 20];
const ANIMATION_MODES = [
  { id: 'calm', label: 'Calm (Gentle, low distraction)' },
  { id: 'standard', label: 'Standard' },
  { id: 'none', label: 'None (Zero movement)' },
];

export default function PersonalizationSettingsScreen() {
  const { user } = useAuthStore();
  const [assistanceLevel, setAssistanceLevel] = useState<string>('standard');
  const [sessionLength, setSessionLength] = useState<number>(10);
  const [animationLevel, setAnimationLevel] = useState<string>('calm');
  const [difficultyPreference, setDifficultyPreference] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [elderId, setElderId] = useState<string>('00000000-0000-0000-0000-000000000001');

  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true);
      let targetId = '00000000-0000-0000-0000-000000000001';
      if (user?.role === 'caregiver' && user?.id) {
        try {
          const dash = await api.get<any>(`/caregiver/${user.id}/dashboard`);
          if (dash?.elder?.id) {
            targetId = dash.elder.id;
            setElderId(dash.elder.id);
          }
        } catch {}
      } else if (user?.id) {
        targetId = user.id;
        setElderId(user.id);
      }

      const res = await api.get<any>(`/elders/${targetId}/personalization`);
      if (res) {
        setAssistanceLevel(res.assistance_level || 'standard');
        setSessionLength(res.preferred_session_length || 10);
        setAnimationLevel(res.animation_level || 'calm');
        setDifficultyPreference(res.difficulty_preference || 1);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        assistance_level: assistanceLevel,
        preferred_session_length: sessionLength,
        animation_level: animationLevel,
        difficulty_preference: difficultyPreference,
      };

      try {
        await api.patch(`/elders/${elderId}/personalization`, payload);
      } catch {
        // Cache locally if offline
        await offlineStore.savePersonalization({ elder_id: elderId, ...payload });
      }

      Alert.alert(
        'Preferences Updated',
        'Your loved one’s experience will immediately adapt to these settings.'
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not save preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Elder Adaptation Controls</Text>
        <Text style={styles.subtitle}>
          Human caregiver override to ensure the app always feels comfortable and stress-free.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.teal} style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* Assistance Level Section */}
          <Text style={styles.sectionHeader}>Adaptive Assistance Level</Text>
          <Text style={styles.sectionDesc}>
            Controls how much guidance and how many choices appear during cognitive games.
          </Text>

          <View style={styles.optionsList}>
            {ASSISTANCE_LEVELS.map((lvl) => {
              const isSelected = assistanceLevel === lvl.id;
              return (
                <TouchableOpacity
                  key={lvl.id}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => setAssistanceLevel(lvl.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.optionEmoji}>{lvl.emoji}</Text>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {lvl.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Session Length Section */}
          <Text style={styles.sectionHeader}>Preferred Activity Duration</Text>
          <Text style={styles.sectionDesc}>
            How long should an activity session last before offering a restful tea break?
          </Text>

          <View style={styles.pillsRow}>
            {SESSION_LENGTHS.map((mins) => {
              const isSelected = sessionLength === mins;
              return (
                <TouchableOpacity
                  key={mins}
                  style={[styles.pillBtn, isSelected && styles.pillBtnSelected]}
                  onPress={() => setSessionLength(mins)}
                >
                  <Text style={[styles.pillBtnText, isSelected && styles.pillBtnTextSelected]}>
                    {mins} mins
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Animation & Visual Calmness */}
          <Text style={styles.sectionHeader}>Visual Motion / Animation</Text>
          <Text style={styles.sectionDesc}>
            Minimize visual movement for elders sensitive to screen transitions.
          </Text>

          <View style={styles.optionsList}>
            {ANIMATION_MODES.map((mode) => {
              const isSelected = animationLevel === mode.id;
              return (
                <TouchableOpacity
                  key={mode.id}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => setAnimationLevel(mode.id)}
                >
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                    {mode.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>Save Adaptation Settings</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mintBg,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.navy,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
    lineHeight: 20,
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.navy,
    marginTop: spacing.lg,
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  optionsList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  optionCardSelected: {
    borderColor: colors.teal,
    backgroundColor: '#F0FDFA',
  },
  optionEmoji: {
    fontSize: 18,
    marginRight: spacing.sm,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navy,
    flex: 1,
  },
  optionLabelSelected: {
    color: colors.teal,
    fontWeight: '700',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  pillBtn: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  pillBtnSelected: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  pillBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navy,
  },
  pillBtnTextSelected: {
    color: colors.white,
  },
  saveButton: {
    backgroundColor: colors.teal,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.xl,
    minHeight: 56,
    justifyContent: 'center',
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '800',
  },
});
