/**
 * SMRITI+ — Break & Comfort System Modal
 *
 * Implements Section 28 & 70:
 * - Patient, warm check-in when struggle signals or long session duration are detected
 * - Never uses words like "failed", "struggled", or "wrong"
 * - Clear, high-contrast actions: [ Take a Break ] / [ Continue Gently ]
 */

import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '../theme/tokens';

interface BreakModalProps {
  visible: boolean;
  reason?: string | null;
  onTakeBreak: () => void;
  onContinue: () => void;
}

export default function BreakModal({
  visible,
  reason,
  onTakeBreak,
  onContinue,
}: BreakModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>☕</Text>
          <Text style={styles.title}>Would you like a little break? ❤️</Text>
          <Text style={styles.message}>
            {reason ||
              'You have been doing great! Resting your eyes and taking your time helps your mind stay fresh.'}
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.breakButton}
              onPress={onTakeBreak}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Take a break"
            >
              <Text style={styles.breakButtonText}>☕ Take a Little Break</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={onContinue}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Continue activity"
            >
              <Text style={styles.continueButtonText}>Continue Gently →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 23, 48, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    borderWidth: 2,
    borderColor: colors.teal,
    shadowColor: colors.navyDark,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  emoji: {
    fontSize: 54,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.elderly.h2,
    color: colors.navy,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.elderly.body,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: spacing.xl,
  },
  actions: {
    width: '100%',
    gap: spacing.md,
  },
  breakButton: {
    backgroundColor: colors.teal,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
  },
  breakButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.white,
  },
  continueButton: {
    backgroundColor: colors.mintBg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navy,
  },
});
