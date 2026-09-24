/**
 * SMRITI+ — Cultural Heritage Recall & Trivia Game
 *
 * Elderly-friendly cognitive exercise inspired by regional Indian crafts,
 * handloom motifs, sacred rivers, and cultural artifacts from stitch_smriti_cognitive_companion.
 * - Large tactile option cards
 * - Zero timers, zero negative penalty
 * - Full offline SQLite persistence & streak tracking
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ArrowLeft, CheckCircle2, Flower2 } from 'lucide-react-native';
import {
  colors,
  spacing,
  borderRadius,
  shadows,
  fontFamily,
} from '../../../theme/tokens';
import { PrimaryButton } from '../../../components/UIComponents';
import { offlineStore } from '../../../services/offlineStore';
import { useAuthStore } from '../../../state/authStore';
import { useBackNavigation } from '../../../navigation/useBackNavigation';
import { useTranslation, getLanguage } from '../../../i18n';

interface Props {
  gameId: string;
  difficulty?: number;
  onComplete: () => void;
  onBack: () => void;
}

interface TriviaQuestion {
  question: string;
  context: string;
  icon: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const TRIVIA_BY_LANG: Record<string, TriviaQuestion[]> = {
  te: [
    {
      question: 'ఎర్రటి అంచులతో నేసిన సాంప్రదాయ అస్సామీ వస్త్రం ఏది?',
      context: 'సాంప్రదాయ చేనేత వస్త్రం',
      icon: '🧣',
      options: ['అస్సామీ గమోసా', 'ఉన్ని శాలువా', 'బనారసి పట్టు'],
      correctIndex: 0,
      explanation: 'గమోసా గౌరవానికి మరియు ఆప్యాయతకు ప్రతీకగా నిలిచే పవిత్రమైన తెల్లటి-ఎర్రటి చేనేత వస్త్రం.',
    },
    {
      question: 'ఈశాన్య తోటల పొగమంచులో ఉదయాన్నే చేతులతో కోసే సువాసనగల ఆకులు ఏవి?',
      context: 'తోటల సంపద',
      icon: '🍃',
      options: ['కాఫీ గింజలు', 'అస్సాం తేయాకు', 'తమలపాకులు'],
      correctIndex: 1,
      explanation: 'ప్రశాంతమైన తేయాకు తోటల నుండి ప్రతి ఉదయం రెండు ఆకులు, ఒక మొగ్గను ఎంతో శ్రద్ధతో కోస్తారు.',
    },
    {
      question: 'ధాన్యం శుభ్రం చేయడానికి మరియు అతిథులను స్వాగతించడానికి వాడే సాంప్రదాయ వెదురు పాత్ర ఏది?',
      context: 'వెదురు కళారూపం',
      icon: '🧺',
      options: ['మట్టి కుండ', 'స్టీల్ ప్లేట్', 'వెదురు చేట / డాలా'],
      correctIndex: 2,
      explanation: 'డాలా లేదా చేట శతాబ్దాల నాటి హస్తకళతో మృదువైన బంగారు వెదురుతో నేయబడుతుంది.',
    },
    {
      question: 'తూర్పు లోయల గుండా ప్రవహించే పవిత్రమైన జీవనది ఏది?',
      context: 'పవిత్ర జీవనది',
      icon: '🌊',
      options: ['బ్రహ్మపుత్ర నది', 'ఎడారి ఒయాసిస్', 'కొండ వాగు'],
      correctIndex: 0,
      explanation: 'బ్రహ్మపుత్ర నది ఈశాన్య సంస్కృతిలో జీవనాడిగా మరియు పాటల్లో కీర్తించబడే పవిత్ర నది.',
    },
    {
      question: 'ఎరుపు, నలుపు డిజైన్లతో వెదురుతో చేసిన సాంప్రదాయ గౌరవ టోపీ ఏది?',
      context: 'సాంస్కృతిక చిహ్నం',
      icon: '👒',
      options: ['జాపీ (Jaapi)', 'తలపాగా', 'స్ట్రా హ్యాట్'],
      correctIndex: 0,
      explanation: 'జాపీ అనేది వెదురు మరియు టోకౌ ఆకులతో అల్లిన అస్సామీ గౌరవ ప్రతీక.',
    },
  ],
  hi: [
    {
      question: 'लाल बॉर्डर वाली पारंपरिक असमिया हथकरघा पोशाक कौन सी है?',
      context: 'पारंपरिक हथकरघा',
      icon: '🧣',
      options: ['असमिया गमोसा', 'ऊनी शॉल', 'बनारसी सिल्क'],
      correctIndex: 0,
      explanation: 'गमोसा सम्मान और अपनापन दर्शाने वाला पवित्र सफेद और लाल हाथ से बुना वस्त्र है।',
    },
    {
      question: 'पूर्वोत्तर के बगीचों में सुबह की धुंध में कौन सी ताज़ा पत्तियां तोड़ी जाती हैं?',
      context: 'प्राकृतिक फसल',
      icon: '🍃',
      options: ['कॉफी बीन्स', 'असम चाय की पत्तियां', 'पान के पत्ते'],
      correctIndex: 1,
      explanation: 'शांत चाय बागानों में हर सुबह दो पत्तियां और एक कली हाथों से चुनी जाती हैं।',
    },
    {
      question: 'अनाज साफ करने और मेहमानों के सत्कार में प्रयुक्त बांस की पारंपरिक वस्तु कौन सी है?',
      context: 'बांस का हस्तशिल्प',
      icon: '🧺',
      options: ['मिट्टी का बर्तन', 'स्टील की थाली', 'बांस का सूप (डाला)'],
      correctIndex: 2,
      explanation: 'डाला सुनहरे बांस से सदियों पुरानी कारीगरी द्वारा तैयार किया जाता है।',
    },
    {
      question: 'पूर्वोत्तर की घाटियों में जीवन और शांति देने वाली पावन नदी कौन सी है?',
      context: 'पवित्र नदी',
      icon: '🌊',
      options: ['ब्रह्मपुत्र नदी', 'मरुस्थल झरना', 'पहाड़ी नाला'],
      correctIndex: 0,
      explanation: 'ब्रह्मपुत्र नदी लोकगीतों और संस्कृति में पूर्वोत्तर की जीवनरेखा मानी जाती है।',
    },
    {
      question: 'लाल और काले रंग के डिज़ाइन वाला बांस का पारंपरिक छत्र क्या कहलाता है?',
      context: 'सांस्कृतिक प्रतीक',
      icon: '👒',
      options: ['जापी (Jaapi)', 'पगड़ी', 'स्ट्रॉ हैट'],
      correctIndex: 0,
      explanation: 'जापी बांस और तोकौ के पत्तों से बना असम का गौरवशाली पारंपरिक छत्र है।',
    },
  ],
  as: [
    {
      question: 'ৰঙা ফুল কটা পৰম্পৰাগত অসমীয়া হস্ততাঁতৰ বস্ত্ৰ কি?',
      context: 'পৰম্পৰাগত হস্ততাঁত',
      icon: '🧣',
      options: ['অসমীয়া গামোচা', 'ঊণৰ চাদৰ', 'বেনাৰসী পাট'],
      correctIndex: 0,
      explanation: 'গামোচা হ\'ল সন্মান আৰু শ্ৰদ্ধাৰ প্ৰতীক বগা আৰু ৰঙা ফুল কটা পবিত্ৰ কাপোৰ।',
    },
    {
      question: 'পুৱাৰ কুঁৱলী ফালি অসমৰ বাগানৰ পৰা কি কি কোমল পাত তোলা হয়?',
      context: 'প্ৰাকৃতিক সোণ',
      icon: '🍃',
      options: ['কফি গুটি', 'অসমৰ চাহ পাত', 'পাণ পাত'],
      correctIndex: 1,
      explanation: 'সুন্দৰ চাহ বাগানৰ পৰা প্ৰতি পুৱা দুটি পাত এটি কলি সাৱধানে তোলা হয়।',
    },
    {
      question: 'ধান জোৰা আৰু সন্মান জনাবলৈ ব্যৱহাৰ কৰা বাঁহৰ সঁজুলিটো কি?',
      context: 'বাঁহ-বেতৰ শিল্প',
      icon: '🧺',
      options: ['মাটিৰ চৰু', 'কাঁহৰ কাঁহী', 'বাঁহৰ কুলা / ডলা'],
      correctIndex: 2,
      explanation: 'ডলা বা কুলা হ\'ল বাঁহৰ কাঠিৰে সজা অসমৰ ঐতিহ্যমণ্ডিত সঁজুলি।',
    },
    {
      question: 'পূৰ্বোত্তৰ উপত্যকাৰ মাজেৰে বৈ যোৱা চিৰপ্ৰশান্ত মহাপবিত্ৰ নদীখন কি?',
      context: 'পৱিত্ৰ নদী',
      icon: '🌊',
      options: ['ব্ৰহ্মপুত্ৰ নদী', 'মৰুভূমিৰ নিজৰা', 'পাহাৰী জান'],
      correctIndex: 0,
      explanation: 'ব্ৰহ্মপুত্ৰ নদীক গীত আৰু কবিতাত অসমৰ প্ৰাণস্পন্দন বুলি কোৱা হয়।',
    },
    {
      question: 'বাঁহ আৰু টকৌ পাতেৰে নিৰ্মিত অসমৰ জাতীয় গৌৰৱৰ প্ৰতীকটো কি?',
      context: 'জাতীয় গৌৰৱ',
      icon: '👒',
      options: ['জাপি', 'পাগুৰি', 'টুপী'],
      correctIndex: 0,
      explanation: 'জাপি হ\'ল বাঁহ, বেত আৰু টকৌ পাতেৰে সজা অসমৰ সন্মানৰ প্ৰতীক।',
    },
  ],
  bn: [
    {
      question: 'লাল পাড়ের ঐতিহ্যবাহী অসমীয়া তাঁতের বস্ত্র কোনটি?',
      context: 'ঐতিহ্যবাহী তাঁতশিল্প',
      icon: '🧣',
      options: ['অসমীয়া গামোচা', 'উলের শাল', 'বেনারসি সিল্ক'],
      correctIndex: 0,
      explanation: 'গামোচা হলো শ্রদ্ধা ও ভালোবাসার প্রতীক একটি পবিত্র লাল-সাদা হাতে বোনা বস্ত্র।',
    },
    {
      question: 'সকালের কুয়াশায় বাগান থেকে যে কোমল সোনালী পাতা তোলা হয় তা কী?',
      context: 'প্রাকৃতিক ফসল',
      icon: '🍃',
      options: ['কফি বিন', 'অসম চা পাতা', 'পান পাতা'],
      correctIndex: 1,
      explanation: 'শান্ত চা বাগান থেকে প্রতিদিন সকালে দুটি পাতা একটি কুঁড়ি পরম যত্নে তোলা হয়।',
    },
    {
      question: 'শস্য ঝাড়াই ও অতিথি বরণে ব্যবহৃত বাঁশের তৈরি ঐতিহ্যবাহী পাত্র কোনটি?',
      context: 'বাঁশের হস্তশিল্প',
      icon: '🧺',
      options: ['মাটির পাত্র', 'কাঁসার থালা', 'বাঁশের কুলো (ডালা)'],
      correctIndex: 2,
      explanation: 'ডালা বাঁশের মসৃণ ফালি দিয়ে তৈরি শতাব্দী প্রাচীন একটি শিল্পকর্ম।',
    },
    {
      question: 'পূর্ব উপত্যকার জীবনদায়িনী শান্ত পবিত্র নদী কোনটি?',
      context: 'পবিত্র নদী',
      icon: '🌊',
      options: ['ব্রহ্মপুত্র নদ', 'মরুভূমির ঝর্ণা', 'পাহাড়ী নদী'],
      correctIndex: 0,
      explanation: 'ব্রহ্মপুত্র নদ পূর্বোত্তর ভারতের সংস্কৃতি ও সংগীতের প্রাণশক্তি।',
    },
    {
      question: 'বাঁশ ও বেত দিয়ে তৈরি আঞ্চলিক গৌরবের ঐতিহ্যবাহী টুপি কোনটি?',
      context: 'সাংস্কৃতিক স্মারক',
      icon: '👒',
      options: ['জাপি', 'পাগড়ি', 'স্ট্র হ্যাট'],
      correctIndex: 0,
      explanation: 'জাপি হলো বাঁশ, বেত ও তোকৌ পাতা দিয়ে তৈরি অসমের পরম শ্রদ্ধার প্রতীক।',
    },
  ],
  ta: [
    {
      question: 'சிவப்பு மலர் வேலைப்பாடுகள் கொண்ட பாரம்பரிய கைத்தறி ஆடை எது?',
      context: 'பாரம்பரிய கைத்தறி',
      icon: '🧣',
      options: ['அசாமிய கமோசா', 'கம்பளி சால்வை', 'பனாரசி பட்டு'],
      correctIndex: 0,
      explanation: 'கமோசா என்பது அன்பு மற்றும் மரியாதையின் அடையாளமாக வழங்கப்படும் புனித ஆடை.',
    },
    {
      question: 'காலை பனித்துளியில் தோட்டங்களில் இருந்து பறிக்கப்படும் நறுமண இலைகள் எவை?',
      context: 'இயற்கை அறுவடை',
      icon: '🍃',
      options: ['காபி விதைகள்', 'அசாம் தேயிலை இலைகள்', 'வெற்றிலை'],
      correctIndex: 1,
      explanation: 'அமைதியான தோட்டங்களில் இருந்து இரண்டு இலைகள் ஒரு மொக்கு தினமும் பறிக்கப்படுகிறது.',
    },
    {
      question: 'தானியங்களை புடைக்கவும் விருந்தினர்களை வரவேற்கவும் பயன்படும் மூங்கில் தட்டு எது?',
      context: 'மூங்கில் கைவினை',
      icon: '🧺',
      options: ['மண்பானை', 'எஃகு தட்டு', 'மூங்கில் முறம் (தாலா)'],
      correctIndex: 2,
      explanation: 'தாலா என்பது பொன்னிற மூங்கிலால் பழங்கால கைவினை முறைப்படி பின்னப்படுகிறது.',
    },
    {
      question: 'கிழக்கு பள்ளத்தாக்குகளில் பாயும் புனிதம் நிறைந்த பெருநதி எது?',
      context: 'புனித நதி',
      icon: '🌊',
      options: ['பிரம்மபுத்திரா நதி', 'பாலைவன நீர்ச்சுனை', 'மலை ஓடை'],
      correctIndex: 0,
      explanation: 'பிரம்மபுத்திரா நதி பாடல்களிலும் வழிபாட்டிலும் போற்றப்படும் முக்கிய நதி.',
    },
    {
      question: 'பாரம்பரிய பெருமையின் சின்னமாக விளங்கும் கூம்பு வடிவ மூங்கில் தலைக்கவசம் எது?',
      context: 'கலாச்சார அடையாளம்',
      icon: '👒',
      options: ['ஜாபி (Jaapi)', 'தலைப்பாகை', 'தொப்பி'],
      correctIndex: 0,
      explanation: 'ஜாபி என்பது மூங்கில் மற்றும் பனை ஓலைகளால் நேர்த்தியாக நெய்யப்பட்ட தொப்பி.',
    },
  ],
  bodo: [
    {
      question: 'गाजां बोसालियाव बाहायनाय गाजां बारग\'नाय हारिमुनि गामोसाया मा?',
      context: 'हारिमुनि दानाय-लुनाय',
      icon: '🧣',
      options: ['आसामिज गामोसा', 'उलनि साल', 'बेनारसि सिलक'],
      correctIndex: 0,
      explanation: 'गामोसाया मान होनाय आरो मोजां मोननायनि दिन्थिनाय गुफुर-गोजा सि।',
    },
    {
      question: 'फुंनि कुहायाव सा बागाननिफ्राय खांनाय गोरलै बिलाइया मा?',
      context: 'दोनथुमनाय मुवा',
      icon: '🍃',
      options: ['कफि बिगु', 'आसाम सा बिलाइ', 'फान बिलाइ'],
      correctIndex: 1,
      explanation: 'सानफ्रोमबो फुङाव सा बागाननिफ्राय बिलाइ मोननै आरो खिलि मोनसेल\' खांनाय जायो।',
    },
    {
      question: 'माय सायख\'नो आरो आगोन्तुकफोरखौ बरायनो बाहायनाय औवानि मुवाया मा?',
      context: 'औवानि बानायनाय',
      icon: '🧺',
      options: ['हायानि बाथा', 'थिफुं खां', 'औवानि रुन / डाला'],
      correctIndex: 2,
      explanation: 'डालाया औवानि दानाय मोनसे गोजाम हारिमुनि मुवा।',
    },
    {
      question: 'सानजा खोलायाव बोहैलांनाय गोनांथार दैमाया मा?',
      context: 'पवित्र दैमा',
      icon: '🌊',
      options: ['ब्रह्मपुत्र दैमा', 'हाब्रु बिलो', 'हाजोनि दैसा'],
      correctIndex: 0,
      explanation: 'ब्रह्मपुत्र दैमाया सानजा खोलायाव गासै जिउनि बिथा।',
    },
    {
      question: 'औवा आरो तकौ बिलाइजों बानायनाय हारिमुनि मानगोनां मुवाया मा?',
      context: 'हारिमुनि सिन',
      icon: '👒',
      options: ['जापि', 'फाग्लि', 'टुपि'],
      correctIndex: 0,
      explanation: 'जापिया औवा आरो तकौ बिलाइजों बानायनाय मान होनायनि सिन।',
    },
  ],
  en: [
    {
      question: 'Which traditional handloom cloth with red woven floral borders is celebrated in Assam?',
      context: 'Traditional Handloom Weave',
      icon: '🧣',
      options: ['Assamese Gamosa', 'Woolen Shawl', 'Banarasi Silk'],
      correctIndex: 0,
      explanation: 'The Gamosa is a revered white and red handwoven textile symbolizing respect and warmth.',
    },
    {
      question: 'Which tender golden green leaves are gently hand-plucked in the morning mist of Northeast gardens?',
      context: 'Heritage Harvest',
      icon: '🍃',
      options: ['Coffee Beans', 'Assam Tea Leaves', 'Betel Leaves'],
      correctIndex: 1,
      explanation: 'Two leaves and a delicate bud are hand-plucked each morning across serene tea plantations.',
    },
    {
      question: 'What handcrafted natural bamboo item is traditionally used for winnowing grains and welcoming guests?',
      context: 'Natural Cane Craft',
      icon: '🧺',
      options: ['Clay Pot', 'Steel Plate', 'Bamboo Kula (Dala)'],
      correctIndex: 2,
      explanation: 'The Kula or Dala is woven from smooth golden bamboo strips with centuries-old handicraft skill.',
    },
    {
      question: 'Which sacred, mighty river brings life, gentle breezes, and timeless serenity across the eastern valleys?',
      context: 'Sacred Waterway',
      icon: '🌊',
      options: ['Brahmaputra', 'Desert Oasis', 'Mountain Stream'],
      correctIndex: 0,
      explanation: 'The Brahmaputra river is celebrated in songs and folklore as the lifeline of northeastern heritage.',
    },
    {
      question: 'What conical woven bamboo sunshade hat with red-and-black felt patterns is a regional symbol of pride?',
      context: 'Folk Emblem',
      icon: '👒',
      options: ['Jaapi', 'Turban', 'Straw Visor'],
      correctIndex: 0,
      explanation: 'The Jaapi is a magnificent traditional headgear made of tightly woven bamboo, cane, and tokou leaves.',
    },
  ],
};

export default function CulturalTriviaGame({
  gameId,
  difficulty = 1,
  onComplete,
  onBack,
}: Props) {
  const { t } = useTranslation();
  const currentLang = getLanguage() || 'en';
  const TRIVIA_QUESTIONS = TRIVIA_BY_LANG[currentLang] || TRIVIA_BY_LANG['en'];
  const user = useAuthStore((s) => s.user);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [updatedDifficulty, setUpdatedDifficulty] = useState<number | null>(null);

  const { panHandlers } = useBackNavigation(undefined, { onCustomBack: onBack });
  const currentQ = TRIVIA_QUESTIONS[currentIndex];

  const handleSelect = (idx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    setShowExplanation(true);
    if (idx === currentQ.correctIndex) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < TRIVIA_QUESTIONS.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsFinished(true);
    const elderId = user?.id || 'demo-elder-id';
    const finalScore = score + (selectedAnswer === currentQ.correctIndex ? 1 : 0);
    const nextDiff = Math.min(5, difficulty + 1);
    setUpdatedDifficulty(nextDiff);

    try {
      await offlineStore.recordGameSession({
        elder_id: elderId,
        game_id: gameId,
        difficulty_level: difficulty,
        score: Math.round((finalScore / TRIVIA_QUESTIONS.length) * 100),
        max_score: 100,
        accuracy_percentage: Math.round((finalScore / TRIVIA_QUESTIONS.length) * 100),
        response_time_ms: 45000,
        metrics_payload: {
          totalQuestions: TRIVIA_QUESTIONS.length,
          correct: finalScore,
          category: 'Cultural Heritage Recall',
        },
      });
      await offlineStore.setDifficulty(elderId, gameId, nextDiff);
    } catch (err) {
      console.log('Error saving trivia session:', err);
    }
    onComplete();
  };

  // ── Result Screen ──
  if (isFinished) {
    const finalScore = score;
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }} {...panHandlers}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.resultScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBarResult}>
            <TouchableOpacity
              onPress={onBack}
              style={styles.backButtonTop}
              activeOpacity={0.75}
            >
              <ArrowLeft size={18} color={colors.textDark} strokeWidth={2.4} />
              <Text style={styles.backButtonTopText}>{t('games.backToActivities') || 'Back to Activities'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.trophyCircle}>
            <Flower2 size={46} color={colors.teal} strokeWidth={2.2} />
          </View>

          <Text style={styles.completeTitle}>{t('games.gameComplete') || 'Cultural Heritage Celebrated!'}</Text>

          <View style={[styles.difficultyBadge, styles.difficultyBadgeUp]}>
            <Text style={styles.difficultyBadgeText}>
              ⭐ {finalScore} / {TRIVIA_QUESTIONS.length} • {t('games.level', { level: difficulty }) || `Level ${difficulty}`}
            </Text>
          </View>

          <Text style={styles.encouragement}>
            {t('games.encouragement.great') || 'Your memory for beloved cultural traditions and folk heritage is sharp and vibrant! Connecting with familiar symbols brings comfort and joy to the mind.'}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{finalScore}/{TRIVIA_QUESTIONS.length}</Text>
              <Text style={styles.statLabel}>{t('games.score') || 'Score'}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{updatedDifficulty || difficulty}</Text>
              <Text style={styles.statLabel}>{t('games.level', { level: '' }).trim() || 'Level'}</Text>
            </View>
          </View>

          <View style={styles.recommendationCard}>
            <Text style={styles.recommendationLabel}>Personalized Recommendation</Text>
            <Text style={styles.recommendationText}>
              Share one of these traditional memories with your family or caregiver today! Stories stimulate memory and warm connections.
            </Text>
          </View>

          <View style={styles.resultActions}>
            <PrimaryButton
              title="Play Trivia Again"
              variant="success"
              onPress={() => {
                setIsFinished(false);
                setCurrentIndex(0);
                setSelectedAnswer(null);
                setShowExplanation(false);
                setScore(0);
              }}
              style={styles.actionBtnPlayNext}
            />
            <PrimaryButton
              title={t('games.backToActivities') || 'Back to Activities'}
              onPress={onBack}
              variant="secondary"
              style={styles.actionBtnBack}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Active Gameplay ──
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} {...panHandlers}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButtonTop}
            activeOpacity={0.75}
          >
            <ArrowLeft size={18} color={colors.textDark} strokeWidth={2.4} />
            <Text style={styles.backButtonTopText}>{t('games.backToGames') || 'Exit Game'}</Text>
          </TouchableOpacity>

          <View style={styles.roundPill}>
            <Text style={styles.roundPillText}>
              {t('games.round', { current: currentIndex + 1, total: TRIVIA_QUESTIONS.length }) || `Round ${currentIndex + 1} of ${TRIVIA_QUESTIONS.length}`}
            </Text>
          </View>
        </View>

        {/* Question Card */}
        <View style={styles.questionCard}>
          <View style={styles.badgeRow}>
            <Text style={styles.contextBadge}>{currentQ.context}</Text>
            <Text style={styles.questionIcon}>{currentQ.icon}</Text>
          </View>
          <Text style={styles.questionText}>{currentQ.question}</Text>
        </View>

        {/* Options List */}
        <View style={styles.optionsList}>
          {currentQ.options.map((opt, i) => {
            const isSelected = selectedAnswer === i;
            const isCorrect = i === currentQ.correctIndex;
            let btnStyle: StyleProp<ViewStyle> = styles.optionButton;
            let textStyle: StyleProp<TextStyle> = styles.optionButtonText;

            if (selectedAnswer !== null) {
              if (isCorrect) {
                btnStyle = [styles.optionButton, styles.optionCorrect];
                textStyle = [styles.optionButtonText, styles.optionCorrectText];
              } else if (isSelected) {
                btnStyle = [styles.optionButton, styles.optionIncorrect];
                textStyle = [styles.optionButtonText, styles.optionIncorrectText];
              }
            }

            return (
              <TouchableOpacity
                key={i}
                onPress={() => handleSelect(i)}
                style={btnStyle}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Option ${opt}`}
                disabled={selectedAnswer !== null}
              >
                <View style={styles.optContent}>
                  <Text style={textStyle}>{opt}</Text>
                  {selectedAnswer !== null && isCorrect && (
                    <CheckCircle2 size={20} color={colors.success} strokeWidth={2.4} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Explanation & Next Button */}
        {showExplanation && (
          <View style={styles.explanationBox}>
            <Text style={styles.explanationTitle}>
              {selectedAnswer === currentQ.correctIndex ? '🌸 Splendid Memory!' : '💡 Wonderful Insight'}
            </Text>
            <Text style={styles.explanationText}>{currentQ.explanation}</Text>

            <PrimaryButton
              title={currentIndex + 1 < TRIVIA_QUESTIONS.length ? 'Next ➔' : (t('games.gameComplete') || 'See Results')}
              variant="success"
              onPress={handleNext}
              style={{ marginTop: spacing.md, minHeight: 56 }}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenMargin,
    paddingBottom: Platform.OS === 'ios' ? 160 : 130,
  },
  resultScrollContent: {
    paddingHorizontal: spacing.screenMargin,
    paddingBottom: Platform.OS === 'ios' ? 160 : 130,
    alignItems: 'center',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  backButtonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 44,
  },
  backButtonTopText: {
    fontFamily: fontFamily.display,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
  },
  roundPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.tealBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 113, 227, 0.2)',
  },
  roundPillText: {
    fontFamily: fontFamily.display,
    fontSize: 13,
    fontWeight: '700',
    color: colors.teal,
  },
  questionCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  contextBadge: {
    fontFamily: fontFamily.display,
    fontSize: 12,
    fontWeight: '700',
    color: colors.teal,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionIcon: {
    fontSize: 28,
  },
  questionText: {
    fontFamily: fontFamily.display,
    fontSize: 22,
    fontWeight: '700',
    color: colors.navy,
    lineHeight: 30,
    letterSpacing: 0,
  },
  optionsList: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  optionButton: {
    backgroundColor: colors.surface,
    paddingVertical: 18,
    paddingHorizontal: spacing.lg,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.border,
    minHeight: 60,
    justifyContent: 'center',
    ...shadows.card,
  },
  optContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionButtonText: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    letterSpacing: 0,
    flex: 1,
  },
  optionCorrect: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  optionCorrectText: {
    color: '#15803D',
    fontWeight: '800',
  },
  optionIncorrect: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },
  optionIncorrectText: {
    color: '#B91C1C',
    fontWeight: '700',
  },
  explanationBox: {
    backgroundColor: '#EFF6FF',
    padding: spacing.lg,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    marginBottom: spacing.xl,
  },
  explanationTitle: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    fontWeight: '800',
    color: '#1E40AF',
    marginBottom: 6,
    letterSpacing: 0,
  },
  explanationText: {
    fontFamily: fontFamily.text,
    fontSize: 16,
    color: colors.textDark,
    lineHeight: 24,
    letterSpacing: 0,
  },
  topBarResult: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  trophyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.tealBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  completeTitle: {
    fontFamily: fontFamily.display,
    fontSize: 26,
    fontWeight: '800',
    color: colors.navy,
    textAlign: 'center',
    letterSpacing: 0,
    marginBottom: spacing.xs,
  },
  difficultyBadge: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  difficultyBadgeUp: {
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    borderColor: colors.success,
  },
  difficultyBadgeText: {
    fontFamily: fontFamily.display,
    fontSize: 14,
    fontWeight: '800',
    color: colors.teal,
    letterSpacing: 0,
  },
  encouragement: {
    fontFamily: fontFamily.text,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    letterSpacing: 0,
  },
  statsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statNumber: {
    fontFamily: fontFamily.display,
    fontSize: 22,
    fontWeight: '800',
    color: colors.teal,
    letterSpacing: 0,
  },
  statLabel: {
    fontFamily: fontFamily.text,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  recommendationCard: {
    width: '100%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  recommendationLabel: {
    fontFamily: fontFamily.display,
    fontSize: 13,
    fontWeight: '700',
    color: colors.teal,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  recommendationText: {
    fontFamily: fontFamily.text,
    fontSize: 15,
    color: colors.textDark,
    lineHeight: 22,
  },
  resultActions: {
    width: '100%',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  actionBtnPlayNext: {
    width: '100%',
    minHeight: 52,
  },
  actionBtnBack: {
    width: '100%',
    minHeight: 48,
  },
});
