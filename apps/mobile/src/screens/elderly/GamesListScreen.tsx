/**
 * SMRITI+ — Games List Screen
 *
 * Shows available games with difficulty info, launches the selected game.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows, fontFamily } from '../../theme/tokens';
import { GameCard } from '../../components/UIComponents';
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

  useEffect(() => { fetchGames(); }, [fetchGames]);

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

  const handleGameComplete = () => { /* Session already submitted & persisted in game */ };

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
      <View style={{ flex: 1 }} {...panHandlers}>
        {gameElement}
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center]} {...panHandlers}>
        <ActivityIndicator size="large" color={colors.teal} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} {...panHandlers}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={goBackSafe}
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
          activeOpacity={0.75}
        >
          <ArrowLeft size={16} color={colors.textDark} strokeWidth={2.4} style={{ marginRight: 6 }} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t('games.title') || 'Play a Game'}</Text>
        <Text style={styles.subtitle}>{t('games.subtitle') || 'Choose a game to exercise your mind'}</Text>

        {games.map((game) => (
          <GameCard
            key={game.id}
            name={game.name}
            icon=""
            description={game.description || ''}
            onPress={() => startGame(game)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: {
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    padding: spacing.lg,
    paddingTop: 56,
    paddingBottom: 110,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.pill,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 44,
  },
  backText: {
    fontFamily: fontFamily.display,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
  },
  title: { ...typography.elderly.h1, fontSize: 30, fontWeight: '800', color: colors.textDark, marginBottom: 4, letterSpacing: -0.6 },
  subtitle: { ...typography.elderly.caption, fontSize: 16, color: colors.muted, marginBottom: spacing.xl },
});
