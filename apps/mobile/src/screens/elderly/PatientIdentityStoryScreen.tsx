/**
 * SMRITI+ — Patient Identity & Life Story Screen
 * "Who Am I?" — Comforting biographical anchor for moments of confusion
 *
 * Designed for Alzheimer's / dementia patients during memory lapses or Sundowning.
 * Large text, warm colors, voice narration, and a reassuring grounding card.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  ArrowLeft,
  Volume2,
  Phone,
  User,
  Heart,
  BookOpen,
  Users,
  Home,
  GraduationCap,
  Smile,
  ShieldCheck,
} from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows, fontFamily } from '../../theme/tokens';
import { useAuthStore } from '../../state/authStore';
import { api } from '../../services/api';
import { offlineStore } from '../../services/offlineStore';
import { useBackNavigation } from '../../navigation/useBackNavigation';

// ─── Default biographical data (shown until caregiver fills in real data) ─────
const DEFAULT_IDENTITY = {
  full_name: 'Amit Borah',
  preferred_name: 'Borah Babu',
  birth_place: 'Tezpur, Assam',
  schooling_location: 'Tezpur Government Higher Secondary School, Assam (1968–1974)',
  college: 'Cotton College, Guwahati — B.Sc. in Botany (1974–1977)',
  study_details: 'You were a bright student who loved the natural sciences and spent evenings reading near the river.',
  childhood_friends: 'Hemanta Kalita, Biren Deka, Rupa Saikia — your closest friends from childhood. You played football together every evening.',
  parents_names: 'Father: Late Shri Bireswar Borah  •  Mother: Late Smt. Kamala Borah',
  spouse_name: 'Malabika Borah (your loving wife)',
  kids: JSON.stringify([
    { name: 'Priya Borah', relation: 'Daughter', location: 'Guwahati', note: 'She calls you every evening and loves you dearly.' },
    { name: 'Rahul Borah', relation: 'Son', location: 'Bengaluru', note: 'He visits every month and thinks of you often.' },
  ]),
  profession: 'School Teacher — 30 years of service at Tezpur Government School',
  home_town: 'Tezpur, Assam',
  comfort_message: 'You are safe. You are at home in Guwahati. Everything is peaceful. Your family loves you very much.',
};

interface KidDetail {
  name: string;
  relation: string;
  location: string;
  note: string;
}

interface IdentityStory {
  full_name: string;
  preferred_name?: string;
  birth_place?: string;
  schooling_location?: string;
  college?: string;
  study_details?: string;
  childhood_friends?: string;
  parents_names?: string;
  spouse_name?: string;
  kids?: string;
  profession?: string;
  home_town?: string;
  comfort_message?: string;
}

interface PatientIdentityStoryScreenProps {
  navigation?: any;
  route?: any;
}

export default function PatientIdentityStoryScreen({ navigation }: PatientIdentityStoryScreenProps) {
  const user = useAuthStore((s: any) => s.user);
  const [story, setStory] = useState<IdentityStory>(DEFAULT_IDENTITY);
  const [loading, setLoading] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const { goBackSafe, panHandlers } = useBackNavigation(navigation, { fallbackTab: 'Home' });

  const fetchStory = useCallback(async () => {
    try {
      const data = await api.get<IdentityStory>(`/elders/${user?.id || 'demo-elder-id'}/identity-story`);
      if (data && data.full_name) {
        setStory(data);
        return;
      }
    } catch {}
    try {
      const cached = await (offlineStore as any).getCachedIdentityStory?.(user?.id || 'demo-elder-id');
      if (cached && cached.full_name) {
        setStory(cached);
        return;
      }
    } catch {}
    setStory(DEFAULT_IDENTITY);
  }, [user?.id]);

  useEffect(() => {
    fetchStory().finally(() => setLoading(false));
  }, [fetchStory]);

  const parseKids = (kidsJson?: string): KidDetail[] => {
    if (!kidsJson) return [];
    try {
      const parsed = JSON.parse(kidsJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const buildNarration = (): string => {
    const kids = parseKids(story.kids);
    const kidsText = kids.length > 0
      ? kids.map((k) => `${k.name}, your ${k.relation}, lives in ${k.location}. ${k.note}`).join(' ')
      : '';

    return [
      `Hello. Your name is ${story.full_name}.`,
      story.preferred_name ? `Everyone lovingly calls you ${story.preferred_name}.` : '',
      story.birth_place ? `You were born in ${story.birth_place}.` : '',
      story.parents_names ? `Your parents were: ${story.parents_names}.` : '',
      story.schooling_location ? `You studied at ${story.schooling_location}.` : '',
      story.college ? `For college, you went to ${story.college}.` : '',
      story.childhood_friends ? `Your childhood friends were ${story.childhood_friends}.` : '',
      story.profession ? `You worked as a ${story.profession}.` : '',
      kidsText,
      story.comfort_message ? story.comfort_message : 'You are safe. Everything is okay.',
    ].filter(Boolean).join(' ');
  };

  const handleSpeak = async () => {
    if (speaking) return;
    setSpeaking(true);
    const narration = buildNarration();
    try {
      const Speech = require('expo-speech');
      await Speech.speakAsync(narration, {
        rate: 0.85,
        pitch: 1.0,
        onDone: () => setSpeaking(false),
        onError: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
      });
    } catch {
      setSpeaking(false);
    }
  };

  const kids = parseKids(story.kids);

  if (loading) {
    return (
      <View style={styles.loadingContainer} {...panHandlers}>
        <ActivityIndicator size="large" color={colors.teal} />
        <Text style={styles.loadingText}>Loading your story…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} {...panHandlers}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={goBackSafe} accessibilityRole="button">
          <ArrowLeft size={18} color={colors.textDark} strokeWidth={2.4} />
          <Text style={styles.backBtnText}>Home</Text>
        </TouchableOpacity>

        {/* ─── Identity Header ─────────────────────────────── */}
        <View style={styles.identityHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
          <View style={styles.identityHeaderText}>
            <Text style={styles.helloText}>Hello,</Text>
            <Text style={styles.nameText}>{story.full_name}</Text>
            {story.preferred_name ? (
              <Text style={styles.preferredNameText}>
                Everyone calls you "{story.preferred_name}"
              </Text>
            ) : null}
          </View>
        </View>

        {/* ─── Grounding Comfort Card ───────────────────────── */}
        <View style={styles.comfortCard}>
          <ShieldCheck size={26} color={colors.teal} strokeWidth={2.2} style={{ marginBottom: 10 }} />
          <Text style={styles.comfortText}>{story.comfort_message || DEFAULT_IDENTITY.comfort_message}</Text>
        </View>

        {/* ─── Listen Button ────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.listenBtn, speaking && styles.listenBtnActive]}
          onPress={handleSpeak}
          disabled={speaking}
          accessibilityRole="button"
          accessibilityLabel="Listen to your life story"
        >
          <Volume2 size={22} color={colors.white} strokeWidth={2.5} />
          <Text style={styles.listenBtnText}>
            {speaking ? '▶ Listening to Your Story…' : '▶ Listen to My Life Story'}
          </Text>
        </TouchableOpacity>

        {/* ─── Parents ─────────────────────────────────────── */}
        {story.parents_names ? (
          <SectionCard icon={<Heart size={22} color="#E11D48" strokeWidth={2.2} />} title="Your Parents" color="#FFF1F2">
            <Text style={styles.cardBodyText}>{story.parents_names}</Text>
          </SectionCard>
        ) : null}

        {/* ─── Spouse ──────────────────────────────────────── */}
        {story.spouse_name ? (
          <SectionCard icon={<Smile size={22} color={colors.primary} strokeWidth={2.2} />} title="Your Life Partner" color={colors.primaryMuted}>
            <Text style={styles.cardBodyText}>{story.spouse_name}</Text>
          </SectionCard>
        ) : null}

        {/* ─── Home Town ───────────────────────────────────── */}
        {story.birth_place || story.home_town ? (
          <SectionCard icon={<Home size={22} color="#7C3AED" strokeWidth={2.2} />} title="Where You Are From" color="#F5F3FF">
            {story.birth_place ? <Text style={styles.cardBodyText}>Born in: {story.birth_place}</Text> : null}
            {story.home_town && story.home_town !== story.birth_place
              ? <Text style={styles.cardBodyText}>Home: {story.home_town}</Text>
              : null}
          </SectionCard>
        ) : null}

        {/* ─── Education ───────────────────────────────────── */}
        {(story.schooling_location || story.college) ? (
          <SectionCard icon={<GraduationCap size={22} color="#059669" strokeWidth={2.2} />} title="Your Education" color="#ECFDF5">
            {story.schooling_location ? (
              <>
                <Text style={styles.cardLabel}>School</Text>
                <Text style={styles.cardBodyText}>{story.schooling_location}</Text>
              </>
            ) : null}
            {story.college ? (
              <>
                <Text style={[styles.cardLabel, { marginTop: 10 }]}>College</Text>
                <Text style={styles.cardBodyText}>{story.college}</Text>
              </>
            ) : null}
            {story.study_details ? (
              <Text style={[styles.cardBodyText, { marginTop: 8, fontStyle: 'italic', color: colors.muted }]}>
                {story.study_details}
              </Text>
            ) : null}
          </SectionCard>
        ) : null}

        {/* ─── Childhood Friends ───────────────────────────── */}
        {story.childhood_friends ? (
          <SectionCard icon={<Users size={22} color="#D97706" strokeWidth={2.2} />} title="Your Childhood Friends" color="#FFFBEB">
            <Text style={styles.cardBodyText}>{story.childhood_friends}</Text>
          </SectionCard>
        ) : null}

        {/* ─── Profession ──────────────────────────────────── */}
        {story.profession ? (
          <SectionCard icon={<BookOpen size={22} color={colors.primary} strokeWidth={2.2} />} title="Your Work & Life" color={colors.primaryMuted}>
            <Text style={styles.cardBodyText}>{story.profession}</Text>
          </SectionCard>
        ) : null}

        {/* ─── Children ────────────────────────────────────── */}
        {kids.length > 0 ? (
          <View style={[styles.sectionCard, { backgroundColor: '#FFF7ED' }]}>
            <View style={styles.sectionCardHeader}>
              <View style={[styles.sectionIconCircle, { backgroundColor: '#FED7AA' }]}>
                <Users size={22} color="#C2410C" strokeWidth={2.2} />
              </View>
              <Text style={styles.sectionCardTitle}>Your Children</Text>
            </View>
            {kids.map((kid, idx) => (
              <View key={idx} style={styles.kidCard}>
                <Text style={styles.kidName}>{kid.name}</Text>
                <Text style={styles.kidRelation}>{kid.relation} — {kid.location}</Text>
                {kid.note ? <Text style={styles.kidNote}>{kid.note}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* ─── Emergency Call ──────────────────────────────── */}
        {navigation && (
          <TouchableOpacity
            style={styles.emergencyBtn}
            onPress={() => navigation.navigate('FamilyCorner')}
            accessibilityRole="button"
            accessibilityLabel="Call a family member"
          >
            <Phone size={22} color={colors.white} strokeWidth={2.5} />
            <Text style={styles.emergencyBtnText}>Call Family Member</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

// ─── Section Card Helper ──────────────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  color,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.sectionCard, { backgroundColor: color }]}>
      <View style={styles.sectionCardHeader}>
        <View style={styles.sectionIconCircle}>{icon}</View>
        <Text style={styles.sectionCardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontFamily: fontFamily.text,
    fontSize: 17,
    color: colors.muted,
  },
  content: {
    paddingHorizontal: spacing.screenMargin,
    paddingTop: Platform.OS === 'ios' ? 58 : 38,
    paddingBottom: 32,
  },
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

  // Identity Header
  identityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: 16,
    ...shadows.card,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarEmoji: { fontSize: 36 },
  identityHeaderText: { flex: 1 },
  helloText: {
    fontFamily: fontFamily.text,
    fontSize: 17,
    color: 'rgba(255,255,255,0.75)',
  },
  nameText: {
    fontFamily: fontFamily.display,
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  preferredNameText: {
    fontFamily: fontFamily.text,
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },

  // Comfort card
  comfortCard: {
    backgroundColor: '#F0FDFA',
    borderRadius: 18,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: '#99F6E4',
    alignItems: 'center',
    ...shadows.subtle,
  },
  comfortText: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    fontWeight: '700',
    color: colors.navy,
    textAlign: 'center',
    lineHeight: 28,
  },

  // Listen button
  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.teal,
    borderRadius: borderRadius.button,
    paddingVertical: 18,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  listenBtnActive: {
    backgroundColor: colors.success,
  },
  listenBtnText: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
  },

  // Section cards
  sectionCard: {
    borderRadius: 18,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...shadows.subtle,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sectionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCardTitle: {
    fontFamily: fontFamily.display,
    fontSize: 20,
    fontWeight: '800',
    color: colors.navy,
  },
  cardLabel: {
    fontFamily: fontFamily.display,
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  cardBodyText: {
    fontFamily: fontFamily.text,
    fontSize: 17,
    color: colors.textDark,
    lineHeight: 26,
  },

  // Kids cards
  kidCard: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
  },
  kidName: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 2,
  },
  kidRelation: {
    fontFamily: fontFamily.text,
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  kidNote: {
    fontFamily: fontFamily.text,
    fontSize: 15,
    color: colors.teal,
    fontStyle: 'italic',
    lineHeight: 22,
  },

  // Emergency button
  emergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.danger,
    borderRadius: borderRadius.button,
    paddingVertical: 18,
    marginTop: spacing.sm,
    ...shadows.card,
  },
  emergencyBtnText: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
  },
});
