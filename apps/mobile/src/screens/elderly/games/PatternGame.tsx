/**
 * SMRITI+ — Pattern Recognition Game
 *
 * Complete the sequence (shapes/colors).
 * Difficulty controls sequence length and number of choices.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { colors, typography, spacing, borderRadius, shadows, fontFamily } from '../../../theme/tokens';
import { PrimaryButton, ProgressRing } from '../../../components/UIComponents';
import { useAuthStore } from '../../../state/authStore';
import { api } from '../../../services/api';
import { offlineStore } from '../../../services/offlineStore';
import { ArrowLeft } from 'lucide-react-native';

const SHAPES = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⬛', '🔶', '💎', '🔺'];

interface PatternGameProps {
  gameId: string;
  difficulty: number;
  targetTimeMs: number;
  onComplete: (session: any) => void;
  onBack: () => void;
}

function generatePattern(difficulty: number): { sequence: string[]; answer: string; choices: string[] } {
  const patternLength = 3 + difficulty; // 4 to 8
  const numShapes = Math.min(2 + difficulty, SHAPES.length);
  const availableShapes = SHAPES.slice(0, numShapes);

  // Generate a repeating pattern
  const basePattern = availableShapes.slice(0, Math.min(2 + Math.floor(difficulty / 2), availableShapes.length));
  const sequence: string[] = [];
  for (let i = 0; i < patternLength; i++) {
    sequence.push(basePattern[i % basePattern.length]);
  }

  const answer = basePattern[patternLength % basePattern.length];

  // Generate choices (include the answer)
  const choiceSet = new Set([answer]);
  while (choiceSet.size < Math.min(4, availableShapes.length)) {
    choiceSet.add(availableShapes[Math.floor(Math.random() * availableShapes.length)]);
  }

  return { sequence, answer, choices: Array.from(choiceSet).sort(() => Math.random() - 0.5) };
}

export default function PatternGame({ gameId, difficulty, targetTimeMs, onComplete, onBack }: PatternGameProps) {
  const user = useAuthStore((s: any) => s.user);
  const [round, setRound] = useState(0);
  const [pattern, setPattern] = useState(generatePattern(difficulty));
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [startTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);
  const [sessionResult, setSessionResult] = useState<any>(null);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const totalRounds = 3 + difficulty; // 4 to 8 rounds

  const handleChoice = async (choice: string) => {
    const isCorrect = choice === pattern.answer;
    const newScore = score + (isCorrect ? 1 : 0);
    const newTotal = total + 1;

    setFeedback(isCorrect ? '✓ Correct!' : `✗ The answer was ${pattern.answer}`);
    setScore(newScore);
    setTotal(newTotal);

    setTimeout(() => {
      setFeedback(null);
      if (newTotal >= totalRounds) {
        finishGame(newScore, newTotal);
      } else {
        setPattern(generatePattern(difficulty));
        setRound(round + 1);
      }
    }, 1000);
  };

  const finishGame = async (finalScore: number, finalTotal: number) => {
    const accuracy = finalScore / finalTotal;
    const responseTime = Date.now() - startTime;
    const sessionId = uuidv4();

    const session = {
      id: sessionId,
      game_id: gameId,
      accuracy: Math.round(accuracy * 1000) / 1000,
      response_time_ms: responseTime,
      completed: true,
      attempts: finalTotal,
      difficulty_level: difficulty,
      streak_at_time: 0,
      device_id: 'mobile-app',
    };

    setSessionResult({ ...session, correct: finalScore, total: finalTotal });
    setIsComplete(true);

    // 1. Offline-first: save locally in SQLite + sync_queue
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
          reason: 'Remarkable pattern insight! You completed sequences with high precision.',
          current_level: Math.min(5, difficulty + 1),
        };
      } else if (accuracy < 0.5) {
        rec = {
          reason: 'Good effort! Next round will introduce simpler, repeating visual cues.',
          current_level: Math.max(1, difficulty - 1),
        };
      } else {
        rec = {
          reason: 'Consistent pattern solving! Maintaining your current comfortable level.',
          current_level: difficulty,
        };
      }
    }
    setRecommendation(rec);

    onComplete(session);
  };

  if (isComplete && sessionResult) {
    const enc = sessionResult.accuracy >= 0.85
      ? 'Superb! You identified the patterns with precision.'
      : sessionResult.accuracy >= 0.6
      ? 'Great work! Pattern logic strengthens everyday reasoning.'
      : 'Good try! Pattern practice builds cognitive agility.';

    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.completeTitle}>Game Complete</Text>
        <ProgressRing progress={sessionResult.accuracy} size={120}
          color={sessionResult.accuracy >= 0.7 ? colors.success : colors.accent} label="Score" />
        <Text style={styles.encouragement}>{enc}</Text>
        <Text style={styles.stat}>{`Correct: ${sessionResult.correct}/${sessionResult.total}`}</Text>

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <TouchableOpacity
        onPress={onBack}
        style={styles.backButtonTop}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel="Back to games"
      >
        <ArrowLeft size={18} color={colors.textDark} strokeWidth={2.4} />
        <Text style={styles.backButtonTopText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Complete the Pattern</Text>
      <Text style={styles.subtitle}>Round {total + 1} of {totalRounds} • Level {difficulty}</Text>

      {/* Pattern sequence */}
      <View style={styles.sequenceRow}>
        {pattern.sequence.map((shape, i) => (
          <View key={i} style={styles.sequenceItem}>
            <Text style={styles.sequenceEmoji}>{shape}</Text>
          </View>
        ))}
        <View style={[styles.sequenceItem, styles.missingItem]}>
          <Text style={styles.questionMark}>?</Text>
        </View>
      </View>

      {feedback && (
        <Text style={[styles.feedback, { color: feedback.startsWith('✓') ? colors.success : colors.error }]}>
          {feedback}
        </Text>
      )}

      <Text style={styles.chooseLabel}>What comes next?</Text>

      <View style={styles.choicesRow}>
        {pattern.choices.map((choice, i) => (
          <TouchableOpacity key={i} onPress={() => handleChoice(choice)} style={styles.choiceBtn} activeOpacity={0.7}>
            <Text style={styles.choiceEmoji}>{choice}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.scoreText}>Score: {score}/{total}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 56 },
  center: { alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  backButtonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.pill,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 44,
  },
  backButtonTopText: {
    fontFamily: fontFamily.display,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
  },
  title: {
    ...typography.elderly.h2,
    fontSize: 24,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: spacing.xs,
    letterSpacing: -0.4,
  },
  subtitle: {
    ...typography.elderly.caption,
    fontSize: 15,
    color: colors.muted,
    marginBottom: spacing.xl,
  },
  sequenceRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  sequenceItem: {
    width: 56, height: 56, borderRadius: borderRadius.md, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center', ...shadows.card,
  },
  missingItem: { borderWidth: 2, borderColor: colors.teal, borderStyle: 'dashed', backgroundColor: colors.tealBg },
  sequenceEmoji: { fontSize: 28 },
  questionMark: { fontSize: 28, color: colors.teal, fontWeight: '700' },
  feedback: { ...typography.elderly.bodyBold, textAlign: 'center', marginBottom: spacing.md },
  chooseLabel: { ...typography.elderly.body, color: colors.textDark, textAlign: 'center', marginBottom: spacing.lg },
  choicesRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg, marginBottom: spacing.xl },
  choiceBtn: {
    width: 72, height: 72, borderRadius: borderRadius.lg, backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center', ...shadows.elevated, minWidth: 56, minHeight: 56,
  },
  choiceEmoji: { fontSize: 36 },
  scoreText: { ...typography.elderly.caption, color: colors.muted, textAlign: 'center' },
  completeTitle: { ...typography.elderly.h1, color: colors.navy, marginBottom: spacing.xl },
  encouragement: { ...typography.elderly.body, color: colors.teal, textAlign: 'center', marginVertical: spacing.lg },
  stat: { ...typography.elderly.caption, color: colors.muted },
  backBtn: { marginTop: spacing.xl, width: '80%' },
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
});
