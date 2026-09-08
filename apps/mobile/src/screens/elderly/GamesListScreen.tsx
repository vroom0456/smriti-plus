/**
 * SMRITI+ — Games List Screen
 *
 * Shows available games with difficulty info, launches the selected game.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { colors, typography, spacing } from '../../theme/tokens';
import { GameCard } from '../../components/UIComponents';
import { api } from '../../services/api';
import { useAuthStore } from '../../state/authStore';
import { offlineStore, DEFAULT_GAMES } from '../../services/offlineStore';
import { useTranslation } from '../../i18n';
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

const GAME_ICONS: Record<string, string> = {
  memory_recall: '🧠',
  memory_matching: '🃏',
  attention: '👁️',
  pattern_recognition: '🧩',
};

export default function GamesListScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [games, setGames] = useState<GameInfo[]>(DEFAULT_GAMES);
  const [loading, setLoading] = useState(true);
  const [activeGame, setActiveGame] = useState<{ game: GameInfo; difficulty: number } | null>(null);

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
      // Offline fallback: read from local SQLite
      try {
        difficulty = await offlineStore.getDifficulty(user?.id || 'demo-elder-id', game.id);
      } catch {
        difficulty = 1;
      }
    }
    setActiveGame({ game, difficulty });
  };

  const handleGameComplete = () => { /* Session already submitted & persisted in game */ };

  const handleBack = () => {
    setActiveGame(null);
    fetchGames(); // refresh
  };

  // Render active game
  if (activeGame) {
    const { game, difficulty } = activeGame;
    const props = {
      gameId: game.id,
      difficulty,
      targetTimeMs: game.target_time_ms,
      onComplete: handleGameComplete,
      onBack: handleBack,
    };

    switch (game.category) {
      case 'memory_matching':
        return <MemoryMatchingGame {...props} />;
      case 'memory_recall':
        return <MemoryRecallGame {...props} />;
      case 'pattern_recognition':
        return <PatternGame {...props} />;
      case 'attention':
        return <AttentionGame {...props} />;
      default:
        return <MemoryMatchingGame {...props} />;
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.teal} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
  title: { ...typography.elderly.h1, fontSize: 30, fontWeight: '800', color: colors.textDark, marginBottom: 4, letterSpacing: -0.6 },
  subtitle: { ...typography.elderly.caption, fontSize: 16, color: colors.muted, marginBottom: spacing.xl },
});
