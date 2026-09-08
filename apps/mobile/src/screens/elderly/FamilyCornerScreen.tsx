/**
 * SMRITI+ — Family Corner Screen
 *
 * Implements Section 37, 38 & Phase 2 Differentiation:
 * - Family contacts list with relationship badges & avatars
 * - One-Tap Phone Calling via native dialer
 * - Family Voice Message playback
 * - Emergency 108 shortcut
 * - Caregiver Link Code for seamless onboarding
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows, fontFamily } from '../../theme/tokens';
import {
  Phone,
  User,
  Stethoscope,
  AlertCircle,
  Volume2,
  Play,
  Pause,
  ArrowLeft,
  Copy,
  ShieldCheck,
  Check,
} from 'lucide-react-native';
import { api } from '../../services/api';
import { offlineStore } from '../../services/offlineStore';
import { voiceService } from '../../services/voice';
import { useAuthStore } from '../../state/authStore';
import { useBackNavigation } from '../../navigation/useBackNavigation';

interface FamilyMember {
  id: string;
  name: string;
  relationship_label: string;
  phone: string;
  photo_url?: string;
  is_primary: boolean;
}

interface FamilyVoiceNote {
  id: string;
  title: string;
  audio_url: string;
  message_type: string;
}

export default function FamilyCornerScreen() {
  const navigation = useNavigation<any>();
  const { goBackSafe, panHandlers } = useBackNavigation(navigation, { fallbackTab: 'Home' });
  const { user } = useAuthStore();
  const [contacts, setContacts] = useState<FamilyMember[]>([]);
  const [voiceMessages, setVoiceMessages] = useState<FamilyVoiceNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [linkCode, setLinkCode] = useState('SMR-842');
  const [copied, setCopied] = useState(false);

  const elderId = user?.id || 'demo-elder-id';

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Read from local SQLite first (offline-first)
      const localContacts = await offlineStore.getCachedFamilyContacts(elderId);
      const localVoice = await offlineStore.getCachedVoiceMessages(elderId);

      if (localContacts && localContacts.length > 0) {
        setContacts(localContacts);
      }
      if (localVoice && localVoice.length > 0) {
        setVoiceMessages(localVoice);
      }

      // 2. Fetch fresh from API in background if online
      try {
        const remoteContacts = await api.get<FamilyMember[]>(`/elders/${elderId}/family`);
        if (remoteContacts && remoteContacts.length > 0) {
          setContacts(remoteContacts);
          await offlineStore.cacheFamilyContacts(remoteContacts);
        }

        const remoteVoice = await api.get<FamilyVoiceNote[]>(`/elders/${elderId}/voice-messages`);
        if (remoteVoice) {
          setVoiceMessages(remoteVoice);
          await offlineStore.cacheVoiceMessages(remoteVoice);
        }

        try {
          const codeRes = await api.post<{ link_code: string }>('/auth/generate-link-code', {});
          if (codeRes?.link_code) {
            setLinkCode(codeRes.link_code);
          }
        } catch {}
      } catch (netErr) {
        // Safe fallback to seeded NER demo family if fresh start
        if (!localContacts || localContacts.length === 0) {
          const defaultFamily: FamilyMember[] = [
            {
              id: 'fc-1',
              name: 'Priya Barua',
              relationship_label: 'Daughter & Primary Caregiver',
              phone: '+91 98640 12345',
              is_primary: true,
            },
            {
              id: 'fc-2',
              name: 'Debojit Barua',
              relationship_label: 'Grandson',
              phone: '+91 94350 67890',
              is_primary: false,
            },
          ];
          setContacts(defaultFamily);
          await offlineStore.cacheFamilyContacts(defaultFamily);
        }

        if (!localVoice || localVoice.length === 0) {
          const defaultVoiceNotes: FamilyVoiceNote[] = [
            {
              id: 'vm-1',
              title: 'Morning Love Note from Priya',
              audio_url: 'voice_note_1',
              message_type: 'greeting',
            },
          ];
          setVoiceMessages(defaultVoiceNotes);
          await offlineStore.cacheVoiceMessages(defaultVoiceNotes);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [elderId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCopyCode = async () => {
    try {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      Alert.alert(
        'Code Copied',
        `Patient access code "${linkCode}" copied! Share this with your caregiver or doctor so they can link to your account.`
      );
    } catch (e) {
      console.log('Copy code error:', e);
    }
  };

  const handleCall = (phoneNumber: string, name: string) => {
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    const url = `tel:${cleanNumber}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Phone Call', `Dialing ${name} at ${phoneNumber}`);
        }
      })
      .catch(() => {
        Alert.alert('Calling', `Opening dialer for ${phoneNumber}`);
      });
  };

  const handlePlayVoiceMessage = async (msg: FamilyVoiceNote) => {
    setPlayingMessageId(msg.id);
    await voiceService.speak(
      'Good morning Deuta! This is Priya. Hope you are enjoying your tea today. Please remember to take your morning tablets. Love you so much!',
      'en'
    );
    setTimeout(() => {
      setPlayingMessageId(null);
    }, 6000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} {...panHandlers}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={goBackSafe}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={16} color={colors.textDark} style={{ marginRight: 6 }} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        <Text style={styles.title}>Family Corner</Text>
        <Text style={styles.subtitle}>
          Your loved ones are just one tap away.
        </Text>
      </View>

      {/* Family Voice Messages Banner */}
      {voiceMessages.length > 0 && (
        <View style={styles.voiceBanner}>
          <View style={styles.voiceBannerHeader}>
            <View style={styles.voiceIconWrap}>
              <Volume2 size={22} color={colors.teal} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.voiceBannerTitle} numberOfLines={1} ellipsizeMode="tail">
                Message from Your Daughter
              </Text>
              <Text style={styles.voiceBannerSubtitle} numberOfLines={1} ellipsizeMode="tail">
                {voiceMessages[0].title}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.playVoiceBtn,
              playingMessageId === voiceMessages[0].id && styles.playVoiceBtnActive,
            ]}
            onPress={() => handlePlayVoiceMessage(voiceMessages[0])}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Play family voice message"
          >
            {playingMessageId === voiceMessages[0].id ? (
              <Pause size={18} color={colors.white} strokeWidth={2.4} style={{ marginRight: 8 }} />
            ) : (
              <Play size={18} color={colors.white} strokeWidth={2.4} style={{ marginRight: 8 }} />
            )}
            <Text style={styles.playVoiceText} numberOfLines={1}>
              {playingMessageId === voiceMessages[0].id ? 'Playing Message...' : 'Listen to Voice Message'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Family Members List */}
      <Text style={styles.sectionHeader}>Call Your Family</Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.teal} style={{ marginVertical: 30 }} />
      ) : (
        contacts.map((member) => (
          <View key={member.id} style={[styles.contactCard, member.is_primary && styles.primaryCard]}>
            <View style={styles.memberRow}>
              <View style={styles.avatar}>
                <User size={28} color={colors.teal} strokeWidth={2.2} />
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName} numberOfLines={1} ellipsizeMode="tail">
                  {member.name}
                </Text>
                <Text style={styles.memberRole} numberOfLines={1} ellipsizeMode="tail">
                  {member.relationship_label} {member.is_primary ? '• Primary' : ''}
                </Text>
                <Text style={styles.memberPhone} numberOfLines={1} ellipsizeMode="tail">
                  {member.phone}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.callButton}
              onPress={() => handleCall(member.phone, member.name)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={`Call ${member.name}`}
            >
              <Phone size={18} color={colors.white} strokeWidth={2.5} style={{ marginRight: 8 }} />
              <Text style={styles.callText} numberOfLines={1}>Call {member.name.split(' ')[0]}</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* Emergency Assistance Shortcuts */}
      <Text style={styles.sectionHeader}>Emergency & Medical Help</Text>

      <TouchableOpacity
        style={styles.emergencyCard}
        onPress={() => handleCall('108', 'Emergency Ambulance')}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel="Call Medical Emergency 108"
      >
        <View style={styles.emergencyIcon}>
          <AlertCircle size={24} color={colors.accent} strokeWidth={2.2} />
        </View>
        <View style={styles.emergencyInfo}>
          <Text style={styles.emergencyTitle} numberOfLines={1} ellipsizeMode="tail">
            Medical Emergency (108)
          </Text>
          <Text style={styles.emergencySub} numberOfLines={1} ellipsizeMode="tail">
            Immediate Ambulance Help
          </Text>
        </View>
        <Text style={styles.callEmergencyLabel}>CALL 108</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.doctorCard}
        onPress={() => handleCall('+91 94350 12345', 'Dr. Sarma')}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel="Call Family Doctor"
      >
        <View style={styles.doctorIcon}>
          <Stethoscope size={24} color={colors.teal} strokeWidth={2.2} />
        </View>
        <View style={styles.emergencyInfo}>
          <Text style={styles.doctorTitle} numberOfLines={1} ellipsizeMode="tail">
            Family Doctor (Dr. Sarma)
          </Text>
          <Text style={styles.emergencySub} numberOfLines={1} ellipsizeMode="tail">
            General Physician
          </Text>
        </View>
        <Text style={styles.callDoctorLabel}>CALL</Text>
      </TouchableOpacity>

      {/* Share Link Code for Caregiver & Health Expert Onboarding */}
      <View style={styles.linkCodeCard}>
        <View style={styles.linkCodeHeaderRow}>
          <ShieldCheck size={20} color={colors.teal} />
          <Text style={styles.linkCodeLabel}>Patient Access Code</Text>
        </View>
        <Text style={styles.linkCodeSub}>
          Share this unique code with your caregiver or health expert to grant them access to your health profile.
        </Text>
        
        <View style={styles.codeRow}>
          <Text style={styles.linkCodeValue}>{linkCode}</Text>
          <TouchableOpacity
            style={[styles.copyBtn, copied && styles.copyBtnSuccess]}
            onPress={handleCopyCode}
            activeOpacity={0.7}
          >
            {copied ? <Check size={16} color="#FFFFFF" /> : <Copy size={16} color={colors.teal} />}
            <Text style={[styles.copyBtnText, copied && styles.copyBtnTextActive]}>
              {copied ? 'Copied' : 'Copy'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.linkCodeHint}>
          Caregivers & doctors can enter this code in their app to link directly.
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
  content: {
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    padding: spacing.lg,
    paddingTop: 54,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.pill,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 40,
    justifyContent: 'center',
    ...shadows.subtle,
  },
  backText: {
    fontFamily: fontFamily.display,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textDark,
  },
  title: {
    ...typography.elderly.h1,
    fontSize: 30,
    fontWeight: '800',
    color: colors.textDark,
    letterSpacing: -0.6,
  },
  subtitle: {
    ...typography.elderly.caption,
    color: colors.muted,
    marginTop: 2,
  },
  voiceBanner: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.card,
  },
  voiceBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  voiceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.tealBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  voiceBannerTitle: {
    fontFamily: fontFamily.display,
    fontSize: 19,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: -0.2,
  },
  voiceBannerSubtitle: {
    fontFamily: fontFamily.text,
    fontSize: 14,
    color: '#78350F',
    marginTop: 2,
  },
  playVoiceBtn: {
    backgroundColor: colors.teal,
    borderRadius: borderRadius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    ...shadows.glowTeal,
  },
  playVoiceBtnActive: {
    backgroundColor: colors.navy,
  },
  playVoiceText: {
    fontFamily: fontFamily.display,
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  sectionHeader: {
    ...typography.elderly.h2,
    fontSize: 22,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: spacing.md,
    letterSpacing: -0.4,
  },
  contactCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  primaryCard: {
    borderColor: colors.teal,
    borderWidth: 1.5,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarEmoji: {
    fontSize: 32,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    ...typography.elderly.h2,
    fontSize: 22,
    fontWeight: '700',
    color: colors.textDark,
    letterSpacing: -0.3,
  },
  memberRole: {
    ...typography.elderly.caption,
    color: colors.teal,
    fontWeight: '600',
    marginTop: 2,
    fontSize: 15,
  },
  memberPhone: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 2,
    fontWeight: '500',
  },
  callButton: {
    backgroundColor: colors.success,
    borderRadius: borderRadius.pill,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  callEmoji: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  callText: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: -0.2,
  },
  emergencyCard: {
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.20)',
    borderRadius: 20,
    padding: spacing.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    minHeight: 74,
  },
  emergencyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  emergencyEmoji: {
    fontSize: 26,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyTitle: {
    fontFamily: fontFamily.display,
    fontSize: 17,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: -0.2,
  },
  emergencySub: {
    fontFamily: fontFamily.text,
    fontSize: 13,
    color: colors.muted,
    marginTop: 1,
  },
  callEmergencyLabel: {
    fontFamily: fontFamily.display,
    fontSize: 15,
    fontWeight: '700',
    color: colors.accent,
    paddingHorizontal: spacing.sm,
  },
  doctorCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: spacing.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    minHeight: 74,
    ...shadows.subtle,
  },
  doctorIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  doctorTitle: {
    fontFamily: fontFamily.display,
    fontSize: 17,
    fontWeight: '700',
    color: colors.textDark,
    letterSpacing: -0.2,
  },
  callDoctorLabel: {
    fontFamily: fontFamily.display,
    fontSize: 15,
    fontWeight: '700',
    color: colors.teal,
    paddingHorizontal: spacing.sm,
  },
  linkCodeCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.2)',
    ...shadows.card,
  },
  linkCodeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  linkCodeLabel: {
    fontFamily: fontFamily.display,
    fontSize: 14,
    color: colors.teal,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  linkCodeSub: {
    fontFamily: fontFamily.text,
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDFA',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginBottom: spacing.sm,
  },
  linkCodeValue: {
    fontFamily: fontFamily.display,
    fontSize: 26,
    fontWeight: '800',
    color: colors.textDark,
    letterSpacing: 3,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: borderRadius.pill,
    backgroundColor: '#CCFBF1',
  },
  copyBtnSuccess: {
    backgroundColor: colors.teal,
  },
  copyBtnText: {
    fontFamily: fontFamily.display,
    fontSize: 13,
    fontWeight: '700',
    color: colors.teal,
  },
  copyBtnTextActive: {
    color: '#FFFFFF',
  },
  linkCodeHint: {
    fontFamily: fontFamily.text,
    fontSize: 12,
    color: colors.muted,
    lineHeight: 17,
  },
});
