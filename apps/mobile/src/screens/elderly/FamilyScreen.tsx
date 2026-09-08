/**
 * SMRITI+ — Family / Emergency Help Screen
 *
 * Elderly-first design:
 * - Huge 64dp+ tap targets
 * - Direct one-tap phone dialer integration
 * - Displays linked caregiver info & share code
 * - Emergency contacts (Ambulance, Doctor)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, fontFamily, borderRadius, shadows } from '../../theme/tokens';
import { useAuthStore } from '../../state/authStore';
import { api } from '../../services/api';
import { Phone, User, AlertCircle, Stethoscope, ArrowLeft } from 'lucide-react-native';

export default function FamilyScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [caregiver, setCaregiver] = useState<{
    name: string;
    phone: string;
    relationship: string;
  } | null>({
    name: 'Priya Barua',
    phone: '+91 98765 43210',
    relationship: 'Daughter / Primary Caregiver',
  });
  const [shareCode, setShareCode] = useState<string>('SMR-842');

  const handleCall = (phoneNumber: string, name: string) => {
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');
    const url = `tel:${cleanNumber}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Calling Not Supported', `Please dial manually: ${phoneNumber}`);
        }
      })
      .catch(() => {
        Alert.alert('Phone Call', `Dialing ${name} at ${phoneNumber}`);
      });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          activeOpacity={0.75}
        >
          <ArrowLeft size={18} color={colors.navy} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">Family & Help</Text>
        <Text style={styles.subtitle} numberOfLines={2} ellipsizeMode="tail">
          One tap to talk to your family or get help anytime.
        </Text>
      </View>

      {/* Primary Caregiver Card */}
      {caregiver ? (
        <View style={styles.caregiverCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <User size={30} color={colors.teal} />
            </View>
            <View style={styles.caregiverInfo}>
              <Text style={styles.caregiverName} numberOfLines={1} ellipsizeMode="tail">{caregiver.name}</Text>
              <Text style={styles.caregiverRole} numberOfLines={1} ellipsizeMode="tail">{caregiver.relationship}</Text>
              <Text style={styles.caregiverPhone} numberOfLines={1} ellipsizeMode="tail">{caregiver.phone}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.callButton}
            onPress={() => handleCall(caregiver.phone, caregiver.name)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={`Call ${caregiver.name}`}
          >
            <Phone size={20} color={colors.white} style={{ marginRight: spacing.sm }} />
            <Text style={styles.callButtonText} numberOfLines={1} ellipsizeMode="tail">Call {caregiver.name.split(' ')[0]}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Family Linked Yet</Text>
          <Text style={styles.emptyText}>
            Give this code to your daughter, son, or caregiver so they can connect:
          </Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{shareCode}</Text>
          </View>
        </View>
      )}

      {/* Emergency Assistance */}
      <Text style={styles.sectionHeader}>Emergency Assistance</Text>

      <TouchableOpacity
        style={styles.emergencyCard}
        onPress={() => handleCall('108', 'Emergency Ambulance')}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel="Call Medical Emergency 108"
      >
        <View style={styles.emergencyIcon}>
          <AlertCircle size={26} color={colors.coral} />
        </View>
        <View style={styles.emergencyInfo}>
          <Text style={styles.emergencyTitle} numberOfLines={1} ellipsizeMode="tail">Medical Emergency (108)</Text>
          <Text style={styles.emergencySub} numberOfLines={1} ellipsizeMode="tail">Immediate Ambulance Service</Text>
        </View>
        <Text style={styles.callLabel}>CALL 108</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.doctorCard}
        onPress={() => handleCall('+91 94350 12345', 'Dr. Sarma')}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel="Call Family Doctor"
      >
        <View style={styles.doctorIcon}>
          <Stethoscope size={26} color={colors.teal} />
        </View>
        <View style={styles.emergencyInfo}>
          <Text style={styles.doctorTitle} numberOfLines={1} ellipsizeMode="tail">Family Physician</Text>
          <Text style={styles.emergencySub} numberOfLines={1} ellipsizeMode="tail">Dr. B. Sarma (+91 94350 12345)</Text>
        </View>
        <Text style={styles.callLabelDoctor}>CALL</Text>
      </TouchableOpacity>

      {/* Share Code Info */}
      <View style={styles.shareBox}>
        <Text style={styles.shareTitle}>Caregiver Link Code</Text>
        <Text style={styles.shareCodeText}>{shareCode}</Text>
        <Text style={styles.shareDesc}>
          Your caregiver can enter this code in their SMRITI+ app to view your health updates and manage your reminders.
        </Text>
      </View>
    </ScrollView>
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
    paddingTop: 56,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.glassCard,
    borderRadius: borderRadius.pill,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    minHeight: 44,
    justifyContent: 'center',
    gap: 6,
    ...shadows.subtle,
  },
  backText: {
    fontFamily: fontFamily.display,
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
  },
  title: {
    ...typography.elderly.h1,
    color: colors.navy,
    letterSpacing: -0.6,
  },
  subtitle: {
    ...typography.elderly.caption,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  caregiverCard: {
    backgroundColor: colors.glassCard,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    ...shadows.card,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.teal + '20',
  },
  caregiverInfo: {
    flex: 1,
  },
  caregiverName: {
    ...typography.elderly.h2,
    color: colors.navy,
    letterSpacing: -0.3,
  },
  caregiverRole: {
    ...typography.elderly.caption,
    color: colors.teal,
    fontWeight: '700',
  },
  caregiverPhone: {
    ...typography.elderly.caption,
    color: colors.muted,
    marginTop: 2,
    fontWeight: '500',
  },
  callButton: {
    backgroundColor: colors.teal,
    borderRadius: borderRadius.pill,
    paddingVertical: 16,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    ...shadows.glowTeal,
  },
  callButtonText: {
    fontFamily: fontFamily.display,
    fontSize: 20,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.2,
  },
  emptyCard: {
    backgroundColor: colors.glassCard,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    ...shadows.card,
  },
  emptyTitle: {
    ...typography.elderly.h2,
    color: colors.navy,
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
  },
  emptyText: {
    ...typography.elderly.body,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  codeBox: {
    backgroundColor: colors.mintBg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.pill,
    borderWidth: 1.5,
    borderColor: colors.teal,
  },
  codeText: {
    fontFamily: fontFamily.display,
    fontSize: 28,
    fontWeight: '800',
    color: colors.navy,
    letterSpacing: 2,
  },
  sectionHeader: {
    ...typography.elderly.h2,
    color: colors.navy,
    marginBottom: spacing.md,
    letterSpacing: -0.4,
  },
  emergencyCard: {
    backgroundColor: colors.coralBg,
    borderWidth: 1.5,
    borderColor: colors.coral + '40',
    borderRadius: borderRadius.xl,
    padding: spacing.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    minHeight: 74,
    ...shadows.subtle,
  },
  emergencyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.coral + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyTitle: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    fontWeight: '800',
    color: colors.coral,
    letterSpacing: -0.2,
  },
  emergencySub: {
    fontFamily: fontFamily.text,
    fontSize: 14,
    color: colors.muted,
  },
  callLabel: {
    fontFamily: fontFamily.display,
    fontSize: 16,
    fontWeight: '800',
    color: colors.coral,
    paddingHorizontal: spacing.sm,
  },
  doctorCard: {
    backgroundColor: colors.glassCard,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.xl,
    padding: spacing.md + 2,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    minHeight: 74,
    ...shadows.subtle,
  },
  doctorIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.teal + '20',
  },
  doctorTitle: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    fontWeight: '800',
    color: colors.navy,
    letterSpacing: -0.2,
  },
  callLabelDoctor: {
    fontFamily: fontFamily.display,
    fontSize: 16,
    fontWeight: '800',
    color: colors.teal,
    paddingHorizontal: spacing.sm,
  },
  shareBox: {
    backgroundColor: colors.glassCard,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    ...shadows.card,
  },
  shareTitle: {
    fontFamily: fontFamily.display,
    fontSize: 16,
    fontWeight: '700',
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  shareCodeText: {
    fontFamily: fontFamily.display,
    fontSize: 28,
    fontWeight: '800',
    color: colors.navy,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  shareDesc: {
    fontFamily: fontFamily.text,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
