/**
 * SMRITI+ — Pattern Recognition Game
 *
 * Complete the sequence (shapes/colors).
 * Difficulty controls sequence length and number of choices.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { v4 as uuidv4 } from '../../../utils/uuid';
import { colors, typography, spacing, borderRadius, shadows, fontFamily } from '../../../theme/tokens';
import { PrimaryButton, ProgressRing } from '../../../components/UIComponents';
import { useAuthStore } from '../../../state/authStore';
import { api } from '../../../services/api';
import { offlineStore } from '../../../services/offlineStore';
import { ArrowLeft } from 'lucide-react-native';
import { useBackNavigation } from '../../../navigation/useBackNavigation';

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

export default function PatternGame({ gameId, difficulty: initialDifficulty, targetTimeMs, onComplete, onBack }: PatternGameProps) {
  const user = useAuthStore((s: any) => s.user);
  const { panHandlers } = useBackNavigation(null, {
    onCustomBack: onBack,
  });
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [round, setRound] = useState(0);
  const [pattern, setPattern] = useState(generatePattern(difficulty));
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);
  const [sessionResult, setSessionResult] = useState<any>(null);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [updatedDifficulty, setUpdatedDifficulty] = useState<number | null>(null);

  const totalRounds = 3 + difficulty; // 4 to 8 rounds

  // Load current saved difficulty from offline store on mount
  useEffect(() => {
    async function loadSavedDifficulty() {
      try {
        const saved = await offlineStore.getDifficulty(user?.id || 'demo-elder-id', gameId);
        if (saved && saved >= 1 && saved <= 5) {
          setDifficulty(saved);
          setPattern(generatePattern(saved));
        }
      } catch {}
    }
    loadSavedDifficulty();
  }, [user?.id, gameId]);

  // Restart game helper
  const handleRestartGame = (newDiff?: number) => {
    const targetDiff = newDiff || difficulty;
    setDifficulty(targetDiff);
    setRound(0);
    setScore(0);
    setTotal(0);
    setPattern(generatePattern(targetDiff));
    setFeedback(null);
    setIsComplete(false);
    setSessionResult(null);
    setRecommendation(null);
    setUpdatedDifficulty(null);
    setStartTime(Date.now());
  };

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

    let nextDifficulty = difficulty;

    // 1. Offline-first: save locally in SQLite + sync_queue
    try {
      const recordResult = await offlineStore.recordGameSession({
        elder_id: user?.id || 'demo-elder-id',
        game_id: gameId,
        difficulty_level: difficulty,
        score: finalScore,
        max_score: finalTotal,
        accuracy_percentage: Math.round(accuracy * 100),
        response_time_ms: responseTime,
        metrics_payload: { correct: finalScore, total: finalTotal },
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
          <ProgressRing progress={sessionResult.accuracy} size={110}
            color={sessionResult.accuracy >= 0.7 ? colors.success : colors.accent} label="Score" />

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

          <Text style={styles.encouragement}>{enc}</Text>
          <Text style={styles.stat}>{`Correct: ${sessionResult.correct}/${sessionResult.total}`}</Text>

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
  title: {
    ...typography.elderly.h2,
    fontSize: 28,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: spacing.xs,
    letterSpacing: -0.4,
  },
  subtitle: {
    ...typography.elderly.caption,
    fontSize: 16,
    color: colors.muted,
    marginBottom: spacing.xl,
  },
  sequenceRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  sequenceItem: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...shadows.card,
  },
  missingItem: {
    borderWidth: 2.5,
    borderColor: colors.teal,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(0, 113, 227, 0.08)',
  },
  sequenceEmoji: {
    fontSize: 34,
  },
  questionMark: {
    fontSize: 32,
    color: colors.teal,
    fontWeight: '800',
  },
  feedback: {
    ...typography.elderly.bodyBold,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  chooseLabel: {
    ...typography.elderly.body,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  choicesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  choiceBtn: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    ...shadows.elevated,
  },
  choiceEmoji: {
    fontSize: 40,
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
  encouragement: {
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
