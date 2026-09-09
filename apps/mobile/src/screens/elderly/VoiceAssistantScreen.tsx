/**
 * SMRITI+ — Voice Assistant Screen
 *
 * A warm, interactive, bilingual voice interface tuned for elderly users.
 * Features:
 *  - Animated multi-bar sound-wave visualizer
 *  - Conversational chat bubble history with replay buttons
 *  - Language-specific greeting, honorifics and quick-phrase chips
 *  - 1-tap confirmation card for actions
 *  - Persona/mood control panel (developer/judge panel)
 *  - Proper regional voice via SpeechSynthesizer
 */

import React, { useState, useEffect, useRef } from 'react';
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
import { colors, typography, spacing, borderRadius, shadows, fontFamily } from '../../theme/tokens';
import { ArrowLeft, RotateCcw, Send, Mic } from 'lucide-react-native';
import {
  voiceIntelligence,
  VoiceState,
  CanonicalIntent,
  adaptivePersonaEngine,
} from '../../services/voiceIntelligence';
import { PersonaType, HonorificType } from '../../services/adaptivePersonaEngine';
import { languageRegistry } from '../../services/languageRegistry';
import { offlineStore } from '../../services/offlineStore';
import { VoiceTools, ToolResult } from '../../services/voiceTools';
import { LanguageProfileManager } from '../../services/languageProfiles';
import { defaultVoiceOrchestrator } from '../../services/voice/VoiceOrchestrator';
import { useAuthStore } from '../../state/authStore';
import { useTranslation, getLanguage } from '../../i18n';
import { useBackNavigation } from '../../navigation/useBackNavigation';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatTurn {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  spokenAudioText?: string;
  timestamp: string;
  intentLabel?: string;
}

// ─── Language-specific content maps ──────────────────────────────────────────

const LANG_GREETINGS: Record<string, string> = {
  te: 'నమస్కారం! నేను మీ స్మృతి వాయిస్ అసిస్టెంట్‌ని. ఈరోజు మీకు ఎలా సహాయపడగలను?',
  hi: 'नमस्ते! मैं आपकी स्मृति वॉयस असिस्टेंट हूँ। आज मैं आपकी क्या सहायता कर सकती हूँ?',
  as: 'নমস্কাৰ! মই আপোনাৰ স্মৃতি ভইচ এচিষ্টেণ্ট। আজি মই আপোনাক কেনেকৈ সহায় কৰিব পাৰোঁ?',
  bn: 'নমস্কার! আমি আপনার স্মৃতি ভয়েস সহকারী। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
  ta: 'வணக்கம்! நான் உங்கள் ஸ்மிருதி குரல் உதவியாளர். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?',
  kn: 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಸ್ಮೃತಿ ಧ್ವನಿ ಸಹಾಯಕ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?',
  ml: 'നമസ്കാരം! ഞാൻ നിങ്ങളുടെ സ്മൃതി വോയ്സ് അസിസ്റ്റന്റാണ്. ഇന്ന് ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കട്ടെ?',
  mr: 'नमस्कार! मी तुमची स्मृती व्हॉइस असिस्टंट आहे. आज मी तुम्हाला कशी मदत करू?',
  en: 'Hello! I am your SMRITI voice assistant. How can I help you today?',
};

const LANG_LISTEN_PROMPT: Record<string, string> = {
  te: 'చెప్పండి, వింటున్నాను.',
  hi: 'जी, मैं ध्यान से सुन रही हूँ।',
  as: 'মই শুনি আছোঁ।',
  bn: 'আমি শুনছি, বলুন।',
  ta: 'சொல்லுங்கள், நான் கேட்கிறேன்.',
  kn: 'ಹೇಳಿ, ನಾನು ಕೇಳುತ್ತಿದ್ದೇನೆ.',
  ml: 'പറയൂ, ഞാൻ കേൾക്കുന്നു.',
  mr: 'सांगा, मी ऐकतो आहे.',
  en: 'I am listening. Please speak.',
};

