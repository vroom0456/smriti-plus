/**
 * SMRITI+ — Memory Recall Game
 *
 * Show N objects, hide them, ask the user to recall/select them.
 * Implements standard session payload. Difficulty controls object count.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { v4 as uuidv4 } from '../../../utils/uuid';
import { colors, typography, spacing, borderRadius, shadows, fontFamily } from '../../../theme/tokens';
import { PrimaryButton, ProgressRing } from '../../../components/UIComponents';
import { useAuthStore } from '../../../state/authStore';
import { api } from '../../../services/api';
import { offlineStore } from '../../../services/offlineStore';
import { ArrowLeft } from 'lucide-react-native';
import { useBackNavigation } from '../../../navigation/useBackNavigation';

const ALL_ITEMS = [
  { id: '1', emoji: '🍎', label: 'Apple' },
  { id: '2', emoji: '🌸', label: 'Flower' },
  { id: '3', emoji: '🐘', label: 'Elephant' },
  { id: '4', emoji: '⭐', label: 'Star' },
  { id: '5', emoji: '🏠', label: 'House' },
  { id: '6', emoji: '🌙', label: 'Moon' },
  { id: '7', emoji: '🐦', label: 'Bird' },
  { id: '8', emoji: '🍵', label: 'Tea' },
  { id: '9', emoji: '🎋', label: 'Bamboo' },
  { id: '10', emoji: '🐟', label: 'Fish' },
  { id: '11', emoji: '☂️', label: 'Umbrella' },
  { id: '12', emoji: '📚', label: 'Book' },
  { id: '13', emoji: '🔔', label: 'Bell' },
  { id: '14', emoji: '🎨', label: 'Paint' },
  { id: '15', emoji: '🪴', label: 'Plant' },
];

const ITEMS_PER_LEVEL: Record<number, number> = {
  1: 3, 2: 4, 3: 5, 4: 6, 5: 8,
};

type Phase = 'memorize' | 'recall' | 'result';

interface MemoryRecallGameProps {
  gameId: string;
  difficulty: number;
  targetTimeMs: number;
  onComplete: (session: any) => void;
  onBack: () => void;
}

export default function MemoryRecallGame({
  gameId, difficulty: initialDifficulty, targetTimeMs, onComplete, onBack,
}: MemoryRecallGameProps) {
  const user = useAuthStore((s: any) => s.user);
  const { panHandlers } = useBackNavigation(null, {
    onCustomBack: onBack,
  });
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const itemCount = ITEMS_PER_LEVEL[difficulty] || 4;
  const [phase, setPhase] = useState<Phase>('memorize');
  const [targetItems, setTargetItems] = useState<typeof ALL_ITEMS>([]);
  const [allOptions, setAllOptions] = useState<typeof ALL_ITEMS>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [startTime, setStartTime] = useState(Date.now());
  const [timer, setTimer] = useState(3 + difficulty); // seconds to memorize
  const [sessionResult, setSessionResult] = useState<any>(null);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [updatedDifficulty, setUpdatedDifficulty] = useState<number | null>(null);

  // Load current saved difficulty from offline store on mount
  useEffect(() => {
    async function loadSavedDifficulty() {
      try {
        const saved = await offlineStore.getDifficulty(user?.id || 'demo-elder-id', gameId);
        if (saved && saved >= 1 && saved <= 5) {
          setDifficulty(saved);
        }
      } catch {}
    }
    loadSavedDifficulty();
  }, [user?.id, gameId]);

  // Restart game helper
  const handleRestartGame = (newDiff?: number) => {
    const targetDiff = newDiff || difficulty;
    setDifficulty(targetDiff);
    setSelected(new Set());
    setSessionResult(null);
    setRecommendation(null);
    setUpdatedDifficulty(null);
    setStartTime(Date.now());
    setTimer(3 + targetDiff);
    setPhase('memorize');
  };

  // Generate round
  useEffect(() => {
    const shuffled = [...ALL_ITEMS].sort(() => Math.random() - 0.5);
    const targets = shuffled.slice(0, itemCount);
    const distractors = shuffled.slice(itemCount, itemCount + Math.min(itemCount + 2, shuffled.length - itemCount));
    const options = [...targets, ...distractors].sort(() => Math.random() - 0.5);

    setTargetItems(targets);
    setAllOptions(options);
  }, [itemCount, startTime]);

  // Memorize countdown
  useEffect(() => {
    if (phase !== 'memorize') return;
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setPhase('recall');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const handleSubmit = async () => {
    const correct = targetItems.filter((item) => selected.has(item.id)).length;
    const accuracy = correct / targetItems.length;
    const responseTime = Date.now() - startTime;
    const sessionId = uuidv4();

    const session = {
      id: sessionId,
      game_id: gameId,
      accuracy: Math.round(accuracy * 1000) / 1000,
      response_time_ms: responseTime,
      completed: true,
      attempts: 1,
      difficulty_level: difficulty,
      streak_at_time: 0,
      device_id: 'mobile-app',
    };

    setSessionResult({ ...session, correct, total: targetItems.length });
    setPhase('result');

    let nextDifficulty = difficulty;

    // 1. Offline-first: save locally in SQLite + sync_queue
    try {
      const recordResult = await offlineStore.recordGameSession({
        elder_id: user?.id || 'demo-elder-id',
        game_id: gameId,
        difficulty_level: difficulty,
        score: correct,
        max_score: targetItems.length,
        accuracy_percentage: Math.round(accuracy * 100),
        response_time_ms: responseTime,
        metrics_payload: { correct, total: targetItems.length },
      });
      if (recordResult?.newDifficulty) {
        nextDifficulty = recordResult.newDifficulty;
        setUpdatedDifficulty(nextDifficulty);
      }
    } catch (localErr) {
      console.warn('[OfflineStore] Failed to save local session:', localErr);
    }

    // 2. Submit to API & get recommendation
    let rec: any = null;
    try {
      const resp = await api.post<any>(`/games/${gameId}/session`, session);
      if (resp?.recommendation) {
        rec = resp.recommendation;
      }
    } catch (err) {
      console.log('Session will sync later via background engine:', err);
    }

    if (!rec) {
      if (accuracy >= 0.85) {
        rec = {
          reason: 'Excellent recall! Your memory retention was swift and accurate.',
          current_level: Math.min(5, difficulty + 1),
        };
      } else if (accuracy < 0.5) {
        rec = {
          reason: 'That was challenging. Next round will give you more time to observe each item.',
          current_level: Math.max(1, difficulty - 1),
        };
      } else {
        rec = {
          reason: 'Steady recall performance! Maintaining your current comfortable level.',
          current_level: difficulty,
        };
      }
    }
    setRecommendation(rec);

    onComplete(session);
  };

  const getEncouragement = () => {
    if (!sessionResult) return '';
    if (sessionResult.accuracy >= 0.85) return 'Superb! You recalled nearly everything accurately.';
    if (sessionResult.accuracy >= 0.5) return 'Good job! Regular practice builds mental stamina.';
    return 'Good effort! Each attempt exercises your focus.';
  };

  // MEMORIZE phase
  if (phase === 'memorize') {
    return (
      <View style={[styles.container, styles.center]} {...panHandlers}>
        <View style={styles.topBarMemorize}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButtonTop}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Exit game and go back"
          >
            <ArrowLeft size={18} color={colors.textDark} strokeWidth={2.4} />
            <Text style={styles.backButtonTopText}>Exit Game</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.phaseTitle}>Remember these items!</Text>
        <Text style={styles.timer}>{timer}s</Text>
        <View style={styles.itemGrid}>
          {targetItems.map((item) => (
            <View key={item.id} style={styles.memorizeItem}>
              <Text style={styles.itemEmoji}>{item.emoji}</Text>
              <Text style={styles.itemLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // RESULT phase
  if (phase === 'result' && sessionResult) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }} {...panHandlers}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.resultScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBarResult}>
            <TouchableOpacity
              onPress={onBack}
              style={styles.backButtonTop}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Back to games"
            >
              <ArrowLeft size={18} color={colors.textDark} strokeWidth={2.4} />
              <Text style={styles.backButtonTopText}>Exit Game</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.completeTitle}>Game Complete!</Text>
          <ProgressRing
            progress={sessionResult.accuracy}
            size={110}
            color={sessionResult.accuracy >= 0.7 ? colors.success : colors.accent}
            label="Recall"
          />

          {/* Dynamic Difficulty Progression Badge */}
          <View style={[
            styles.difficultyBadge,
            updatedDifficulty && updatedDifficulty > difficulty ? styles.difficultyBadgeUp : null,
          ]}>
            <Text style={styles.difficultyBadgeText}>
              {updatedDifficulty && updatedDifficulty > difficulty
                ? `Level Up! Level ${difficulty} ➔ Level ${updatedDifficulty} 🎉`
                : updatedDifficulty && updatedDifficulty < difficulty
                ? `Comfort Pace: Level ${difficulty} ➔ Level ${updatedDifficulty}`
                : `Level ${difficulty} Mastered ⭐`}
            </Text>
          </View>

          <Text style={styles.encouragement}>{getEncouragement()}</Text>
          <Text style={styles.statText}>
            {`Remembered: ${sessionResult.correct}/${sessionResult.total}`}
          </Text>

          {recommendation && (
            <View style={styles.recommendationCard}>
              <Text style={styles.recommendationLabel}>Personalized Recommendation</Text>
              <Text style={styles.recommendationText}>{recommendation.reason}</Text>
            </View>
          )}

          <View style={styles.resultActions}>
            <PrimaryButton
              title={updatedDifficulty && updatedDifficulty > difficulty ? `Play Level ${updatedDifficulty} ➔` : 'Play Again'}
              onPress={() => handleRestartGame(updatedDifficulty || difficulty)}
              variant="success"
              style={styles.actionBtnPlayNext}
            />
            <PrimaryButton
              title="Back to Activities"
              onPress={onBack}
              variant="secondary"
              style={styles.actionBtnBack}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  // RECALL phase
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} {...panHandlers}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButtonTop}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Back to games"
        >
          <ArrowLeft size={18} color={colors.textDark} strokeWidth={2.4} />
          <Text style={styles.backButtonTopText}>Exit Game</Text>
        </TouchableOpacity>
        <Text style={styles.phaseTitle}>Which items did you see?</Text>
        <Text style={styles.subtitle}>Tap all the items you remember</Text>

        <View style={styles.optionsGrid}>
          {allOptions.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => toggleSelect(item.id)}
              activeOpacity={0.7}
              style={[
                styles.optionItem,
                selected.has(item.id) && styles.optionSelected,
              ]}
            >
              <Text style={styles.itemEmoji}>{item.emoji}</Text>
              <Text style={styles.itemLabel}>{item.label}</Text>
              {selected.has(item.id) && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <PrimaryButton
          title={`Submit (${selected.size} selected)`}
          onPress={handleSubmit}
          disabled={selected.size === 0}
          variant="success"
          style={styles.submitBtn}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'ios' ? 56 : 38,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  topBarMemorize: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  topBarResult: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 160 : 130,
  },
  resultScrollContent: {
    paddingHorizontal: spacing.screenMargin,
    paddingBottom: Platform.OS === 'ios' ? 160 : 130,
    alignItems: 'center',
  },
  backButtonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.pill,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 46,
    ...shadows.subtle,
  },
  backButtonTopText: {
    fontFamily: fontFamily.display,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textDark,
  },
  phaseTitle: {
    ...typography.elderly.h2,
    fontSize: 28,
    fontWeight: '800',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: spacing.xs,
    letterSpacing: -0.4,
  },
  subtitle: {
    ...typography.elderly.caption,
    fontSize: 16,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  timer: {
    fontSize: 52,
    fontWeight: '800',
    color: colors.teal,
    marginBottom: spacing.xl,
  },
  itemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  memorizeItem: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.md,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...shadows.card,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
  },
  optionItem: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.md,
    alignItems: 'center',
    minWidth: 96,
    minHeight: 96,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    position: 'relative',
    ...shadows.card,
  },
  optionSelected: {
    borderColor: colors.teal,
    backgroundColor: 'rgba(0, 113, 227, 0.08)',
  },
  itemEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  itemLabel: {
    ...typography.elderly.caption,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 6,
    right: 8,
    color: colors.teal,
    fontSize: 20,
    fontWeight: '800',
  },
  submitBtn: {
    marginTop: spacing.xl,
    minHeight: 56,
  },
  completeTitle: {
    ...typography.elderly.h1,
    fontSize: 32,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: spacing.lg,
  },
  encouragement: {
    ...typography.elderly.body,
    fontSize: 18,
    color: colors.teal,
    textAlign: 'center',
    marginVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  statText: {
    ...typography.elderly.caption,
    fontSize: 16,
    color: colors.textDark,
  },
  backBtn: {
    marginTop: spacing.lg,
    width: '100%',
    minHeight: 56,
  },
  recommendationCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    width: '90%',
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    ...shadows.card,
  },
  recommendationLabel: {
    ...typography.elderly.caption,
    color: colors.teal,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recommendationText: {
    ...typography.elderly.body,
    color: colors.navy,
    lineHeight: 24,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1.5,
    borderColor: '#99F6E4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  difficultyBadgeUp: {
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    borderColor: colors.success,
  },
  difficultyBadgeText: {
    fontFamily: fontFamily.display,
    fontSize: 15,
    fontWeight: '800',
    color: colors.textDark,
    letterSpacing: 0,
  },
  resultActions: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtnPlayNext: {
    width: '100%',
    minHeight: 52,
  },
  actionBtnBack: {
    width: '100%',
    minHeight: 48,
  },
});
