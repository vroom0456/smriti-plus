/**
 * SMRITI+ — Authentication Screen (Sign In & Sign Up)
 *
 * Minimalist Apple HIG aesthetic optimized for mobile dimensions:
 * - Crisp neutral canvas (#F8F9FB)
 * - Zero cartoon emojis — authentic Lucide vector icons
 * - Non-overlapping iOS-style segmented controls
 * - Compact card paddings (16px) and ergonomic touch targets (46-48px)
 * - 1-tap quick role switchers (Elderly, Caregiver, Health Worker) without bulky cards
 * - Proper Patient Code login with direct Elder and Caregiver role selection
 * - Minimal, smooth vertical scrolling without overflowing elements
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {
  Brain,
  UserCheck,
  Users,
  Stethoscope,
  ChevronRight,
  User,
  Globe,
  ChevronDown,
  Check,
  X,
  KeyRound,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows, fontFamily } from '../../theme/tokens';
import { PrimaryButton } from '../../components/UIComponents';
import { useAuthStore, UserRole } from '../../state/authStore';

const ALLOWED_LANGUAGES = [
  { id: 'en', native: 'English', en: 'English', group: 'Primary Languages' },
  { id: 'te', native: 'తెలుగు', en: 'Telugu', group: 'Primary Languages' },
  { id: 'hi', native: 'हिन्दी', en: 'Hindi', group: 'Primary Languages' },
  { id: 'as', native: 'অসমীয়া', en: 'Assamese', group: 'North Eastern (MDoNER)' },
  { id: 'bodo', native: 'बर’', en: 'Bodo', group: 'North Eastern (MDoNER)' },
  { id: 'mni', native: 'মৈতৈলোন্', en: 'Manipuri / Meitei', group: 'North Eastern (MDoNER)' },
  { id: 'kha', native: 'Ka Ktien Khasi', en: 'Khasi', group: 'North Eastern (MDoNER)' },
  { id: 'grt', native: 'A·chik', en: 'Garo', group: 'North Eastern (MDoNER)' },
  { id: 'lus', native: 'Mizo ṭawng', en: 'Mizo', group: 'North Eastern (MDoNER)' },
];

export default function LoginScreen() {
  const [authAction, setAuthAction] = useState<'signin' | 'signup'>('signin');
  const [loginMode, setLoginMode] = useState<'email' | 'phone' | 'code'>('email');

  // Sign In state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [accessCode, setAccessCode] = useState('SMR-842');
  const [codeRole, setCodeRole] = useState<'elderly' | 'caregiver'>('elderly');

  // Sign Up state
  const [signupName, setSignupName] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('elderly');
  const [signupIdentifier, setSignupIdentifier] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupLanguage, setSignupLanguage] = useState<string>('en');
  const [signupPatientCode, setSignupPatientCode] = useState('');
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const { login, loginWithOtp, loginWithCode, signup, isLoading, error, clearError } = useAuthStore();

  const handleSignIn = async () => {
    try {
      if (loginMode === 'code') {
        const targetCode = accessCode.trim().toUpperCase() || 'SMR-842';
        await loginWithCode(targetCode, codeRole);
      } else if (loginMode === 'email') {
        const targetEmail = email.trim() || 'elder.demo@smriti.local';
        const targetPass = password.trim() || '1234';
        await login(targetEmail, targetPass);
      } else {
        if (!phone.trim() || !otp.trim()) {
          Alert.alert('Missing Fields', 'Please enter your phone number and OTP.');
          return;
        }
        await loginWithOtp(phone.trim(), otp.trim());
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network')) {
        await login(email.trim() || 'elder.demo@smriti.local', 'demo123');
      } else {
        Alert.alert('Login Failed', msg || 'Please check your credentials.');
      }
    }
  };

  const handleSignUp = async () => {
    if (!signupName.trim() || !signupIdentifier.trim() || !signupPassword.trim()) {
      Alert.alert('Missing Fields', 'Please fill in your name, contact, and password/PIN.');
      return;
    }

    try {
      const isEmail = signupIdentifier.includes('@');
      await signup({
        name: signupName.trim(),
        role: signupRole,
        email: isEmail ? signupIdentifier.trim() : undefined,
        phone: !isEmail ? signupIdentifier.trim() : undefined,
        password: signupPassword.trim(),
        language: signupLanguage,
        patient_link_code: signupPatientCode.trim() ? signupPatientCode.trim() : undefined,
      });
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network')) {
        await signup({
          name: signupName.trim(),
          role: signupRole,
          email: signupIdentifier.includes('@') ? signupIdentifier.trim() : undefined,
          phone: !signupIdentifier.includes('@') ? signupIdentifier.trim() : undefined,
          password: signupPassword.trim(),
          language: signupLanguage,
        });
      } else {
        Alert.alert('Sign Up Failed', msg || 'Could not register account.');
      }
    }
  };

  // Instant 1-tap demo logins
  const handleQuickDemoLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLoginMode('email');
    clearError();
    try {
      await login(demoEmail, demoPass);
    } catch (err: any) {
      console.warn('Demo login handled:', err);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Compact Apple-style Brand Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Brain size={24} color={colors.teal} strokeWidth={2.4} />
          </View>
          <Text style={styles.logoTitle}>SMRITI+</Text>
          <Text style={styles.tagline}>Cognitive Care & Support</Text>
        </View>

        {/* Primary Segmented Control (Sign In vs Create Account) */}
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentTab,
              authAction === 'signin' && styles.segmentTabActive,
            ]}
            onPress={() => {
              setAuthAction('signin');
              clearError();
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Switch to Sign In"
          >
            <Text
              style={[
                styles.segmentText,
                authAction === 'signin' && styles.segmentTextActive,
              ]}
            >
              Sign In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentTab,
              authAction === 'signup' && styles.segmentTabActive,
            ]}
            onPress={() => {
              setAuthAction('signup');
              clearError();
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Switch to Create Account"
          >
            <Text
              style={[
                styles.segmentText,
                authAction === 'signup' && styles.segmentTextActive,
              ]}
            >
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── SIGN IN FORM ── */}
        {authAction === 'signin' ? (
          <View style={styles.formCard}>
            <Text style={styles.formHeading}>Welcome Back</Text>
            <Text style={styles.formSubheading}>
              Select your sign-in method to continue.
            </Text>

            {/* Sub-Segmented Control (Email / Phone / Patient Code) */}
            <View style={styles.subSegmentedControl}>
              <TouchableOpacity
                style={[
                  styles.subSegmentTab,
                  loginMode === 'email' && styles.subSegmentTabActive,
                ]}
                onPress={() => {
                  setLoginMode('email');
                  clearError();
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.subSegmentText,
                    loginMode === 'email' && styles.subSegmentTextActive,
                  ]}
                  numberOfLines={1}
                >
                  Email / PIN
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.subSegmentTab,
                  loginMode === 'phone' && styles.subSegmentTabActive,
                ]}
                onPress={() => {
                  setLoginMode('phone');
                  clearError();
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.subSegmentText,
                    loginMode === 'phone' && styles.subSegmentTextActive,
                  ]}
                  numberOfLines={1}
                >
                  Mobile OTP
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.subSegmentTab,
                  loginMode === 'code' && styles.subSegmentTabActive,
                ]}
                onPress={() => {
                  setLoginMode('code');
                  clearError();
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.subSegmentText,
                    loginMode === 'code' && styles.subSegmentTextActive,
                  ]}
                  numberOfLines={1}
                >
                  Patient Code
                </Text>
              </TouchableOpacity>
            </View>

            {/* Mode 1: Patient Code Login */}
            {loginMode === 'code' ? (
              <View style={styles.codeLoginBox}>
                <View style={styles.codeLoginHeaderRow}>
                  <KeyRound size={16} color={colors.teal} />
                  <Text style={styles.codeLoginTitle}>Direct Patient Code Access</Text>
                </View>

                {/* Role Switcher for Code Login */}
                <Text style={styles.codeRoleLabel}>I am signing in as:</Text>
                <View style={styles.codeRoleSelector}>
                  <TouchableOpacity
                    style={[
                      styles.codeRoleTab,
                      codeRole === 'elderly' && styles.codeRoleTabActive,
                    ]}
                    onPress={() => setCodeRole('elderly')}
                    activeOpacity={0.8}
                  >
                    <User size={14} color={codeRole === 'elderly' ? colors.teal : colors.muted} />
                    <Text
                      style={[
                        styles.codeRoleText,
                        codeRole === 'elderly' && styles.codeRoleTextActive,
                      ]}
                    >
                      Patient (Elder)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.codeRoleTab,
                      codeRole === 'caregiver' && styles.codeRoleTabActive,
                    ]}
                    onPress={() => setCodeRole('caregiver')}
                    activeOpacity={0.8}
                  >
                    <Users size={14} color={codeRole === 'caregiver' ? colors.teal : colors.muted} />
                    <Text
                      style={[
                        styles.codeRoleText,
                        codeRole === 'caregiver' && styles.codeRoleTextActive,
                      ]}
                    >
                      Caregiver / Family
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.codeHelperText}>
                  {codeRole === 'elderly'
                    ? 'Enter your 6-character patient card code for instant, password-free access.'
                    : 'Enter the patient’s code to monitor their routine, reminders, and activities.'}
                </Text>

                <TextInput
                  style={[styles.input, styles.codeInput]}
                  value={accessCode}
                  onChangeText={(t) => {
                    setAccessCode(t.toUpperCase());
                    clearError();
                  }}
                  placeholder="e.g. SMR-842"
                  placeholderTextColor={colors.mutedLight}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>
            ) : loginMode === 'email' ? (
              /* Mode 2: Email / PIN Login */
              <>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="e.g. elder.demo@smriti.local"
                  placeholderTextColor={colors.mutedLight}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Text style={styles.label}>Password or 4-Digit PIN</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password or PIN"
                  placeholderTextColor={colors.mutedLight}
                  secureTextEntry
                />
              </>
            ) : (
              /* Mode 3: Mobile OTP Login */
              <>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="e.g. 9876543210"
                  placeholderTextColor={colors.mutedLight}
                  keyboardType="phone-pad"
                />

                <Text style={styles.label}>One-Time Password (OTP)</Text>
                <TextInput
                  style={styles.input}
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="Enter 6-digit OTP (demo: 123456)"
                  placeholderTextColor={colors.mutedLight}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </>
            )}

            {error && <Text style={styles.errorText}>{error}</Text>}

            <PrimaryButton
              title={loginMode === 'code' ? 'Connect via Patient Code' : 'Sign In'}
              onPress={handleSignIn}
              loading={isLoading}
              style={styles.actionButton}
            />

            {/* ── 1-TAP COMPACT DEMO ACCESS BAR ── */}
            <View style={styles.demoSection}>
              <View style={styles.demoHeaderRow}>
                <Text style={styles.demoTitle}>Instant Demo Profiles</Text>
                <Text style={styles.demoTag}>1-Tap Access</Text>
              </View>

              <View style={styles.demoGrid}>
                {/* Elder Demo */}
                <TouchableOpacity
                  style={styles.demoChip}
                  onPress={() => handleQuickDemoLogin('elder.demo@smriti.local', '1234')}
                  activeOpacity={0.75}
                >
                  <View style={[styles.demoChipIconWrap, { backgroundColor: colors.tealBg }]}>
                    <UserCheck size={16} color={colors.teal} strokeWidth={2.4} />
                  </View>
                  <View style={styles.demoChipTextWrap}>
                    <Text style={styles.demoChipRole}>Elderly</Text>
                    <Text style={styles.demoChipSub}>Amit Borah</Text>
                  </View>
                </TouchableOpacity>

                {/* Caregiver Demo */}
                <TouchableOpacity
                  style={styles.demoChip}
                  onPress={() => handleQuickDemoLogin('caregiver.demo@smriti.local', 'caregiver123')}
                  activeOpacity={0.75}
                >
                  <View style={[styles.demoChipIconWrap, { backgroundColor: '#DCFCE7' }]}>
                    <Users size={16} color={colors.success} strokeWidth={2.4} />
                  </View>
                  <View style={styles.demoChipTextWrap}>
                    <Text style={styles.demoChipRole}>Caregiver</Text>
                    <Text style={styles.demoChipSub}>Priya Borah</Text>
                  </View>
                </TouchableOpacity>

                {/* Health Worker Demo */}
                <TouchableOpacity
                  style={styles.demoChip}
                  onPress={() => handleQuickDemoLogin('worker.demo@smriti.local', 'worker123')}
                  activeOpacity={0.75}
                >
                  <View style={[styles.demoChipIconWrap, { backgroundColor: '#F3E8FF' }]}>
                    <Stethoscope size={16} color="#9333EA" strokeWidth={2.4} />
                  </View>
                  <View style={styles.demoChipTextWrap}>
                    <Text style={styles.demoChipRole}>Health Worker</Text>
                    <Text style={styles.demoChipSub}>Dr. Anjali</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          /* ── SIGN UP / REGISTRATION FORM ── */
          <View style={styles.formCard}>
            <Text style={styles.formHeading}>Create Account</Text>
            <Text style={styles.formSubheading}>
              Join SMRITI+ for respectful, adaptive cognitive care.
            </Text>

            {/* Compact Role Selector */}
            <Text style={styles.label}>Select Your Role</Text>
            <View style={styles.roleSelector}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  signupRole === 'elderly' && styles.roleButtonActive,
                ]}
                onPress={() => setSignupRole('elderly')}
                activeOpacity={0.75}
              >
                <User size={18} color={signupRole === 'elderly' ? colors.teal : colors.muted} strokeWidth={2.2} />
                <Text
                  style={[
                    styles.roleLabel,
                    signupRole === 'elderly' && styles.roleLabelActive,
                  ]}
                >
                  Elderly
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  signupRole === 'caregiver' && styles.roleButtonActive,
                ]}
                onPress={() => setSignupRole('caregiver')}
                activeOpacity={0.75}
              >
                <Users size={18} color={signupRole === 'caregiver' ? colors.teal : colors.muted} strokeWidth={2.2} />
                <Text
                  style={[
                    styles.roleLabel,
                    signupRole === 'caregiver' && styles.roleLabelActive,
                  ]}
                >
                  Caregiver
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  signupRole === 'health_worker' && styles.roleButtonActive,
                ]}
                onPress={() => setSignupRole('health_worker')}
                activeOpacity={0.75}
              >
                <Stethoscope size={18} color={signupRole === 'health_worker' ? colors.teal : colors.muted} strokeWidth={2.2} />
                <Text
                  style={[
                    styles.roleLabel,
                    signupRole === 'health_worker' && styles.roleLabelActive,
                  ]}
                >
                  Health Worker
                </Text>
              </TouchableOpacity>
            </View>

            {/* Full Name */}
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={signupName}
              onChangeText={setSignupName}
              placeholder="e.g. Bhaben Barua"
              placeholderTextColor={colors.mutedLight}
            />

            {/* Email or Phone */}
            <Text style={styles.label}>Email or Mobile Number</Text>
            <TextInput
              style={styles.input}
              value={signupIdentifier}
              onChangeText={setSignupIdentifier}
              placeholder="e.g. bhaben@example.com or 9876543210"
              placeholderTextColor={colors.mutedLight}
              autoCapitalize="none"
            />

            {/* Password or PIN */}
            <Text style={styles.label}>
              {signupRole === 'elderly' ? '4-Digit PIN (Easy to remember)' : 'Password'}
            </Text>
            <TextInput
              style={styles.input}
              value={signupPassword}
              onChangeText={setSignupPassword}
              placeholder={signupRole === 'elderly' ? 'e.g. 1234' : 'At least 6 characters'}
              placeholderTextColor={colors.mutedLight}
              secureTextEntry
              keyboardType={signupRole === 'elderly' ? 'number-pad' : 'default'}
            />

            {/* Optional Patient Pairing Code for Caregiver / Health Worker */}
            {signupRole !== 'elderly' && (
              <View style={styles.signupCodeCard}>
                <View style={styles.signupCodeHeaderRow}>
                  <ShieldCheck size={14} color={colors.teal} />
                  <Text style={styles.signupCodeTitle}>Patient Pairing Code (Optional)</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.codeInput, { height: 42, minHeight: 42, fontSize: 16 }]}
                  value={signupPatientCode}
                  onChangeText={(t) => setSignupPatientCode(t.toUpperCase())}
                  placeholder="e.g. SMR-842"
                  placeholderTextColor={colors.mutedLight}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>
            )}

            {/* Preferred Language Trigger */}
            <Text style={styles.label}>Preferred Language</Text>
            {(() => {
              const currentLang = ALLOWED_LANGUAGES.find((l) => l.id === signupLanguage) || ALLOWED_LANGUAGES[0];
              return (
                <TouchableOpacity
                  style={styles.langPickerTrigger}
                  onPress={() => setLanguageModalVisible(true)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel="Choose preferred language"
                >
                  <View style={styles.langPickerLeft}>
                    <Globe size={16} color={colors.teal} strokeWidth={2.2} />
                    <Text style={styles.langPickerNative}>{currentLang.native} ({currentLang.en})</Text>
                  </View>
                  <ChevronDown size={16} color={colors.muted} strokeWidth={2.2} />
                </TouchableOpacity>
              );
            })()}

            {error && <Text style={styles.errorText}>{error}</Text>}

            <PrimaryButton
              title="Create Account & Start"
              onPress={handleSignUp}
              loading={isLoading}
              style={styles.actionButton}
            />
          </View>
        )}

        {/* Clinical Disclaimer */}
        <Text style={styles.disclaimer}>
          SMRITI+ provides cognitive engagement and routine assistance; it does not diagnose or treat medical conditions.
        </Text>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={languageModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, shadows.card]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Choose Language</Text>
                <Text style={styles.modalSubtitle}>Regional & North Eastern support</Text>
              </View>
              <TouchableOpacity
                onPress={() => setLanguageModalVisible(false)}
                style={styles.modalCloseButton}
                accessibilityRole="button"
                accessibilityLabel="Close language selector"
              >
                <X size={18} color={colors.muted} strokeWidth={2.4} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {['Primary Languages', 'North Eastern (MDoNER)'].map((group) => (
                <View key={group} style={styles.modalGroup}>
                  <Text style={styles.modalGroupTitle}>{group}</Text>
                  <View style={styles.modalGroupCard}>
                    {ALLOWED_LANGUAGES.filter((l) => l.group === group).map((lang, idx, arr) => {
                      const isSelected = signupLanguage === lang.id;
                      const isLast = idx === arr.length - 1;
                      return (
                        <TouchableOpacity
                          key={lang.id}
                          style={[styles.modalRow, !isLast && styles.modalRowDivider]}
                          onPress={() => {
                            setSignupLanguage(lang.id);
                            setLanguageModalVisible(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.modalRowInfo}>
                            <Text style={[styles.modalRowNative, isSelected && styles.modalRowNativeActive]}>
                              {lang.native}
                            </Text>
                            <Text style={styles.modalRowEn}>{lang.en}</Text>
                          </View>
                          {isSelected && (
                            <Check size={18} color={colors.teal} strokeWidth={2.5} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: 24,
    paddingBottom: 36,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 14,
  },
  logoBadge: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textDark,
    letterSpacing: -0.4,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.teal,
    marginTop: 2,
    letterSpacing: -0.2,
  },

  // Primary Segmented Control (Sign In / Create Account)
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  segmentTabActive: {
    backgroundColor: colors.surface,
    ...shadows.subtle,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  segmentTextActive: {
    color: colors.textDark,
    fontWeight: '700',
  },

  // Sub-segmented Control (Email / Mobile / Code)
  subSegmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 2,
    marginBottom: 12,
  },
  subSegmentTab: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  subSegmentTabActive: {
    backgroundColor: colors.surface,
    ...shadows.subtle,
  },
  subSegmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  subSegmentTextActive: {
    color: colors.teal,
    fontWeight: '700',
  },

  // Form Card
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  formHeading: {
    fontFamily: fontFamily.display,
    fontSize: 19,
    fontWeight: '800',
    color: colors.textDark,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  formSubheading: {
    fontFamily: fontFamily.text,
    fontSize: 13,
    color: colors.muted,
    marginBottom: 12,
    lineHeight: 18,
  },
  label: {
    fontFamily: fontFamily.display,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 4,
    marginTop: 10,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 15,
    fontFamily: fontFamily.text,
    color: colors.textDark,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorText: {
    fontFamily: fontFamily.text,
    fontSize: 12,
    color: colors.error,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  actionButton: {
    marginTop: 14,
    minHeight: 48,
  },

  // Code Login Specific
  codeLoginBox: {
    backgroundColor: '#F0FDFA',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginBottom: 4,
  },
  codeLoginHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  codeLoginTitle: {
    fontFamily: fontFamily.display,
    fontSize: 14,
    fontWeight: '700',
    color: colors.teal,
  },
  codeRoleLabel: {
    fontFamily: fontFamily.display,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 4,
  },
  codeRoleSelector: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  codeRoleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.surface,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  codeRoleTabActive: {
    backgroundColor: colors.tealBg,
    borderColor: colors.teal,
  },
  codeRoleText: {
    fontFamily: fontFamily.display,
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  codeRoleTextActive: {
    color: colors.teal,
    fontWeight: '700',
  },
  codeHelperText: {
    fontFamily: fontFamily.text,
    fontSize: 12,
    color: colors.muted,
    lineHeight: 16,
    marginBottom: 8,
  },
  codeInput: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2.5,
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#99F6E4',
    borderWidth: 1.5,
  },

  // 1-Tap Demo Access Section
  demoSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  demoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  demoTitle: {
    fontFamily: fontFamily.display,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textDark,
  },
  demoTag: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.teal,
    backgroundColor: colors.tealBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  demoGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  demoChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  demoChipIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  demoChipTextWrap: {
    flex: 1,
  },
  demoChipRole: {
    fontFamily: fontFamily.display,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textDark,
  },
  demoChipSub: {
    fontFamily: fontFamily.text,
    fontSize: 10,
    color: colors.muted,
  },

  // Role Selector in Sign Up
  roleSelector: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  roleButton: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 52,
    gap: 3,
  },
  roleButtonActive: {
    backgroundColor: colors.tealBg,
    borderColor: colors.teal,
    borderWidth: 1.5,
  },
  roleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
  },
  roleLabelActive: {
    color: colors.teal,
    fontWeight: '700',
  },

  // Signup code card
  signupCodeCard: {
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginTop: 8,
  },
  signupCodeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  signupCodeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.teal,
  },

  // Language Picker Trigger
  langPickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
  langPickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langPickerNative: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDark,
  },

  // Language Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '75%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textDark,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.muted,
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    marginTop: 4,
  },
  modalGroup: {
    marginBottom: 10,
  },
  modalGroupTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  modalGroupCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  modalRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  modalRowInfo: {
    flex: 1,
  },
  modalRowNative: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },
  modalRowNativeActive: {
    color: colors.teal,
    fontWeight: '700',
  },
  modalRowEn: {
    fontSize: 11,
    color: colors.muted,
  },

  disclaimer: {
    fontSize: 11,
    color: colors.mutedLight,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 16,
    maxWidth: 360,
    alignSelf: 'center',
  },
});
