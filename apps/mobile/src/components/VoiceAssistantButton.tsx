/**
SMRITI+ — Accessible Multilingual Voice Assistant Button
 *
 * Implements Section 54:
 * - 64dp+ accessible touch target
 * - Visual microphone state: Idle, Listening, Processing, Confirming, Speaking, Error
 * - Real-time animated audio wave bars
 * - Cancel, Repeat, and Touch fallback controls
 * - Apple SF Pro Display typography hierarchy
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  ViewStyle,
} from 'react-native';
import { colors, typography, spacing, fontFamily } from '../theme/tokens';
import { useVoiceAssistant } from '../services/voice/VoiceContext';
import { VoiceState } from '../services/voice/VoiceStateMachine';

interface VoiceAssistantButtonProps {
  onOpenFallback?: () => void;
  style?: ViewStyle;
  compact?: boolean;
}

export function VoiceAssistantButton({
  onOpenFallback,
  style,
  compact = false,
}: VoiceAssistantButtonProps) {
  const {
    state,
    transcript,
    spokenResponse,
    showTouchFallback,
    startListening,
    stopListening,
    cancel,
    speak,
  } = useVoiceAssistant();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const wave1 = useRef(new Animated.Value(10)).current;
  const wave2 = useRef(new Animated.Value(18)).current;
  const wave3 = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;

    if (state === 'LISTENING') {
      animLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: false }),
            Animated.timing(pulseAnim, { toValue: 1.0, duration: 600, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(wave1, { toValue: 28, duration: 300, useNativeDriver: false }),
            Animated.timing(wave1, { toValue: 8, duration: 300, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(wave2, { toValue: 36, duration: 400, useNativeDriver: false }),
            Animated.timing(wave2, { toValue: 14, duration: 400, useNativeDriver: false }),
          ]),
          Animated.sequence([
            Animated.timing(wave3, { toValue: 30, duration: 350, useNativeDriver: false }),
            Animated.timing(wave3, { toValue: 10, duration: 350, useNativeDriver: false }),
          ]),
        ])
      );
      animLoop.start();
    } else {
      pulseAnim.setValue(1);
      wave1.setValue(10);
      wave2.setValue(18);
      wave3.setValue(12);
    }

    return () => {
      if (animLoop) animLoop.stop();
    };
  }, [state, pulseAnim, wave1, wave2, wave3]);

  const handlePress = () => {
    if (state === 'IDLE' || state === 'ERROR') {
      startListening();
    } else if (state === 'LISTENING') {
      stopListening();
    } else if (state === 'SPEAKING') {
      cancel();
    }
  };

  const getButtonBgColor = () => {
    switch (state) {
      case 'LISTENING':
        return colors.coral;
      case 'PROCESSING':
        return colors.gold;
      case 'SPEAKING':
        return colors.teal;
      case 'CONFIRMING':
        return colors.accent;
      case 'ERROR':
        return colors.error;
      default:
        return colors.teal;
    }
  };

  const getStatusLabel = () => {
    switch (state) {
      case 'LISTENING':
        return 'వింటున్నాను... (Listening)';
      case 'PROCESSING':
        return 'ఆలోచిస్తున్నాను... (Processing)';
      case 'SPEAKING':
        return 'మాట్లాడుతున్నాను (Speaking)';
      case 'CONFIRMING':
        return 'ధృవీకరించండి (Confirm)';
      case 'ERROR':
        return 'మళ్ళీ చెప్పండి (Tap to Retry)';
      default:
        return 'మాట్లాడటానికి నొక్కండి (Tap to Speak)';
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Wave Bars when Listening */}
      {state === 'LISTENING' && (
        <View style={styles.waveRow}>
          <Animated.View style={[styles.waveBar, { height: wave1 }]} />
          <Animated.View style={[styles.waveBar, { height: wave2, backgroundColor: colors.coral }]} />
          <Animated.View style={[styles.waveBar, { height: wave3 }]} />
        </View>
      )}

      {/* Main Mic Button */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.8}
          style={[styles.button, { backgroundColor: getButtonBgColor() }]}
          accessibilityLabel="Voice Assistant Button"
          accessibilityRole="button"
        >
          <Text style={styles.micEmoji}>
            {state === 'LISTENING' ? '🎙️' : (state === 'SPEAKING' ? '🔊' : (state === 'PROCESSING' ? '⏳' : '🎤'))}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Status Label */}
      {!compact && <Text style={styles.statusText}>{getStatusLabel()}</Text>}

      {/* Real-time transcript preview */}
      {Boolean(transcript) && (
        <View style={styles.transcriptBox}>
          <Text style={styles.transcriptText}>"{transcript}"</Text>
        </View>
      )}

      {/* Action Controls: Cancel & Touch Fallback */}
      {state !== 'IDLE' && (
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={cancel} style={styles.cancelChip}>
            <Text style={styles.cancelText}>✕ ఆపు (Cancel)</Text>
          </TouchableOpacity>
          {Boolean(spokenResponse) && (
            <TouchableOpacity onPress={() => speak(spokenResponse)} style={styles.repeatChip}>
              <Text style={styles.repeatText}>↻ మళ్ళీ చెప్పు (Repeat)</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Tier-3 Touch Fallback notification */}
      {showTouchFallback && onOpenFallback && (
        <TouchableOpacity onPress={onOpenFallback} style={styles.fallbackCard}>
          <Text style={styles.fallbackText}>👉 స్క్రీన్‌పై ఎంచుకోండి (Use Touch Buttons)</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  button: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  micEmoji: {
    fontSize: 34,
  },
  statusText: {
    fontFamily: fontFamily.display,
    fontSize: 17,
    fontWeight: '700',
    color: colors.navy,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    marginBottom: spacing.xs,
  },
  waveBar: {
    width: 6,
    borderRadius: 3,
    backgroundColor: colors.teal,
  },
  transcriptBox: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
    maxWidth: '90%',
  },
  transcriptText: {
    fontFamily: fontFamily.text,
    fontSize: 16,
    color: colors.navy,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  cancelChip: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  cancelText: {
    fontFamily: fontFamily.display,
    fontSize: 14,
    fontWeight: '700',
    color: colors.coral,
  },
  repeatChip: {
    backgroundColor: colors.mintBg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  repeatText: {
    fontFamily: fontFamily.display,
    fontSize: 14,
    fontWeight: '700',
    color: colors.teal,
  },
  fallbackCard: {
    backgroundColor: colors.mintBg,
    borderWidth: 2,
    borderColor: colors.teal,
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  fallbackText: {
    fontFamily: fontFamily.display,
    fontSize: 16,
    fontWeight: '800',
    color: colors.teal,
  },
});
