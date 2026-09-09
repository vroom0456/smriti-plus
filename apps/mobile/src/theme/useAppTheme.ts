import { useMemo, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { useSettingsStore } from '../state/settingsStore';
import { colors as baseColors, fontFamily, spacing, borderRadius, shadows } from './tokens';

export function useAppTheme() {
  const { fontScale, highContrast, textSize } = useSettingsStore();

  const colors = useMemo(() => {
    if (!highContrast) return baseColors;
    return {
      ...baseColors,
      background: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceSecondary: '#F1F5F9',
      textDark: '#000000',
      textSecondary: '#000000',
      muted: '#1E293B',
      border: '#000000',
      borderLight: '#000000',
      primary: '#004DB3',
      primaryDark: '#003380',
      teal: '#004D40',
      navy: '#000000',
    };
  }, [highContrast]);

  const scale = useCallback(
    (size: number) => {
      return Math.round(size * (fontScale || 1.0));
    },
    [fontScale]
  );

  const hcStyles = useMemo(() => {
    if (!highContrast) {
      return StyleSheet.create({
        cardBorder: {},
        boldText: {},
        buttonBorder: {},
      });
    }
    return StyleSheet.create({
      cardBorder: {
        borderWidth: 2,
        borderColor: '#000000',
      },
      boldText: {
        fontWeight: '800' as const,
        color: '#000000',
      },
      buttonBorder: {
        borderWidth: 2,
        borderColor: '#000000',
      },
    });
  }, [highContrast]);

  return {
    fontScale,
    highContrast,
    textSize,
    colors,
    scale,
    hcStyles,
    fontFamily,
    spacing,
    borderRadius,
    shadows,
  };
}
