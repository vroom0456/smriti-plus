/**
 * SMRITI+ — Digital Memory Box Screen ("My Memories ❤️")
 *
 * Implements Sections 35, 36, 39 & Phase 2 Differentiation:
 * - Curated categories (Family, Places, Celebrations, Music, Photos, People)
 * - Culturally authentic North Eastern Region (NER) heritage and personal stories
 * - "▶ Listen to Story" audio narration via voiceService.speak
 * - One-Thing-At-A-Time detailed memory view modal
 * - Offline-first caching via SQLite
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows, fontFamily } from '../../theme/tokens';
import { api } from '../../services/api';
import { offlineStore } from '../../services/offlineStore';
import { voiceService } from '../../services/voice';
import { useAuthStore } from '../../state/authStore';
import {
  Sparkles,
  Users,
  Home,
  PartyPopper,
  Music,
  Camera,
  ArrowLeft,
  Volume2,
  Square,
  Heart,
  Check,
  ArrowRight,
} from 'lucide-react-native';

interface Memory {
  id: string;
  type: string;
  title: string;
  description: string;
  media_url: string;
  thumbnail_url?: string;
  category: string;
  is_favorite?: boolean;
}

const CATEGORIES = [
  { id: 'All', label: 'All', icon: Sparkles },
  { id: 'Family', label: 'Family', icon: Users },
  { id: 'Places', label: 'Places', icon: Home },
  { id: 'Celebrations', label: 'Celebrations', icon: PartyPopper },
  { id: 'Music', label: 'Music', icon: Music },
  { id: 'Photos', label: 'Photos', icon: Camera },
];

export default function MemoryBoxScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeMemory, setActiveMemory] = useState<Memory | null>(null);
  const [isNarrating, setIsNarrating] = useState<boolean>(false);

  const elderId = user?.id || 'demo-elder-id';

  const loadMemories = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Read from local SQLite first
      const local = await offlineStore.getCachedMemories(elderId, selectedCategory);
      if (local && local.length > 0) {
        setMemories(local);
      }

      // 2. Refresh from server in background
      try {
        const url =
          selectedCategory === 'All'
            ? `/elders/${elderId}/memories`
            : `/elders/${elderId}/memories?category=${encodeURIComponent(selectedCategory)}`;
        const remote = await api.get<Memory[]>(url);
        if (remote && remote.length > 0) {
          setMemories(remote);
          await offlineStore.cacheMemories(remote);
        }
      } catch (err) {
        // Fallback default NER memories if fresh install
        if (!local || local.length === 0) {
          const defaultItems: Memory[] = [
            {
              id: 'mem-1',
              type: 'photo',
              title: 'Rongali Bihu Celebrations',
              description: 'Dancing the Bohag Bihu with the whole village. We had delicious pitha, laru, and played the dhol under the mango tree.',
              media_url: 'bihu_photo',
              category: 'Celebrations',
            },
            {
              id: 'mem-2',
              type: 'photo',
              title: 'Tea Estate Sunrise in Jorhat',
              description: 'Walking through the green tea gardens in Jorhat during the early morning mist. The fragrance of fresh tea leaves was so soothing.',
              media_url: 'tea_garden',
              category: 'Places',
            },
            {
              id: 'mem-3',
              type: 'story',
              title: 'Meena’s First Saree in Guwahati',
              description: 'Our granddaughter Meena wore her mother’s traditional Muga silk mekhela chador on her 18th birthday. Everyone was smiling.',
              media_url: 'meena_saree',
              category: 'Family',
            },
            {
              id: 'mem-4',
              type: 'place',
              title: 'Sunset at Majuli Island',
              description: 'Taking the ferry across the mighty Brahmaputra river to visit the ancient Satras in Majuli. The peaceful chanting filled the air.',
              media_url: 'majuli_island',
              category: 'Places',
            },
            {
              id: 'mem-5',
              type: 'music',
              title: 'Traditional Bamboo Flute Melodies',
              description: 'Gentle Borgeet songs played on the traditional bamboo flute. Calming sounds for a peaceful afternoon rest.',
              media_url: 'flute_music',
              category: 'Music',
            },
          ];
          setMemories(defaultItems);
          await offlineStore.cacheMemories(defaultItems);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [elderId, selectedCategory]);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  const handleOpenMemory = (item: Memory) => {
    setActiveMemory(item);
    setIsNarrating(false);
  };

  const handleListenStory = async (item: Memory) => {
    if (isNarrating) {
      await voiceService.stop();
      setIsNarrating(false);
      return;
    }

    setIsNarrating(true);
    const spokenText = `${item.title}. ${item.description}`;
    await voiceService.speak(spokenText, 'en');
  };

  const handleCloseModal = async () => {
    await voiceService.stop();
    setIsNarrating(false);
    setActiveMemory(null);
  };

  const toggleFavorite = (item: Memory) => {
    setMemories((prev) =>
      prev.map((m) => (m.id === item.id ? { ...m, is_favorite: !m.is_favorite } : m))
    );
    if (activeMemory && activeMemory.id === item.id) {
      setActiveMemory({ ...activeMemory, is_favorite: !activeMemory.is_favorite });
    }
  };

  const renderCategoryVector = (category: string, size = 36, color = colors.teal) => {
    switch (category) {
      case 'Celebrations':
        return <PartyPopper size={size} color={color} />;
      case 'Places':
        return <Home size={size} color={color} />;
      case 'Music':
        return <Music size={size} color={color} />;
      case 'Photos':
        return <Camera size={size} color={color} />;
      case 'Family':
        return <Users size={size} color={color} />;
      default:
        return <Sparkles size={size} color={color} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          activeOpacity={0.75}
        >
          <ArrowLeft size={16} color={colors.navy} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">My Memories</Text>
        <Text style={styles.subtitle} numberOfLines={2} ellipsizeMode="tail">
          Familiar places, dear family, and happy celebrations.
        </Text>
      </View>

      {/* Category Pills */}
      <View style={styles.categoriesWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryPills}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const IconComp = cat.icon;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.pill, isSelected && styles.pillSelected]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${cat.label}`}
              >
                <IconComp size={16} color={isSelected ? colors.white : colors.navy} style={{ marginRight: 6 }} />
                <Text style={[styles.pillLabel, isSelected && styles.pillLabelSelected]} numberOfLines={1}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Memories Grid / List */}
      <ScrollView contentContainerStyle={styles.listContent}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.teal} style={{ marginTop: 40 }} />
        ) : memories.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Camera size={36} color={colors.muted} />
            </View>
            <Text style={styles.emptyTitle}>No Memories Here Yet</Text>
            <Text style={styles.emptyText}>
              Ask your family to add photos or stories about your home and family.
            </Text>
          </View>
        ) : (
          memories.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.memoryCard}
              onPress={() => handleOpenMemory(item)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={`Open memory: ${item.title}`}
            >
              {/* Visual Placeholder / Image Header */}
              <View style={styles.mediaFrame}>
                <View style={styles.mediaCircle}>
                  {renderCategoryVector(item.category, 40, colors.teal)}
                </View>
                <View style={styles.categoryBadge}>
                  <Text style={styles.badgeText} numberOfLines={1}>{item.category}</Text>
                </View>
              </View>

              <View style={styles.memoryDetails}>
                <Text style={styles.memoryTitle} numberOfLines={1} ellipsizeMode="tail">{item.title}</Text>
                <Text style={styles.memorySnippet} numberOfLines={2} ellipsizeMode="tail">
                  {item.description}
                </Text>

                <View style={styles.cardBottomRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={styles.tapToOpen}>Tap to view & listen</Text>
                    <ArrowRight size={14} color={colors.teal} />
                  </View>
                  {item.is_favorite && <Heart size={18} color={colors.coral} fill={colors.coral} />}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Memory Detail Modal (One-Thing-At-A-Time Experience) */}
      <Modal visible={activeMemory !== null} transparent animationType="slide">
        {activeMemory && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalCategoryBadge}>
                  <Text style={styles.modalCategoryText}>{activeMemory.category}</Text>
                </View>
                <TouchableOpacity
                  style={styles.favButton}
                  onPress={() => toggleFavorite(activeMemory)}
                  accessibilityRole="button"
                  accessibilityLabel="Toggle favorite"
                  activeOpacity={0.75}
                >
                  <Heart
                    size={24}
                    color={activeMemory.is_favorite ? colors.coral : colors.muted}
                    fill={activeMemory.is_favorite ? colors.coral : 'transparent'}
                  />
                </TouchableOpacity>
              </View>

              {/* Media Display */}
              <View style={styles.modalMediaBox}>
                {renderCategoryVector(activeMemory.category, 56, colors.teal)}
              </View>

              <Text style={styles.modalTitle} numberOfLines={2} ellipsizeMode="tail">{activeMemory.title}</Text>
              <Text style={styles.modalDescription}>{activeMemory.description}</Text>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.narrateButton, isNarrating && styles.narrateButtonActive]}
                  onPress={() => handleListenStory(activeMemory)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel="Listen to memory story"
                >
                  {isNarrating ? (
                    <Square size={20} color={colors.white} style={{ marginRight: spacing.sm }} />
                  ) : (
                    <Volume2 size={20} color={colors.white} style={{ marginRight: spacing.sm }} />
                  )}
                  <Text style={styles.narrateText}>
                    {isNarrating ? 'Stop Listening' : 'Listen to Story'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleCloseModal}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel="Close memory view"
                >
                  <Check size={18} color={colors.navy} style={{ marginRight: 6 }} />
                  <Text style={styles.closeButtonText}>Done Viewing</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.glassCard,
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.glassCard,
    borderRadius: borderRadius.pill,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    gap: 6,
    ...shadows.subtle,
  },
  backText: {
    fontFamily: fontFamily.display,
    fontSize: 15,
    fontWeight: '700',
    color: colors.navy,
  },
  title: {
    ...typography.elderly.h1,
    color: colors.navy,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontFamily: fontFamily.text,
    fontSize: 16,
    color: colors.muted,
    marginTop: 2,
  },
  categoriesWrapper: {
    backgroundColor: colors.glassCard,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
  },
  categoryPills: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: spacing.md + 2,
    paddingVertical: 10,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 44,
  },
  pillSelected: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
    ...shadows.glowTeal,
  },
  pillLabel: {
    fontFamily: fontFamily.display,
    fontSize: 15,
    fontWeight: '700',
    color: colors.navy,
  },
  pillLabelSelected: {
    color: colors.white,
  },
  listContent: {
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  emptyCard: {
    backgroundColor: colors.glassCard,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: 40,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    ...shadows.card,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.elderly.h2,
    color: colors.navy,
    marginBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  emptyText: {
    ...typography.elderly.body,
    color: colors.muted,
    textAlign: 'center',
  },
  memoryCard: {
    backgroundColor: colors.glassCard,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    ...shadows.card,
  },
  mediaFrame: {
    height: 140,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  mediaCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.subtle,
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(19, 42, 82, 0.78)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: borderRadius.pill,
  },
  badgeText: {
    fontFamily: fontFamily.display,
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  memoryDetails: {
    padding: spacing.lg,
  },
  memoryTitle: {
    ...typography.elderly.h2,
    color: colors.navy,
    marginBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  memorySnippet: {
    ...typography.elderly.body,
    color: colors.muted,
    lineHeight: 26,
    marginBottom: spacing.md,
    fontSize: 18,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tapToOpen: {
    fontFamily: fontFamily.display,
    fontSize: 15,
    color: colors.teal,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 23, 48, 0.72)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.xl,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    ...shadows.floating,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalCategoryBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCategoryText: {
    fontFamily: fontFamily.display,
    fontSize: 14,
    fontWeight: '700',
    color: colors.teal,
  },
  favButton: {
    padding: spacing.xs,
  },
  modalMediaBox: {
    height: 160,
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    ...typography.elderly.h1,
    color: colors.navy,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  modalDescription: {
    ...typography.elderly.body,
    color: colors.textDark,
    lineHeight: 30,
    marginBottom: spacing.xl,
    fontSize: 20,
  },
  modalActions: {
    gap: spacing.md,
  },
  narrateButton: {
    backgroundColor: colors.teal,
    borderRadius: borderRadius.pill,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    ...shadows.glowTeal,
  },
  narrateButtonActive: {
    backgroundColor: colors.coral,
    ...shadows.glowCoral,
  },
  narrateText: {
    fontFamily: fontFamily.display,
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.pill,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 52,
  },
  closeButtonText: {
    fontFamily: fontFamily.display,
    color: colors.navy,
    fontSize: 16,
    fontWeight: '700',
  },
});
