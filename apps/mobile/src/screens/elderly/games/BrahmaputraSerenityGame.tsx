/**
 * SMRITI+ — Brahmaputra Serenity & Calming Mind Rhythm
 *
 * Implements the 2-minute serene deep breathing & gentle mindfulness rhythm
 * from the Serene Heritage cognitive collection.
 * - Visual expanding/contracting breath guide (Inhale 4s, Hold 3s, Exhale 4s)
 * - Gentle ripple rhythm tapping
 * - Full offline SQLite persistence & streak tracking
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { ArrowLeft, Sparkles, Waves, Heart, Trophy, CheckCircle2 } from 'lucide-react-native';
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
  targetTimeMs?: number;
  onComplete: () => void;
  onBack: () => void;
}

type BreathPhase = 'inhale' | 'hold' | 'exhale';

const PHASE_CONFIG: Record<BreathPhase, { duration: number; text: string; sub: string; scale: number; color: string }> = {
  inhale: {
    duration: 4000,
    text: 'Breathe In Slowly',
    sub: 'Draw in peaceful morning energy through your nose...',
    scale: 1.35,
    color: colors.teal,
  },
  hold: {
    duration: 3000,
    text: 'Hold Gently',
    sub: 'Feel the quiet stillness in your heart...',
    scale: 1.35,
    color: colors.navy,
  },
  exhale: {
    duration: 4000,
    text: 'Exhale Softly',
    sub: 'Let go of all tension through your mouth...',
    scale: 0.9,
    color: colors.tealDeep,
  },
};

export default function BrahmaputraSerenityGame({
  gameId,
  difficulty = 1,
  onComplete,
  onBack,
}: Props) {
  const user = useAuthStore((s) => s.user);
  const [phase, setPhase] = useState<BreathPhase>('inhale');
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [calmTouches, setCalmTouches] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [isFinished, setIsFinished] = useState(false);
  const [updatedDifficulty, setUpdatedDifficulty] = useState<number | null>(null);

  const breathAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<any>(null);

  const { panHandlers } = useBackNavigation(undefined, { onCustomBack: onBack });

  // Breath Animation Loop
  useEffect(() => {
    if (isFinished) return;

    let isMounted = true;

    const runCycle = () => {
      if (!isMounted || isFinished) return;

      // 1. Inhale (4s)
      setPhase('inhale');
      Animated.timing(breathAnim, {
        toValue: PHASE_CONFIG.inhale.scale,
        duration: PHASE_CONFIG.inhale.duration,
        useNativeDriver: true,
      }).start(() => {
        if (!isMounted || isFinished) return;

        // 2. Hold (3s)
        setPhase('hold');
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          ]),
          { iterations: 1 }
        ).start();

        setTimeout(() => {
          if (!isMounted || isFinished) return;

          // 3. Exhale (4s)
          setPhase('exhale');
          Animated.timing(breathAnim, {
            toValue: PHASE_CONFIG.exhale.scale,
            duration: PHASE_CONFIG.exhale.duration,
            useNativeDriver: true,
          }).start(() => {
            if (!isMounted || isFinished) return;
            setCyclesCompleted((prev) => prev + 1);
            runCycle();
          });
        }, PHASE_CONFIG.hold.duration);
      });
    };

    runCycle();

    return () => {
      isMounted = false;
      breathAnim.stopAnimation();
    };
  }, [isFinished]);

  // Gentle countdown timer
  useEffect(() => {
    if (isFinished) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isFinished]);

  const handleRippleTap = () => {
    setCalmTouches((c) => c + 1);
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.15, duration: 120, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  };

  const handleFinish = async () => {
    setIsFinished(true);
    const elderId = user?.id || 'demo-elder-id';
    const nextDiff = Math.min(3, difficulty + 1);
    setUpdatedDifficulty(nextDiff);

    try {
      await offlineStore.recordGameSession({
        elder_id: elderId,
        game_id: gameId,
        difficulty_level: difficulty,
        score: Math.min(100, (cyclesCompleted + 1) * 20 + calmTouches * 2),
        max_score: 100,
        accuracy_percentage: 100,
        response_time_ms: (60 - secondsRemaining) * 1000,
        metrics_payload: {
          cycles: cyclesCompleted + 1,
          calm_touches: calmTouches,
          exercise: 'Brahmaputra Serenity',
        },
      });
      await offlineStore.setDifficulty(elderId, gameId, nextDiff);
    } catch (err) {
      console.log('Error saving serenity session:', err);
    }
    onComplete();
  };

  // ── Result / Completed State ──
  if (isFinished) {
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
            <Waves size={46} color={colors.teal} strokeWidth={2.2} />
          </View>

          <Text style={styles.completeTitle}>Mind Refreshed & Centered</Text>

          <View style={[styles.difficultyBadge, styles.difficultyBadgeUp]}>
            <Text style={styles.difficultyBadgeText}>
              🌸 Peaceful Serenity Achieved • Level {difficulty}
            </Text>
          </View>

          <Text style={styles.encouragement}>
            Wonderful work! Taking these quiet moments supports healthy circulation, reduces worry, and clears your thoughts.
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{Math.max(1, cyclesCompleted)}</Text>
              <Text style={styles.statLabel}>Breath Cycles</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{calmTouches}</Text>
              <Text style={styles.statLabel}>Gentle Taps</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{60 - secondsRemaining}s</Text>
              <Text style={styles.statLabel}>Relaxed Time</Text>
            </View>
          </View>

          <View style={styles.recommendationCard}>
            <Text style={styles.recommendationLabel}>Daily Mind Whisper</Text>
            <Text style={styles.recommendationText}>
              Drink a glass of warm water now to stay hydrated and refreshed throughout the morning.
            </Text>
          </View>

          <View style={styles.resultActions}>
            <PrimaryButton
              title="Practice Again"
              onPress={() => {
                setIsFinished(false);
                setSecondsRemaining(60);
                setCyclesCompleted(0);
                setCalmTouches(0);
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

  // ── Active Gameplay State ──
  const activeCfg = PHASE_CONFIG[phase];

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

          <View style={styles.timerPill}>
            <Waves size={16} color={colors.teal} style={{ marginRight: 4 }} />
            <Text style={styles.timerText}>{secondsRemaining}s</Text>
          </View>
        </View>

        <Text style={styles.title}>Brahmaputra Serenity</Text>
        <Text style={styles.subtitle}>
          Serene Heritage Mindfulness • Relax your shoulders & breathe
        </Text>

        {/* Breathing Animation Sphere */}
        <View style={styles.breathSphereContainer}>
          <Animated.View
            style={[
              styles.breathOuterGlow,
              {
                borderColor: activeCfg.color,
                transform: [{ scale: breathAnim }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.breathCoreSphere,
                {
                  backgroundColor: activeCfg.color,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Waves size={38} color="#FFFFFF" strokeWidth={2.2} />
              <Text style={styles.spherePhaseText}>{phase.toUpperCase()}</Text>
            </Animated.View>
          </Animated.View>
        </View>

        {/* Prompt Card */}
        <View style={styles.promptCard}>
          <Text style={[styles.promptTitle, { color: activeCfg.color }]}>
            {activeCfg.text}
          </Text>
          <Text style={styles.promptSub}>{activeCfg.sub}</Text>
        </View>

        {/* Gentle Ripple Touch Button */}
        <TouchableOpacity
          onPress={handleRippleTap}
          style={styles.rippleButton}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Tap to feel peaceful ripple, current count ${calmTouches}`}
        >
          <Heart size={20} color={colors.teal} style={{ marginRight: 8 }} />
          <Text style={styles.rippleButtonText}>
            Tap to feel peaceful ripple ({calmTouches})
          </Text>
        </TouchableOpacity>

        {/* Early Refreshed Action */}
        <TouchableOpacity
          onPress={handleFinish}
          style={styles.finishEarlyButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="I Feel Calm & Refreshed"
        >
          <CheckCircle2 size={18} color={colors.textSecondary} style={{ marginRight: 6 }} />
          <Text style={styles.finishEarlyText}>I Feel Calm & Refreshed</Text>
        </TouchableOpacity>
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
    alignItems: 'center',
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
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.tealBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 113, 227, 0.2)',
  },
  timerText: {
    fontFamily: fontFamily.display,
    fontSize: 14,
    fontWeight: '800',
    color: colors.teal,
  },
  title: {
    fontFamily: fontFamily.display,
    fontSize: 26,
    fontWeight: '800',
    color: colors.navy,
    textAlign: 'center',
    letterSpacing: 0,
    marginTop: spacing.xs,
  },
  subtitle: {
    fontFamily: fontFamily.text,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.xl,
    lineHeight: 22,
    letterSpacing: 0,
  },
  breathSphereContainer: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.lg,
  },
  breathOuterGlow: {
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 113, 227, 0.04)',
  },
  breathCoreSphere: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  spherePhaseText: {
    fontFamily: fontFamily.display,
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
    letterSpacing: 1,
  },
  promptCard: {
    width: '100%',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  promptTitle: {
    fontFamily: fontFamily.display,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0,
  },
  promptSub: {
    fontFamily: fontFamily.text,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0,
  },
  rippleButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: colors.tealBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 113, 227, 0.2)',
    marginTop: spacing.sm,
    minHeight: 52,
  },
  rippleButtonText: {
    fontFamily: fontFamily.display,
    fontSize: 15,
    fontWeight: '700',
    color: colors.teal,
    letterSpacing: 0,
  },
  finishEarlyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: spacing.md,
  },
  finishEarlyText: {
    fontFamily: fontFamily.display,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
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
    fontSize: 28,
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
