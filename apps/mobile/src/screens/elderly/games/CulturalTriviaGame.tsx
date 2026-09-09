/**
 * SMRITI+ — Cultural Heritage Recall & Trivia Game
 *
 * Elderly-friendly cognitive exercise inspired by regional Indian crafts,
 * handloom motifs, sacred rivers, and cultural artifacts from stitch_smriti_cognitive_companion.
 * - Large tactile option cards
 * - Zero timers, zero negative penalty
 * - Full offline SQLite persistence & streak tracking
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ArrowLeft, Sparkles, Trophy, CheckCircle2, ChevronRight, Flower2 } from 'lucide-react-native';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  fontFamily,
} from '../../../theme/tokens';
import { PrimaryButton } from '../../../components/UIComponents';
import { offlineStore } from '../../../services/offlineStore';
import { useAuthStore } from '../../../state/authStore';
import { useBackNavigation } from '../../../navigation/useBackNavigation';

interface Props {
  gameId: string;
  difficulty?: number;
  onComplete: () => void;
  onBack: () => void;
}

interface TriviaQuestion {
  question: string;
  context: string;
  icon: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  {
    question: 'Which traditional handloom cloth with red woven floral borders is celebrated in Assam?',
    context: 'Traditional Handloom Weave',
    icon: '🧣',
    options: ['Assamese Gamosa', 'Woolen Shawl', 'Banarasi Silk'],
    correctIndex: 0,
    explanation: 'The Gamosa is a revered white and red handwoven textile symbolizing respect and warmth.',
  },
  {
    question: 'Which tender golden green leaves are gently hand-plucked in the morning mist of Northeast gardens?',
    context: 'Heritage Harvest',
    icon: '🍃',
    options: ['Coffee Beans', 'Assam Tea Leaves', 'Betel Leaves'],
    correctIndex: 1,
    explanation: 'Two leaves and a delicate bud are hand-plucked each morning across serene tea plantations.',
  },
  {
    question: 'What handcrafted natural bamboo item is traditionally used for winnowing grains and welcoming guests?',
    context: 'Natural Cane Craft',
    icon: '🧺',
    options: ['Clay Pot', 'Steel Plate', 'Bamboo Kula (Dala)'],
    correctIndex: 2,
    explanation: 'The Kula or Dala is woven from smooth golden bamboo strips with centuries-old handicraft skill.',
  },
  {
    question: 'Which sacred, mighty river brings life, gentle breezes, and timeless serenity across the eastern valleys?',
    context: 'Sacred Waterway',
    icon: '🌊',
    options: ['Brahmaputra', 'Desert Oasis', 'Mountain Stream'],
    correctIndex: 0,
    explanation: 'The Brahmaputra river is celebrated in songs and folklore as the lifeline of northeastern heritage.',
  },
  {
    question: 'What conical woven bamboo sunshade hat with red-and-black felt patterns is a regional symbol of pride?',
    context: 'Folk Emblem',
    icon: '👒',
    options: ['Jaapi', 'Turban', 'Straw Visor'],
    correctIndex: 0,
    explanation: 'The Jaapi is a magnificent traditional headgear made of tightly woven bamboo, cane, and tokou leaves.',
  },
];

export default function CulturalTriviaGame({
  gameId,
  difficulty = 1,
  onComplete,
  onBack,
}: Props) {
  const user = useAuthStore((s) => s.user);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [updatedDifficulty, setUpdatedDifficulty] = useState<number | null>(null);

  const { panHandlers } = useBackNavigation(undefined, { onCustomBack: onBack });
  const currentQ = TRIVIA_QUESTIONS[currentIndex];

  const handleSelect = (idx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    setShowExplanation(true);
    if (idx === currentQ.correctIndex) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < TRIVIA_QUESTIONS.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsFinished(true);
    const elderId = user?.id || 'demo-elder-id';
    const finalScore = score + (selectedAnswer === currentQ.correctIndex ? 1 : 0);
    const nextDiff = Math.min(5, difficulty + 1);
    setUpdatedDifficulty(nextDiff);

    try {
      await offlineStore.recordGameSession({
        elder_id: elderId,
        game_id: gameId,
        difficulty_level: difficulty,
        score: Math.round((finalScore / TRIVIA_QUESTIONS.length) * 100),
        max_score: 100,
        accuracy_percentage: Math.round((finalScore / TRIVIA_QUESTIONS.length) * 100),
        response_time_ms: 45000,
        metrics_payload: {
          totalQuestions: TRIVIA_QUESTIONS.length,
          correct: finalScore,
          category: 'Cultural Heritage Recall',
        },
      });
      await offlineStore.setDifficulty(elderId, gameId, nextDiff);
    } catch (err) {
      console.log('Error saving trivia session:', err);
    }
    onComplete();
  };

  // ── Result Screen ──
  if (isFinished) {
    const finalScore = score;
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
            >
              <ArrowLeft size={18} color={colors.textDark} strokeWidth={2.4} />
              <Text style={styles.backButtonTopText}>Back to Activities</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.trophyCircle}>
            <Flower2 size={46} color={colors.teal} strokeWidth={2.2} />
          </View>

          <Text style={styles.completeTitle}>Cultural Heritage Celebrated!</Text>

          <View style={[styles.difficultyBadge, styles.difficultyBadgeUp]}>
            <Text style={styles.difficultyBadgeText}>
              ⭐ {finalScore} of {TRIVIA_QUESTIONS.length} Treasures Recalled • Level {difficulty} Mastered
            </Text>
          </View>

          <Text style={styles.encouragement}>
            Your memory for beloved cultural traditions and folk heritage is sharp and vibrant! Connecting with familiar symbols brings comfort and joy to the mind.
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{finalScore}/{TRIVIA_QUESTIONS.length}</Text>
              <Text style={styles.statLabel}>Treasures Found</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>Level {updatedDifficulty || difficulty}</Text>
              <Text style={styles.statLabel}>Next Level</Text>
            </View>
          </View>

          <View style={styles.recommendationCard}>
            <Text style={styles.recommendationLabel}>Personalized Recommendation</Text>
            <Text style={styles.recommendationText}>
              Share one of these traditional memories with your family or caregiver today! Stories stimulate memory and warm connections.
            </Text>
          </View>

          <View style={styles.resultActions}>
            <PrimaryButton
              title="Play Trivia Again"
              variant="success"
              onPress={() => {
                setIsFinished(false);
                setCurrentIndex(0);
                setSelectedAnswer(null);
                setShowExplanation(false);
                setScore(0);
              }}
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

  // ── Active Gameplay ──
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} {...panHandlers}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButtonTop}
            activeOpacity={0.75}
          >
            <ArrowLeft size={18} color={colors.textDark} strokeWidth={2.4} />
            <Text style={styles.backButtonTopText}>Exit Game</Text>
          </TouchableOpacity>

          <View style={styles.roundPill}>
            <Text style={styles.roundPillText}>
              Question {currentIndex + 1} of {TRIVIA_QUESTIONS.length}
            </Text>
          </View>
        </View>

        {/* Question Card */}
        <View style={styles.questionCard}>
          <View style={styles.badgeRow}>
            <Text style={styles.contextBadge}>{currentQ.context}</Text>
            <Text style={styles.questionIcon}>{currentQ.icon}</Text>
          </View>
          <Text style={styles.questionText}>{currentQ.question}</Text>
        </View>

        {/* Options List */}
        <View style={styles.optionsList}>
          {currentQ.options.map((opt, i) => {
            const isSelected = selectedAnswer === i;
            const isCorrect = i === currentQ.correctIndex;
            let btnStyle: StyleProp<ViewStyle> = styles.optionButton;
            let textStyle: StyleProp<TextStyle> = styles.optionButtonText;

            if (selectedAnswer !== null) {
              if (isCorrect) {
                btnStyle = [styles.optionButton, styles.optionCorrect];
                textStyle = [styles.optionButtonText, styles.optionCorrectText];
              } else if (isSelected) {
                btnStyle = [styles.optionButton, styles.optionIncorrect];
                textStyle = [styles.optionButtonText, styles.optionIncorrectText];
              }
            }

            return (
              <TouchableOpacity
                key={i}
                onPress={() => handleSelect(i)}
                style={btnStyle}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Option ${opt}`}
                disabled={selectedAnswer !== null}
              >
                <View style={styles.optContent}>
                  <Text style={textStyle}>{opt}</Text>
                  {selectedAnswer !== null && isCorrect && (
                    <CheckCircle2 size={20} color={colors.success} strokeWidth={2.4} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Explanation & Next Button */}
        {showExplanation && (
          <View style={styles.explanationBox}>
            <Text style={styles.explanationTitle}>
              {selectedAnswer === currentQ.correctIndex ? '🌸 Splendid Memory!' : '💡 Wonderful Insight'}
            </Text>
            <Text style={styles.explanationText}>{currentQ.explanation}</Text>

            <PrimaryButton
              title={currentIndex + 1 < TRIVIA_QUESTIONS.length ? 'Next Treasure ➔' : 'See Results'}
              variant="success"
              onPress={handleNext}
              style={{ marginTop: spacing.md, minHeight: 56 }}
            />
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
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenMargin,
    paddingBottom: Platform.OS === 'ios' ? 160 : 130,
  },
  resultScrollContent: {
    paddingHorizontal: spacing.screenMargin,
    paddingBottom: Platform.OS === 'ios' ? 160 : 130,
    alignItems: 'center',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  backButtonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 20,
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
  roundPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.tealBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 113, 227, 0.2)',
  },
  roundPillText: {
    fontFamily: fontFamily.display,
    fontSize: 13,
    fontWeight: '700',
    color: colors.teal,
  },
  questionCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  contextBadge: {
    fontFamily: fontFamily.display,
    fontSize: 12,
    fontWeight: '700',
    color: colors.teal,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionIcon: {
    fontSize: 28,
  },
  questionText: {
    fontFamily: fontFamily.display,
    fontSize: 22,
    fontWeight: '700',
    color: colors.navy,
    lineHeight: 30,
    letterSpacing: 0,
  },
  optionsList: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  optionButton: {
    backgroundColor: colors.surface,
    paddingVertical: 18,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    minHeight: 60,
    justifyContent: 'center',
    ...shadows.card,
  },
  optContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionButtonText: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    letterSpacing: 0,
    flex: 1,
  },
  optionCorrect: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  optionCorrectText: {
    color: '#15803D',
    fontWeight: '800',
  },
  optionIncorrect: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },
  optionIncorrectText: {
    color: '#B91C1C',
    fontWeight: '700',
  },
  explanationBox: {
    backgroundColor: '#EFF6FF',
    padding: spacing.lg,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    marginBottom: spacing.xl,
  },
  explanationTitle: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    fontWeight: '800',
    color: '#1E40AF',
    marginBottom: 6,
    letterSpacing: 0,
  },
  explanationText: {
    fontFamily: fontFamily.text,
    fontSize: 16,
    color: colors.textDark,
    lineHeight: 24,
    letterSpacing: 0,
  },
  topBarResult: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  trophyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.tealBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  completeTitle: {
    fontFamily: fontFamily.display,
    fontSize: 26,
    fontWeight: '800',
    color: colors.navy,
    textAlign: 'center',
    letterSpacing: 0,
    marginBottom: spacing.xs,
  },
  difficultyBadge: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  difficultyBadgeUp: {
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    borderColor: colors.success,
  },
  difficultyBadgeText: {
    fontFamily: fontFamily.display,
    fontSize: 14,
    fontWeight: '800',
    color: colors.teal,
    letterSpacing: 0,
  },
  encouragement: {
    fontFamily: fontFamily.text,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    letterSpacing: 0,
  },
  statsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: fontFamily.display,
    fontSize: 22,
    fontWeight: '800',
    color: colors.teal,
    letterSpacing: 0,
  },
  statLabel: {
    fontFamily: fontFamily.text,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  recommendationCard: {
    width: '100%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  recommendationLabel: {
    fontFamily: fontFamily.display,
    fontSize: 13,
    fontWeight: '700',
    color: colors.teal,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  recommendationText: {
    fontFamily: fontFamily.text,
    fontSize: 15,
    color: colors.textDark,
    lineHeight: 22,
  },
  resultActions: {
    width: '100%',
    gap: spacing.sm,
    marginBottom: spacing.xl,
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
