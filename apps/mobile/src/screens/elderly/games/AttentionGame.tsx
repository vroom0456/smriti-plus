/**
 * SMRITI+ — Attention/Concentration Game (Spot the Odd One Out)
 *
 * Find the different item in a group. Timed rounds.
 * Difficulty controls grid size and visual similarity.
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { colors, typography, spacing, borderRadius, shadows, fontFamily } from '../../../theme/tokens';
import { PrimaryButton, ProgressRing } from '../../../components/UIComponents';
import { useAuthStore } from '../../../state/authStore';
import { api } from '../../../services/api';
import { offlineStore } from '../../../services/offlineStore';
import { ArrowLeft } from 'lucide-react-native';
import { useBackNavigation } from '../../../navigation/useBackNavigation';

const ODD_ONE_OUT_SETS = [
  { majority: '🍎', odd: '🍊', label: 'Find the orange' },
  { majority: '🔵', odd: '🟢', label: 'Find the green circle' },
  { majority: '🌸', odd: '🌺', label: 'Find the different flower' },
  { majority: '⭐', odd: '🌙', label: 'Find the moon' },
  { majority: '🐦', odd: '🦅', label: 'Find the eagle' },
  { majority: '🍵', odd: '☕', label: 'Find the coffee' },
  { majority: '🏠', odd: '🏡', label: 'Find the house with garden' },
  { majority: '🎋', odd: '🌿', label: 'Find the leaf' },
  { majority: '🐟', odd: '🐠', label: 'Find the tropical fish' },
  { majority: '🔴', odd: '🟠', label: 'Find the orange circle' },
];

const GRID_SIZE: Record<number, number> = { 1: 4, 2: 6, 3: 9, 4: 12, 5: 16 };

interface AttentionGameProps {
  gameId: string;
  difficulty: number;
  targetTimeMs: number;
  onComplete: (session: any) => void;
  onBack: () => void;
}

export default function AttentionGame({ gameId, difficulty, targetTimeMs, onComplete, onBack }: AttentionGameProps) {
  const user = useAuthStore((s: any) => s.user);
  const { panHandlers } = useBackNavigation(null, {
    onCustomBack: onBack,
  });
  const gridSize = GRID_SIZE[difficulty] || 6;
  const totalRounds = 3 + difficulty;

  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [currentSet, setCurrentSet] = useState(ODD_ONE_OUT_SETS[0]);
  const [grid, setGrid] = useState<{ emoji: string; isOdd: boolean }[]>([]);
  const [oddIndex, setOddIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [startTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);
  const [sessionResult, setSessionResult] = useState<any>(null);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(Math.max(10, 20 - difficulty * 2));

  const generateRound = () => {
    const setIndex = (round + Math.floor(Math.random() * ODD_ONE_OUT_SETS.length)) % ODD_ONE_OUT_SETS.length;
    const set = ODD_ONE_OUT_SETS[setIndex];
    setCurrentSet(set);

    const oddPos = Math.floor(Math.random() * gridSize);
    setOddIndex(oddPos);

    const newGrid = Array.from({ length: gridSize }, (_, i) => ({
      emoji: i === oddPos ? set.odd : set.majority,
      isOdd: i === oddPos,
    }));
    setGrid(newGrid);
    setTimeLeft(Math.max(10, 20 - difficulty * 2));
  };

  useEffect(() => { generateRound(); }, [round]);

  // Timer
  useEffect(() => {
    if (isComplete) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleTap(-1); // missed
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [round, isComplete]);

  const handleTap = async (index: number) => {
    const correct = index >= 0 && grid[index]?.isOdd;
    const newScore = score + (correct ? 1 : 0);
    const newRound = round + 1;

    setScore(newScore);
    setFeedback(correct ? '✓ Found it!' : index < 0 ? '⏰ Time\'s up!' : '✗ Not that one!');

    setTimeout(() => {
      setFeedback(null);
      if (newRound >= totalRounds) {
        finishGame(newScore, newRound);
      } else {
        setRound(newRound);
      }
    }, 800);
  };

  const finishGame = async (finalScore: number, finalTotal: number) => {
    const accuracy = finalScore / finalTotal;
    const responseTime = Date.now() - startTime;
    const session = {
      id: uuidv4(), game_id: gameId,
      accuracy: Math.round(accuracy * 1000) / 1000,
      response_time_ms: responseTime, completed: true,
      attempts: finalTotal, difficulty_level: difficulty,
      streak_at_time: 0, device_id: 'mobile-app',
    };
    setSessionResult({ ...session, correct: finalScore, total: finalTotal });
    setIsComplete(true);

    // 1. Offline-first persistence
    try {
      await offlineStore.recordGameSession({
        elder_id: user?.id || 'demo-elder-id',
        game_id: gameId,
        difficulty_level: difficulty,
        score: finalScore,
        max_score: finalTotal,
        accuracy_percentage: Math.round(accuracy * 100),
        response_time_ms: responseTime,
        metrics_payload: { correct: finalScore, total: finalTotal },
      });
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
      console.log('Will sync later:', err);
    }

    if (!rec) {
      if (accuracy >= 0.85) {
        rec = {
          reason: 'Sharp concentration! You spotted differences with high precision.',
          current_level: Math.min(5, difficulty + 1),
        };
      } else if (accuracy < 0.5) {
        rec = {
          reason: 'Good effort! Next round will give you a clearer layout to focus comfortably.',
          current_level: Math.max(1, difficulty - 1),
        };
      } else {
        rec = {
          reason: 'Solid focus! Maintaining your current comfortable concentration pace.',
          current_level: difficulty,
        };
      }
    }
    setRecommendation(rec);

    onComplete(session);
  };

  if (isComplete && sessionResult) {
    const enc = sessionResult.accuracy >= 0.85
      ? 'Outstanding visual attention and focus.'
      : sessionResult.accuracy >= 0.6
      ? 'Well spotted! Regular attention training strengthens clarity.'
      : 'Good effort! Concentration improves with each daily round.';

    return (
      <View style={[styles.container, styles.center]} {...panHandlers}>
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
        <ProgressRing progress={sessionResult.accuracy} size={124}
          color={sessionResult.accuracy >= 0.7 ? colors.success : colors.accent} label="Accuracy" />
        <Text style={styles.enc}>{enc}</Text>
        <Text style={styles.stat}>{`Found: ${sessionResult.correct}/${sessionResult.total}`}</Text>

        {recommendation && (
          <View style={styles.recommendationCard}>
            <Text style={styles.recommendationLabel}>Personalized Recommendation</Text>
            <Text style={styles.recommendationText}>{recommendation.reason}</Text>
          </View>
        )}

        <PrimaryButton title="Back to Games" onPress={onBack} style={styles.backBtn} />
      </View>
    );
  }

  const cols = gridSize <= 4 ? 2 : gridSize <= 9 ? 3 : 4;

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

        <Text style={styles.title}>Spot the Odd One Out</Text>
        <Text style={styles.subtitle}>Round {round + 1}/{totalRounds} • ⏱ {timeLeft}s • Level {difficulty}</Text>
        <Text style={styles.hint}>{currentSet.label}</Text>

        {feedback && (
          <Text style={[styles.feedback, { color: feedback.startsWith('✓') ? colors.success : colors.error }]}>
            {feedback}
          </Text>
        )}

        <View style={[styles.grid, { flexDirection: 'row', flexWrap: 'wrap' }]}>
          {grid.map((cell, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => handleTap(i)}
              activeOpacity={0.7}
              style={[styles.cell, { width: `${Math.floor(90 / cols)}%` }]}
            >
              <Text style={styles.cellEmoji}>{cell.emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.scoreText}>Score: {score}/{round}</Text>
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
  topBarResult: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
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
  title: {
    ...typography.elderly.h2,
    fontSize: 28,
    fontWeight: '800',
    color: colors.textDark,
    letterSpacing: -0.4,
  },
  subtitle: {
    ...typography.elderly.caption,
    fontSize: 16,
    color: colors.muted,
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  hint: {
    ...typography.elderly.body,
    fontSize: 18,
    color: colors.teal,
    marginBottom: spacing.lg,
    fontWeight: '700',
  },
  feedback: {
    ...typography.elderly.bodyBold,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  grid: {
    justifyContent: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  cell: {
    aspectRatio: 1,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.xs,
    minHeight: 76,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...shadows.card,
  },
  cellEmoji: {
    fontSize: 38,
  },
  scoreText: {
    ...typography.elderly.caption,
    fontSize: 16,
    color: colors.muted,
    textAlign: 'center',
  },
  completeTitle: {
    ...typography.elderly.h1,
    fontSize: 32,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: spacing.lg,
  },
  enc: {
    ...typography.elderly.body,
    fontSize: 18,
    color: colors.teal,
    textAlign: 'center',
    marginVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  stat: {
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
    borderRadius: 18,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  recommendationLabel: {
    fontFamily: fontFamily.display,
    fontSize: 13,
    color: colors.teal,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recommendationText: {
    fontFamily: fontFamily.text,
    fontSize: 15,
    color: colors.textDark,
    lineHeight: 22,
  },
});
