/**
 * SMRITI+ — Global Settings & Accessibility Store (Zustand)
 *
 * Synchronizes:
 * 1. UI Text Size & Global Typography Scaling ('normal' | 'large' | 'xlarge')
 * 2. High Contrast Accessibility Mode
 * 3. App Language & Regional Dialects
 * 4. Voice Assistant Pace & Privacy Controls
 *
 * Persists all settings to localStorage (web) and SecureStore (mobile).
 */

import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { SupportedLanguage, setLanguage as setI18nLanguage, getLanguage as getI18nLanguage } from '../i18n';
import { defaultVoiceOrchestrator } from '../services/voice/VoiceOrchestrator';
import { voiceIntelligence } from '../services/voiceIntelligence';

export type TextSize = 'normal' | 'large' | 'xlarge';

const FONT_SCALE_MAP: Record<TextSize, number> = {
  normal: 1.0,
  large: 1.18,
  xlarge: 1.35,
};

const SETTINGS_STORAGE_KEY = 'smriti_app_settings';

interface SettingsState {
  textSize: TextSize;
  fontScale: number;
  highContrast: boolean;
  language: SupportedLanguage;
  voiceSpeed: number;
  voiceGuidance: boolean;
  privateVoiceMode: boolean;
  isLoaded: boolean;

  setTextSize: (size: TextSize) => Promise<void>;
  setHighContrast: (enabled: boolean) => Promise<void>;
  setAppLanguage: (lang: SupportedLanguage) => Promise<void>;
  setVoiceSpeed: (speed: number) => Promise<void>;
  setVoiceGuidance: (enabled: boolean) => Promise<void>;
  setPrivateVoiceMode: (enabled: boolean) => Promise<void>;
  loadSettings: () => Promise<void>;
}

// Apply scale to web document if running in browser
function applyWebRootScaling(scale: number, highContrast: boolean) {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    try {
      const basePx = Math.round(16 * scale);
      document.documentElement.style.fontSize = `${basePx}px`;
      if (highContrast) {
        document.documentElement.setAttribute('data-high-contrast', 'true');
      } else {
        document.documentElement.removeAttribute('data-high-contrast');
      }
    } catch {
      // Ignore web styling errors
    }
  }
}

async function saveToStorage(key: string, value: any) {
  const jsonStr = JSON.stringify(value);
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, jsonStr);
      }
    } catch {}
    return;
  }
  try {
    await SecureStore.setItemAsync(key, jsonStr);
  } catch {}
}

async function readFromStorage(key: string): Promise<any | null> {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      }
    } catch {}
    return null;
  }
  try {
    const item = await SecureStore.getItemAsync(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

function serializeSettings(state: SettingsState) {
  return {
    textSize: state.textSize,
    fontScale: state.fontScale,
    highContrast: state.highContrast,
    language: state.language,
    voiceSpeed: state.voiceSpeed,
    voiceGuidance: state.voiceGuidance,
    privateVoiceMode: state.privateVoiceMode,
  };
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  textSize: 'large',
  fontScale: FONT_SCALE_MAP.large,
  highContrast: false,
  language: (getI18nLanguage() as SupportedLanguage) || 'en',
  voiceSpeed: 0.85,
  voiceGuidance: true,
  privateVoiceMode: false,
  isLoaded: false,

  setTextSize: async (size: TextSize) => {
    const fontScale = FONT_SCALE_MAP[size] || 1.18;
    set({ textSize: size, fontScale });
    applyWebRootScaling(fontScale, get().highContrast);
    await saveToStorage(SETTINGS_STORAGE_KEY, serializeSettings({ ...get(), textSize: size, fontScale }));
  },

  setHighContrast: async (enabled: boolean) => {
    set({ highContrast: enabled });
    applyWebRootScaling(get().fontScale, enabled);
    await saveToStorage(SETTINGS_STORAGE_KEY, serializeSettings({ ...get(), highContrast: enabled }));
  },

  setAppLanguage: async (lang: SupportedLanguage) => {
    set({ language: lang });
    setI18nLanguage(lang);
    try {
      defaultVoiceOrchestrator.setLanguage(lang);
      voiceIntelligence.updateContext({ primaryLanguage: lang });
    } catch {}
    await saveToStorage(SETTINGS_STORAGE_KEY, serializeSettings({ ...get(), language: lang }));
  },

  setVoiceSpeed: async (speed: number) => {
    set({ voiceSpeed: speed });
    try {
      voiceIntelligence.updateContext({ voiceSpeed: speed });
    } catch {}
    await saveToStorage(SETTINGS_STORAGE_KEY, {
      ...get(),
      voiceSpeed: speed,
    });
  },

  setVoiceGuidance: async (enabled: boolean) => {
    set({ voiceGuidance: enabled });
    await saveToStorage(SETTINGS_STORAGE_KEY, {
      ...get(),
      voiceGuidance: enabled,
    });
  },

  setPrivateVoiceMode: async (enabled: boolean) => {
    set({ privateVoiceMode: enabled });
    try {
      voiceIntelligence.updateContext({ privateVoiceMode: enabled });
    } catch {}
    await saveToStorage(SETTINGS_STORAGE_KEY, {
      ...get(),
      privateVoiceMode: enabled,
    });
  },

  loadSettings: async () => {
    try {
      const saved = await readFromStorage(SETTINGS_STORAGE_KEY);
      if (saved) {
        const lang = (saved.language || 'en') as SupportedLanguage;
        const size = (saved.textSize || 'large') as TextSize;
        const fontScale = FONT_SCALE_MAP[size] || 1.18;
        const highContrast = Boolean(saved.highContrast);
        const voiceSpeed = typeof saved.voiceSpeed === 'number' ? saved.voiceSpeed : 0.85;
        const voiceGuidance = saved.voiceGuidance !== undefined ? Boolean(saved.voiceGuidance) : true;
        const privateVoiceMode = Boolean(saved.privateVoiceMode);

        set({
          textSize: size,
          fontScale,
          highContrast,
          language: lang,
          voiceSpeed,
          voiceGuidance,
          privateVoiceMode,
          isLoaded: true,
        });

        setI18nLanguage(lang);
        defaultVoiceOrchestrator.setLanguage(lang);
        voiceIntelligence.updateContext({
          primaryLanguage: lang,
          voiceSpeed,
          privateVoiceMode,
        });
        applyWebRootScaling(fontScale, highContrast);
        return;
      }
    } catch (err) {
      console.warn('[SettingsStore] Failed to load saved settings:', err);
    }
    set({ isLoaded: true });
    applyWebRootScaling(FONT_SCALE_MAP.large, false);
  },
}));

// Initialize settings automatically on load
if (typeof window !== 'undefined') {
  useSettingsStore.getState().loadSettings();
}
