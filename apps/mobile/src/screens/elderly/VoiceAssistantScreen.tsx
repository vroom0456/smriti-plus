/**
 * SMRITI+ — Voice Assistant Screen (Production)
 *
 * Cross-platform: Web Speech API on browsers, expo-speech TTS + text fallback on native.
 * 10 Indian regional languages, warm cream palette, full i18n.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Speech from 'expo-speech';
import { colors, spacing, borderRadius, fontFamily, shadows } from '../../theme/tokens';
import { ArrowLeft, RotateCcw, Send, Mic, MicOff, Volume2 } from 'lucide-react-native';
import {
  voiceIntelligence,
  VoiceState,
  CanonicalIntent,
  adaptivePersonaEngine,
} from '../../services/voiceIntelligence';
import { languageRegistry } from '../../services/languageRegistry';
import { offlineStore } from '../../services/offlineStore';
import { defaultVoiceOrchestrator } from '../../services/voice/VoiceOrchestrator';
import { useAuthStore } from '../../state/authStore';
import { useTranslation, getLanguage } from '../../i18n';
import { useBackNavigation } from '../../navigation/useBackNavigation';

interface ChatTurn {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  spokenAudioText?: string;
  timestamp: string;
  intentLabel?: string;
}

const LANG_GREETINGS: Record<string, string> = {
  te: 'నమస్కారం! నేను మీ స్మృతి వాయిస్ అసిస్టెంట్‌ని. ఈరోజు మీకు ఎలా సహాయపడగలను?',
  hi: 'नमस्ते! मैं आपकी स्मृति वॉयस असिस्टेंट हूँ। आज मैं आपकी क्या सहायता कर सकती हूँ?',
  as: 'নমস্কাৰ! মই আপোনাৰ স্মৃতি ভইচ এচিষ্টেণ্ট। আজি মই আপোনাক কেনেকৈ সহায় কৰিব পাৰোঁ?',
  bn: 'নমস্কার! আমি আপনার স্মৃতি ভয়েস সহকারী। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
  ta: 'வணக்கம்! நான் உங்கள் ஸ்மிருதி குரல் உதவியாளர். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?',
  bodo: 'खुलुमबाय! आं नोंथांनि SMRITI राव हेफाजाबगिरि।',
  en: 'Hello! I am your SMRITI+ voice assistant. How can I help you today?',
};

const LANG_LISTEN_PROMPT: Record<string, string> = {
  te: 'చెప్పండి, వింటున్నాను.',
  hi: 'जी, मैं ध्यान से सुन रही हूँ।',
  as: 'মই শুনি আছোঁ।',
  bn: 'আমি শুনছি, বলুন।',
  ta: 'சொல்லுங்கள், நான் கேட்கிறேன்.',
  bodo: 'आं खोनासं गासिनो, बुं।',
  en: 'I am listening. Please speak or type below.',
};

const LANG_STATE: Record<string, Record<VoiceState, string>> = {
  te: { IDLE: 'నొక్కి మాట్లాడండి', LISTENING: 'వింటున్నాను...', PROCESSING: 'అర్థం చేసుకుంటున్నాను...', CONFIRMING: 'ధృవీకరించండి', SPEAKING: 'SMRITI+ మాట్లాడుతోంది...', ERROR: 'తిరిగి ప్రయత్నించండి', OFFLINE: 'నెట్‌వర్క్ లేదు' },
  hi: { IDLE: 'टैप करें', LISTENING: 'सुन रहा हूँ...', PROCESSING: 'समझ रहा हूँ...', CONFIRMING: 'पुष्टि करें', SPEAKING: 'SMRITI+ बोल रहा है...', ERROR: 'दोबारा कोशिश करें', OFFLINE: 'नेटवर्क नहीं' },
  as: { IDLE: 'টেপ কৰক', LISTENING: 'শুনি আছোঁ...', PROCESSING: 'বুজি পাইছোঁ...', CONFIRMING: 'নিশ্চিত কৰক', SPEAKING: 'SMRITI+ কথা কৈ আছে...', ERROR: 'পুনৰ চেষ্টা', OFFLINE: 'নেটৱৰ্ক নাই' },
  bn: { IDLE: 'স্পর্শ করুন', LISTENING: 'শুনছি...', PROCESSING: 'বুঝছি...', CONFIRMING: 'নিশ্চিত করুন', SPEAKING: 'SMRITI+ বলছে...', ERROR: 'আবার চেষ্টা', OFFLINE: 'নেটওয়ার্ক নেই' },
  ta: { IDLE: 'தட்டவும்', LISTENING: 'கேட்கிறேன்...', PROCESSING: 'புரிகிறது...', CONFIRMING: 'உறுதிப்படுத்தவும்', SPEAKING: 'SMRITI+ பேசுகிறது...', ERROR: 'மீண்டும் முயற்சி', OFFLINE: 'இணைப்பு இல்லை' },
  bodo: { IDLE: 'रायलानो थु', LISTENING: 'खोनासं गासिनो...', PROCESSING: 'बुजि गासिनो...', CONFIRMING: 'थार खालाम', SPEAKING: 'SMRITI+ बुंगासिनो...', ERROR: 'फिन नाजा', OFFLINE: 'नेटवर्क गैया' },
  en: { IDLE: 'Tap to Speak', LISTENING: 'Listening...', PROCESSING: 'Understanding...', CONFIRMING: 'Please Confirm', SPEAKING: 'SMRITI+ speaking...', ERROR: 'Please try again', OFFLINE: 'No network' },
};

const CHIPS: Record<string, Array<{ tag: string; phrase: string; spoken: string }>> = {
  te: [
    { tag: '📋 షెడ్యూల్', phrase: 'ఈ రోజు షెడ్యూల్', spoken: 'నా ఈ రోజు షెడ్యూల్ ఏమిటి?' },
    { tag: '💊 మందు', phrase: 'తర్వాతి మందు', spoken: 'నా తర్వాతి మందు ఎప్పుడు?' },
    { tag: '🌬️ శ్వాస', phrase: 'శ్వాస వ్యాయామం', spoken: 'నాకు ప్రశాంత శ్వాస వ్యాయామం చెప్పు' },
    { tag: '🧩 ఆట', phrase: 'మెదడు ఆట', spoken: 'ఒక మెదడు ఆట చెప్పు' },
    { tag: '💧 నీళ్ళు', phrase: 'నీళ్ళు తాగానా?', spoken: 'ఈ రోజు నేను నీళ్ళు తాగానా?' },
    { tag: '🖼️ జ్ఞాపకాలు', phrase: 'ఫ్యామిలీ జ్ఞాపకాలు', spoken: 'ఫ్యామిలీ జ్ఞాపకాలు చూపించు' },
    { tag: '🔄 మళ్ళీ', phrase: 'మళ్ళీ చెప్పు', spoken: 'మళ్ళీ చెప్పు' },
  ],
  hi: [
    { tag: '📋 कार्यक्रम', phrase: 'आज का कार्यक्रम', spoken: 'मेरा आज का कार्यक्रम क्या है?' },
    { tag: '💊 दवा', phrase: 'अगली दवाई', spoken: 'मेरी अगली दवाई कब है?' },
    { tag: '🌬️ सांस', phrase: 'सांस की कसरत', spoken: 'मुझे शांति से सांस लेने की कसरत कराओ' },
    { tag: '🧩 खेल', phrase: 'दिमागी खेल', spoken: 'दिमागी खेल बताओ' },
    { tag: '💧 पानी', phrase: 'पानी पिया?', spoken: 'क्या मैंने आज पानी पिया?' },
    { tag: '🖼️ यादें', phrase: 'परिवार की यादें', spoken: 'परिवार की यादें दिखाओ' },
    { tag: '🔄 दोहरा', phrase: 'फिर से बोलो', spoken: 'फिर से बोलो' },
  ],
  as: [
    { tag: '📋 কাৰ্যসূচী', phrase: 'আজি কি কাম', spoken: 'আজি মোৰ কি কি কাম আছে?' },
    { tag: '💊 দৰব', phrase: 'পিছৰ দৰব', spoken: 'মোৰ পিছৰ দৰব কেতিয়া খাব লাগে?' },
    { tag: '🌬️ উশাহ', phrase: 'উশাহ অভ্যাস', spoken: 'মোক শান্তিৰে উশাহ লোৱাৰ অভ্যাস কৰোৱা' },
    { tag: '🧩 খেল', phrase: 'মগজুৰ খেল', spoken: 'এটা মগজুৰ খেল কোৱা' },
    { tag: '💧 পানী', phrase: 'পানী খালোঁনে', spoken: 'মই আজি পানী খালোঁনে?' },
    { tag: '🖼️ স্মৃতি', phrase: 'পৰিয়ালৰ স্মৃতি', spoken: 'পৰিয়ালৰ স্মৃতি দেখুওৱা' },
    { tag: '🔄 পুনৰ', phrase: 'পুনৰ কোৱা', spoken: 'পুনৰ কোৱা' },
  ],
  en: [
    { tag: '📋 Schedule', phrase: 'My schedule today', spoken: 'What is my schedule today?' },
    { tag: '💊 Medicine', phrase: 'Next medicine', spoken: 'When is my next medicine?' },
    { tag: '🌬️ Breathe', phrase: 'Breathing exercise', spoken: 'Help me relax with a breathing exercise' },
    { tag: '🧩 Game', phrase: 'Brain game', spoken: 'Recommend a brain game for me' },
    { tag: '💧 Water', phrase: 'Drink water?', spoken: 'Did I drink water today?' },
    { tag: '🖼️ Memories', phrase: 'Family memories', spoken: 'Show my family memories' },
    { tag: '🔄 Repeat', phrase: 'Say again', spoken: 'Say that again' },
  ],
};

const BCP47: Record<string, string> = {
  te: 'te-IN', hi: 'hi-IN', as: 'as-IN', bn: 'bn-IN',
  ta: 'ta-IN', bodo: 'as-IN', mni: 'bn-IN', kha: 'en-IN',
  grt: 'en-IN', lus: 'en-IN', en: 'en-IN',
};

function getChips(lang: string) { return CHIPS[lang] || CHIPS['en']; }
function getStateLabel(lang: string, state: VoiceState): string {
  return (LANG_STATE[lang] || LANG_STATE['en'])[state];
}

async function speakNative(text: string, lang: string, rate = 0.85): Promise<void> {
  const clean = text
    .replace(/[\u{1F600}-\u{1FAFF}]/gu, '')
    .replace(/[🙏✨💡🛡️⚡🎉❤️👍👋✓✕📋💊🌬️🧩💧🖼️🎮📞🔄🛑⚠️🔊▶]/g, '')
    .replace(/\s+/g, ' ').trim();
  if (!clean) return;

  return new Promise<void>((resolve) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = BCP47[lang] || 'en-IN';
      utter.rate = rate;
      utter.pitch = 1.0;
      const trySpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        const best = voices.find(v => v.lang.startsWith(BCP47[lang]?.split('-')[0] || lang));
        if (best) utter.voice = best;
        utter.onend = () => resolve();
        utter.onerror = () => resolve();
        window.speechSynthesis.speak(utter);
      };
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.onvoiceschanged = null; trySpeak(); };
      } else { trySpeak(); }
    } else {
      Speech.speak(clean, { language: BCP47[lang] || 'en-IN', rate, pitch: 1.0, onDone: resolve, onError: () => resolve() });
    }
  });
}

async function stopNative(): Promise<void> {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    } else {
      await Speech.stop();
    }
  } catch {}
}

export default function VoiceAssistantScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const { goBackSafe, panHandlers } = useBackNavigation(navigation, {
    onCustomBack: () => { try { stopNative(); } catch {} return false; },
    fallbackTab: 'Home',
  });

  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [currentIntent, setCurrentIntent] = useState<CanonicalIntent | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>([]);
  const [inputPhrase, setInputPhrase] = useState('');
  const [lastSpokenText, setLastSpokenText] = useState('');

  const waves = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.7)).current,
    useRef(new Animated.Value(0.4)).current,
    useRef(new Animated.Value(0.9)).current,
    useRef(new Animated.Value(0.5)).current,
    useRef(new Animated.Value(0.6)).current,
    useRef(new Animated.Value(0.3)).current,
  ];
  const pulseMic = useRef(new Animated.Value(1)).current;
  const chatScrollRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);
  const listenRef = useRef<any>(null);
  const mountedRef = useRef(true);

  const currentLang = getLanguage() || 'en';
  const langCap = languageRegistry.getCapability(currentLang);

  const doSpeak = useCallback(async (text: string, lang: string, rate = 0.85) => {
    if (!mountedRef.current) return;
    setVoiceState('SPEAKING');
    setLastSpokenText(text);
    try { await speakNative(text, lang, rate); } finally {
      if (mountedRef.current) setVoiceState('IDLE');
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    try { voiceIntelligence.updateContext({ currentScreen: 'voice', primaryLanguage: currentLang }); } catch {}
    const greeting = LANG_GREETINGS[currentLang] || LANG_GREETINGS['en'];
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatHistory([{ id: '1', sender: 'assistant', text: greeting, spokenAudioText: greeting, timestamp: now }]);
    const t = setTimeout(() => { if (mountedRef.current) doSpeak(greeting, currentLang); }, 700);
    return () => { mountedRef.current = false; clearTimeout(t); clearTimeout(listenRef.current); stopNative(); };
  }, [currentLang, doSpeak]);

  useEffect(() => {
    try {
      defaultVoiceOrchestrator.setLanguage(currentLang);
      defaultVoiceOrchestrator.setCurrentScreen('voice');
      defaultVoiceOrchestrator.registerActionHandlers({
        startGame: () => { navigation.navigate('Games'); return true; },
        openReminders: () => navigation.navigate('Reminders'),
        navigate: (s: string) => navigation.navigate(s),
      });
    } catch {}
  }, [currentLang, navigation]);

  useEffect(() => {
    let anims: Animated.CompositeAnimation[] = [];
    if (voiceState === 'LISTENING' || voiceState === 'SPEAKING') {
      const dur = [420, 360, 500, 330, 480, 390, 445];
      const mn = [0.15, 0.25, 0.10, 0.35, 0.20, 0.28, 0.12];
      const mx = [1.0, 0.85, 1.0, 0.8, 0.95, 0.88, 0.92];
      anims = waves.map((w, i) => Animated.loop(Animated.sequence([
        Animated.timing(w, { toValue: mx[i], duration: dur[i], useNativeDriver: false }),
        Animated.timing(w, { toValue: mn[i], duration: dur[i], useNativeDriver: false }),
      ])));
      anims.forEach(a => a.start());
      Animated.loop(Animated.sequence([
        Animated.timing(pulseMic, { toValue: 1.12, duration: 750, useNativeDriver: false }),
        Animated.timing(pulseMic, { toValue: 1.0, duration: 750, useNativeDriver: false }),
      ])).start();
    } else {
      [0.3, 0.5, 0.4, 0.6, 0.35, 0.5, 0.4].forEach((v, i) => waves[i].setValue(v));
      pulseMic.setValue(1);
    }
    return () => anims.forEach(a => a.stop());
  }, [voiceState]);

  useEffect(() => {
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 120);
  }, [chatHistory]);

  const processPhrase = useCallback(async (phrase: string) => {
    if (!phrase.trim()) return;
    clearTimeout(listenRef.current);
    setVoiceState('PROCESSING');
    setInputPhrase('');
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userTurn: ChatTurn = { id: Date.now().toString(), sender: 'user', text: phrase, timestamp: now };
    setChatHistory(p => [...p, userTurn]);

    if (/^(stop|ఆపు|रुको|ৰখোৱা|pause|cancel)$/i.test(phrase.trim())) {
      await stopNative(); setVoiceState('IDLE'); return;
    }
    if (/^(repeat|again|say that again|మళ్ళీ|फिर से|পুনৰ|மீண்டும்)$/i.test(phrase.trim())) {
      if (lastSpokenText) await doSpeak(lastSpokenText, currentLang); return;
    }

    try {
      const orchResult = await defaultVoiceOrchestrator.processUserSpeech(phrase);
      if (orchResult && orchResult.intent !== 'UNKNOWN') {
        const at: ChatTurn = {
          id: (Date.now()+1).toString(), sender: 'assistant',
          text: orchResult.spokenResponse, spokenAudioText: orchResult.spokenResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          intentLabel: orchResult.intent.replace(/_/g, ' '),
        };
        setChatHistory(p => [...p, at]);
        if (orchResult.requiresConfirmation) { setVoiceState('CONFIRMING'); await speakNative(orchResult.spokenResponse, currentLang); }
        else { await doSpeak(orchResult.spokenResponse, currentLang); }
        return;
      }
    } catch {}

    try {
      const ex = await voiceIntelligence.executeVoiceCommand(phrase, user?.id || 'demo-elder-id');
      if (ex.canonicalIntent) setCurrentIntent(ex.canonicalIntent);
      const at: ChatTurn = {
        id: (Date.now()+1).toString(), sender: 'assistant',
        text: ex.responseText, spokenAudioText: ex.responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intentLabel: ex.canonicalIntent?.intent || 'Companion',
      };
      setChatHistory(p => [...p, at]);
      if (ex.confirmationRequired) { setVoiceState('CONFIRMING'); await speakNative(ex.responseText, currentLang); }
      else { await doSpeak(ex.responseText, currentLang); }
    } catch {
      const fb = LANG_GREETINGS[currentLang] || "I'm here! Could you please repeat that?";
      const at: ChatTurn = { id: (Date.now()+1).toString(), sender: 'assistant', text: fb, spokenAudioText: fb, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), intentLabel: 'Companion' };
      setChatHistory(p => [...p, at]);
      await doSpeak(fb, currentLang);
    }
  }, [currentLang, lastSpokenText, doSpeak, user?.id]);

  const handleMicPress = async () => {
    if (voiceState === 'SPEAKING') { await stopNative(); setVoiceState('IDLE'); return; }
    if (voiceState === 'LISTENING') { clearTimeout(listenRef.current); setVoiceState('IDLE'); return; }
    setVoiceState('LISTENING');
    const prompt = LANG_LISTEN_PROMPT[currentLang] || LANG_LISTEN_PROMPT['en'];

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        try {
          await speakNative(prompt, currentLang);
          const rec = new SR();
          rec.lang = BCP47[currentLang] || 'en-IN';
          rec.continuous = false; rec.interimResults = false;
          rec.onresult = (e: any) => { const t = e.results[0][0]?.transcript; if (t) processPhrase(t); };
          rec.onerror = () => { setVoiceState('IDLE'); textInputRef.current?.focus(); };
          rec.onend = () => { if (mountedRef.current) setVoiceState(p => p === 'LISTENING' ? 'IDLE' : p); };
          rec.start();
          listenRef.current = setTimeout(() => { if (mountedRef.current) setVoiceState(p => p === 'LISTENING' ? 'IDLE' : p); }, 8000);
          return;
        } catch {}
      }
    }
    await speakNative(prompt, currentLang);
    textInputRef.current?.focus();
    listenRef.current = setTimeout(() => { if (mountedRef.current) setVoiceState(p => p === 'LISTENING' ? 'IDLE' : p); }, 10000);
  };

  const handleConfirmAction = async () => {
    if (!currentIntent) return;
    if (currentIntent.intent === 'start_game') { setVoiceState('IDLE'); navigation.navigate('Games'); return; }
    if (currentIntent.intent === 'call_family') { setVoiceState('IDLE'); navigation.navigate('FamilyCorner'); return; }
    const msgs: Record<string, string> = { te: 'అద్భుతం! విజయవంతంగా నమోదు చేశాను!', hi: 'बहुत अच्छा! सुरक्षित कर लिया।', as: "বহুত ভাল! সংৰক্ষিত হ'ল।", en: 'Done! Saved safely.' };
    const msg = msgs[currentLang] || msgs['en'];
    const at: ChatTurn = { id: Date.now().toString(), sender: 'assistant', text: msg, spokenAudioText: msg, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatHistory(p => [...p, at]);
    setCurrentIntent(null);
    await doSpeak(msg, currentLang);
  };

  const waveColor = voiceState === 'LISTENING' ? colors.danger : voiceState === 'SPEAKING' ? colors.secondary : colors.primary;
  const micBgColor: Record<VoiceState, string> = {
    IDLE: colors.primary, LISTENING: colors.danger, PROCESSING: colors.warning,
    CONFIRMING: colors.warning, SPEAKING: colors.secondary, ERROR: colors.danger, OFFLINE: colors.muted,
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.screen} {...panHandlers}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={goBackSafe} accessibilityRole="button" activeOpacity={0.75}>
          <ArrowLeft size={18} color={colors.primary} />
          <Text style={styles.backBtnText}>{t('nav.back') || 'Back'}</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('voice.headerTitle') || 'SMRITI+ Voice'}</Text>
          <View style={styles.langPill}>
            <Text style={styles.langPillText}>{langCap.nativeName}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.repeatBtn} onPress={() => { if (lastSpokenText) doSpeak(lastSpokenText, currentLang); }} activeOpacity={0.75}>
          <RotateCcw size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Visualizer */}
      <View style={styles.vizSection}>
        <View style={styles.waveRow}>
          {waves.map((w, i) => (
            <Animated.View key={i} style={[styles.waveBar, { transform: [{ scaleY: w }], backgroundColor: waveColor, height: i === 3 ? 28 : 20, opacity: voiceState === 'IDLE' ? 0.3 : 0.9 }]} />
          ))}
        </View>
        <Text style={[styles.stateLabel, { color: voiceState === 'LISTENING' ? colors.danger : colors.primaryDark }]}>
          {getStateLabel(currentLang, voiceState)}
        </Text>
        {voiceState === 'SPEAKING' && (
          <View style={styles.speechControls}>
            <TouchableOpacity style={styles.stopBtn} onPress={async () => { await stopNative(); setVoiceState('IDLE'); }} activeOpacity={0.8}>
              <MicOff size={14} color={colors.danger} />
              <Text style={styles.stopBtnText}>{t('voice.stop') || 'Stop'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctrlBtn} onPress={() => { if (lastSpokenText) doSpeak(lastSpokenText, currentLang); }} activeOpacity={0.8}>
              <RotateCcw size={14} color={colors.primaryDark} />
              <Text style={styles.ctrlBtnText}>{t('voice.repeat') || 'Repeat'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ctrlBtn} onPress={() => { if (lastSpokenText) doSpeak(lastSpokenText, currentLang, 0.65); }} activeOpacity={0.8}>
              <Volume2 size={14} color={colors.primaryDark} />
              <Text style={styles.ctrlBtnText}>{t('voice.slower') || 'Slower'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {Platform.OS !== 'web' && voiceState === 'IDLE' && (
        <View style={styles.hintBar}>
          <Text style={styles.hintText}>💡 {t('voice.typeHint') || 'Type below or tap a quick phrase — voice playback works on all devices'}</Text>
        </View>
      )}

      {/* Chat */}
      <ScrollView ref={chatScrollRef} style={styles.chat} contentContainerStyle={styles.chatContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {voiceState === 'CONFIRMING' && currentIntent && (
          <View style={styles.confirmCard}>
            <Text style={styles.confirmLabel}>{t('voice.confirmAction') || '⚡ CONFIRM ACTION'}</Text>
            <Text style={styles.confirmPrompt}>{currentIntent.confirmationPrompt}</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.confirmYes} onPress={handleConfirmAction} activeOpacity={0.8}>
                <Text style={styles.confirmYesText}>✓ {t('voice.yes') || 'Yes, Do This'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmNo} onPress={async () => { await stopNative(); setVoiceState('IDLE'); setCurrentIntent(null); }} activeOpacity={0.8}>
                <Text style={styles.confirmNoText}>✕ {t('voice.cancel') || 'Cancel'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {chatHistory.map(turn => (
          <View key={turn.id} style={[styles.bubble, turn.sender === 'user' ? styles.userBubble : styles.assistantBubble]}>
            <View style={styles.bubbleHeader}>
              <Text style={[styles.senderLabel, turn.sender === 'assistant' && { color: colors.primaryDark }]}>
                {turn.sender === 'user' ? (user?.name || t('voice.you') || 'You') : 'SMRITI+'}
              </Text>
              {turn.intentLabel && turn.intentLabel !== 'Companion' && (
                <View style={styles.intentPill}><Text style={styles.intentPillText}>{turn.intentLabel.replace(/_/g, ' ')}</Text></View>
              )}
              {turn.spokenAudioText && turn.sender === 'assistant' && (
                <TouchableOpacity style={styles.replayBtn} onPress={() => { if (turn.spokenAudioText) doSpeak(turn.spokenAudioText, currentLang); }}>
                  <Volume2 size={14} color={colors.primaryDark} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.bubbleText, turn.sender === 'user' && styles.userBubbleText]}>{turn.text}</Text>
            <Text style={styles.tsText}>{turn.timestamp}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Quick Chips */}
      <View style={styles.chipsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContent} keyboardShouldPersistTaps="handled">
          {getChips(currentLang).map((chip, i) => (
            <TouchableOpacity key={i} style={styles.chip} onPress={() => processPhrase(chip.spoken)} activeOpacity={0.75}>
              <Text style={styles.chipTag}>{chip.tag}</Text>
              <Text style={styles.chipPhrase}>{chip.phrase}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <Animated.View style={[styles.micRing, { backgroundColor: (micBgColor[voiceState] || colors.primary) + '22', transform: [{ scale: pulseMic }] }]}>
          <TouchableOpacity style={[styles.micBtn, { backgroundColor: micBgColor[voiceState] || colors.primary }]} onPress={handleMicPress} activeOpacity={0.82} accessibilityRole="button" accessibilityLabel={t('voice.speak') || 'Speak to SMRITI+'}>
            {voiceState === 'LISTENING' ? <MicOff size={22} color="#FFF" strokeWidth={2.4} /> : <Mic size={22} color="#FFF" strokeWidth={2.4} />}
          </TouchableOpacity>
        </Animated.View>
        <TextInput
          ref={textInputRef}
          style={styles.textInput}
          value={inputPhrase}
          onChangeText={setInputPhrase}
          placeholder={voiceState === 'LISTENING' ? (t('voice.listeningPlaceholder') || 'Listening… type to send') : (t('voice.typePlaceholder') || 'Type your message…')}
          placeholderTextColor={colors.muted}
          onSubmitEditing={() => { if (inputPhrase.trim()) processPhrase(inputPhrase.trim()); }}
          returnKeyType="send"
        />
        <TouchableOpacity style={[styles.sendBtn, !inputPhrase.trim() && { opacity: 0.4 }]} disabled={!inputPhrase.trim()} onPress={() => { if (inputPhrase.trim()) processPhrase(inputPhrase.trim()); }} accessibilityRole="button">
          <Send size={18} color="#FFF" strokeWidth={2.4} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: Platform.OS === 'ios' ? 56 : 36, paddingBottom: spacing.sm, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, backgroundColor: colors.primaryLight, borderRadius: 100, minHeight: 44, gap: 6 },
  backBtnText: { fontFamily: fontFamily.display, fontSize: 15, fontWeight: '700', color: colors.primary },
  headerCenter: { alignItems: 'center', flex: 1, paddingHorizontal: 8 },
  headerTitle: { fontFamily: fontFamily.display, fontSize: 20, fontWeight: '800', color: colors.textDark, letterSpacing: -0.3 },
  langPill: { marginTop: 3, backgroundColor: colors.primaryMuted, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100 },
  langPillText: { fontFamily: fontFamily.display, fontSize: 13, fontWeight: '700', color: colors.primaryDark },
  repeatBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  vizSection: { alignItems: 'center', backgroundColor: colors.surface, paddingVertical: 12, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  waveRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, height: 32 },
  waveBar: { width: 6, borderRadius: 3 },
  stateLabel: { fontFamily: fontFamily.display, fontSize: 14, fontWeight: '700', marginTop: 6, letterSpacing: 0.1 },
  speechControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 10 },
  stopBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.dangerBg, borderWidth: 1.5, borderColor: colors.danger, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 100, minHeight: 44 },
  stopBtnText: { fontFamily: fontFamily.display, fontSize: 14, fontWeight: '800', color: colors.danger },
  ctrlBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 100, minHeight: 44 },
  ctrlBtnText: { fontFamily: fontFamily.display, fontSize: 14, fontWeight: '700', color: colors.textDark },
  hintBar: { backgroundColor: colors.accentGoldBg, paddingHorizontal: spacing.md, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  hintText: { fontFamily: fontFamily.text, fontSize: 13, color: colors.accentGoldDark, textAlign: 'center' },
  chat: { flex: 1, backgroundColor: colors.background },
  chatContent: { padding: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
  confirmCard: { backgroundColor: colors.accentGoldBg, borderRadius: 16, padding: spacing.lg, borderWidth: 2, borderColor: colors.accentGold, marginBottom: spacing.sm },
  confirmLabel: { fontFamily: fontFamily.display, fontSize: 13, fontWeight: '800', color: colors.accentGoldDark, letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' },
  confirmPrompt: { fontFamily: fontFamily.text, fontSize: 18, lineHeight: 28, color: colors.textDark, marginBottom: spacing.md },
  confirmActions: { gap: spacing.sm },
  confirmYes: { backgroundColor: colors.success, paddingVertical: 16, borderRadius: 12, alignItems: 'center', minHeight: 56, justifyContent: 'center' },
  confirmYesText: { fontFamily: fontFamily.display, fontSize: 20, fontWeight: '800', color: '#FFF' },
  confirmNo: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, paddingVertical: 14, borderRadius: 12, alignItems: 'center', minHeight: 52, justifyContent: 'center' },
  confirmNoText: { fontFamily: fontFamily.display, fontSize: 18, fontWeight: '700', color: colors.textSecondary },
  bubble: { borderRadius: 20, padding: spacing.md, maxWidth: '88%' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  bubbleHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  senderLabel: { fontFamily: fontFamily.display, fontSize: 14, fontWeight: '700', color: colors.primary, flex: 1 },
  intentPill: { backgroundColor: colors.primaryMuted, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100 },
  intentPillText: { fontFamily: fontFamily.display, fontSize: 11, fontWeight: '800', color: colors.primaryDark, textTransform: 'uppercase', letterSpacing: 0.4 },
  replayBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  bubbleText: { fontFamily: fontFamily.text, fontSize: 17, lineHeight: 26, color: colors.textDark, fontWeight: '500' },
  userBubbleText: { color: '#FFF', fontWeight: '600' },
  tsText: { fontFamily: fontFamily.text, fontSize: 11, color: colors.muted, marginTop: 4, alignSelf: 'flex-end' },
  chipsWrap: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 10 },
  chipsContent: { paddingHorizontal: spacing.md, gap: 10, alignItems: 'center' },
  chip: { backgroundColor: colors.primaryLight, borderWidth: 1.5, borderColor: colors.primaryMuted, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 10, minHeight: 46, justifyContent: 'center', alignItems: 'center' },
  chipTag: { fontFamily: fontFamily.display, fontSize: 13, fontWeight: '700', color: colors.primaryDark },
  chipPhrase: { fontFamily: fontFamily.text, fontSize: 11, color: colors.primary, marginTop: 2 },
  bottomBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: spacing.md, paddingTop: 10, paddingBottom: Platform.OS === 'android' ? 20 : Platform.OS === 'ios' ? 28 : 12, gap: 10 },
  micRing: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  micBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  textInput: { flex: 1, height: 48, backgroundColor: colors.surfaceSecondary, borderRadius: 100, paddingHorizontal: 16, fontFamily: fontFamily.text, fontSize: 16, color: colors.textDark, borderWidth: 1.5, borderColor: colors.border },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
