/**
 * SMRITI+ Hero Voice Orb Component
 *
 * Implements the core conversational companion hero layer:
 * - Large 80-92px accessible hit target
 * - Real state visualizer: IDLE | LISTENING | THINKING | SPEAKING
 * - Subtle, calm pulse animation (non-distracting for elderly users)
 * - Global voice control toolbar:
 *   "Speak slower" | "Repeat that" | "Stop"
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import {
  Mic,
  Square,
  RotateCcw,
  Volume2,
  Sparkles,
  ArrowRight,
} from 'lucide-react-native';
import { colors, fontFamily, spacing } from '../../theme/tokens';
import { useTranslation } from '../../i18n';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface SMRITIVoiceOrbProps {
  state: VoiceState;
  transcript?: string;
  responseMessage?: string;
  onPressOrb: () => void;
  onStop?: () => void;
  onRepeat?: () => void;
  onSlowDown?: () => void;
  actionSuggestion?: {
    label: string;
    onAction: () => void;
  } | null;
}

export function SMRITIVoiceOrb({
  state,
  transcript,
  responseMessage,
  onPressOrb,
  onStop,
  onRepeat,
  onSlowDown,
  actionSuggestion,
}: SMRITIVoiceOrbProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state === 'listening' || state === 'speaking') {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.08,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1.0,
              duration: 800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(rippleAnim, {
              toValue: 1,
              duration: 1600,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(rippleAnim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      rippleAnim.stopAnimation();
      Animated.timing(pulseAnim, {
        toValue: 1.0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      Animated.timing(rippleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [state, pulseAnim, rippleAnim]);

  const { t } = useTranslation();

  const stateLabels: Record<VoiceState, { title: string; subtitle: string; color: string }> = {
    idle: {
      title: t('home.tapToSpeak') || 'Talk to SMRITI',
      subtitle: t('home.tapMicAnytime') || 'Ask about your day, memories, or tell me how you feel',
      color: colors.primary,
    },
    listening: {
      title: t('home.listeningToYou') || "I'm listening…",
      subtitle: t('home.speakInNative') || 'Speak in your native language',
      color: '#0E7490', // Calm Teal
    },
    thinking: {
      title: t('home.justAMoment') || 'Just a moment…',
      subtitle: t('home.smritiThinking') || 'SMRITI is thinking',
      color: '#7C3AED', // Gentle Purple
    },
    speaking: {
      title: t('home.smritiSpeaking') || 'SMRITI is speaking',
      subtitle: t('home.listenCalmly') || 'Listen calmly or tap stop anytime',
      color: '#059669', // Emerald Green
    },
  };

  const currentMeta = stateLabels[state];

  return (
    <View style={styles.container}>
      {/* Outer Ripple effect when active */}
      <View style={styles.orbWrapper}>
        {(state === 'listening' || state === 'speaking') && (
          <Animated.View
            style={[
              styles.rippleRing,
              {
                borderColor: currentMeta.color,
                opacity: rippleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 0],
                }),
                transform: [
                  {
                    scale: rippleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.45],
                    }),
                  },
                ],
              },
            ]}
          />
        )}

        <TouchableOpacity
          onPress={onPressOrb}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={`${currentMeta.title} — Tap to speak with SMRITI`}
        >
          <Animated.View
            style={[
              styles.orbCircle,
              {
                backgroundColor: currentMeta.color,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            {state === 'thinking' ? (
              <Sparkles size={36} color="#FFFFFF" strokeWidth={2.4} />
            ) : state === 'speaking' ? (
              <Volume2 size={36} color="#FFFFFF" strokeWidth={2.4} />
            ) : (
              <Mic size={38} color="#FFFFFF" strokeWidth={2.4} />
            )}
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Spoken State Label */}
      <Text style={[styles.statusTitle, { color: colors.textDark }]}>
        {currentMeta.title}
      </Text>

      {state === 'idle' ? (
        <Text style={[styles.statusSubtitle, { color: colors.textSecondary }]}>
          {currentMeta.subtitle}
        </Text>
      ) : null}

      {/* Live transcript or conversational response */}
      {state === 'listening' && transcript ? (
        <View style={styles.liveSpeechBox}>
          <Text style={styles.transcriptPrefix}>{t('home.youSaid') || 'You said:'}</Text>
          <Text style={styles.transcriptText}>"{transcript}"</Text>
        </View>
      ) : null}

      {responseMessage ? (
        <View style={styles.responseCard}>
          <View style={styles.responseHeaderRow}>
            <View style={styles.avatarMini}>
              <Text style={styles.avatarMiniText}>S</Text>
            </View>
            <Text style={styles.responseSpeaker}>SMRITI</Text>
          </View>
          <Text style={styles.responseText}>{responseMessage}</Text>

          {/* Action Suggestion if AI recommended one */}
          {actionSuggestion ? (
            <TouchableOpacity
              style={styles.suggestionBtn}
              onPress={actionSuggestion.onAction}
              activeOpacity={0.8}
            >
              <Text style={styles.suggestionBtnText}>{actionSuggestion.label}</Text>
              <ArrowRight size={16} color={colors.primary} strokeWidth={2.4} />
            </TouchableOpacity>
          ) : null}

          {/* Global Voice Controls when Speaking or Responding */}
          <View style={styles.voiceControlBar}>
            {onStop ? (
              <TouchableOpacity
                style={styles.voiceControlBtn}
                onPress={onStop}
                activeOpacity={0.75}
                accessibilityLabel="Stop speech"
              >
                <Square size={16} color="#DC2626" fill="#DC2626" style={{ marginRight: 6 }} />
                <Text style={[styles.voiceControlText, { color: '#DC2626' }]}>{t('home.stop') || 'Stop'}</Text>
              </TouchableOpacity>
            ) : null}

            {onRepeat ? (
              <TouchableOpacity
                style={styles.voiceControlBtn}
                onPress={onRepeat}
                activeOpacity={0.75}
                accessibilityLabel="Repeat that again"
              >
                <RotateCcw size={16} color={colors.textDark} style={{ marginRight: 6 }} />
                <Text style={styles.voiceControlText}>{t('home.repeat') || 'Repeat'}</Text>
              </TouchableOpacity>
            ) : null}

            {onSlowDown ? (
              <TouchableOpacity
                style={styles.voiceControlBtn}
                onPress={onSlowDown}
                activeOpacity={0.75}
                accessibilityLabel="Speak slower"
              >
                <Volume2 size={16} color={colors.textDark} style={{ marginRight: 6 }} />
                <Text style={styles.voiceControlText}>{t('home.speakSlower') || 'Speak slower'}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: spacing.md,
    paddingVertical: spacing.sm,
    width: '100%',
  },
  orbWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    marginBottom: spacing.md,
  },
  rippleRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
  },
  orbCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 24px rgba(0, 113, 227, 0.28)',
      },
    }),
  },
  statusTitle: {
    fontFamily: fontFamily.display,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontFamily: fontFamily.text,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
    paddingHorizontal: spacing.md,
  },
  liveSpeechBox: {
    width: '100%',
    padding: spacing.md,
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginTop: spacing.sm,
  },
  transcriptPrefix: {
    fontFamily: fontFamily.text,
    fontSize: 13,
    fontWeight: '700',
    color: '#0369A1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  transcriptText: {
    fontFamily: fontFamily.text,
    fontSize: 17,
    color: colors.textDark,
    marginTop: 2,
    fontStyle: 'italic',
  },
  responseCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.lg,
    marginTop: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  responseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  avatarMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarMiniText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  responseSpeaker: {
    fontFamily: fontFamily.display,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  responseText: {
    fontFamily: fontFamily.text,
    fontSize: 18,
    lineHeight: 26,
    color: colors.textDark,
    marginVertical: spacing.xs,
  },
  suggestionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  suggestionBtnText: {
    fontFamily: fontFamily.text,
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  voiceControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  voiceControlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  voiceControlText: {
    fontFamily: fontFamily.text,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
  },
});
