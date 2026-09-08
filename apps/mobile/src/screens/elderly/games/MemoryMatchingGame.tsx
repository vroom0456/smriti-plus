/**
 * SMRITI+ — Memory Matching Game
 *
 * Flip-card pairs matching game with NER-themed imagery.
 * Implements GameDefinition interface, emits standard session payload.
 * Difficulty levels 1-5 control grid size (2x2 → 4x4).
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { colors, typography, spacing, borderRadius, shadows, fontFamily } from '../../../theme/tokens';
import { PrimaryButton, ProgressRing } from '../../../components/UIComponents';
import { useAuthStore } from '../../../state/authStore';
import { api } from '../../../services/api';
import { offlineStore } from '../../../services/offlineStore';
import { ArrowLeft } from 'lucide-react-native';
import { useBackNavigation } from '../../../navigation/useBackNavigation';

// NER-themed card items (culturally relevant)
const CARD_ITEMS = [
  { id: 'tea', emoji: '🍵', label: 'Tea' },
  { id: 'lotus', emoji: '🪷', label: 'Lotus' },
  { id: 'rice', emoji: '🍚', label: 'Rice' },
  { id: 'mountain', emoji: '⛰️', label: 'Mountain' },
  { id: 'river', emoji: '🏞️', label: 'River' },
  { id: 'bamboo', emoji: '🎋', label: 'Bamboo' },
  { id: 'drum', emoji: '🥁', label: 'Drum' },
  { id: 'bird', emoji: '🐦', label: 'Bird' },
  { id: 'flower', emoji: '🌺', label: 'Flower' },
  { id: 'fish', emoji: '🐟', label: 'Fish' },
  { id: 'sun', emoji: '☀️', label: 'Sun' },
  { id: 'rain', emoji: '🌧️', label: 'Rain' },
];

interface Card {
  id: string;
  pairId: string;
  emoji: string;
  label: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const DIFFICULTY_PAIRS: Record<number, number> = {
  1: 3,  // 6 cards (3x2)
  2: 4,  // 8 cards (4x2)
  3: 6,  // 12 cards (4x3)
  4: 8,  // 16 cards (4x4)
  5: 10, // 20 cards (5x4)
};

interface MemoryMatchingGameProps {
  gameId: string;
  difficulty: number;
  targetTimeMs: number;
  onComplete: (session: any) => void;
  onBack: () => void;
}

export default function MemoryMatchingGame({
  gameId,
  difficulty,
  targetTimeMs,
  onComplete,
  onBack,
}: MemoryMatchingGameProps) {
  const user = useAuthStore((s: any) => s.user);
  const numPairs = DIFFICULTY_PAIRS[difficulty] || 4;

  const { panHandlers } = useBackNavigation(null, {
    onCustomBack: onBack,
  });

  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [sessionResult, setSessionResult] = useState<any>(null);
  const [recommendation, setRecommendation] = useState<any>(null);

  // Generate cards
  useEffect(() => {
    const shuffled = [...CARD_ITEMS]
      .sort(() => Math.random() - 0.5)
      .slice(0, numPairs);

    const cardPairs: Card[] = [];
    shuffled.forEach((item) => {
      const pairId = uuidv4();
      cardPairs.push(
        { id: uuidv4(), pairId, emoji: item.emoji, label: item.label, isFlipped: false, isMatched: false },
        { id: uuidv4(), pairId, emoji: item.emoji, label: item.label, isFlipped: false, isMatched: false },
      );
    });

    setCards(cardPairs.sort(() => Math.random() - 0.5));
  }, [numPairs]);

  const handleCardPress = useCallback((index: number) => {
    if (isChecking || cards[index].isFlipped || cards[index].isMatched || isComplete) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setIsChecking(true);
      setAttempts((a) => a + 1);

      const [first, second] = newFlipped;
      if (cards[first].pairId === cards[second].pairId) {
        // Match!
        setTimeout(() => {
          const matched = [...cards];
          matched[first].isMatched = true;
          matched[second].isMatched = true;
          setCards(matched);
          setMatchedPairs((m) => m + 1);
          setFlippedIndices([]);
          setIsChecking(false);

          // Check completion
          if (matchedPairs + 1 >= numPairs) {
            handleGameComplete(matched, attempts + 1);
          }
        }, 300);
      } else {
        // No match — flip back
        setTimeout(() => {
          const reset = [...cards];
          reset[first].isFlipped = false;
          reset[second].isFlipped = false;
          setCards(reset);
          setFlippedIndices([]);
          setIsChecking(false);
        }, 800);
      }
    }
  }, [cards, flippedIndices, isChecking, isComplete, matchedPairs, numPairs, attempts]);

  const handleGameComplete = async (finalCards: Card[], totalAttempts: number) => {
    const responseTime = Date.now() - startTime;
    const accuracy = numPairs / Math.max(totalAttempts, numPairs); // perfect = 1.0
    const sessionId = uuidv4();

    const session = {
      id: sessionId,
      game_id: gameId,
      accuracy: Math.round(accuracy * 1000) / 1000,
      response_time_ms: responseTime,
      completed: true,
      attempts: totalAttempts,
      difficulty_level: difficulty,
      streak_at_time: 0,
      device_id: 'mobile-app',
    };

    setSessionResult(session);
    setIsComplete(true);

    // 1. Offline-first: save locally in SQLite + sync_queue
    try {
      await offlineStore.recordGameSession({
        elder_id: user?.id || 'demo-elder-id',
        game_id: gameId,
        difficulty_level: difficulty,
        score: numPairs,
        max_score: numPairs,
        accuracy_percentage: Math.round(accuracy * 100),
        response_time_ms: responseTime,
        metrics_payload: { attempts: totalAttempts, pairs: numPairs },
      });
    } catch (localErr) {
      console.warn('[OfflineStore] Failed to save local session:', localErr);
    }

    // 2. Submit to API & get explainable recommendation
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
          reason: 'Accuracy was high and response time was swift. Next activity will offer gentle progression.',
          current_level: Math.min(5, difficulty + 1),
        };
      } else if (accuracy < 0.5) {
        rec = {
          reason: 'That was a good effort. Next activity will provide extra assistance.',
          current_level: Math.max(1, difficulty - 1),
        };
      } else {
        rec = {
          reason: 'Good consistent pacing! Maintaining your current comfortable level.',
          current_level: difficulty,
        };
      }
    }
    setRecommendation(rec);

    onComplete(session);
  };

  const getEncouragement = () => {
    if (!sessionResult) return '';
    const acc = sessionResult.accuracy;
    if (acc >= 0.85) return 'Wonderful! You have an excellent memory.';
    if (acc >= 0.6) return 'Great job! Consistent exercise strengthens recall.';
    return 'Good effort! Every exercise keeps your mind sharp.';
  };

  // Determine grid columns
  const cols = numPairs <= 3 ? 3 : 4;

  if (isComplete && sessionResult) {
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
        <ProgressRing
          progress={sessionResult.accuracy}
          size={124}
          color={sessionResult.accuracy >= 0.7 ? colors.success : colors.accent}
          label="Accuracy"
        />
        <Text style={styles.encouragement}>{getEncouragement()}</Text>
        <Text style={styles.statText}>
          {`Pairs found: ${numPairs} • Attempts: ${sessionResult.attempts}`}
        </Text>
        <Text style={styles.statText}>
          {`Time: ${Math.round(sessionResult.response_time_ms / 1000)}s`}
        </Text>

        {recommendation && (
          <View style={styles.recommendationCard}>
            <Text style={styles.recommendationLabel}>Personalized Recommendation</Text>
            <Text style={styles.recommendationText}>{recommendation.reason}</Text>
          </View>
        )}

        <PrimaryButton
          title="Back to Games"
          onPress={onBack}
          style={styles.backButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container} {...panHandlers}>
      {/* Header */}
      <View style={styles.header}>
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
        <Text style={styles.title}>Memory Matching</Text>
        <Text style={styles.subtitle}>
          {`Level ${difficulty} • ${matchedPairs}/${numPairs} pairs found`}
        </Text>
      </View>

      {/* Card Grid */}
      <View style={styles.grid}>
        {cards.map((card, index) => (
          <TouchableOpacity
            key={card.id}
            onPress={() => handleCardPress(index)}
            activeOpacity={0.7}
            style={[
              styles.card,
              { width: `${Math.floor(92 / cols)}%` },
              card.isFlipped || card.isMatched
                ? styles.cardFlipped
                : styles.cardFaceDown,
              card.isMatched && styles.cardMatched,
            ]}
          >
            {card.isFlipped || card.isMatched ? (
              <View style={styles.cardContent}>
                <Text style={styles.cardEmoji}>{card.emoji}</Text>
                <Text style={styles.cardLabel}>{card.label}</Text>
              </View>
            ) : (
              <Text style={styles.cardBack}>?</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 56 : 38,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarResult: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  header: {
    marginBottom: spacing.lg,
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
    letterSpacing: -0.5,
  },
  subtitle: {
    ...typography.elderly.caption,
    fontSize: 16,
    color: colors.muted,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  card: {
    aspectRatio: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing.xs,
    minHeight: 74,
    ...shadows.card,
  },
  cardFaceDown: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  cardFlipped: {
    backgroundColor: colors.white,
    borderWidth: 2.5,
    borderColor: colors.teal,
  },
  cardMatched: {
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    borderWidth: 2.5,
    borderColor: colors.success,
  },
  cardContent: {
    alignItems: 'center',
  },
  cardEmoji: {
    fontSize: 34,
  },
  cardLabel: {
    ...typography.elderly.caption,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textDark,
    marginTop: 3,
    textAlign: 'center',
  },
  cardBack: {
    fontSize: 30,
    color: colors.teal,
    fontWeight: '800',
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
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  statText: {
    ...typography.elderly.caption,
    fontSize: 16,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  recommendationCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.md,
    marginVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
  },
  recommendationLabel: {
    fontFamily: fontFamily.display,
    fontSize: 13,
    fontWeight: '700',
    color: colors.teal,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  recommendationText: {
    fontFamily: fontFamily.text,
    fontSize: 15,
    color: colors.textDark,
    lineHeight: 22,
  },
  backButton: {
    marginTop: spacing.lg,
    width: '100%',
    minHeight: 56,
  },
});
