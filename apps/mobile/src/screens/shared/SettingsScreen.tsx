/**
 * SMRITI+ — Settings Screen (Elderly Friendly & Organized)
 *
 * Clean, high-contrast, low-clutter configuration:
 * 1. Voice & Language (Single language card + clean modal picker, speech speed pills)
 * 2. Voice Guidance & Privacy toggles
 * 3. Display & Accessibility (Text size pills, high contrast)
 * 4. Profile & Sign Out
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  fontFamily,
} from '../../theme/tokens';
import { useAuthStore } from '../../state/authStore';
import { useSettingsStore, TextSize } from '../../state/settingsStore';
import { useTranslation, SupportedLanguage } from '../../i18n';
import { useAppTheme } from '../../theme/useAppTheme';
import { languageRegistry } from '../../services/languageRegistry';
import { voiceIntelligence } from '../../services/voiceIntelligence';
import { voicePackManager, VoicePackInfo } from '../../services/voicePackManager';
import {
  Globe,
  ArrowLeft,
  Check,
  Volume2,
  Eye,
  User,
  LogOut,
  ChevronRight,
  X,
  Sparkles,
  DownloadCloud,
  Download,
  Trash2,
  CheckCircle,
} from 'lucide-react-native';
import { useBackNavigation } from '../../navigation/useBackNavigation';

interface LanguageOption {
  code: string;
  native: string;
  name: string;
  region: string;
}

const ALL_LANGUAGES: LanguageOption[] = [
  { code: 'en', native: 'English', name: 'English (Indian)', region: 'National' },
  { code: 'te', native: 'తెలుగు', name: 'Telugu', region: 'National' },
  { code: 'as', native: 'অসমীয়া', name: 'Assamese', region: 'North Eastern (MDoNER)' },
  { code: 'bodo', native: 'बर’', name: 'Bodo', region: 'North Eastern (MDoNER)' },
  { code: 'mni', native: 'মৈতৈলোন্', name: 'Manipuri / Meitei', region: 'North Eastern (MDoNER)' },
  { code: 'kha', native: 'Ka Ktien Khasi', name: 'Khasi', region: 'North Eastern (MDoNER)' },
  { code: 'grt', native: 'A·chik', name: 'Garo', region: 'North Eastern (MDoNER)' },
  { code: 'lus', native: 'Mizo ṭawng', name: 'Mizo', region: 'North Eastern (MDoNER)' },
];

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const { goBackSafe, panHandlers } = useBackNavigation(navigation, { fallbackTab: 'Home' });
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();

  const {
    textSize,
    fontScale,
    highContrast,
    language: activeLang,
    voiceSpeed,
    voiceGuidance,
    privateVoiceMode,
    setTextSize,
    setHighContrast,
    setAppLanguage,
    setVoiceSpeed,
    setVoiceGuidance,
    setPrivateVoiceMode,
  } = useSettingsStore();

  const [showLangModal, setShowLangModal] = useState<boolean>(false);
  const [showVoicePacksModal, setShowVoicePacksModal] = useState<boolean>(false);
  const [voicePacks, setVoicePacks] = useState<VoicePackInfo[]>(voicePackManager.getVoicePacks());
  const [isDownloadingAll, setIsDownloadingAll] = useState<boolean>(false);

  useEffect(() => {
    const unsub = voicePackManager.subscribe(() => {
      setVoicePacks(voicePackManager.getVoicePacks());
    });
    return unsub;
  }, []);

  const handleDownloadPack = async (code: string) => {
    await voicePackManager.downloadPack(code);
  };

  const handleDeletePack = async (code: string) => {
    await voicePackManager.deletePack(code);
  };

  const handleDownloadAll = async () => {
    setIsDownloadingAll(true);
    await voicePackManager.downloadAllPacks();
    setIsDownloadingAll(false);
  };

  const currentLangObj =
    ALL_LANGUAGES.find((l) => l.code === activeLang) || ALL_LANGUAGES[0];

  const handleSelectLanguage = async (code: string) => {
    await setAppLanguage(code as SupportedLanguage);
    setShowLangModal(false);
  };

  const handleSpeedChange = async (speed: number) => {
    await setVoiceSpeed(speed);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} {...panHandlers}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={goBackSafe}
          accessibilityRole="button"
          accessibilityLabel="Go back to Home"
          activeOpacity={0.75}
        >
          <ArrowLeft size={18} color={colors.textDark} strokeWidth={2.4} style={{ marginRight: 6 }} />
          <Text style={styles.backButtonText}>Home</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Personalize your voice, display, and comfort</Text>

        {/* ── 1. VOICE & LANGUAGE SECTION ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Volume2 size={20} color={colors.primary} strokeWidth={2.2} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Voice & Language</Text>
          </View>

          {/* Clean Single Language Card */}
          <TouchableOpacity
            style={[styles.card, shadows.subtle]}
            onPress={() => setShowLangModal(true)}
            activeOpacity={0.78}
            accessibilityRole="button"
            accessibilityLabel={`Change language, currently ${currentLangObj.name}`}
          >
            <View style={styles.cardIconWrap}>
              <Globe size={22} color={colors.primary} strokeWidth={2.2} />
            </View>
            <View style={styles.cardMain}>
              <Text style={styles.cardLabel}>Language</Text>
              <Text style={styles.cardValue}>
                {currentLangObj.native} ({currentLangObj.name})
              </Text>
            </View>
            <View style={styles.changePill}>
              <Text style={styles.changePillText}>Change</Text>
              <ChevronRight size={16} color={colors.primary} strokeWidth={2.2} />
            </View>
          </TouchableOpacity>

          {/* Offline Regional Voice Packs Card */}
          <TouchableOpacity
            style={[styles.card, shadows.subtle]}
            onPress={() => setShowVoicePacksModal(true)}
            activeOpacity={0.78}
            accessibilityRole="button"
            accessibilityLabel="Manage offline regional voice packs"
          >
            <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(52, 199, 89, 0.12)' }]}>
              <DownloadCloud size={22} color={colors.greenCalm} strokeWidth={2.2} />
            </View>
            <View style={styles.cardMain}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.cardLabel}>Offline Voice Packs</Text>
                <View style={styles.badgeNER}>
                  <Text style={styles.badgeNERText}>MDoNER Ready</Text>
                </View>
              </View>
              <Text style={styles.cardSubText}>
                {voicePackManager.getInstalledCount().installed} of {voicePackManager.getInstalledCount().total} Regional Packs Installed ({voicePackManager.getTotalInstalledSizeMB().toFixed(1)} MB)
              </Text>
            </View>
            <View style={styles.changePill}>
              <Text style={styles.changePillText}>Download</Text>
              <ChevronRight size={16} color={colors.primary} strokeWidth={2.2} />
            </View>
          </TouchableOpacity>

          {/* Speaking Pace Pills */}
          <View style={[styles.card, { flexDirection: 'column', alignItems: 'stretch' }, shadows.subtle]}>
            <Text style={styles.cardLabel}>Speaking Pace</Text>
            <Text style={styles.cardSubText}>Adjust how fast SMRITI speaks to you</Text>
            <View style={styles.pillsRow}>
              {[
                { rate: 0.75, label: 'Slow (0.75x)' },
                { rate: 0.85, label: 'Comfortable (0.85x)' },
                { rate: 1.0, label: 'Standard (1.0x)' },
              ].map((item) => {
                const isActive = voiceSpeed === item.rate;
                return (
                  <TouchableOpacity
                    key={item.rate}
                    style={[styles.pillBtn, isActive && styles.pillBtnActive]}
                    onPress={() => handleSpeedChange(item.rate)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pillBtnText, isActive && styles.pillBtnTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Voice Guidance Toggle */}
          <View style={[styles.toggleRow, shadows.subtle]}>
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text style={styles.toggleTitle}>Voice Guidance</Text>
              <Text style={styles.toggleSub}>
                Speak reminders and screen directions aloud
              </Text>
            </View>
            <Switch
              value={voiceGuidance}
              onValueChange={setVoiceGuidance}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Private Voice Mode Toggle */}
          <View style={[styles.toggleRow, shadows.subtle]}>
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text style={styles.toggleTitle}>Private Mode</Text>
              <Text style={styles.toggleSub}>
                Mask medicine details aloud when in public
              </Text>
            </View>
            <Switch
              value={privateVoiceMode}
              onValueChange={(val) => {
                setPrivateVoiceMode(val);
                voiceIntelligence.updateContext({ privateVoiceMode: val });
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* ── 2. DISPLAY & ACCESSIBILITY SECTION ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Eye size={20} color={colors.greenCalm} strokeWidth={2.2} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Display & Readability</Text>
          </View>

          {/* Text Size Pills */}
          <View style={[styles.card, { flexDirection: 'column', alignItems: 'stretch' }, shadows.subtle]}>
            <Text style={styles.cardLabel}>Text Size</Text>
            <Text style={styles.cardSubText}>Choose comfortable readability</Text>
            <View style={styles.pillsRow}>
              {[
                { id: 'normal', label: 'Normal' },
                { id: 'large', label: 'Large (A+)' },
                { id: 'xlarge', label: 'Extra Large (A++)' },
              ].map((item) => {
                const isActive = textSize === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.pillBtn, isActive && styles.pillBtnActive]}
                    onPress={() => setTextSize(item.id as any)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.pillBtnText, isActive && styles.pillBtnTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Live Text Preview Box */}
            <View
              style={{
                marginTop: 14,
                padding: 14,
                borderRadius: borderRadius.md,
                backgroundColor: highContrast ? '#000000' : '#F1F5F9',
                borderWidth: highContrast ? 2 : 1,
                borderColor: highContrast ? '#000000' : colors.borderLight,
              }}
            >
              <Text
                style={{
                  fontFamily: fontFamily.display,
                  fontSize: Math.round(18 * (fontScale || 1.0)),
                  fontWeight: '700',
                  color: highContrast ? '#FFFFFF' : colors.textDark,
                  marginBottom: 4,
                }}
              >
                Aa Preview: SMRITI+ Daily Care
              </Text>
              <Text
                style={{
                  fontFamily: fontFamily.text,
                  fontSize: Math.round(14 * (fontScale || 1.0)),
                  color: highContrast ? '#E2E8F0' : colors.textSecondary,
                  lineHeight: Math.round(20 * (fontScale || 1.0)),
                }}
              >
                Text size is {textSize.toUpperCase()} ({Math.round(fontScale * 100)}%) · High Contrast: {highContrast ? 'ON' : 'OFF'}
              </Text>
            </View>
          </View>

          {/* High Contrast Toggle */}
          <View style={[styles.toggleRow, shadows.subtle]}>
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text style={styles.toggleTitle}>High Contrast</Text>
              <Text style={styles.toggleSub}>
                Darker text and bolder borders for enhanced visual clarity
              </Text>
            </View>
            <Switch
              value={highContrast}
              onValueChange={setHighContrast}
              trackColor={{ false: colors.border, true: colors.greenCalm }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* ── 3. ACCOUNT & CAREGIVER SECTION ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <User size={20} color={colors.textDark} strokeWidth={2.2} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Account & Caregiver</Text>
          </View>

          <View style={[styles.card, shadows.subtle]}>
            <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(52, 199, 89, 0.12)' }]}>
              <User size={22} color={colors.greenCalm} strokeWidth={2.2} />
            </View>
            <View style={styles.cardMain}>
              <Text style={styles.cardLabel}>{user?.name || 'Elderly User'}</Text>
              <Text style={styles.cardSubText}>
                {user?.email || 'Caregiver connected: Priya Borah'}
              </Text>
            </View>
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Sign out of account"
          >
            <LogOut size={18} color={colors.danger} strokeWidth={2.2} style={{ marginRight: 8 }} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── CLEAN LANGUAGE SELECTION MODAL ── */}
      <Modal
        visible={showLangModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLangModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Globe size={22} color={colors.primary} strokeWidth={2.2} style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Choose Language</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowLangModal(false)}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <X size={20} color={colors.textDark} strokeWidth={2.4} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
              {ALL_LANGUAGES.map((lang, index) => {
                const isSelected = activeLang === lang.code;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    style={[styles.langItemRow, isSelected && styles.langItemRowActive]}
                    onPress={() => handleSelectLanguage(lang.code)}
                    activeOpacity={0.75}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.langItemNative, isSelected && styles.langItemTextActive]}>
                        {lang.native}
                      </Text>
                      <Text style={styles.langItemSub}>
                        {lang.name} • {lang.region}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={styles.langCheckCircle}>
                        <Check size={16} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── OFFLINE REGIONAL VOICE PACKS MODAL ── */}
      <Modal
        visible={showVoicePacksModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVoicePacksModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '92%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <DownloadCloud size={22} color={colors.greenCalm} strokeWidth={2.2} style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Offline Voice Packs</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowVoicePacksModal(false)}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <X size={20} color={colors.textDark} strokeWidth={2.4} />
              </TouchableOpacity>
            </View>

            <View style={styles.bannerInfo}>
              <Text style={styles.bannerInfoTitle}>🎙️ On-Device Regional Speech AI</Text>
              <Text style={styles.bannerInfoText}>
                Download local neural speech models for Assamese, Bodo, Manipuri, Khasi, Garo, Mizo, Telugu, and Hindi so voice assistant functions 100% offline.
              </Text>
            </View>

            {/* Download All Button */}
            <TouchableOpacity
              style={[
                styles.downloadAllBtn,
                isDownloadingAll && styles.downloadAllBtnDisabled,
              ]}
              onPress={handleDownloadAll}
              disabled={isDownloadingAll}
              activeOpacity={0.8}
            >
              {isDownloadingAll ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.downloadAllBtnText}>Downloading Regional Packs...</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Download size={18} color="#FFFFFF" strokeWidth={2.4} style={{ marginRight: 8 }} />
                  <Text style={styles.downloadAllBtnText}>Download All Regional Packs</Text>
                </View>
              )}
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380, marginTop: 12 }}>
              {voicePacks.map((pack) => {
                const isInstalled = pack.status === 'installed';
                const isDownloading = pack.status === 'downloading';

                return (
                  <View key={pack.code} style={[styles.packRow, isInstalled && styles.packRowInstalled]}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Text style={styles.packNativeName}>{pack.nativeName}</Text>
                        <View
                          style={[
                            styles.regionTag,
                            pack.region.includes('MDoNER') ? styles.regionTagNER : styles.regionTagNational,
                          ]}
                        >
                          <Text
                            style={[
                              styles.regionTagText,
                              pack.region.includes('MDoNER') ? styles.regionTagTextNER : styles.regionTagTextNational,
                            ]}
                          >
                            {pack.region.includes('MDoNER') ? 'NER MDoNER' : 'National'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.packDetails}>
                        {pack.name} • {pack.sizeMB} MB • v{pack.version}
                      </Text>
                      {isDownloading && (
                        <View style={styles.progressBarWrap}>
                          <View style={[styles.progressBarFill, { width: `${pack.progress}%` }]} />
                        </View>
                      )}
                    </View>

                    <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                      {isInstalled ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={styles.installedPill}>
                            <CheckCircle size={14} color={colors.greenCalm} strokeWidth={2.4} style={{ marginRight: 4 }} />
                            <Text style={styles.installedPillText}>Ready</Text>
                          </View>
                          <TouchableOpacity
                            style={styles.deletePackBtn}
                            onPress={() => handleDeletePack(pack.code)}
                            activeOpacity={0.7}
                            accessibilityLabel={`Delete ${pack.name} pack`}
                          >
                            <Trash2 size={16} color={colors.muted} strokeWidth={2} />
                          </TouchableOpacity>
                        </View>
                      ) : isDownloading ? (
                        <View style={styles.downloadingPill}>
                          <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 4 }} />
                          <Text style={styles.downloadingPillText}>{pack.progress}%</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.downloadPackBtn}
                          onPress={() => handleDownloadPack(pack.code)}
                          activeOpacity={0.8}
                          accessibilityLabel={`Download ${pack.name} voice pack`}
                        >
                          <Download size={14} color="#FFFFFF" strokeWidth={2.4} style={{ marginRight: 4 }} />
                          <Text style={styles.downloadPackBtnText}>Download</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: spacing.screenMargin,
    paddingTop: Platform.OS === 'ios' ? 52 : 32,
    paddingBottom: 110,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: borderRadius.pill,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle,
  },
  backButtonText: {
    fontFamily: fontFamily.display,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },
  title: {
    fontFamily: fontFamily.display,
    fontSize: 30,
    fontWeight: '700',
    color: colors.textDark,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: fontFamily.text,
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.xl,
  },

  // ── Sections ──
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm + 2,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    letterSpacing: -0.2,
  },

  // ── Cards ──
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    padding: spacing.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm + 2,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 113, 227, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardMain: {
    flex: 1,
  },
  cardLabel: {
    fontFamily: fontFamily.display,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
  },
  cardValue: {
    fontFamily: fontFamily.text,
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  cardSubText: {
    fontFamily: fontFamily.text,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 113, 227, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.pill,
  },
  changePillText: {
    fontFamily: fontFamily.display,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 2,
  },

  // ── Pills Row ──
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.sm + 2,
  },
  pillBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  pillBtnActive: {
    backgroundColor: 'rgba(0, 113, 227, 0.10)',
    borderColor: colors.primary,
  },
  pillBtnText: {
    fontFamily: fontFamily.display,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  pillBtnTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  // ── Toggles ──
  toggleRow: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.card,
    padding: spacing.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm + 2,
  },
  toggleTitle: {
    fontFamily: fontFamily.display,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
  },
  toggleSub: {
    fontFamily: fontFamily.text,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },

  // ── Sign Out Button ──
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
    borderRadius: borderRadius.card,
    paddingVertical: 14,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.20)',
    minHeight: 52,
  },
  signOutText: {
    fontFamily: fontFamily.display,
    fontSize: 16,
    fontWeight: '700',
    color: colors.danger,
  },

  // ── Modal Styles ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 44 : 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontFamily: fontFamily.display,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textDark,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: colors.surfaceSecondary,
  },
  langItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: borderRadius.sm,
    marginBottom: 6,
    backgroundColor: colors.surfaceSecondary,
  },
  langItemRowActive: {
    backgroundColor: 'rgba(0, 113, 227, 0.10)',
  },
  langItemNative: {
    fontFamily: fontFamily.display,
    fontSize: 17,
    fontWeight: '700',
    color: colors.textDark,
  },
  langItemTextActive: {
    color: colors.primary,
  },
  langItemSub: {
    fontFamily: fontFamily.text,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  langCheckCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Voice Pack Modal Styles ──
  badgeNER: {
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.pill,
    marginLeft: 8,
  },
  badgeNERText: {
    fontFamily: fontFamily.display,
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  bannerInfo: {
    backgroundColor: 'rgba(52, 199, 89, 0.08)',
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.20)',
  },
  bannerInfoTitle: {
    fontFamily: fontFamily.display,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 4,
  },
  bannerInfoText: {
    fontFamily: fontFamily.text,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  downloadAllBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    ...shadows.subtle,
  },
  downloadAllBtnDisabled: {
    opacity: 0.7,
  },
  downloadAllBtnText: {
    fontFamily: fontFamily.display,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  packRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceSecondary,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  packRowInstalled: {
    borderColor: 'rgba(52, 199, 89, 0.25)',
    backgroundColor: 'rgba(52, 199, 89, 0.04)',
  },
  packNativeName: {
    fontFamily: fontFamily.display,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
    marginRight: 6,
  },
  regionTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.pill,
  },
  regionTagNER: {
    backgroundColor: 'rgba(255, 149, 0, 0.12)',
  },
  regionTagNational: {
    backgroundColor: 'rgba(0, 113, 227, 0.10)',
  },
  regionTagText: {
    fontFamily: fontFamily.display,
    fontSize: 10,
    fontWeight: '700',
  },
  regionTagTextNER: {
    color: '#D97706',
  },
  regionTagTextNational: {
    color: colors.primary,
  },
  packDetails: {
    fontFamily: fontFamily.text,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  progressBarWrap: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  installedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.pill,
    marginRight: 6,
  },
  installedPillText: {
    fontFamily: fontFamily.display,
    fontSize: 12,
    fontWeight: '700',
    color: colors.greenCalm,
  },
  deletePackBtn: {
    padding: 6,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  downloadingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 113, 227, 0.10)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.pill,
  },
  downloadingPillText: {
    fontFamily: fontFamily.display,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  downloadPackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: borderRadius.pill,
    ...shadows.subtle,
  },
  downloadPackBtnText: {
    fontFamily: fontFamily.display,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
