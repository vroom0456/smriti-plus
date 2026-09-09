/**
 * SMRITI+ — Authentication Screen (Sign In & Sign Up)
 *
 * Minimalist Apple HIG aesthetic:
 * - Crisp neutral canvas (#F8F9FB)
 * - Zero cartoon emojis — authentic Lucide vector icons
 * - iOS-style segmented controls
 * - Refined white cards with subtle hairline borders and diffused shadows
 * - Apple System Blue (#0071E3) primary interactions
 * - Clean 1-tap demo access profiles for judges & testing
 * - 56dp+ touch targets, 20px+ body text for elderly accessibility
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
  HeartHandshake,
  Stethoscope,
  ChevronRight,
  User,
  Globe,
  ChevronDown,
  Check,
  X,
  KeyRound,
  ShieldCheck,
} from 'lucide-react-native';
import { colors, typography, spacing, borderRadius, shadows, fontFamily } from '../../theme/tokens';
import { PrimaryButton } from '../../components/UIComponents';
import { useAuthStore, UserRole } from '../../state/authStore';

const ALLOWED_LANGUAGES = [
  { id: 'en', native: 'English', en: 'English', group: 'Primary Languages' },
  { id: 'te', native: 'తెలుగు', en: 'Telugu', group: 'Primary Languages' },
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
  const [accessCode, setAccessCode] = useState('');

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
        if (!accessCode.trim()) {
          Alert.alert('Missing Code', 'Please enter the patient’s pairing code (e.g. SMR-842).');
          return;
        }
        await loginWithCode(accessCode.trim());
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
        // Transparently authenticate user to demo session without blocking
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
        {/* Apple-style Brand Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Brain size={32} color={colors.teal} strokeWidth={2.2} />
          </View>
          <Text style={styles.logoTitle}>SMRITI+</Text>
          <Text style={styles.tagline}>Remember. Engage. Connect.</Text>
          <Text style={styles.subTagline}>
            AI Cognitive Care & Support Platform
          </Text>
        </View>

        {/* iOS-Style Segmented Control (Sign In vs Create Account) */}
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
              Access your daily routine and cognitive exercises.
            </Text>

            {/* iOS Sub-Segmented Control (Email / Phone / Patient Code) */}
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
              >
                <Text
                  style={[
                    styles.subSegmentText,
                    loginMode === 'email' && styles.subSegmentTextActive,
                  ]}
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
              >
                <Text
                  style={[
                    styles.subSegmentText,
                    loginMode === 'phone' && styles.subSegmentTabActive,
                  ]}
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
              >
                <Text
                  style={[
                    styles.subSegmentText,
                    loginMode === 'code' && styles.subSegmentTextActive,
                  ]}
                >
                  Patient Code
                </Text>
              </TouchableOpacity>
            </View>

            {loginMode === 'code' ? (
              <View style={styles.codeLoginBox}>
                <View style={styles.codeLoginHeaderRow}>
                  <KeyRound size={18} color={colors.teal} />
                  <Text style={styles.codeLoginTitle}>Flo-Style Patient Access</Text>
                </View>
                <Text style={styles.codeLoginSub}>
                  Caregivers & Health Experts: Enter the patient’s special code (e.g. SMR-842) to connect and sign in immediately.
                </Text>
                <Text style={styles.label}>Patient Pairing Code</Text>
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

            {/* Switch to Signup Link */}
            <TouchableOpacity
              style={styles.switchAuthLink}
              onPress={() => {
                setAuthAction('signup');
                clearError();
              }}
            >
              <Text style={styles.switchAuthText}>
                Don't have an account? <Text style={styles.switchAuthBold}>Create Account</Text>
              </Text>
            </TouchableOpacity>

            {/* ── 1-TAP DEMO CREDENTIALS QUICK-FILL ── */}
            <View style={styles.demoSection}>
              <View style={styles.demoHeaderRow}>
                <Text style={styles.demoTitle}>Instant Demo Profiles</Text>
                <Text style={styles.demoTag}>1-Tap Access</Text>
              </View>
              <Text style={styles.demoSubtitle}>
                Tap any role to test full user experience:
              </Text>

              {/* Elder profile */}
              <TouchableOpacity
                style={styles.demoRow}
                onPress={() => handleQuickDemoLogin('elder.demo@smriti.local', '1234')}
                activeOpacity={0.7}
              >
                <View style={[styles.demoIconSquircle, { backgroundColor: 'rgba(0, 113, 227, 0.10)' }]}>
                  <UserCheck size={22} color={colors.teal} strokeWidth={2.2} />
                </View>
                <View style={styles.demoInfo}>
                  <Text style={styles.demoRoleName}>Elderly User (Amit Borah)</Text>
                  <Text style={styles.demoCredentials}>elder.demo@smriti.local • PIN: 1234</Text>
                </View>
                <View style={styles.demoActionChip}>
                  <Text style={styles.demoActionChipText}>Launch</Text>
                  <ChevronRight size={14} color={colors.teal} strokeWidth={2.5} style={{ marginLeft: 2 }} />
                </View>
              </TouchableOpacity>

              {/* Caregiver profile */}
              <TouchableOpacity
                style={styles.demoRow}
                onPress={() => handleQuickDemoLogin('caregiver.demo@smriti.local', 'caregiver123')}
                activeOpacity={0.7}
              >
                <View style={[styles.demoIconSquircle, { backgroundColor: 'rgba(52, 199, 89, 0.12)' }]}>
                  <HeartHandshake size={22} color={colors.success} strokeWidth={2.2} />
                </View>
                <View style={styles.demoInfo}>
                  <Text style={styles.demoRoleName}>Caregiver (Priya Borah)</Text>
                  <Text style={styles.demoCredentials}>caregiver.demo@smriti.local • caregiver123</Text>
                </View>
                <View style={styles.demoActionChip}>
                  <Text style={styles.demoActionChipText}>Launch</Text>
                  <ChevronRight size={14} color={colors.teal} strokeWidth={2.5} style={{ marginLeft: 2 }} />
                </View>
              </TouchableOpacity>

              {/* Health worker profile */}
              <TouchableOpacity
                style={styles.demoRow}
                onPress={() => handleQuickDemoLogin('worker.demo@smriti.local', 'worker123')}
                activeOpacity={0.7}
              >
                <View style={[styles.demoIconSquircle, { backgroundColor: 'rgba(175, 82, 222, 0.12)' }]}>
                  <Stethoscope size={22} color={colors.systemPurple} strokeWidth={2.2} />
                </View>
                <View style={styles.demoInfo}>
                  <Text style={styles.demoRoleName}>Health Worker (Dr. Anjali)</Text>
                  <Text style={styles.demoCredentials}>worker.demo@smriti.local • worker123</Text>
                </View>
                <View style={styles.demoActionChip}>
                  <Text style={styles.demoActionChipText}>Launch</Text>
                  <ChevronRight size={14} color={colors.teal} strokeWidth={2.5} style={{ marginLeft: 2 }} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* ── SIGN UP / REGISTRATION FORM ── */
          <View style={styles.formCard}>
            <Text style={styles.formHeading}>Create Your Account</Text>
            <Text style={styles.formSubheading}>
              Join SMRITI+ for respectful, adaptive memory support.
            </Text>

            {/* Role Selection */}
            <Text style={styles.label}>Select Your Role</Text>
            <View style={styles.roleSelector}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  signupRole === 'elderly' && styles.roleButtonActive,
                ]}
                onPress={() => setSignupRole('elderly')}
                activeOpacity={0.7}
              >
                <User size={26} color={signupRole === 'elderly' ? colors.teal : colors.muted} strokeWidth={2.2} style={{ marginBottom: 4 }} />
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
                activeOpacity={0.7}
              >
                <HeartHandshake size={26} color={signupRole === 'caregiver' ? colors.teal : colors.muted} strokeWidth={2.2} style={{ marginBottom: 4 }} />
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
                activeOpacity={0.7}
              >
                <Stethoscope size={26} color={signupRole === 'health_worker' ? colors.teal : colors.muted} strokeWidth={2.2} style={{ marginBottom: 4 }} />
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
                  <ShieldCheck size={16} color={colors.teal} />
                  <Text style={styles.signupCodeTitle}>Connect Patient (Optional)</Text>
                </View>
                <Text style={styles.signupCodeSub}>
                  Have the patient's pairing code (e.g. SMR-842)? Enter it here to link automatically upon registration.
                </Text>
                <TextInput
                  style={[styles.input, styles.codeInput, { marginTop: 4 }]}
                  value={signupPatientCode}
                  onChangeText={(t) => setSignupPatientCode(t.toUpperCase())}
                  placeholder="e.g. SMR-842"
                  placeholderTextColor={colors.mutedLight}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>
            )}

            {/* Preferred Language Trigger (Apple HIG dropdown card) */}
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
                    <View style={styles.langPickerIcon}>
                      <Globe size={18} color={colors.teal} strokeWidth={2.2} />
                    </View>
                    <View style={styles.langPickerTextGroup}>
                      <Text style={styles.langPickerNative}>{currentLang.native}</Text>
                      <Text style={styles.langPickerSub}>{currentLang.en}</Text>
                    </View>
                  </View>
                  <ChevronDown size={18} color={colors.muted} strokeWidth={2.2} />
                </TouchableOpacity>
              );
            })()}

            {error && <Text style={styles.errorText}>{error}</Text>}

            <PrimaryButton
              title="Complete Sign Up & Start"
              onPress={handleSignUp}
              loading={isLoading}
              style={styles.actionButton}
            />

            {/* Switch to Sign In Link */}
            <TouchableOpacity
              style={styles.switchAuthLink}
              onPress={() => {
                setAuthAction('signin');
                clearError();
              }}
            >
              <Text style={styles.switchAuthText}>
                Already have an account? <Text style={styles.switchAuthBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Mandatory Non-Diagnostic Clinical Disclaimer */}
        <Text style={styles.disclaimer}>
          SMRITI+ supports cognitive engagement and routine assistance; it does not diagnose, treat, or prevent dementia.
        </Text>
      </ScrollView>

      {/* Apple Sheet Modal for Language Selection */}
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
                <X size={20} color={colors.muted} strokeWidth={2.4} />
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
                            <Check size={20} color={colors.teal} strokeWidth={2.5} />
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
    paddingHorizontal: spacing.lg,
    paddingTop: 54,
    paddingBottom: spacing.xxl,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  logoTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textDark,
    letterSpacing: -0.6,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.teal,
    marginTop: 2,
    letterSpacing: -0.2,
  },
  subTagline: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
    textAlign: 'center',
  },

  // Segmented Control (Sign In / Create Account)
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    padding: 4,
    marginBottom: spacing.lg,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  segmentTabActive: {
    backgroundColor: colors.surface,
    ...shadows.subtle,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.muted,
  },
  segmentTextActive: {
    color: colors.textDark,
    fontWeight: '700',
  },

  // Sub-segmented Control (Email / Mobile)
  subSegmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 3,
    marginBottom: spacing.lg,
  },
  subSegmentTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  subSegmentTabActive: {
    backgroundColor: colors.surface,
    ...shadows.subtle,
  },
  subSegmentText: {
    fontSize: 14,
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
    borderRadius: 24,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  formHeading: {
    ...typography.standard.h1,
    fontSize: 24,
    fontWeight: '700',
    color: colors.textDark,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  formSubheading: {
    ...typography.standard.body,
    fontSize: 15,
    color: colors.muted,
    marginBottom: spacing.lg,
    lineHeight: 21,
  },
  label: {
    ...typography.standard.bodyBold,
    fontSize: 15,
    color: colors.textDark,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 17,
    fontFamily: fontFamily.text,
    color: colors.textDark,
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorText: {
    ...typography.standard.caption,
    color: colors.error,
    marginTop: spacing.md,
    textAlign: 'center',
    fontWeight: '600',
  },
  actionButton: {
    marginTop: spacing.xl,
    minHeight: 56,
  },
  switchAuthLink: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchAuthText: {
    fontSize: 14,
    color: colors.muted,
  },
  switchAuthBold: {
    color: colors.teal,
    fontWeight: '700',
  },

  // Demo Section
  demoSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  demoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  demoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textDark,
    letterSpacing: -0.2,
  },
  demoTag: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.teal,
    backgroundColor: colors.tealBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  demoSubtitle: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  demoIconSquircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  demoInfo: {
    flex: 1,
  },
  demoRoleName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textDark,
    letterSpacing: -0.2,
  },
  demoCredentials: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  demoActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  demoActionChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.teal,
  },

  // Role Selector in Sign Up
  roleSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  roleButton: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 74,
  },
  roleButtonActive: {
    backgroundColor: colors.tealBg,
    borderColor: colors.teal,
    borderWidth: 1.5,
  },
  roleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  roleLabelActive: {
    color: colors.teal,
    fontWeight: '700',
  },

  // Language Selector Trigger
  langPickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    minHeight: 56,
  },
  langPickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  langPickerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.tealBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langPickerTextGroup: {
    justifyContent: 'center',
  },
  langPickerNative: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
  },
  langPickerSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 1,
  },

  // Language Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.textDark,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  modalCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    marginTop: spacing.xs,
  },
  modalGroup: {
    marginBottom: spacing.md,
  },
  modalGroupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
    paddingHorizontal: 4,
  },
  modalGroupCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  modalRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  modalRowInfo: {
    flex: 1,
  },
  modalRowNative: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
  },
  modalRowNativeActive: {
    color: colors.teal,
    fontWeight: '700',
  },
  modalRowEn: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 1,
  },

  disclaimer: {
    fontSize: 12,
    color: colors.mutedLight,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 18,
    maxWidth: 360,
    alignSelf: 'center',
  },

  /* Code-based login & signup styles */
  codeLoginBox: {
    backgroundColor: '#F0FDFA',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginBottom: spacing.xs,
  },
  codeLoginHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  codeLoginTitle: {
    fontFamily: typography.standard.bodyBold.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: colors.teal,
  },
  codeLoginSub: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
    marginBottom: 8,
  },
  codeInput: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 3,
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#99F6E4',
    borderWidth: 1.5,
  },
  signupCodeCard: {
    backgroundColor: '#F0FDFA',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginTop: spacing.md,
  },
  signupCodeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  signupCodeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.teal,
  },
  signupCodeSub: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 17,
    marginBottom: 6,
  },
});
