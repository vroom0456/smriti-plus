/**
 * SMRITI+ — Memory Recall Game (Image Edition)
 *
 * Cultural heritage visual memory training:
 * - Real photographs of culturally-familiar Assamese items
 * - Show images in MEMORIZE phase, recall via large image-cards
 * - Row-based answer cards (image + title + checkbox) — elderly friendly
 * - No timers in recall phase (No Rush)
 * - Full offline SQLite persistence & streak tracking
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { v4 as uuidv4 } from '../../../utils/uuid';
import { colors, typography, spacing, borderRadius, shadows, fontFamily } from '../../../theme/tokens';
import { PrimaryButton, ProgressRing } from '../../../components/UIComponents';
import { useAuthStore } from '../../../state/authStore';
import { api } from '../../../services/api';
import { offlineStore } from '../../../services/offlineStore';
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react-native';
import { useBackNavigation } from '../../../navigation/useBackNavigation';

// ─── Cultural item catalogue with real images + emoji fallback ───────────────

const ALL_ITEMS = [
  {
    id: '1',
    label: 'Tea Leaves',
    sublabel: 'Assam Garden Pick',
    emoji: '🍃',
    image: require('../../../../assets/game_items/tea_leaves.jpg'),
    hasImage: true,
  },
  {
    id: '2',
    label: 'Bamboo Basket',
    sublabel: 'Traditional Khang',
    emoji: '🧺',
    image: require('../../../../assets/game_items/bamboo_basket.jpg'),
    hasImage: true,
  },
  {
    id: '3',
    label: 'Gamosa',
    sublabel: 'Woven Red & White',
    emoji: '🧣',
    image: require('../../../../assets/game_items/gamosa.jpg'),
    hasImage: true,
  },
  {
    id: '4',
    label: 'River Fish',
    sublabel: 'Fresh Brahmaputra',
    emoji: '🐟',
    image: require('../../../../assets/game_items/river_fish.jpg'),
    hasImage: true,
  },
  {
    id: '5',
    label: 'Red Apple',
    sublabel: 'Hillside Fruit',
    emoji: '🍎',
    image: require('../../../../assets/game_items/apple.jpg'),
    hasImage: true,
  },
  {
    id: '6',
    label: 'Clay Pot',
    sublabel: 'Village Handcraft',
    emoji: '🏺',
    hasImage: false,
    image: null,
  },
  {
    id: '7',
    label: 'Marigold',
    sublabel: 'Sacred Garden',
    emoji: '🌼',
    hasImage: false,
    image: null,
  },
  {
    id: '8',
    label: 'Brass Diya',
    sublabel: 'Festival Lamp',
    emoji: '🪔',
    hasImage: false,
    image: null,
  },
  {
    id: '9',
    label: 'Bamboo Shoot',
    sublabel: 'Forest Fresh',
    emoji: '🎋',
    hasImage: false,
    image: null,
  },
  {
    id: '10',
    label: 'Banana',
    sublabel: 'Golden Bunch',
    emoji: '🍌',
    hasImage: false,
    image: null,
  },
  {
    id: '11',
    label: 'Umbrella',
    sublabel: 'Monsoon Shield',
    emoji: '☂️',
    hasImage: false,
    image: null,
  },
  {
    id: '12',
    label: 'Bell',
    sublabel: 'Temple Chime',
    emoji: '🔔',
    hasImage: false,
    image: null,
  },
] as const;

type ItemType = typeof ALL_ITEMS[number];

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
  const { panHandlers } = useBackNavigation(null, { onCustomBack: onBack });
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const itemCount = ITEMS_PER_LEVEL[difficulty] || 4;
  const [phase, setPhase] = useState<Phase>('memorize');
  const [targetItems, setTargetItems] = useState<ItemType[]>([]);
  const [allOptions, setAllOptions] = useState<ItemType[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [startTime, setStartTime] = useState(Date.now());
  const [timer, setTimer] = useState(4 + difficulty);
  const [sessionResult, setSessionResult] = useState<any>(null);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [updatedDifficulty, setUpdatedDifficulty] = useState<number | null>(null);
  const [memorized, setMemorized] = useState(false);

  useEffect(() => {
    async function loadSavedDifficulty() {
      try {
        const saved = await offlineStore.getDifficulty(user?.id || 'demo-elder-id', gameId);
        if (saved && saved >= 1 && saved <= 5) setDifficulty(saved);
      } catch {}
    }
    loadSavedDifficulty();
  }, [user?.id, gameId]);

  const handleRestartGame = (newDiff?: number) => {
    const targetDiff = newDiff || difficulty;
    setDifficulty(targetDiff);
    setSelected(new Set());
    setSessionResult(null);
    setRecommendation(null);
    setUpdatedDifficulty(null);
    setStartTime(Date.now());
    setTimer(4 + targetDiff);
    setPhase('memorize');
    setMemorized(false);
  };

  useEffect(() => {
    const items = [...ALL_ITEMS] as ItemType[];
    const shuffled = items.sort(() => Math.random() - 0.5);
    const targets = shuffled.slice(0, itemCount);
    const distractors = shuffled.slice(itemCount, itemCount + Math.min(itemCount + 2, shuffled.length - itemCount));
    const options = [...targets, ...distractors].sort(() => Math.random() - 0.5);
    setTargetItems(targets);
    setAllOptions(options);
  }, [itemCount, startTime]);

  useEffect(() => {
    if (phase !== 'memorize') return;
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const toggleSelect = (id: string) => {
    const ns = new Set(selected);
    if (ns.has(id)) ns.delete(id); else ns.add(id);
    setSelected(ns);
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
    } catch {}

    let rec: any = null;
    try {
      const resp = await api.post<any>(`/games/${gameId}/session`, session);
      if (resp?.recommendation) rec = resp.recommendation;
    } catch {}

    if (!rec) {
      if (accuracy >= 0.85) rec = { reason: 'Excellent recall! Your memory is sharp and warm.', current_level: Math.min(5, difficulty + 1) };
      else if (accuracy < 0.5) rec = { reason: 'That was tricky. Next round gives you more time to look.', current_level: Math.max(1, difficulty - 1) };
      else rec = { reason: 'Good steady recall. Keep practicing gently.', current_level: difficulty };
    }
    setRecommendation(rec);
    onComplete(session);
  };

  // ─── MEMORIZE PHASE ──────────────────────────────────────────────────────────
  if (phase === 'memorize') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }} {...panHandlers}>
        <ScrollView contentContainerStyle={styles.memorizeContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityRole="button">
            <ArrowLeft size={18} color={colors.textDark} strokeWidth={2.4} />
            <Text style={styles.backBtnText}>Exit Game</Text>
          </TouchableOpacity>

          <View style={styles.phaseBadge}>
            <Text style={styles.phaseBadgeText}>MEMORY PHASE</Text>
          </View>
          <Text style={styles.phaseTitle}>
            Look closely at these {itemCount} items
          </Text>
          <Text style={styles.phaseSubtitle}>
            Relax, breathe naturally, and gently commit them to memory.
          </Text>

          {/* Countdown */}
          <View style={styles.timerCard}>
            <Text style={styles.timerLabel}>{timer > 0 ? `${timer} seconds remaining` : 'Time to recall!'}</Text>
            <View style={[styles.timerBar, { width: '100%' }]}>
              <View style={[styles.timerBarFill, { width: `${(timer / (4 + difficulty)) * 100}%` }]} />
            </View>
          </View>

          {/* Image Grid */}
          <View style={styles.memorizeGrid}>
            {targetItems.map((item, idx) => (
              <View key={item.id} style={styles.memorizeCard}>
                <View style={styles.itemNumberBadge}>
                  <Text style={styles.itemNumberText}>{idx + 1}</Text>
                </View>
                {item.hasImage && item.image ? (
                  <Image source={item.image} style={styles.memorizeImage} resizeMode="cover" />
                ) : (
                  <View style={styles.memorizeEmojiWrap}>
                    <Text style={styles.memorizeEmoji}>{item.emoji}</Text>
                  </View>
                )}
                <Text style={styles.memorizeItemLabel}>{item.label}</Text>
                <Text style={styles.memorizeItemSub}>{item.sublabel}</Text>
              </View>
            ))}
          </View>

          {/* Manual "I've Memorized" button */}
          {!memorized && (
            <TouchableOpacity
              style={styles.memorizedBtn}
              onPress={() => { setMemorized(true); setPhase('recall'); }}
              activeOpacity={0.85}
            >
              <Text style={styles.memorizedBtnText}>I Have Memorized Them →</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.breatheNote}>🧘 Breathe gently. Take your time.</Text>
          <View style={{ height: 48 }} />
        </ScrollView>
      </View>
    );
  }

  // ─── RESULT PHASE ────────────────────────────────────────────────────────────
  if (phase === 'result' && sessionResult) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }} {...panHandlers}>
        <ScrollView contentContainerStyle={styles.resultContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityRole="button">
            <ArrowLeft size={18} color={colors.textDark} strokeWidth={2.4} />
            <Text style={styles.backBtnText}>Exit Game</Text>
          </TouchableOpacity>

          <Text style={styles.completeTitle}>Game Complete! 🎉</Text>
          <ProgressRing
            progress={sessionResult.accuracy}
            size={110}
            color={sessionResult.accuracy >= 0.7 ? colors.success : colors.accent}
            label="Recall"
          />

          <View style={[styles.difficultyBadge, updatedDifficulty && updatedDifficulty > difficulty ? styles.difficultyBadgeUp : null]}>
            <Text style={styles.difficultyBadgeText}>
              {updatedDifficulty && updatedDifficulty > difficulty
                ? `Level Up! Level ${difficulty} ➔ Level ${updatedDifficulty} 🎉`
                : updatedDifficulty && updatedDifficulty < difficulty
                ? `Comfort Pace: Level ${difficulty} ➔ Level ${updatedDifficulty}`
                : `Level ${difficulty} Mastered ⭐`}
            </Text>
          </View>

          <Text style={styles.encouragement}>
            {sessionResult.accuracy >= 0.85
              ? 'Superb! You recalled nearly everything accurately.'
              : sessionResult.accuracy >= 0.5
              ? 'Good job! Regular practice builds mental stamina.'
              : 'Good effort! Each attempt strengthens your focus.'}
          </Text>
          <Text style={styles.statText}>{`Remembered: ${sessionResult.correct}/${sessionResult.total}`}</Text>

          {recommendation && (
            <View style={styles.recommendationCard}>
              <Text style={styles.recommendationLabel}>Personalized Recommendation</Text>
              <Text style={styles.recommendationText}>{recommendation.reason}</Text>
            </View>
          )}

          <View style={styles.resultActions}>
            <PrimaryButton
              title={updatedDifficulty && updatedDifficulty > difficulty ? `Play Level ${updatedDifficulty} →` : 'Play Again'}
              onPress={() => handleRestartGame(updatedDifficulty || difficulty)}
              variant="success"
              style={styles.actionBtn}
            />
            <PrimaryButton
              title="Back to Activities"
              onPress={onBack}
              variant="secondary"
              style={styles.actionBtn}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  // ─── RECALL PHASE ────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} {...panHandlers}>
      <ScrollView contentContainerStyle={styles.recallContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityRole="button">
          <ArrowLeft size={18} color={colors.textDark} strokeWidth={2.4} />
          <Text style={styles.backBtnText}>Exit Game</Text>
        </TouchableOpacity>

        <View style={styles.phaseBadge}>
          <Text style={styles.phaseBadgeText}>ANSWER PHASE • ⏱ No Rush</Text>
        </View>
        <Text style={styles.phaseTitle}>Which items did you see?</Text>
        <Text style={styles.phaseSubtitle}>Tap all the items you remember seeing.</Text>

        {/* Progress counter */}
        <View style={styles.progressRow}>
          <CheckCircle2 size={18} color={colors.teal} strokeWidth={2.2} />
          <Text style={styles.progressText}>
            Remembered: <Text style={{ fontWeight: '800', color: colors.teal }}>{selected.size} of {targetItems.length}</Text>
          </Text>
        </View>

        {/* Option Cards as rows */}
        <View style={styles.optionsList}>
          {allOptions.map((item) => {
            const isSelected = selected.has(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => toggleSelect(item.id)}
                activeOpacity={0.72}
                style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={`${item.label}, ${isSelected ? 'selected' : 'not selected'}`}
              >
                {/* Thumbnail */}
                {item.hasImage && item.image ? (
                  <Image source={item.image} style={styles.optionImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.optionEmojiThumb, isSelected && styles.optionEmojiThumbSelected]}>
                    <Text style={styles.optionEmoji}>{item.emoji}</Text>
                  </View>
                )}

                {/* Label */}
                <View style={styles.optionTextWrap}>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>{item.label}</Text>
                  <Text style={styles.optionSub}>{item.sublabel}</Text>
                </View>

                {/* Checkbox */}
                <View style={[styles.checkboxWrap, isSelected && styles.checkboxWrapSelected]}>
                  {isSelected
                    ? <CheckCircle2 size={26} color={colors.white} strokeWidth={2.5} />
                    : <Circle size={26} color={colors.border} strokeWidth={2} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.helpNote}>🧠 Take all the time you need. There is no penalty for thinking.</Text>

        <PrimaryButton
          title={`Submit Answers (${selected.size} Selected)`}
          onPress={handleSubmit}
          disabled={selected.size === 0}
          variant="success"
          style={styles.submitBtn}
        />
        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Shared ──
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.pill,
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 46,
    ...shadows.subtle,
  },
  backBtnText: {
    fontFamily: fontFamily.display,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textDark,
  },
  phaseBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  phaseBadgeText: {
    fontFamily: fontFamily.display,
    fontSize: 12,
    fontWeight: '800',
    color: colors.navy,
    letterSpacing: 0.6,
  },
  phaseTitle: {
    fontFamily: fontFamily.display,
    fontSize: 26,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: spacing.xs,
    lineHeight: 33,
  },
  phaseSubtitle: {
    fontFamily: fontFamily.text,
    fontSize: 16,
    color: colors.muted,
    marginBottom: spacing.lg,
    lineHeight: 24,
  },

  // ── Memorize ──
  memorizeContent: {
    paddingHorizontal: spacing.screenMargin,
    paddingTop: Platform.OS === 'ios' ? 58 : 38,
  },
  timerCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timerLabel: {
    fontFamily: fontFamily.display,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 8,
  },
  timerBar: {
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  timerBarFill: {
    height: 8,
    backgroundColor: colors.teal,
    borderRadius: 4,
  },
  memorizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  memorizeCard: {
    width: '46%',
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.card,
    alignItems: 'flex-start',
  },
  itemNumberBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemNumberText: {
    fontFamily: fontFamily.display,
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
  },
  memorizeImage: {
    width: '100%',
    height: 130,
  },
  memorizeEmojiWrap: {
    width: '100%',
    height: 130,
    backgroundColor: '#F8F9FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memorizeEmoji: {
    fontSize: 64,
  },
  memorizeItemLabel: {
    fontFamily: fontFamily.display,
    fontSize: 16,
    fontWeight: '800',
    color: colors.navy,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  memorizeItemSub: {
    fontFamily: fontFamily.text,
    fontSize: 13,
    color: colors.muted,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  memorizedBtn: {
    backgroundColor: colors.navy,
    borderRadius: borderRadius.button,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.card,
  },
  memorizedBtnText: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
  },
  breatheNote: {
    fontFamily: fontFamily.text,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: 4,
  },

  // ── Recall ──
  recallContent: {
    paddingHorizontal: spacing.screenMargin,
    paddingTop: Platform.OS === 'ios' ? 58 : 38,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDFA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#99F6E4',
    alignSelf: 'flex-start',
  },
  progressText: {
    fontFamily: fontFamily.text,
    fontSize: 15,
    color: colors.textDark,
  },
  optionsList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border,
    minHeight: 72,
    ...shadows.card,
  },
  optionRowSelected: {
    borderColor: colors.navy,
    backgroundColor: '#EFF6FF',
  },
  optionImage: {
    width: 72,
    height: 72,
  },
  optionEmojiThumb: {
    width: 72,
    height: 72,
    backgroundColor: '#F8F9FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionEmojiThumbSelected: {
    backgroundColor: '#DBEAFE',
  },
  optionEmoji: {
    fontSize: 36,
  },
  optionTextWrap: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  optionLabel: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    fontWeight: '800',
    color: colors.textDark,
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: colors.navy,
  },
  optionSub: {
    fontFamily: fontFamily.text,
    fontSize: 13,
    color: colors.muted,
  },
  checkboxWrap: {
    width: 52,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxWrapSelected: {
    backgroundColor: colors.navy,
  },
  helpNote: {
    fontFamily: fontFamily.text,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  submitBtn: {
    minHeight: 60,
    borderRadius: borderRadius.button,
  },

  // ── Result ──
  resultContent: {
    paddingHorizontal: spacing.screenMargin,
    paddingTop: Platform.OS === 'ios' ? 58 : 38,
    alignItems: 'center',
    paddingBottom: 60,
  },
  completeTitle: {
    fontFamily: fontFamily.display,
    fontSize: 30,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: spacing.lg,
    textAlign: 'center',
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
  },
  encouragement: {
    fontFamily: fontFamily.text,
    fontSize: 18,
    color: colors.teal,
    textAlign: 'center',
    marginVertical: spacing.md,
    paddingHorizontal: spacing.md,
    lineHeight: 28,
  },
  statText: {
    fontFamily: fontFamily.text,
    fontSize: 16,
    color: colors.textDark,
    marginBottom: spacing.md,
  },
  recommendationCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    width: '100%',
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    ...shadows.card,
  },
  recommendationLabel: {
    fontFamily: fontFamily.display,
    fontSize: 12,
    fontWeight: '700',
    color: colors.teal,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recommendationText: {
    fontFamily: fontFamily.text,
    fontSize: 16,
    color: colors.navy,
    lineHeight: 24,
  },
  resultActions: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionBtn: {
    width: '100%',
    minHeight: 56,
  },
});
