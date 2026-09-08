/**
 * SMRITI+ — Welcome & Language Selection Screen
 *
 * Implements Sections 5 & 101:
 * - Elder-friendly language setup displaying native scripts
 * - Clear role selection
 * - Non-diagnostic disclaimer footer
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors, typography, spacing, fontFamily, borderRadius, shadows } from '../../theme/tokens';
import { PrimaryButton } from '../../components/UIComponents';
import { setLanguage, SupportedLanguage } from '../../i18n';
import { voiceIntelligence } from '../../services/voiceIntelligence';
import { Brain } from 'lucide-react-native';

interface WelcomeScreenProps {
  onProceed: (lang: string, role: string) => void;
}

export default function WelcomeScreen({ onProceed }: WelcomeScreenProps) {
  const [selectedLang, setSelectedLang] = useState<string>('en');
  const [selectedRole, setSelectedRole] = useState<string>('elderly');

  const languages = [
    { code: 'en', name: 'English', native: 'English', greeting: 'Welcome' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी', greeting: 'नमस्ते' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు', greeting: 'నమస్కారం' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்', greeting: 'வணக்கம்' },
    { code: 'as', name: 'Assamese', native: 'অসমীয়া', greeting: 'স্বাগতম' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা', greeting: 'নমস্কার' },
    { code: 'bodo', name: 'Bodo', native: 'बर’', greeting: 'बरायबाय' },
  ];

  const roles = [
    {
      id: 'elderly',
      title: 'For Myself',
      desc: 'Simple screens, large text & voice guidance',
      emoji: '👴',
    },
    {
      id: 'caregiver',
      title: 'Family Caregiver',
      desc: 'Reminders, adherence tracking & alerts',
      emoji: '👩‍⚕️',
    },
    {
      id: 'health_worker',
      title: 'Community Worker',
      desc: 'Village cohort monitoring & reports',
      emoji: '📋',
    },
  ];

  const handleSelectLanguage = (code: string) => {
    setSelectedLang(code);
    if (['en', 'as', 'bodo', 'te', 'hi', 'ta', 'bn'].includes(code)) {
      setLanguage(code as SupportedLanguage);
    }
    voiceIntelligence.updateContext({ primaryLanguage: code });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Brand Header */}
      <View style={styles.brandHeader}>
        <View style={styles.logoBadge}>
          <Brain size={36} color={colors.primary} strokeWidth={2.2} />
        </View>
        <Text style={styles.brandTitle}>SMRITI+</Text>
        <Text style={styles.brandTagline}>Remember. Engage. Connect.</Text>
      </View>

      {/* Language Selection */}
      <Text style={styles.sectionTitle}>How would you like SMRITI+ to speak with you?</Text>
      <Text style={styles.sectionSub}>Choose your preferred language:</Text>

      <View style={styles.langGrid}>
        {languages.map((l) => (
          <TouchableOpacity
            key={l.code}
            style={[
              styles.langCard,
              selectedLang === l.code && styles.langCardActive,
            ]}
            onPress={() => handleSelectLanguage(l.code)}
            accessibilityRole="button"
            accessibilityLabel={`Select ${l.name}`}
          >
            <Text style={[styles.langNative, selectedLang === l.code && styles.langNativeActive]}>
              {l.native}
            </Text>
            <Text style={styles.langName}>{l.name}</Text>
            <Text style={styles.langGreeting}>"{l.greeting}"</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Role Selection */}
      <Text style={styles.sectionTitle}>Who is using this app?</Text>
      <View style={styles.rolesList}>
        {roles.map((r) => (
          <TouchableOpacity
            key={r.id}
            style={[
              styles.roleCard,
              selectedRole === r.id && styles.roleCardActive,
            ]}
            onPress={() => setSelectedRole(r.id)}
            accessibilityRole="button"
            accessibilityLabel={`Choose role ${r.title}`}
          >
            <View style={styles.roleEmojiBox}>
              <Text style={styles.roleEmoji}>{r.emoji}</Text>
            </View>
            <View style={styles.roleDetails}>
              <Text style={styles.roleTitle}>{r.title}</Text>
              <Text style={styles.roleDesc}>{r.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Continue Button */}
      <View style={styles.actionContainer}>
        <PrimaryButton
          title="Get Started"
          onPress={() => onProceed(selectedLang, selectedRole)}
        />
      </View>

      {/* Regulatory Disclaimer */}
      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerText}>
          SMRITI+ supports cognitive engagement and daily assistance; it does not diagnose or treat dementia.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mintBg,
  },
  content: {
    width: '100%',
    maxWidth: 540,
    alignSelf: 'center',
    padding: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.xxl,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 113, 227, 0.15)',
  },
  logoEmoji: {
    fontSize: 56,
    marginBottom: spacing.xs,
  },
  brandTitle: {
    fontFamily: fontFamily.display,
    fontSize: 34,
    fontWeight: '800',
    color: colors.navy,
    letterSpacing: -0.8,
  },
  brandTagline: {
    fontFamily: fontFamily.display,
    fontSize: 16,
    color: colors.teal,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  sectionTitle: {
    ...typography.elderly.h2,
    color: colors.navy,
    marginBottom: 4,
    marginTop: spacing.md,
    letterSpacing: -0.4,
  },
  sectionSub: {
    fontSize: 15,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  langCard: {
    width: '48%',
    backgroundColor: colors.glassCard,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    minHeight: 92,
    justifyContent: 'center',
    ...shadows.card,
  },
  langCardActive: {
    borderColor: colors.teal,
    borderWidth: 2,
    backgroundColor: '#F0FDFA',
    ...shadows.glowTeal,
  },
  langNative: {
    fontFamily: fontFamily.display,
    fontSize: 19,
    fontWeight: '700',
    color: colors.navy,
  },
  langNativeActive: {
    color: colors.teal,
  },
  langName: {
    fontFamily: fontFamily.text,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
    fontWeight: '500',
  },
  langGreeting: {
    fontFamily: fontFamily.text,
    fontSize: 12,
    color: colors.teal,
    fontStyle: 'italic',
    marginTop: 4,
  },
  rolesList: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  roleCard: {
    backgroundColor: colors.glassCard,
    borderRadius: borderRadius.xl,
    padding: spacing.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    minHeight: 84,
    ...shadows.card,
  },
  roleCardActive: {
    borderColor: colors.teal,
    borderWidth: 2,
    backgroundColor: '#F0FDFA',
    ...shadows.glowTeal,
  },
  roleEmojiBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.mintBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.teal + '20',
  },
  roleEmoji: {
    fontSize: 28,
  },
  roleDetails: {
    flex: 1,
  },
  roleTitle: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    fontWeight: '800',
    color: colors.navy,
    letterSpacing: -0.2,
  },
  roleDesc: {
    fontFamily: fontFamily.text,
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  actionContainer: {
    marginBottom: spacing.xl,
  },
  disclaimerBox: {
    padding: spacing.md,
    backgroundColor: 'rgba(19, 42, 82, 0.04)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  disclaimerText: {
    fontFamily: fontFamily.text,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