const LANG_STATE_LABELS: Record<string, Record<VoiceState, string>> = {
  te: {
    IDLE: 'నొక్కి మాట్లాడండి',
    LISTENING: 'వింటున్నాను...',
    PROCESSING: 'అర్థం చేసుకుంటున్నాను...',
    CONFIRMING: 'దయచేసి ధృవీకరించండి',
    SPEAKING: 'SMRITI+ మాట్లాడుతోంది...',
    ERROR: 'తిరిగి ప్రయత్నించండి',
    OFFLINE: 'నెట్‌వర్క్ లేదు',
  },
  hi: {
    IDLE: 'बात करने के लिए टैप करें',
    LISTENING: 'सुन रहा हूँ...',
    PROCESSING: 'समझ रहा हूँ...',
    CONFIRMING: 'कृपया पुष्टि करें',
    SPEAKING: 'SMRITI+ बोल रहा है...',
    ERROR: 'दोबारा कोशिश करें',
    OFFLINE: 'नेटवर्क नहीं है',
  },
  as: {
    IDLE: 'কথা ক\'বলৈ টেপ কৰক',
    LISTENING: 'শুনি আছোঁ...',
    PROCESSING: 'বুজি পাইছোঁ...',
    CONFIRMING: 'নিশ্চিত কৰক',
    SPEAKING: 'SMRITI+ কথা কৈ আছে...',
    ERROR: 'পুনৰ চেষ্টা কৰক',
    OFFLINE: 'নেটৱৰ্ক নাই',
  },
  en: {
    IDLE: 'Tap to Speak',
    LISTENING: 'Listening...',
    PROCESSING: 'Understanding...',
    CONFIRMING: 'Please Confirm',
    SPEAKING: 'SMRITI+ speaking...',
    ERROR: 'Please try again',
    OFFLINE: 'No network',
  },
};

// Quick phrase chips shown per language
const QUICK_PHRASE_CHIPS: Record<string, Array<{ tag: string; phrase: string; spoken: string }>> = {
  te: [
    { tag: '📋 షెడ్యూల్', phrase: 'ఈ రోజు షెడ్యూల్ ఏమిటి?', spoken: 'నా ఈ రోజు షెడ్యూల్ ఏమిటి?' },
    { tag: '💊 తర్వాతి మందు', phrase: 'నా తర్వాతి మందు ఎప్పుడు?', spoken: 'నా తర్వాతి మందు ఎప్పుడు?' },
    { tag: '💧 నీళ్ళు', phrase: 'ఈ రోజు నీళ్ళు తాగానా?', spoken: 'ఈ రోజు నేను నీళ్ళు తాగానా?' },
    { tag: '🖼️ జ్ఞాపకాలు', phrase: 'ఫ్యామిలీ జ్ఞాపకాలు చూపించు', spoken: 'ఫ్యామిలీ జ్ఞాపకాలు చూపించు' },
    { tag: '🎮 ఆట', phrase: 'ఒక మెదడు ఆట చెప్పు', spoken: 'ఒక మెదడు ఆట చెప్పు' },
    { tag: '🛡️ రక్షణ', phrase: 'రెండు మాత్రలు వేసుకోవచ్చా?', spoken: 'రెండు మాత్రలు ఒకేసారి వేసుకోవచ్చా?' },
    { tag: '📞 ఫ్యామిలీ', phrase: 'Amma ki call cheyyi', spoken: 'Amma ki call cheyyi' },
    { tag: '🔄 మళ్ళీ', phrase: 'మళ్ళీ చెప్పు', spoken: 'మళ్ళీ చెప్పు' },
    { tag: '🛑 ఆపు', phrase: 'ఆపు', spoken: 'ఆపు' },
  ],
  hi: [
    { tag: '📋 कार्यक्रम', phrase: 'आज का कार्यक्रम क्या है?', spoken: 'मेरा आज का कार्यक्रम क्या है?' },
    { tag: '💊 अगली दवा', phrase: 'मेरी अगली दवाई कब है?', spoken: 'मेरी अगली दवाई कब है?' },
    { tag: '💧 पानी', phrase: 'क्या मैंने पानी पिया?', spoken: 'क्या मैंने आज पानी पिया?' },
    { tag: '🖼️ यादें', phrase: 'परिवार की यादें दिखाओ', spoken: 'परिवार की यादें दिखाओ' },
    { tag: '🎮 खेल', phrase: 'दिमागी खेल बताओ', spoken: 'दिमागी खेल बताओ' },
    { tag: '🛡️ सुरक्षा', phrase: 'क्या दो गोली ले सकता हूँ?', spoken: 'क्या मैं दो गोली ले सकता हूँ?' },
    { tag: '📞 परिवार', phrase: 'बेटे को call karwao', spoken: 'बेटे को फ़ोन करवाओ' },
    { tag: '🔄 दोहरा', phrase: 'फिर से बोलो', spoken: 'फिर से बोलो' },
    { tag: '🛑 रुको', phrase: 'रुको', spoken: 'रुको' },
  ],
  as: [
    { tag: '📋 কাৰ্যসূচী', phrase: 'আজি মোৰ কি কি কাম আছে?', spoken: 'আজি মোৰ কি কি কাম আছে?' },
    { tag: '💊 পিছৰ দৰব', phrase: 'মোৰ পিছৰ দৰব কেতিয়া?', spoken: 'মোৰ পিছৰ দৰব কেতিয়া খাব লাগে?' },
    { tag: '💧 পানী', phrase: 'মই আজি পানী খালোঁনে?', spoken: 'মই আজি পানী খালোঁনে?' },
    { tag: '🖼️ স্মৃতি', phrase: 'পৰিয়ালৰ স্মৃতি দেখুওৱা', spoken: 'পৰিয়ালৰ স্মৃতি দেখুওৱা' },
    { tag: '🎮 খেল', phrase: 'এটা মগজুৰ খেল কোৱা', spoken: 'এটা মগজুৰ খেল কোৱা' },
    { tag: '🛡️ নিৰাপত্তা', phrase: 'দৰবৰ মাত্ৰা বঢ়াব পাৰোঁনে?', spoken: 'দৰবৰ মাত্ৰা বঢ়াব পাৰোঁনে?' },
    { tag: '📞 পৰিয়াল', phrase: 'ছোৱালীক ফোন কৰোৱা', spoken: 'ছোৱালীক ফোন কৰোৱা' },
    { tag: '🔄 পুনৰ', phrase: 'পুনৰ কোৱা', spoken: 'পুনৰ কোৱা' },
    { tag: '🛑 ৰখোৱা', phrase: 'ৰখোৱা', spoken: 'ৰখোৱা' },
  ],
  en: [
    { tag: '📋 Schedule', phrase: 'What is my schedule today?', spoken: 'What is my schedule today?' },
    { tag: '💊 Next Med', phrase: 'When is my next medicine?', spoken: 'When is my next medicine?' },
    { tag: '💧 Water', phrase: 'Did I drink water today?', spoken: 'Did I drink water today?' },
    { tag: '🖼️ Memories', phrase: 'Show my family memories', spoken: 'Show my family memories' },
    { tag: '🎮 Game', phrase: 'Recommend a brain game', spoken: 'Recommend a brain game for me' },
    { tag: '🛡️ Safety', phrase: 'Can I take two pills instead of one?', spoken: 'Can I take two pills instead of one?' },
    { tag: '📞 Family', phrase: 'Call daughter please', spoken: 'Please call my daughter' },
    { tag: '🔄 Repeat', phrase: 'Say that again', spoken: 'Say that again' },
    { tag: '🛑 Stop', phrase: 'Stop', spoken: 'Stop' },
  ],
};

