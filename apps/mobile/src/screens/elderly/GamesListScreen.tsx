/**
 * SMRITI+ — Memory Activities (Games List) Screen
 *
 * Elderly-friendly cognitive exercises list following Apple iOS Health standards:
 * - Plain human language ("Memory Activities", not "Neurocognitive intervention")
 * - 48-64px touch targets
 * - Clear single-purpose cards with no distracting animations or casino aesthetics
 * - Predictable back navigation
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { ArrowLeft, Sparkles, Brain, Eye, Puzzle, Gamepad2, ChevronRight, Waves, Flower2 } from 'lucide-react-native';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  touchTargets,
  fontFamily,
} from '../../theme/tokens';
import { api } from '../../services/api';
import { useAuthStore } from '../../state/authStore';
import { offlineStore, DEFAULT_GAMES } from '../../services/offlineStore';
import { defaultVoiceOrchestrator } from '../../services/voice/VoiceOrchestrator';
import { useTranslation } from '../../i18n';
import { useBackNavigation } from '../../navigation/useBackNavigation';
import MemoryMatchingGame from './games/MemoryMatchingGame';
import MemoryRecallGame from './games/MemoryRecallGame';
import PatternGame from './games/PatternGame';
import AttentionGame from './games/AttentionGame';
import BrahmaputraSerenityGame from './games/BrahmaputraSerenityGame';
import CulturalTriviaGame from './games/CulturalTriviaGame';

interface GameInfo {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  target_time_ms: number;
  min_difficulty: number;
  max_difficulty: number;
}

export default function GamesListScreen({ navigation }: any) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [games, setGames] = useState<GameInfo[]>(DEFAULT_GAMES);
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState<{ game: GameInfo; difficulty: number } | null>(null);

  const handleBack = useCallback(() => {
    if (activeGame) {
      setActiveGame(null);
      return true;
    }
    return false;
  }, [activeGame]);

  const { goBackSafe, panHandlers } = useBackNavigation(navigation, {
    onCustomBack: activeGame ? handleBack : undefined,
    fallbackTab: 'Home',
  });

  const fetchGames = useCallback(async () => {
    try {
      const data = await api.get<GameInfo[]>('/games');
      if (data && data.length > 0) {
        const merged = [...data];
        for (const dg of DEFAULT_GAMES) {
          if (!merged.some((m) => m.id === dg.id || m.category === dg.category)) {
            merged.push(dg);
          }
        }
        setGames(merged);
      } else {
        setGames(DEFAULT_GAMES);
      }
    } catch (err) {
      console.log('Could not load games online, using local cache:', err);
      setGames(DEFAULT_GAMES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const startGame = async (game: GameInfo) => {
    let difficulty = 1;
    try {
      if (user?.id) {
        const diff = await api.get<{ current_level: number }>(
          `/elders/${user.id}/difficulty/${game.id}`
        );
        difficulty = diff.current_level;
      }
    } catch {
      try {
        difficulty = await offlineStore.getDifficulty(user?.id || 'demo-elder-id', game.id);
      } catch {
        difficulty = 1;
      }
    }
    setActiveGame({ game, difficulty });
  };

  const handleGameComplete = () => {
    // Session completion handled inside game component
    defaultVoiceOrchestrator.notifyGameCompleted();
  };

  // Register voice action handlers for game management
  useEffect(() => {
    defaultVoiceOrchestrator.setCurrentScreen('games');
    defaultVoiceOrchestrator.registerActionHandlers({
      startGame: async (gameId?: string, targetDiff?: number) => {
        const found = games.find((g) => g.id === gameId || g.category === gameId) || games[0] || DEFAULT_GAMES[0];
        const diff = targetDiff || 1;
        setActiveGame({ game: found, difficulty: diff });
        return true;
      },
      setDifficulty: async (direction: 'easier' | 'harder') => {
        if (!activeGame) return 1;
        const cur = activeGame.difficulty;
        const nextDiff = direction === 'easier' ? Math.max(1, cur - 1) : Math.min(5, cur + 1);
        setActiveGame({ game: activeGame.game, difficulty: nextDiff });
        try {
          await offlineStore.setDifficulty(user?.id || 'demo-elder-id', activeGame.game.id, nextDiff);
        } catch {}
        return nextDiff;
      },
      stopGame: () => {
        setActiveGame(null);
        return true;
      },
    });

    return () => {
      defaultVoiceOrchestrator.setCurrentScreen('home');
    };
  }, [games, activeGame, user]);

  // Auto-hide bottom tab bar during active gameplay
  useEffect(() => {
    if (navigation && navigation.setOptions) {
      if (activeGame) {
        navigation.setOptions({
          tabBarStyle: { display: 'none' },
        });
      } else {
        navigation.setOptions({
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: colors.border,
            height: Platform.OS === 'ios' ? 88 : Platform.OS === 'android' ? 76 : 70,
            paddingBottom: Platform.OS === 'ios' ? 28 : Platform.OS === 'android' ? 14 : 10,
            paddingTop: 8,
          },
        });
      }
    }
  }, [activeGame, navigation]);

  // Render active game
  if (activeGame) {
    const { game, difficulty } = activeGame;
    const props = {
      gameId: game.id,
      difficulty,
      targetTimeMs: game.target_time_ms,
      onComplete: handleGameComplete,
      onBack: () => {
        setActiveGame(null);
        fetchGames();
      },
    };

    let gameElement: React.ReactNode;
    switch (game.category) {
      case 'memory_matching':
        gameElement = <MemoryMatchingGame {...props} />;
        break;
      case 'memory_recall':
        gameElement = <MemoryRecallGame {...props} />;
        break;
      case 'pattern_recognition':
        gameElement = <PatternGame {...props} />;
        break;
      case 'attention':
        gameElement = <AttentionGame {...props} />;
        break;
      case 'relaxation':
        gameElement = <BrahmaputraSerenityGame {...props} />;
        break;
      case 'heritage_trivia':
        gameElement = <CulturalTriviaGame {...props} />;
        break;
      default:
        gameElement = <MemoryMatchingGame {...props} />;
        break;
    }

    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {gameElement}
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center]} {...panHandlers}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading memory activities…</Text>
      </View>
    );
  }

  const renderIconForGame = (category: string) => {
    switch (category) {
      case 'memory_matching':
        return <Sparkles size={24} color={colors.primary} strokeWidth={2.2} />;
      case 'memory_recall':
        return <Brain size={24} color={colors.primary} strokeWidth={2.2} />;
      case 'attention':
        return <Eye size={24} color={colors.primary} strokeWidth={2.2} />;
      case 'pattern_recognition':
        return <Puzzle size={24} color={colors.primary} strokeWidth={2.2} />;
      case 'relaxation':
        return <Waves size={24} color={colors.primary} strokeWidth={2.2} />;
      case 'heritage_trivia':
        return <Flower2 size={24} color={colors.primary} strokeWidth={2.2} />;
      default:
        return <Gamepad2 size={24} color={colors.primary} strokeWidth={2.2} />;
    }
  };

  return (
    <View style={{ flex: 1 }} {...panHandlers}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Safe Back Navigation Button */}
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

        <Text style={styles.title}>{t('games.title') || 'Memory Activities'}</Text>
        <Text style={styles.subtitle}>
          {t('games.subtitle') || 'Gentle daily exercises to exercise memory and focus'}
        </Text>

        {/* Daily Mind Gym Streak Banner from Serene Heritage Stitch Design */}
        <View style={styles.streakBanner}>
          <View style={styles.streakIconWrap}>
            <Sparkles size={22} color="#FFFFFF" strokeWidth={2.2} />
          </View>
          <View style={styles.streakInfo}>
            <Text style={styles.streakTitle}>Keep Your Mind Glowing</Text>
            <Text style={styles.streakSub}>
              Complete at least 1 activity daily to maintain your streak!
            </Text>
          </View>
        </View>

        <View style={styles.gamesList}>
          {games.map((game) => (
            <TouchableOpacity
              key={game.id}
              onPress={() => startGame(game)}
              activeOpacity={0.78}
              accessibilityRole="button"
              accessibilityLabel={`Start ${game.name}: ${game.description || 'Memory exercise'}`}
              style={[styles.activityItem, shadows.card]}
            >
              <View style={styles.activityIconWrap}>
                {renderIconForGame(game.category)}
              </View>

              <View style={styles.activityInfo}>
                <Text style={styles.activityName} numberOfLines={1}>
                  {game.name}
                </Text>
                <Text style={styles.activityDesc} numberOfLines={2}>
                  {game.description || 'Engaging cognitive activity tailored for today'}
                </Text>
              </View>

              <View style={styles.activityArrowWrap}>
                <ChevronRight size={20} color={colors.muted} strokeWidth={2.2} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Calming Senior Reassurance Footer from Stitch */}
        <View style={styles.seniorReassuranceFooter}>
          <Text style={styles.seniorReassuranceText}>
            🌸 Take all the time you need. There are no timers, errors, or stress at SMRITI+.
          </Text>
        </View>
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
    paddingBottom: Platform.OS === 'ios' ? 160 : 135,
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
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tealBg,
    borderRadius: 20,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 113, 227, 0.2)',
  },
  streakIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  streakInfo: {
    flex: 1,
  },
  streakTitle: {
    fontFamily: fontFamily.display,
    fontSize: 15,
    fontWeight: '800',
    color: colors.teal,
    letterSpacing: 0,
  },
  streakSub: {
    fontFamily: fontFamily.text,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  gamesList: {
    gap: 12,
  },
  activityItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    padding: spacing.md + 4,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
  },
  activityIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  activityInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  activityName: {
    ...typography.elderly.cardHeading,
  },
  activityDesc: {
    ...typography.elderly.secondary,
    marginTop: 3,
    lineHeight: 20,
  },
  activityArrowWrap: {
    paddingLeft: 4,
  },
  seniorReassuranceFooter: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seniorReassuranceText: {
    fontFamily: fontFamily.text,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0,
  },
});
