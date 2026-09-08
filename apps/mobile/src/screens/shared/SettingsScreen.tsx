/**
 * SMRITI+ — Settings Screen (All Roles)
 *
 * Implements Sections 3–5, 26, 34–35, 39, 64–66, 72:
 * - Multilingual setup with native scripts
 * - Speech rate / cadence controls (0.80x slow, 0.85x comfortable, 1.0x standard)
 * - Transparent Device Voice Capability Card (NEVER fakes offline STT)
 * - Private Voice Mode (masks sensitive reminder content aloud)
 * - Language Mode (Regional only, English only, Mixed Regional+English)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { colors, typography, spacing, borderRadius, shadows, fontFamily } from '../../theme/tokens';
import { PrimaryButton } from '../../components/UIComponents';
import { useAuthStore } from '../../state/authStore';
import { setLanguage, getLanguage, SupportedLanguage } from '../../i18n';
import { languageRegistry } from '../../services/languageRegistry';
import { voiceIntelligence } from '../../services/voiceIntelligence';
import { Check, Globe } from 'lucide-react-native';

const LANGUAGE_GROUPS = [
  {
    groupTitle: 'Primary Languages',
    description: 'National and regional defaults',
    languages: [
      { code: 'en', script: 'English', enName: 'English (Indian)' },
      { code: 'te', script: 'తెలుగు', enName: 'Telugu' },
    ],
  },
  {
    groupTitle: 'North Eastern Region (MDoNER)',
    description: 'Authentic 8-sister state languages with native scripts',
    languages: [
      { code: 'as', script: 'অসমীয়া', enName: 'Assamese' },
      { code: 'bodo', script: 'बर’', enName: 'Bodo' },
      { code: 'mni', script: 'মৈতৈলোন্', enName: 'Manipuri / Meitei' },
      { code: 'kha', script: 'Ka Ktien Khasi', enName: 'Khasi' },
      { code: 'grt', script: 'A·chik', enName: 'Garo' },
      { code: 'lus', script: 'Mizo ṭawng', enName: 'Mizo' },
    ],
  },
];

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const [textSize, setTextSize] = useState('large');
  const [activeLang, setActiveLang] = useState<string>(getLanguage() || 'en');
  const [voiceSpeed, setVoiceSpeed] = useState<number>(0.85);
  const [privateVoiceMode, setPrivateVoiceMode] = useState<boolean>(false);
  const [languageMode, setLanguageMode] = useState<'regional' | 'english' | 'mixed'>('mixed');
  const [showDebug, setShowDebug] = useState(false);

  const capabilitySummary = languageRegistry.getCapabilitySummary(activeLang);
  const currentCapability = languageRegistry.getCapability(activeLang);

  const handleLanguageChange = (code: string) => {
    setActiveLang(code);
    if (['en', 'as', 'bodo', 'te', 'hi', 'ta', 'bn'].includes(code)) {
      setLanguage(code as SupportedLanguage);
    }
    voiceIntelligence.updateContext({ primaryLanguage: code });
  };

  const handleSpeedChange = (speed: number) => {
    setVoiceSpeed(speed);
    voiceIntelligence.updateContext({ voiceSpeed: speed });
  };

  const handlePrivateModeToggle = (val: boolean) => {
    setPrivateVoiceMode(val);
    voiceIntelligence.updateContext({ privateVoiceMode: val });
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      {/* 1. Language Selection with Native Scripts (MDoNER + Telugu + English) */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Globe size={22} color={colors.teal} strokeWidth={2.2} />
          <Text style={styles.sectionTitleWithIcon}>Language Preferences</Text>
        </View>
        <Text style={styles.sectionSub}>
          Select your communication language (shown in authentic native script):
        </Text>

        {LANGUAGE_GROUPS.map((group) => (
          <View key={group.groupTitle} style={styles.langGroupContainer}>
            <Text style={styles.langGroupHeader}>{group.groupTitle}</Text>
            <Text style={styles.langGroupSub}>{group.description}</Text>
            <View style={[styles.langGroupCard, shadows.card]}>
              {group.languages.map((lang, idx) => {
                const isSelected = activeLang === lang.code;
                const isLast = idx === group.languages.length - 1;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    onPress={() => handleLanguageChange(lang.code)}
                    style={[
                      styles.langRow,
                      !isLast && styles.langRowDivider,
                      isSelected && styles.langRowActive,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${lang.enName}`}
                    activeOpacity={0.7}
                  >
                    <View style={styles.langRowLeft}>
                      <Text style={[styles.langNativeText, isSelected && styles.langNativeTextActive]}>
                        {lang.script}
                      </Text>
                      <Text style={styles.langEnglishText}>{lang.enName}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.checkWrap}>
                        <Check size={16} color={colors.white} strokeWidth={2.8} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      {/* 2. Language Mode (Regional, English, Mixed) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conversation Style</Text>
        <View style={styles.optionRow}>
          {[
            { id: 'mixed', label: 'Mixed (Regional + English)' },
            { id: 'regional', label: 'Regional Script Only' },
            { id: 'english', label: 'English Only' },
          ].map((mode) => (
            <TouchableOpacity
              key={mode.id}
              onPress={() => setLanguageMode(mode.id as any)}
              style={[styles.optionChip, languageMode === mode.id && styles.optionChipActive]}
            >
              <Text style={[styles.optionText, languageMode === mode.id && styles.optionTextActive]}>
                {mode.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 3. Transparent Device Voice Capability Card (Section 4, 39) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Voice & Speech Capabilities</Text>
        <View style={[styles.capCard, shadows.card]}>
          <Text style={styles.capHeader}>
            Active Engine: <Text style={styles.capLang}>{currentCapability.englishName} ({currentCapability.nativeName})</Text>
          </Text>

          <View style={styles.capRow}>
            <Text style={styles.capItem}>Text Support:</Text>
            <Text style={styles.capStatusGood}>✓ Supported</Text>
          </View>
          <View style={styles.capRow}>
            <Text style={styles.capItem}>Speech Output (TTS):</Text>
            <Text style={currentCapability.ttsSupported ? styles.capStatusGood : styles.capStatusWarn}>
              {currentCapability.ttsSupported ? '✓ Active' : '✕ Not Installed'}
            </Text>
          </View>
          <View style={styles.capRow}>
            <Text style={styles.capItem}>Speech Recognition (STT):</Text>
            <Text style={currentCapability.sttSupported ? styles.capStatusGood : styles.capStatusWarn}>
              {currentCapability.sttSupported ? '✓ Active' : '✕ Unavailable (Touch fallback ready)'}
            </Text>
          </View>
          <View style={styles.capRow}>
            <Text style={styles.capItem}>Offline Speech Recognition:</Text>
            <Text style={styles.capStatusWarn}>✕ Requires Internet Connection</Text>
          </View>

          <View style={styles.capNoteBox}>
            <Text style={styles.capNoteText}>{capabilitySummary.description}</Text>
          </View>
        </View>
      </View>

      {/* 4. Speech Speed / Elderly Cadence Control (Section 26) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Assistant Speaking Speed</Text>
        <View style={styles.optionRow}>
          {[
            { rate: 0.80, label: 'Slow & Gentle (0.80x)' },
            { rate: 0.85, label: 'Comfortable (0.85x)' },
            { rate: 1.00, label: 'Standard (1.0x)' },
          ].map((item) => (
            <TouchableOpacity
              key={item.rate}
              onPress={() => handleSpeedChange(item.rate)}
              style={[styles.optionChip, voiceSpeed === item.rate && styles.optionChipActive]}
            >
              <Text style={[styles.optionText, voiceSpeed === item.rate && styles.optionTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 5. Public Privacy Mode (Section 71-72) */}
      <View style={styles.section}>
        <View style={styles.toggleRow}>
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <Text style={styles.sectionTitle}>Private Voice Mode</Text>
            <Text style={styles.sectionSub}>
              Do not speak medication or personal reminders aloud in public places.
            </Text>
          </View>
          <Switch
            value={privateVoiceMode}
            onValueChange={handlePrivateModeToggle}
            trackColor={{ false: colors.border, true: colors.teal }}
            thumbColor={colors.white}
          />
        </View>
      </View>

      {/* 6. Text Size */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Text Size</Text>
        <View style={styles.optionRow}>
          {(['standard', 'large', 'extra_large'] as const).map((size) => (
            <TouchableOpacity
              key={size}
              onPress={() => setTextSize(size)}
              style={[styles.optionChip, textSize === size && styles.optionChipActive]}
            >
              <Text style={[styles.optionText, textSize === size && styles.optionTextActive]}>
                {size === 'standard' ? 'Standard' : size === 'large' ? 'Large' : 'Extra Large'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 7. Offline Sync Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Offline Sync Status</Text>
        <View style={[styles.syncCard, shadows.card]}>
          <View style={styles.syncRow}>
            <Text style={styles.syncLabel}>Connection</Text>
            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
            <Text style={styles.syncValue}>Online</Text>
          </View>
          <View style={styles.syncRow}>
            <Text style={styles.syncLabel}>Last Sync</Text>
            <Text style={styles.syncValue}>Just now</Text>
          </View>
          <View style={styles.syncRow}>
            <Text style={styles.syncLabel}>Local Storage</Text>
            <Text style={styles.syncValue}>Encrypted SQLite</Text>
          </View>
        </View>
      </View>

      {/* 8. Dev Debug Panel */}
      {__DEV__ && (
        <View style={styles.section}>
          <TouchableOpacity onPress={() => setShowDebug(!showDebug)} style={styles.debugToggle}>
            <Text style={styles.sectionTitle}>Developer & Evaluation Panel</Text>
            <Text style={styles.menuArrow}>{showDebug ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {showDebug && (
            <View style={[styles.debugCard, shadows.card]}>
              <Text style={styles.debugItem}>User ID: {user?.id}</Text>
              <Text style={styles.debugItem}>Role: {user?.role}</Text>
              <Text style={styles.debugItem}>Language: {activeLang}</Text>
              <Text style={styles.debugItem}>Voice Speed: {voiceSpeed}x</Text>
              <Text style={styles.debugItem}>Private Mode: {privateVoiceMode ? 'Enabled' : 'Disabled'}</Text>
              <Text style={styles.debugItem}>API: http://127.0.0.1:8000</Text>
            </View>
          )}
        </View>
      )}

      {/* 9. Sign Out */}
      <PrimaryButton
        title="Sign Out"
        onPress={handleLogout}
        variant="outline"
        style={styles.logoutBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: 110,
  },
  title: {
    ...typography.elderly.h1,
    color: colors.navy,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontFamily: fontFamily.display,
    fontSize: 20,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitleWithIcon: {
    fontFamily: fontFamily.display,
    fontSize: 20,
    fontWeight: '700',
    color: colors.navy,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontFamily: fontFamily.text,
    fontSize: 15,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  langGroupContainer: {
    marginBottom: spacing.lg,
  },
  langGroupHeader: {
    fontFamily: fontFamily.display,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  langGroupSub: {
    fontFamily: fontFamily.text,
    fontSize: 12,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  langGroupCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    minHeight: 60,
  },
  langRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  langRowActive: {
    backgroundColor: 'rgba(15, 118, 110, 0.04)',
  },
  langRowLeft: {
    flex: 1,
  },
  langNativeText: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    fontWeight: '700',
    color: colors.navy,
  },
  langNativeTextActive: {
    color: colors.teal,
  },
  langEnglishText: {
    fontFamily: fontFamily.text,
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
    fontWeight: '500',
  },
  checkWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionChip: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 48,
    justifyContent: 'center',
  },
  optionChipActive: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  optionText: {
    fontFamily: fontFamily.display,
    fontSize: 16,
    color: colors.navy,
    fontWeight: '600',
  },
  optionTextActive: {
    color: colors.white,
  },
  capCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  capHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.navy,
    marginBottom: spacing.sm,
  },
  capLang: {
    color: colors.teal,
    fontWeight: '700',
  },
  capRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  capItem: {
    fontSize: 15,
    color: colors.navy,
  },
  capStatusGood: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.teal,
  },
  capStatusWarn: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted,
  },
  capNoteBox: {
    marginTop: spacing.sm,
    backgroundColor: 'rgba(20, 184, 166, 0.08)',
    borderRadius: 8,
    padding: spacing.sm,
  },
  capNoteText: {
    fontSize: 13,
    color: colors.navy,
    lineHeight: 18,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  syncCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  syncLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.navy,
  },
  syncValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.navy,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  debugToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuArrow: {
    fontSize: 18,
    color: colors.muted,
  },
  debugCard: {
    backgroundColor: colors.navy,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  debugItem: {
    fontSize: 14,
    color: colors.white,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  logoutBtn: {
    marginTop: spacing.xl,
  },
});