function getLangChips(lang: string) {
  return QUICK_PHRASE_CHIPS[lang] || QUICK_PHRASE_CHIPS['en'];
}

function getStateLabel(lang: string, state: VoiceState): string {
  return (LANG_STATE_LABELS[lang] || LANG_STATE_LABELS['en'])[state];
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function VoiceAssistantScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const onCustomBack = () => {
    try {
      voiceIntelligence.stopSpeech();
    } catch {}
    return false;
  };

  const { goBackSafe, panHandlers } = useBackNavigation(navigation, {
    onCustomBack,
    fallbackTab: 'Home',
  });

  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [transcript, setTranscript] = useState('');
  const [currentIntent, setCurrentIntent] = useState<CanonicalIntent | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatTurn[]>([]);
  const [activePersona, setActivePersona] = useState<PersonaType>('warm_companion');
  const [activeHonorific, setActiveHonorific] = useState<HonorificType>('none');
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [inputPhrase, setInputPhrase] = useState('');

  // Wave animation values
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

  const currentLang = getLanguage() || 'en';
  const langCap = languageRegistry.getCapability(currentLang);

  // ── Initial greeting ──
  useEffect(() => {
    voiceIntelligence.updateContext({
      currentScreen: 'voice',
      primaryLanguage: currentLang,
    });
    adaptivePersonaEngine.setHonorific(activeHonorific);
    syncPersona();

    const greeting = LANG_GREETINGS[currentLang] || LANG_GREETINGS['en'];
    const turn: ChatTurn = {
      id: '1',
      sender: 'assistant',
      text: greeting,
      spokenAudioText: greeting.replace(/\n/g, ' '),
      timestamp: 'Just now',
    };
    setChatHistory([turn]);

    // Auto-speak greeting on load
    setTimeout(() => {
      voiceIntelligence.speak(turn.spokenAudioText!, currentLang);
    }, 600);
  }, [currentLang]);

  useEffect(() => {
    defaultVoiceOrchestrator.setLanguage(currentLang);
    defaultVoiceOrchestrator.setCurrentScreen('voice');
    defaultVoiceOrchestrator.registerActionHandlers({
      startGame: (gameId?: string, difficulty?: number) => {
        navigation.navigate('Games');
        return true;
      },
      openReminders: () => {
        navigation.navigate('Reminders');
      },
      openProgress: () => {
        navigation.navigate('Reminders');
      },
      navigate: (screen: string) => {
        navigation.navigate(screen);
      },
    });
  }, [currentLang, navigation]);

  const syncPersona = () => {
    const p = adaptivePersonaEngine.getProfile();
    setActivePersona(p.currentPersona);
  };

  // ── Wave animation ──
  useEffect(() => {
    let anims: Animated.CompositeAnimation[] = [];
    if (voiceState === 'LISTENING' || voiceState === 'SPEAKING') {
      const durations = [420, 360, 500, 330, 480, 390, 445];
      const mins = [0.15, 0.25, 0.10, 0.35, 0.20, 0.28, 0.12];
      const maxs = [1.0,  0.85, 1.0,  0.8,  0.95, 0.88, 0.92];
      anims = waves.map((w, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(w, { toValue: maxs[i], duration: durations[i], useNativeDriver: false }),
            Animated.timing(w, { toValue: mins[i], duration: durations[i], useNativeDriver: false }),
          ])
        )
      );
      anims.forEach((a) => a.start());

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseMic, { toValue: 1.12, duration: 750, useNativeDriver: false }),
          Animated.timing(pulseMic, { toValue: 1.0, duration: 750, useNativeDriver: false }),
        ])
      ).start();
    } else {
      const defaults = [0.3, 0.5, 0.4, 0.6, 0.35, 0.5, 0.4];
      waves.forEach((w, i) => w.setValue(defaults[i]));
      pulseMic.setValue(1);
    }
    return () => anims.forEach((a) => a.stop());
  }, [voiceState]);

  // ── Auto-scroll chat ──
  useEffect(() => {
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [chatHistory]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleMicPress = async () => {
    if (voiceState === 'SPEAKING') {
      await voiceIntelligence.stopSpeech();
      setVoiceState('IDLE');
      return;
    }
    if (voiceState === 'LISTENING') {
      setVoiceState('IDLE');
      return;
    }

    setVoiceState('LISTENING');
    setTranscript('');
    setCurrentIntent(null);

    const prompt = LANG_LISTEN_PROMPT[currentLang] || LANG_LISTEN_PROMPT['en'];
    await voiceIntelligence.speak(prompt, currentLang);

    // Real Web Speech API recognition (Browser)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SR) {
        try {
          const recognition = new SR();
          recognition.lang = langCap.bcp47;
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.onresult = (evt: any) => {
            const t = evt.results[0][0]?.transcript;
            if (t) processPhrase(t);
          };
          recognition.onerror = () => {
            setVoiceState('IDLE');
          };
          recognition.onend = () => {
            setVoiceState((prev) => (prev === 'LISTENING' ? 'IDLE' : prev));
          };
          recognition.start();
          return;
        } catch {}
      }
    }
  };

  const processPhrase = async (phrase: string) => {
    setVoiceState('PROCESSING');
    setTranscript(phrase);

    const userTurn: ChatTurn = {
      id: Date.now().toString(),
      sender: 'user',
      text: phrase,
      timestamp: 'Just now',
    };
    setChatHistory((prev) => [...prev, userTurn]);

    // Track behavioral signals
    if (/కష్టం|difficult|mushkil|ਔਖਾ/i.test(phrase)) {
      adaptivePersonaEngine.recordBehavioralSignal('struggle');
    } else if (/tired|అలసట|thak|আৰাম/i.test(phrase)) {
      adaptivePersonaEngine.recordBehavioralSignal('fatigue');
    } else if (/మళ్ళీ|repeat|phir|পুনৰ/i.test(phrase)) {
      adaptivePersonaEngine.recordBehavioralSignal('repeat');
    }
    syncPersona();

    // 1. Direct barge-in stop (Section 14)
    if (/^(stop|ఆపు|रुको|ৰখোৱা|pause|cancel)$/i.test(phrase.trim())) {
      await voiceIntelligence.stopSpeech();
      setVoiceState('IDLE');
      return;
    }

    // 2. Direct repeat (Section 15)
    if (/^(repeat|again|say that again|మళ్ళీ చెప్పు|फिर से बोलो|পুনৰ কোৱা)$/i.test(phrase.trim())) {
      setVoiceState('SPEAKING');
      await voiceIntelligence.repeatLastResponse();
      setTimeout(() => setVoiceState('IDLE'), 2800);
      return;
    }

    // 3. Master Voice Orchestrator Pipeline (Context, Multi-turn, In-Game, Plan)
    const orchResult = await defaultVoiceOrchestrator.processUserSpeech(phrase);
    if (orchResult && orchResult.intent !== 'UNKNOWN') {
      const assistantTurn: ChatTurn = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: orchResult.spokenResponse,
        spokenAudioText: orchResult.spokenResponse,
        timestamp: 'Just now',
        intentLabel: orchResult.intent.replace(/_/g, ' '),
      };
      setChatHistory((prev) => [...prev, assistantTurn]);
      if (orchResult.requiresConfirmation) {
        setVoiceState('CONFIRMING');
      } else {
        setVoiceState('SPEAKING');
        setTimeout(() => setVoiceState('IDLE'), 3500);
      }
      return;
    }

    // 4. Voice Intelligence Router (Tools & Medical Safety Boundaries)
    const execResult = await voiceIntelligence.executeVoiceCommand(phrase, user?.id || 'demo-elder-id');

    if (execResult.isSafetyRefusal) {
      const assistantTurn: ChatTurn = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: `🛡️ Medical Safety Boundary:\n${execResult.responseText}`,
        spokenAudioText: execResult.responseText,
        timestamp: 'Just now',
        intentLabel: 'Medical Safety',
      };
      setChatHistory((prev) => [...prev, assistantTurn]);
      setVoiceState('SPEAKING');
      await voiceIntelligence.speak(execResult.responseText, currentLang);
      setTimeout(() => setVoiceState('IDLE'), 3500);
      return;
    }

    if (execResult.toolResult) {
      const assistantTurn: ChatTurn = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: `⚡ ${execResult.toolResult.tool.replace(/_/g, ' ').toUpperCase()}:\n${execResult.responseText}`,
        spokenAudioText: execResult.responseText,
        timestamp: 'Just now',
        intentLabel: execResult.toolResult.tool.replace(/_/g, ' '),
      };
      setChatHistory((prev) => [...prev, assistantTurn]);
      setVoiceState('SPEAKING');
      await voiceIntelligence.speak(execResult.responseText, currentLang);
      setTimeout(() => setVoiceState('IDLE'), 3500);
      return;
    }

    // 4. Conversational / Transactional Response from Voice Intelligence
    if (execResult.canonicalIntent) {
      setCurrentIntent(execResult.canonicalIntent);
    }

    const assistantTurn: ChatTurn = {
      id: (Date.now() + 1).toString(),
      sender: 'assistant',
      text: execResult.responseText,
      spokenAudioText: execResult.responseText,
      timestamp: 'Just now',
      intentLabel: execResult.canonicalIntent && execResult.canonicalIntent.intent !== 'unknown' 
        ? execResult.canonicalIntent.intent 
        : 'Companion',
    };
    setChatHistory((prev) => [...prev, assistantTurn]);

    if (execResult.confirmationRequired) {
      setVoiceState('CONFIRMING');
      await voiceIntelligence.speak(execResult.responseText, currentLang);
    } else {
      setVoiceState('SPEAKING');
      await voiceIntelligence.speak(execResult.responseText, currentLang);
      setTimeout(() => setVoiceState('IDLE'), 3000);
    }
  };

  const handleStopSpeech = async () => {
    await voiceIntelligence.stopSpeech();
    setVoiceState('IDLE');
  };

  const handleRepeatSpeech = async () => {
    setVoiceState('SPEAKING');
    await voiceIntelligence.repeatLastResponse();
    setTimeout(() => setVoiceState('IDLE'), 2800);
  };

  const handleSlowerSpeech = async () => {
    const currentProfile = adaptivePersonaEngine.getProfile();
    const newSpeed = Math.max(0.65, currentProfile.speechSpeed - 0.1);
    adaptivePersonaEngine.setSpeechSpeed(newSpeed);
    syncPersona();
    setVoiceState('SPEAKING');
    await voiceIntelligence.repeatLastResponse();
    setTimeout(() => setVoiceState('IDLE'), 3200);
  };

  const handleConfirmAction = async () => {
    if (!currentIntent) return;
    adaptivePersonaEngine.recordBehavioralSignal('success');
    syncPersona();

    if (currentIntent.intent === 'create_reminder' && user?.id) {
      await offlineStore.createLocalReminder({
        elder_id: user.id,
        title: currentIntent.category === 'hydration' ? 'Drink Water' : 'Take Medicine',
        category: currentIntent.category || 'medication',
        scheduled_time: currentIntent.time || '08:00',
        recurrence_pattern: currentIntent.recurrence || 'daily',
      });
    } else if (currentIntent.intent === 'log_reminder' && user?.id) {
      await offlineStore.recordReminderAction({
        reminder_id: 'voice-routine-action',
        elder_id: user.id,
        scheduled_for: new Date().toISOString(),
        action: 'completed',
        response_time_seconds: 3,
        confirmed_via: 'voice',
      });
    } else if (currentIntent.intent === 'start_game') {
      setVoiceState('IDLE');
      navigation.navigate('Games');
      return;
    } else if (currentIntent.intent === 'call_family') {
      setVoiceState('IDLE');
      navigation.navigate('FamilyCorner');
      return;
    }

    const confirmMsg: Record<string, string> = {
      te: '✅ అద్భుతం! విజయవంతంగా నమోదు చేశాను!',
      hi: '✅ बहुत अच्छा! सुरक्षित कर लिया गया।',
      as: '✅ বহুত ভাল! সংৰক্ষিত হ\'ল।',
      en: '✅ Done! Saved safely for you.',
    };
    const msg = confirmMsg[currentLang] || confirmMsg['en'];
    const confirmTurn: ChatTurn = {
      id: Date.now().toString(),
      sender: 'assistant',
      text: msg,
      spokenAudioText: msg,
      timestamp: 'Just now',
    };
    setChatHistory((prev) => [...prev, confirmTurn]);
    setVoiceState('SPEAKING');
    await voiceIntelligence.speak(msg, currentLang);
    setTimeout(() => setVoiceState('IDLE'), 2800);
  };

  const handleCancelAction = async () => {
    await voiceIntelligence.stopSpeech();
    setVoiceState('IDLE');
    setTranscript('');
    setCurrentIntent(null);
  };

  const handleReplay = async (turn: ChatTurn) => {
    if (turn.spokenAudioText) {
      setVoiceState('SPEAKING');
      await voiceIntelligence.speak(turn.spokenAudioText, currentLang);
      setVoiceState('IDLE');
    }
  };

  const personaProfile = adaptivePersonaEngine.getProfile();

  // ─── UI helpers ────────────────────────────────────────────────────────────

  const personaIcon = {
    ultra_gentle: '🌿',
    warm_companion: '☀️',
    encouraging_coach: '🌟',
    calm_evening: '🌙',
  }[activePersona] || '☀️';

  const micIcon = {
    IDLE: '🎤',
    LISTENING: '🛑',
    PROCESSING: '⏳',
    CONFIRMING: '❓',
    SPEAKING: '🔊',
    ERROR: '⚠️',
    OFFLINE: '📶',
  }[voiceState];

  const micBgColor = {
    IDLE: colors.teal,
    LISTENING: '#DC2626',
    PROCESSING: colors.gold,
    CONFIRMING: '#B45309',
    SPEAKING: colors.systemBlue,
    ERROR: '#DC2626',
    OFFLINE: colors.muted,
  }[voiceState] || colors.teal;

  const waveColor = voiceState === 'LISTENING'
    ? '#DC2626'
    : voiceState === 'SPEAKING'
    ? colors.systemBlue
    : colors.teal;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
      {...panHandlers}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={goBackSafe}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          activeOpacity={0.75}
        >
          <ArrowLeft size={16} color={colors.teal} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>SMRITI+ Voice</Text>
          <View style={styles.langPill}>
            <Text style={styles.langPillText} numberOfLines={1}>{langCap.nativeName}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.repeatBtn}
          onPress={() => voiceIntelligence.repeatLastResponse()}
          accessibilityRole="button"
          accessibilityLabel="Repeat last response"
          activeOpacity={0.75}
        >
          <RotateCcw size={18} color={colors.teal} />
        </TouchableOpacity>
      </View>

      {/* ── Compact Visualizer & State Banner ────────────────────────────── */}
      <View style={styles.compactVisualizerSection}>
        <View style={styles.compactWaveRow}>
          {waves.map((w, i) => (
            <Animated.View
              key={i}
              style={[
                styles.waveBar,
                {
                  transform: [{ scaleY: w }],
                  backgroundColor: waveColor,
                  height: i === 3 ? 24 : 18,
                  opacity: voiceState === 'IDLE' ? 0.4 : 1,
                },
              ]}
            />
          ))}
        </View>
        <Text style={styles.compactStateLabel}>{getStateLabel(currentLang, voiceState)}</Text>

        {/* Floating Active Speech Controls */}
        {voiceState === 'SPEAKING' && (
          <View style={styles.speakingControlBar}>
            <TouchableOpacity style={styles.speakingBtnStop} onPress={handleStopSpeech}>
              <Text style={styles.speakingBtnStopText}>🛑 Stop</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.speakingBtn} onPress={handleRepeatSpeech}>
              <Text style={styles.speakingBtnText}>🔁 Repeat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.speakingBtn} onPress={handleSlowerSpeech}>
              <Text style={styles.speakingBtnText}>🐢 Slower</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Conversational Chat History (flex: 1) ─────────────────────────── */}
      <ScrollView
        ref={chatScrollRef}
        style={styles.chatScroll}
        contentContainerStyle={styles.chatScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Confirmation Card if active */}
        {voiceState === 'CONFIRMING' && currentIntent && (
          <View style={styles.confirmCard}>
            <Text style={styles.confirmLabel}>⚡ CONFIRM ACTION</Text>
            <Text style={styles.confirmPrompt}>{currentIntent.confirmationPrompt}</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.confirmYes} onPress={handleConfirmAction}>
                <Text style={styles.confirmYesText}>✓ Yes, Do This</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmNo} onPress={handleCancelAction}>
                <Text style={styles.confirmNoText}>✕ Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {chatHistory.map((turn) => (
          <View
            key={turn.id}
            style={[
              styles.bubble,
              turn.sender === 'user' ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            <View style={styles.bubbleHeader}>
              <Text style={[styles.senderLabel, turn.sender === 'assistant' && { color: colors.teal }]}>
                {turn.sender === 'user' ? (user?.name || 'You') : 'SMRITI+'}
              </Text>
              {turn.intentLabel && (
                <View style={styles.intentPill}>
                  <Text style={styles.intentPillText}>{turn.intentLabel.replace(/_/g, ' ')}</Text>
                </View>
              )}
              {turn.spokenAudioText && turn.sender === 'assistant' && (
                <TouchableOpacity
                  style={styles.replayBtn}
                  onPress={() => handleReplay(turn)}
                  accessibilityRole="button"
                  accessibilityLabel="Replay audio"
                >
                  <Text style={styles.replayBtnText}>▶</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.bubbleText, turn.sender === 'user' && styles.userBubbleText]}>
              {turn.text}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* ── Single-Row Horizontal Quick Action Chips ──────────────────────── */}
      <View style={styles.chipsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScrollContent}
        >
          {getLangChips(currentLang).map((chip, i) => (
            <TouchableOpacity
              key={i}
              style={styles.chipPill}
              onPress={() => processPhrase(chip.spoken)}
              activeOpacity={0.75}
            >
              <Text style={styles.chipPillText}>{chip.tag} · "{chip.phrase}"</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Bottom Interactive Voice & Text Bar (Mobile Optimized) ────────── */}
      <View style={styles.bottomControlBar}>
        <Animated.View
          style={[
            styles.bottomMicRing,
            { backgroundColor: micBgColor + '25', transform: [{ scale: pulseMic }] },
          ]}
        >
          <TouchableOpacity
            style={[styles.bottomMicBtn, { backgroundColor: micBgColor }]}
            onPress={handleMicPress}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel="Speak to SMRITI+"
          >
            <Mic size={22} color="#FFFFFF" strokeWidth={2.4} />
          </TouchableOpacity>
        </Animated.View>

        <TextInput
          style={styles.textInputBar}
          value={inputPhrase}
          onChangeText={setInputPhrase}
          placeholder={voiceState === 'LISTENING' ? 'Listening... Speak or tap send' : 'Type or tap quick phrase...'}
          placeholderTextColor={colors.muted}
          onSubmitEditing={() => {
            if (inputPhrase.trim()) {
              processPhrase(inputPhrase.trim());
              setInputPhrase('');
            }
          }}
          returnKeyType="send"
        />

        <TouchableOpacity
          style={[styles.sendBtn, !inputPhrase.trim() && { opacity: 0.4 }]}
          disabled={!inputPhrase.trim()}
          onPress={() => {
            if (inputPhrase.trim()) {
              processPhrase(inputPhrase.trim());
              setInputPhrase('');
            }
          }}
        >
          <Send size={18} color="#FFFFFF" strokeWidth={2.4} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: borderRadius.pill,
    minHeight: 40,
    justifyContent: 'center',
    gap: 6,
  },
  backBtnText: {
    fontFamily: fontFamily.display,
    fontSize: 15,
    fontWeight: '700',
    color: colors.teal,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fontFamily.display,
    fontSize: 20,
    fontWeight: '800',
    color: colors.navy,
    letterSpacing: -0.3,
  },
  langPill: {
    marginTop: 3,
    backgroundColor: colors.tealBg,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  langPillText: {
    fontFamily: fontFamily.display,
    fontSize: 12,
    fontWeight: '700',
    color: colors.teal,
  },
  repeatBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Persona banner
  personaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  personaEmoji: {
    fontSize: 26,
  },
  personaTone: {
    fontFamily: fontFamily.display,
    fontSize: 15,
    fontWeight: '700',
    color: colors.navy,
  },
  personaMeta: {
    fontFamily: fontFamily.text,
    fontSize: 13,
    color: colors.muted,
    marginTop: 1,
  },

  // Compact Visualizer (Mobile optimized, no excessive height)
  compactVisualizerSection: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.subtle,
  },
  compactWaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 26,
  },
  compactStateLabel: {
    fontFamily: fontFamily.display,
    fontSize: 14,
    fontWeight: '700',
    color: colors.tealDeep,
    marginTop: 4,
    letterSpacing: 0.1,
  },
  waveBar: {
    width: 6,
    borderRadius: 3,
  },
  speakingControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  speakingBtnStop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
    borderColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.pill,
    minHeight: 46,
    ...shadows.subtle,
  },
  speakingBtnStopText: {
    fontFamily: fontFamily.display,
    fontSize: 16,
    fontWeight: '800',
    color: '#DC2626',
  },
  speakingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.pill,
    minHeight: 46,
    ...shadows.subtle,
  },
  speakingBtnText: {
    fontFamily: fontFamily.display,
    fontSize: 15,
    fontWeight: '700',
    color: colors.navy,
  },
  transcriptBubble: {
    marginTop: spacing.sm,
    backgroundColor: colors.tealBg,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxWidth: '85%',
    borderWidth: 1,
    borderColor: colors.glassTealBorder,
  },
  transcriptText: {
    fontFamily: fontFamily.text,
    fontSize: 16,
    color: colors.tealDeep,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Chat Scrollable area (Fills middle viewport, scrolls naturally without layout sliding)
  chatScroll: {
    flex: 1,
  },
  chatScrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },

  // Confirmation card
  confirmCard: {
    backgroundColor: '#FEFCE8',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: '#D97706',
    ...shadows.elevated,
  },
  confirmLabel: {
    fontFamily: fontFamily.display,
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  confirmPrompt: {
    ...typography.elderly.body,
    color: colors.navy,
    marginBottom: spacing.lg,
    lineHeight: 28,
  },
  confirmActions: {
    gap: spacing.sm,
  },
  confirmYes: {
    backgroundColor: colors.teal,
    paddingVertical: 16,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
    ...shadows.glowTeal,
  },
  confirmYesText: {
    fontFamily: fontFamily.display,
    fontSize: 20,
    fontWeight: '800',
    color: colors.white,
  },
  confirmNo: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  confirmNoText: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    fontWeight: '700',
    color: colors.muted,
  },

  // Chat
  chatSection: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
  },
  bubble: {
    borderRadius: 20,
    padding: spacing.md + 2,
    maxWidth: '88%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.teal,
    borderBottomRightRadius: 4,
    borderWidth: 0,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  bubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  senderLabel: {
    fontFamily: fontFamily.display,
    fontSize: 13,
    fontWeight: '700',
    color: colors.teal,
    flex: 1,
  },
  intentPill: {
    backgroundColor: colors.tealBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  intentPillText: {
    fontFamily: fontFamily.display,
    fontSize: 10,
    fontWeight: '800',
    color: colors.teal,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  replayBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.tealBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replayBtnText: {
    fontSize: 12,
    color: colors.teal,
    fontWeight: '700',
  },
  bubbleText: {
    fontFamily: fontFamily.text,
    fontSize: 18,
    lineHeight: 26,
    color: colors.textDark,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  userBubbleText: {
    color: colors.white,
    fontWeight: '600',
  },

  // Horizontal Quick phrase chips (Single row swipe, zero excess scroll)
  chipsWrapper: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingVertical: 8,
  },
  chipsScrollContent: {
    paddingHorizontal: spacing.md,
    gap: 8,
    alignItems: 'center',
  },
  chipPill: {
    backgroundColor: colors.tealBg,
    borderWidth: 1,
    borderColor: colors.glassTealBorder,
    borderRadius: borderRadius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    ...shadows.subtle,
  },
  chipPillText: {
    fontFamily: fontFamily.display,
    fontSize: 13,
    fontWeight: '700',
    color: colors.tealDeep,
  },

  // Interactive Bottom Bar (Mobile Navigation Safe & Production Ready)
  bottomControlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'android' ? 24 : Platform.OS === 'ios' ? 24 : 12,
    gap: 10,
    ...shadows.elevated,
  },
  bottomMicRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomMicBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glowTeal,
  },
  textInputBar: {
    flex: 1,
    height: 46,
    backgroundColor: '#F1F5F9',
    borderRadius: borderRadius.pill,
    paddingHorizontal: 16,
    fontFamily: fontFamily.text,
    fontSize: 15,
    color: colors.textDark,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glowTeal,
  },

  // Debug panel
  debugSection: {
    marginTop: spacing.xs,
  },
  debugToggle: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(10,22,40,0.05)',
    borderRadius: borderRadius.md,
  },
  debugToggleText: {
    fontFamily: fontFamily.display,
    fontSize: 14,
    fontWeight: '700',
    color: colors.muted,
  },
  debugBody: {
    backgroundColor: colors.navy,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  debugHeading: {
    fontFamily: fontFamily.display,
    fontSize: 13,
    fontWeight: '700',
    color: colors.tealLight,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  pillActive: {
    backgroundColor: colors.teal,
  },
  pillText: {
    fontFamily: fontFamily.display,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
  },
  pillTextActive: {
    color: colors.white,
    fontWeight: '800',
  },
  telemetry: {
    marginTop: 14,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  teleLine: {
    fontFamily: fontFamily.mono,
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 3,
  },
});
