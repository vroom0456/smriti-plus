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
import { ArrowLeft, Sparkles, Brain, Eye, Puzzle, Gamepad2, ChevronRight } from 'lucide-react-native';
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
import { useTranslation } from '../../i18n';
import { useBackNavigation } from '../../navigation/useBackNavigation';
import MemoryMatchingGame from './games/MemoryMatchingGame';
import MemoryRecallGame from './games/MemoryRecallGame';
import PatternGame from './games/PatternGame';
import AttentionGame from './games/AttentionGame';

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
        setGames(data);
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
  };

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
    paddingBottom: 110,
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
    marginBottom: spacing.xl,
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
});
