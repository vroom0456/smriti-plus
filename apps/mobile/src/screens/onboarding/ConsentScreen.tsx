/**
 * SMRITI+ — Plain-Language Consent & Non-Diagnostic Disclosure
 *
 * Implements Phase 12 (Consent):
 * - Plain language explanation of data privacy
 * - Prominent non-diagnostic disclaimer
 * - User consent confirmation
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, typography, spacing } from '../../theme/tokens';
import { PrimaryButton } from '../../components/UIComponents';

interface ConsentScreenProps {
  onConsentAgreed: () => void;
  onDecline: () => void;
}

export default function ConsentScreen({ onConsentAgreed, onDecline }: ConsentScreenProps) {
  const [acknowledgedDisclaimer, setAcknowledgedDisclaimer] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Title */}
      <View style={styles.header}>
        <Text style={styles.badge}>DATA PRIVACY & SAFETY</Text>
        <Text style={styles.title}>Your Health & Privacy</Text>
        <Text style={styles.subtitle}>
          How SMRITI+ protects you and your personal information.
        </Text>
      </View>

      {/* Mandatory Non-Diagnostic Disclaimer Box */}
      <View style={styles.alertCard}>
        <View style={styles.alertHeader}>
          <Text style={styles.alertEmoji}>⚕️</Text>
          <Text style={styles.alertTitle}>Important Medical Notice</Text>
        </View>
        <Text style={styles.alertText}>
          SMRITI+ supports cognitive engagement and daily assistance; it does not diagnose or treat dementia or any neurological condition.
        </Text>
        <Text style={styles.alertSub}>
          Always consult a qualified medical professional for medical advice, assessment, and treatment.
        </Text>
      </View>

      {/* What we do & What we never do */}
      <View style={styles.privacyCard}>
        <Text style={styles.sectionHeading}>What SMRITI+ Collects:</Text>

        <View style={styles.itemRow}>
          <Text style={styles.itemEmoji}>✓</Text>
          <Text style={styles.itemText}>
            <Text style={styles.bold}>Game Accuracy & Timings:</Text> Used only to adjust puzzle difficulty to keep challenges enjoyable and stress-free.
          </Text>
        </View>

        <View style={styles.itemRow}>
          <Text style={styles.itemEmoji}>✓</Text>
          <Text style={styles.itemText}>
            <Text style={styles.bold}>Reminder Confirmations:</Text> To notify your family or caregiver if critical medicines are missed.
          </Text>
        </View>

        <View style={styles.itemRow}>
          <Text style={styles.itemEmoji}>✓</Text>
          <Text style={styles.itemText}>
            <Text style={styles.bold}>Local-First Storage:</Text> All your information stays safe on your device first and works without internet.
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionHeading}>What SMRITI+ Never Does:</Text>

        <View style={styles.itemRow}>
          <Text style={[styles.itemEmoji, { color: colors.coral }]}>✗</Text>
          <Text style={styles.itemText}>
            <Text style={styles.bold}>No Audio Recording Storage:</Text> Spoken voice is processed immediately on device and never saved to cloud servers.
          </Text>
        </View>

        <View style={styles.itemRow}>
          <Text style={[styles.itemEmoji, { color: colors.coral }]}>✗</Text>
          <Text style={styles.itemText}>
            <Text style={styles.bold}>Zero Data Selling:</Text> Your family's routines and health activities will never be shared with advertisers or third parties.
          </Text>
        </View>
      </View>

      {/* Acknowledgment Checkbox */}
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => setAcknowledgedDisclaimer(!acknowledgedDisclaimer)}
        activeOpacity={0.8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: acknowledgedDisclaimer }}
      >
        <View style={[styles.checkbox, acknowledgedDisclaimer && styles.checkboxActive]}>
          {acknowledgedDisclaimer && <Text style={styles.checkCheck}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>
          I understand that SMRITI+ is a cognitive support tool and not a medical diagnostic device.
        </Text>
      </TouchableOpacity>

      {/* Agreement Actions */}
      <View style={styles.actions}>
        <PrimaryButton
          title="I Agree & Continue →"
          onPress={onConsentAgreed}
          disabled={!acknowledgedDisclaimer}
        />

        <TouchableOpacity
          style={styles.declineButton}
          onPress={onDecline}
          accessibilityRole="button"
          accessibilityLabel="Back to login"
        >
          <Text style={styles.declineText}>Back to Sign In</Text>
        </TouchableOpacity>
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
    padding: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  badge: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.teal,
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.elderly.h1,
    color: colors.navy,
  },
  subtitle: {
    ...typography.elderly.caption,
    color: colors.muted,
    marginTop: 4,
  },
  alertCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: colors.gold,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  alertEmoji: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#92400E',
  },
  alertText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#78350F',
    lineHeight: 22,
    marginTop: 4,
  },
  alertSub: {
    fontSize: 13,
    color: '#92400E',
    marginTop: 6,
    lineHeight: 18,
  },
  privacyCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  itemEmoji: {
    fontSize: 18,
    color: colors.teal,
    fontWeight: '800',
    marginRight: spacing.sm,
    lineHeight: 22,
  },
  itemText: {
    fontSize: 15,
    color: colors.navy,
    flex: 1,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    minHeight: 64,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkboxActive: {
    backgroundColor: colors.teal,
  },
  checkCheck: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '900',
  },
  checkboxLabel: {
    fontSize: 15,
    color: colors.navy,
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },
  actions: {
    gap: spacing.md,
  },
  declineButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  declineText: {
    fontSize: 16,
    color: colors.muted,
    fontWeight: '600',
  },
});
