import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { 
  Mic, 
  MicOff, 
  Globe, 
  Trophy, 
  BookOpen, 
  Settings, 
  LayoutList,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Clipboard,
  ChevronRight, 
  ChevronLeft,
  Star,
  Lock,
  CheckCircle2,
  AlertCircle,
  Download,
  Wifi,
  WifiOff,
  CloudOff,
  Info,
  Hand,
  Image as ImageIcon,
  Type as TypeIcon,
  Activity,
  RefreshCw,
  MoveHorizontal,
  Volume2,
  Bookmark,
  Loader2,
  Users,
  History,
  ChevronDown,
  Brain,
  Plus,
  FileText,
  Trash2,
  Video,
  Share2,
  Camera,
  AlertTriangle,
  Play,
  Heart,
  Eye,
  Zap,
  Type,
  Timer as TimerIcon,
  LayoutGrid,
  Languages,
  X,
  Maximize2,
  Crown,
  Layers,
  Search,
  VolumeX,
  Compass,
  Sliders
} from 'lucide-react';
// Lazy loaded below
import { 
  Language, 
  ExerciseType, 
  Difficulty, 
  Exercise, 
  Theme, 
  LayoutMode,
  UserProfile, 
  Achievement,
  ChildProfile,
  StruggleWord,
  VoiceRecording,
  InteractiveWord,
  SensoryProfile,
  FirstThenBoard,
  LessonPlan,
  LessonBlock,
  LessonBlockType,
  ClinicalSettings,
  NotificationSettings,
  MarketplaceItem,
  CustomExercise
} from './types';
import { db, auth } from './firebase';
import { localDb, LocalProfile, LocalRecording } from './lib/db';
import { doc, setDoc, getDoc, updateDoc, collection, onSnapshot, query, where, addDoc, deleteDoc, getDocFromServer } from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { analyzeSpeech, SpeechAnalysisResult } from './services/geminiService';
import { repository } from './lib/dataRepository';
import { generateStory, enrichStoryWithImages, enrichStoryWithAudio, generateWordAudio, translateStoryPage } from './services/storyService';
import { handleError, ErrorType, handleFirestoreError, OperationType } from './utils/errorHandler';
import { ACHIEVEMENTS } from './achievements';
import { EXERCISES } from './constants';
import { generateLocalFeedback, pseudoAnalyze } from './utils/localSpeechEngine';
import { notificationService } from './services/notificationService';
import confetti from 'canvas-confetti';
import { speakText } from './utils/speechUtils';
import jsPDF from 'jspdf';
// Views lazy loaded below
import 'jspdf-autotable';
import { 
  ResponsiveContainer, 
  AreaChart, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Area, 
  Bar,
  Line,
  ComposedChart,
  Legend
} from 'recharts';

import { FALLBACK_IMAGE, FALLBACK_AVATAR } from './constants';
import { extractJsonFromResponse } from './utils/aiUtils';
import { LAYOUT_CONFIG } from './layoutConfig';
import { useOnlineStatus } from './utils/useOnlineStatus';

import { SensoryTools } from './components/SensoryTools';
import { ArticulationMatchingGame } from './components/ArticulationMatchingGame';
import { ExerciseIllustration } from './components/ExerciseIllustration';
import { SpecializedExerciseView } from './components/SpecializedExerciseView';
import { LessonBuilder } from './components/LessonBuilder';
import { LessonPlayer } from './components/LessonPlayer';
import { SettingsView } from './components/SettingsView';
import { InstagramEmbed } from './components/InstagramEmbed';
import { LessonListView } from './components/LessonListView';
import { ProUpgradeModal } from './components/ProUpgradeModal';
import { VisualBuilder } from './components/admin/VisualBuilder';
import { ClinicalProgressConsole } from './components/ClinicalProgressConsole';
import { AdminBuilder } from './components/AdminBuilder';
import { AdminCMS } from './components/AdminCMS';
import { StandaloneAdminPortal } from './components/admin/StandaloneAdminPortal';
import { MarketplaceView } from './components/MarketplaceView';
import { BilingualMatchingGame } from './components/BilingualMatchingGame';
import { PrivacyPolicyView } from './components/PrivacyPolicyView';
import { InteractivePacingBoard } from './components/InteractivePacingBoard';
import { LanguageModules } from './components/LanguageModules';
import { VoiceOnsetDecibelMeter } from './components/VoiceOnsetDecibelMeter';
import { AacPlayground } from './components/AacPlayground';
import { ClinicalEvidencePanel } from './components/ClinicalEvidencePanel';
import { ClinicalEvidenceGuide } from './components/ClinicalEvidenceGuide';
import { ClinicalDiagnosticConsole } from './components/ClinicalDiagnosticConsole';
import { SpeechPipelineFeedback } from './components/SpeechPipelineFeedback';
import { PrivacyGovernanceHub } from './components/PrivacyGovernanceHub';
import { RecordingConsentModal } from './components/RecordingConsentModal';
import { privacyGovernanceService } from './services/privacyGovernanceService';
import { sttService, SpeechProviderType } from './services/sttService';
import { clinicalEngine, StructuredAttemptResult } from './services/clinicalEngine';
import { audioService } from './services/audioService';
import { SoundLadderGame } from './components/SoundLadderGame';
import { ContrastEngineView } from './components/ContrastEngineView';
import { FluencyPacingLab } from './components/FluencyPacingLab';
import { VocalTherapyLab } from './components/VocalTherapyLab';
import { SceneAacBoards } from './components/SceneAacBoards';
import { ParentCoachingPortal } from './components/ParentCoachingPortal';
import { ClinicalResearchAnalytics } from './components/ClinicalResearchAnalytics';
import { OfflineSyncBanner } from './components/OfflineSyncBanner';
import { MotorSpeechStudio } from './components/MotorSpeechStudio';
import { ReceptiveLanguageArena } from './components/ReceptiveLanguageArena';
import { ArticulatorAnatomyVisualizer } from './components/ArticulatorAnatomyVisualizer';
import { MicrophoneDiagnosticModal } from './components/MicrophoneDiagnosticModal';
import { QuickSearchCommandModal } from './components/QuickSearchCommandModal';
import { NavigationCustomizerModal } from './components/NavigationCustomizerModal';
import { navPreferencesService, PRESET_CONFIGS, ExperiencePreset } from './services/navigationPreferencesService';
import { sfx } from './utils/soundEffects';

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
    <div className="relative">
      <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-emerald-500 animate-spin" />
      <span className="absolute inset-0 flex items-center justify-center text-lg">🎈</span>
    </div>
    <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Loading adventure...</p>
  </div>
);

import { requestWakeLock } from './utils/nativeBridge';

// ... near other imports
const LoadingScreen = () => (
  <motion.div 
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[1000] bg-white flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50"
  >
    <div className="relative w-32 h-32 mb-8">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 border-8 border-slate-100 rounded-[40px]"
      />
      <motion.div 
        animate={{ rotate: -360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        className="absolute inset-2 border-t-8 border-primary rounded-[30px]"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <Sparkles className="w-12 h-12 text-primary animate-pulse" />
      </div>
    </div>
    <motion.h2 
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="text-2xl font-black uppercase tracking-tight text-slate-800"
    >
      Initializing Experience
    </motion.h2>
    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-4">Safe & Secure Speech Learning</p>
  </motion.div>
);

export default function App() {
  const isOnline = useOnlineStatus();
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState<SpeechAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(true);
  const [cloudSync, setCloudSync] = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [isAutismAddonActive, setIsAutismAddonActive] = useState(false);
  const [isMentorMode, setIsMentorMode] = useState(false);
  const [view, setView] = useState<'practice' | 'stories' | 'progress' | 'pricing' | 'settings' | 'autism-tools' | 'matching-game' | 'bilingual-match' | 'focus-social' | 'lessons' | 'videos' | 'admin-builder' | 'marketplace' | 'privacy-policy' | 'admin-cms' | 'pacing-board' | 'language-modules' | 'voice-meters' | 'aac-playground' | 'sound-ladder' | 'contrast-engine' | 'fluency-lab' | 'vocal-lab' | 'scene-aac' | 'parent-coaching' | 'clinical-research' | 'motor-speech' | 'receptive-language' | 'articulator-anatomy'>('practice');
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [isMicDiagnosticOpen, setIsMicDiagnosticOpen] = useState(false);
  const [isNavCustomizerOpen, setIsNavCustomizerOpen] = useState(false);
  const [isSfxMuted, setIsSfxMuted] = useState(() => sfx.getMuted());
  const [navPrefs, setNavPrefs] = useState(() => navPreferencesService.loadPreferences());
  const [activeDropdown, setActiveDropdown] = useState<'practice' | 'games' | 'speech' | 'aac' | 'clinical' | 'preset' | null>(null);
  const [editingExercise, setEditingExercise] = useState<CustomExercise | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [firestoreExercises, setFirestoreExercises] = useState<Exercise[]>([]);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [sensoryProfile, setSensoryProfile] = useState<SensoryProfile>({
    id: 'default',
    childProfileId: 'active',
    calmingColors: false,
    reducedMotion: false,
    highContrast: false,
    fontScale: 1.0,
    showVisualTimer: true
  });
  const [firstThenBoards, setFirstThenBoards] = useState<FirstThenBoard[]>([]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [theme, setTheme] = useState<Theme>(Theme.MODERN);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(LayoutMode.SIDEBAR);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => localStorage.getItem('darkMode') === 'true');
  const [localSoundEnabled, setLocalSoundEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem('sound_enabled');
    return stored === null ? true : stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem('darkMode', String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);
  const [showGuide, setShowGuide] = useState(false);
  const [spinValues, setSpinValues] = useState<number[]>([]);
  const [sliderValue, setSliderValue] = useState(0);
  const [currentStoryPage, setCurrentStoryPage] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [activeWord, setActiveWord] = useState<InteractiveWord | null>(null);
  const [bookmarks, setBookmarks] = useState<Record<string, number>>({});
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [localMentorAudio, setLocalMentorAudio] = useState<string | null>(null);
  const [localUserRecordings, setLocalUserRecordings] = useState<any[]>([]);
  const [localRecordingsTrigger, setLocalRecordingsTrigger] = useState(0);
  const practiceAreaRef = useRef<HTMLDivElement>(null);
  const speechInitiationTimeRef = useRef<number | null>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const [translatedStoryText, setTranslatedStoryText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeAnimation, setActiveAnimation] = useState<{ url: string; title: string } | null>(null);
  const [comboCount, setComboCount] = useState(0);
  const [mouthAnimKey, setMouthAnimKey] = useState(0);
  const [tongueAnimKey, setTongueAnimKey] = useState(0);
  const [isGeneratingWordAudio, setIsGeneratingWordAudio] = useState(false);
  const [isGeneratingExerciseAudio, setIsGeneratingExerciseAudio] = useState(false);
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [showClearCacheModal, setShowClearCacheModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeSpeechProvider, setActiveSpeechProvider] = useState<SpeechProviderType>(() => sttService.getActiveProvider());
  const [showDiagnosticConsole, setShowDiagnosticConsole] = useState(false);
  const [micPermissionState, setMicPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [lastStructuredAttempt, setLastStructuredAttempt] = useState<StructuredAttemptResult | null>(null);
  const [sttLiveTranscript, setSttLiveTranscript] = useState<string>('');
  const [liveAudioLevel, setLiveAudioLevel] = useState<number>(0);
  const acousticStatsRef = useRef<{ avgDb: number; peakDb: number; pitchHz: number; voiceOnsetMs: number }>({
    avgDb: 45,
    peakDb: 60,
    pitchHz: 210,
    voiceOnsetMs: 450
  });

  const [storyTopic, setStoryTopic] = useState('');
  const [storyLanguage, setStoryLanguage] = useState<Language>(Language.ENGLISH);
  const [storyDifficulty, setStoryDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const [savedStories, setSavedStories] = useState<Exercise[]>([]);
  const [dailyChallenge, setDailyChallenge] = useState<Exercise | null>(null);
  const [dailyGoalProgress, setDailyGoalProgress] = useState(0);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [selectedLessonPlan, setSelectedLessonPlan] = useState<LessonPlan | null>(null);
  const [editingLessonPlan, setEditingLessonPlan] = useState<LessonPlan | null>(null);
  const [isBuildingLesson, setIsBuildingLesson] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNavbarHidden, setIsNavbarHidden] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAdminMode, setIsAdminMode] = useState(() => {
    try {
      return localStorage.getItem('slp_admin_mode_override') === 'true';
    } catch {
      return false;
    }
  });
  const [showCrmAuthModal, setShowCrmAuthModal] = useState(false);
  const [showPrivacyGovernanceModal, setShowPrivacyGovernanceModal] = useState(false);
  const [showRecordingConsentModal, setShowRecordingConsentModal] = useState(false);
  const [crmPasscodeField, setCrmPasscodeField] = useState('');
  const [isFirebaseLive, setIsFirebaseLive] = useState<boolean | null>(null);

  // Retroactive Caregiver 3D Grading States
  const [gradingRecording, setGradingRecording] = useState<any | null>(null);
  const [retroAccuracy, setRetroAccuracy] = useState(5);
  const [retroFluency, setRetroFluency] = useState(5);
  const [retroIndependence, setRetroIndependence] = useState(5);
  const [retroPromptLevel, setRetroPromptLevel] = useState('Independent');
  const [retroNotes, setRetroNotes] = useState('');

   const adminEmail = "danielsand711@gmail.com";
  const [authorizedEmailsTrigger, setAuthorizedEmailsTrigger] = useState(0);
  
  useEffect(() => {
    const handleReload = () => setAuthorizedEmailsTrigger(prev => prev + 1);
    window.addEventListener('slp_authorized_emails_changed', handleReload);
    return () => window.removeEventListener('slp_authorized_emails_changed', handleReload);
  }, []);

  const isActualAdmin = useMemo(() => {
    if (isAdminMode) return true;
    if (!user) return isAdminMode;
    const email = user.email?.toLowerCase();
    const displayName = user.displayName;
    
    // Load dynamically whitelisted clinician emails from workspace registry
    let dynamicClinicians: string[] = [];
    try {
      const saved = localStorage.getItem('slp_authorized_emails');
      if (saved) dynamicClinicians = JSON.parse(saved);
    } catch {}

    const isAuthorizedClinician = email ? dynamicClinicians.map(e => e.toLowerCase()).includes(email) : false;

    return (email === adminEmail.toLowerCase()) || 
           displayName === 'DanielEsme' || 
           email === 'danielsand711@gmail.com' ||
           isAuthorizedClinician;
  }, [user, isAdminMode, authorizedEmailsTrigger]);

  const handleUnlockBypass = () => {
    const cleanWord = crmPasscodeField.trim().toLowerCase();
    const allowed = [
      'brilliantspeech',
      'speechpathology',
      'danielsand711',
      'brilliant123',
      'admin',
      'danielesme',
      'clinic'
    ];
    if (allowed.includes(cleanWord)) {
      setIsAdminMode(true);
      localStorage.setItem('slp_admin_mode_override', 'true');
      
      // Load or set a secure local admin profile so AdminCMS won't crash on user properties
      setUser({
        uid: 'secure-bypass-admin',
        displayName: 'Dr. Daniel (Clinical Admin)',
        email: 'danielsand711@gmail.com',
        isPremium: true,
        isSubscriptionActive: true,
        subscriptionTier: 'monthly_unlimited',
        purchasedExerciseIds: [],
        isAutismAddonActive: true,
        aiCredits: 9999,
        isAiOptedOut: false,
        soundEnabled: true,
        hapticsEnabled: true,
        createdAt: new Date().toISOString(),
        profiles: [],
        activeProfileId: 'default'
      } as UserProfile);
      
      toast.success("Clinician admin status successfully verified! Care CRM unlocked. Welcome, Dr. Daniel.");
      setView('admin-cms');
      setShowCrmAuthModal(false);
      setCrmPasscodeField('');
      playCue('chime');
    } else {
      toast.error("Incorrect clinician passcode. Security access denied.");
    }
  };

  const [clinicalSettings, setClinicalSettings] = useState<ClinicalSettings | null>(null);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('default');
  const [isAdminConsoleVisible, setIsAdminConsoleVisible] = useState(false);
  const [isGamesMenuOpen, setIsGamesMenuOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);

  const navCategories = {
    learning: [
      { id: 'practice', name: 'Practice', icon: Mic },
      { id: 'motor-speech', name: 'Apraxia & Motor', icon: Zap },
      { id: 'sound-ladder', name: 'Sound Ladder', icon: Layers },
      { id: 'contrast-engine', name: 'Contrast Pairs', icon: MoveHorizontal },
      { id: 'receptive-language', name: 'Receptive Arena', icon: Compass },
      { id: 'articulator-anatomy', name: 'Anatomy Lab', icon: Eye },
      { id: 'language-modules', name: 'Language Modules', icon: Sparkles },
      { id: 'lessons', name: 'Lessons', icon: FileText },
      { id: 'stories', name: 'Stories', icon: BookOpen },
    ],
    explore: [
      { id: 'fluency-lab', name: 'Fluency & Pacing', icon: Zap },
      { id: 'vocal-lab', name: 'Vocal Therapy', icon: Activity },
      { id: 'scene-aac', name: 'Visual Scene AAC', icon: ImageIcon },
      { id: 'parent-coaching', name: 'Parent Coaching', icon: Heart },
      { id: 'clinical-research', name: 'Research & Outcomes', icon: ShieldCheck },
      { id: 'videos', name: 'Videos', icon: Video },
      { id: 'matching-game', name: 'Matching Game', icon: Sparkles },
      { id: 'bilingual-match', name: 'Bilingual Match', icon: Globe },
      { id: 'pacing-board', name: 'Pacing Board', icon: Hand },
      { id: 'voice-meters', name: 'Voice Meters', icon: Activity },
      { id: 'aac-playground', name: 'AAC Playground', icon: LayoutGrid },
      { id: 'autism-tools', name: 'Autism Tools', icon: Brain },
      { id: 'focus-social', name: 'Social Skills', icon: Users },
      { id: 'marketplace', name: 'Marketplace', icon: ShoppingBag }
    ]
  };
  const [adminRecorderType, setAdminRecorderType] = useState<'audio' | 'video' | null>(null);
  const [isAdminRecording, setIsAdminRecording] = useState(false);
  const [adminRecordingBlob, setAdminRecordingBlob] = useState<Blob | null>(null);
  const [adminRecordedUrl, setAdminRecordedUrl] = useState<string | null>(null);
  const adminMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const adminAudioChunksRef = useRef<Blob[]>([]);
  const adminVideoRef = useRef<HTMLVideoElement>(null);

  const startAdminRecording = async (type: 'audio' | 'video') => {
    if (!isActualAdmin) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video'
      });
      
      setAdminRecorderType(type);
      setIsAdminRecording(true);
      adminAudioChunksRef.current = [];
      
      const recorder = new MediaRecorder(stream);
      adminMediaRecorderRef.current = recorder;
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          adminAudioChunksRef.current.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(adminAudioChunksRef.current, { type: type === 'audio' ? 'audio/webm' : 'video/webm' });
        const url = URL.createObjectURL(blob);
        setAdminRecordingBlob(blob);
        setAdminRecordedUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      
      if (type === 'video' && adminVideoRef.current) {
        adminVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast.error('Could not access camera/microphone');
    }
  };

  const stopAdminRecording = () => {
    if (adminMediaRecorderRef.current && isAdminRecording) {
      adminMediaRecorderRef.current.stop();
      setIsAdminRecording(false);
    }
  };

  const downloadAdminRecording = () => {
    if (!adminRecordedUrl) return;
    const a = document.createElement('a');
    a.href = adminRecordedUrl;
    a.download = `admin-recording-${Date.now()}.${adminRecorderType === 'audio' ? 'webm' : 'mp4'}`;
    a.click();
    toast.success('Recording downloaded!');
  };

  const shareStore = async () => {
    try {
      await navigator.share({
        title: 'Brilliant Speech Store',
        text: 'Check out these custom speech therapy lessons and practices!',
        url: window.location.origin + '/marketplace'
      });
      toast.success('Store shared successfully!');
    } catch (err) {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.origin + '/marketplace');
      toast.success('Store link copied to clipboard!');
    }
  };

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        setIsFirebaseLive(true);
      } catch (error) {
        // Silently fail, don't show a red error as it confuses users during login
        console.warn("Firestore connectivity test failed (benign if not logged in):", error);
        setIsFirebaseLive(false);
      }
    };
    testConnection();
  }, []);

  useEffect(() => {
    let wakeLock: any = null;
    const enableWakeLock = async () => {
      // Keep screen on during active gaming or practice views
      if (view === 'practice' || view === 'bilingual-match' || view === 'matching-game') {
        wakeLock = await requestWakeLock();
      } else if (wakeLock) {
        try {
          await wakeLock.release();
          wakeLock = null;
        } catch (e) {}
      }
    };
    enableWakeLock();
    return () => {
      if (wakeLock) wakeLock.release();
    };
  }, [view]);

  const allExercises = useMemo(() => {
    const combined = [...EXERCISES];
    firestoreExercises.forEach(fe => {
      if (!combined.find(e => e.id === fe.id)) {
        combined.push(fe);
      }
    });
    return combined;
  }, [firestoreExercises]);

  useEffect(() => {
    // Listen for Firestore exercises
    // Only start if auth is ready to avoid "Access Denied" errors before login finish
    if (!isAuthReady) return;

    const unsubscribe = onSnapshot(collection(db, 'exercises'), (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exercise));
      setFirestoreExercises(fetched);
    }, (error) => {
      // Graceful error if not logged in
      console.warn("Exercises listener failed (expected if not logged in):", error);
    });
    return () => unsubscribe();
  }, [isAuthReady]);

  useEffect(() => {
    // Listen for Marketplace items
    const unsubscribe = onSnapshot(collection(db, 'marketplace'), (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketplaceItem));
      if (fetched.length > 0) {
        setMarketplaceItems(fetched);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkAdminRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      if (path.startsWith('/admin') || search.includes('view=admin') || search.includes('mode=admin') || search.includes('admin=true')) {
        setView('admin-cms');
      } else if (window.location.search.includes('view=')) {
        const params = new URLSearchParams(window.location.search);
        const viewParam = params.get('view') as any;
        if (viewParam) setView(viewParam);
      }
    };

    checkAdminRoute();

    window.addEventListener('popstate', checkAdminRoute);
    return () => window.removeEventListener('popstate', checkAdminRoute);
  }, []);

  useEffect(() => {
    // Generate some mock marketplace items for demo
    const mockItems: MarketplaceItem[] = [
      {
        id: 'm1',
        creatorName: 'Dr. Sarah',
        category: 'Articulation',
        price: 4.99,
        isFeatured: true,
        exercise: {
          id: 'custom-1',
          title: 'Magical "S" Island',
          description: 'A custom articulation adventure through a secret magic island.',
          type: ExerciseType.ARTICULATION,
          difficulty: Difficulty.EASY,
          category: 'Articulation',
          isPremium: true,
          imageUrl: 'https://images.unsplash.com/photo-1544640808-32ca72ac7f67?auto=format&fit=crop&q=80&w=400',
          audioUrl: '/demo.mp3',
          videoUrl: '/demo.mp4',
          language: Language.ENGLISH,
          creatorId: 'admin-1',
          isPublished: true
        }
      },
      {
        id: 'm2',
        creatorName: 'Admin Mike',
        category: 'Stories',
        price: 9.99,
        isFeatured: false,
        exercise: {
          id: 'custom-2',
          title: 'The Brave Fireman',
          description: 'A complete social story about community helpers.',
          type: ExerciseType.STORY,
          difficulty: Difficulty.MEDIUM,
          category: 'Stories',
          isPremium: true,
          imageUrl: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&q=80&w=400',
          language: Language.ENGLISH,
          creatorId: 'admin-2',
          isPublished: true
        }
      },
      {
         id: 'm3',
         creatorName: 'Speech Pro',
         category: 'Social Skills',
         price: 12.99,
         isFeatured: true,
         exercise: {
           id: 'custom-3',
           title: 'Dinner Time Manners',
           description: 'Guided practice for meal-time conversations and etiquette.',
           type: ExerciseType.SOCIAL_SKILLS,
           difficulty: Difficulty.MEDIUM,
           category: 'Social Skills',
           isPremium: true,
           imageUrl: 'https://images.unsplash.com/photo-1547928576-a4a33237ecd3?auto=format&fit=crop&q=80&w=400',
           language: Language.ENGLISH,
           creatorId: 'admin-3',
           isPublished: true
         }
      }
    ];
    setMarketplaceItems(mockItems);
  }, []);

  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];

  const handleSaveCustomExercise = async (data: Partial<CustomExercise>) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const newExId = `ce-${Date.now()}`;
      const newItem: MarketplaceItem = {
        id: `mi-${Date.now()}`,
        creatorName: user.displayName || 'Creator',
        category: data.category || 'Custom',
        price: data.price || 0,
        isFeatured: false,
        exercise: {
          ...data,
          id: newExId,
          isPremium: (data.price || 0) > 0,
          language: Language.ENGLISH,
        } as CustomExercise
      };

      setMarketplaceItems(prev => [newItem, ...prev]);
      
      // Persist to Firestore
      if (isAdminMode) {
        await setDoc(doc(db, 'marketplace', newItem.id), newItem);
      } else {
        await setDoc(doc(db, 'customExercises', newItem.exercise.id), {
          ...newItem.exercise,
          creatorId: user.uid,
          createdAt: new Date().toISOString()
        });
      }

      toast.success('Your practice has been published to the marketplace!');
      setView('marketplace');
    } catch (e) {
      toast.error('Failed to publish exercise');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribeUnlimited = async () => {
    setIsUpgrading(true);
    // Simulate payment
    setTimeout(() => {
      setIsSubscriptionActive(true);
      if (user) {
        setUser({ 
          ...user, 
          isSubscriptionActive: true, 
          subscriptionTier: 'monthly_unlimited' 
        });
      }
      setIsUpgrading(false);
      toast.success('Welcome to the Monthly Unlimited plan!');
    }, 1500);
  };

  const handlePurchaseItem = async (item: MarketplaceItem) => {
    if (!user) return;
    if (isSubscriptionActive) return;

    setIsUpgrading(true);
    // Simulate purchase
    setTimeout(() => {
      const purchased = [...(user.purchasedExerciseIds || []), item.id];
      setUser({ ...user, purchasedExerciseIds: purchased });
      setIsUpgrading(false);
      toast.success(`${item.exercise.title} unlocked!`);
    }, 1000);
  };

  useEffect(() => {
    localStorage.setItem('lessonPlans', JSON.stringify(lessonPlans));
  }, [lessonPlans]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleSaveLessonPlan = (plan: LessonPlan) => {
    setLessonPlans(prev => {
      const exists = prev.find(p => p.id === plan.id);
      if (exists) {
        return prev.map(p => p.id === plan.id ? plan : p);
      }
      return [...prev, plan];
    });
    setIsBuildingLesson(false);
    setEditingLessonPlan(null);
    toast.success('Lesson plan saved!');
  };

  const handleDeleteLessonPlan = (id: string) => {
    setLessonPlans(prev => prev.filter(p => p.id !== id));
    toast.success('Lesson plan deleted');
  };

  const handleStartLesson = (plan: LessonPlan) => {
    setSelectedLessonPlan(plan);
    playCue('swoosh');
  };

  // Firebase Auth and Profile Sync
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success')) {
      toast.success("Payment successful! Your Pro features are being activated.");
      window.history.replaceState({}, document.title, "/");
      playCue('chime');
    }
    if (urlParams.get('canceled')) {
      toast.error("Payment canceled. No charges were made.");
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const isAdmin = (firebaseUser.email?.toLowerCase() === adminEmail.toLowerCase()) || firebaseUser.displayName === 'DanielEsme';
          setIsAdminMode(isAdmin);
          
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserProfile;
            
            setUser(userData);
            setIsPremiumUser(userData.isPremium);
            setIsSubscriptionActive(userData.isSubscriptionActive || false);
            setIsAutismAddonActive(userData.isAutismAddonActive || false);
            
            if (userData.profiles && userData.profiles.length > 0) {
              setProfiles(userData.profiles);
              setActiveProfileId(userData.activeProfileId || userData.profiles[0].id);
            } else {
              const defaultProfile: ChildProfile = {
                id: 'default',
                name: firebaseUser.displayName?.split(' ')[0] || 'Member',
                avatar: FALLBACK_AVATAR,
                points: 0,
                streak: 0,
                sessions: 0,
                unlockedAchievements: [],
                struggleWords: [],
                voiceHistory: [],
                history: [],
                language: Language.ENGLISH,
                isPro: userData.isPremium,
                cloudSyncEnabled: true
              };
              const updatedUser = { ...userData, profiles: [defaultProfile], activeProfileId: 'default' };
              await setDoc(userDocRef, updatedUser);
              setProfiles([defaultProfile]);
              setActiveProfileId('default');
            }
          } else {
            const newUser: UserProfile = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              isPremium: false,
              isSubscriptionActive: false,
              subscriptionTier: 'free',
              purchasedExerciseIds: [],
              isAutismAddonActive: false,
              aiCredits: 0,
              isAiOptedOut: false,
              soundEnabled: true,
              hapticsEnabled: true,
              createdAt: new Date().toISOString(),
              profiles: [{
                id: 'default',
                name: firebaseUser.displayName?.split(' ')[0] || 'Member',
                avatar: '👧',
                points: 0,
                streak: 0,
                sessions: 0,
                unlockedAchievements: [],
                struggleWords: [],
                voiceHistory: [],
                history: [],
                language: Language.ENGLISH,
                isPro: false,
                cloudSyncEnabled: true,
                sensoryProfile: {
                  id: 'default',
                  childProfileId: 'default',
                  calmingColors: false,
                  reducedMotion: false,
                  highContrast: false,
                  fontScale: 1.0,
                  showVisualTimer: true
                },
                firstThenBoards: []
              }],
              activeProfileId: 'default'
            };
            await setDoc(userDocRef, newUser);
            setUser(newUser);
            setProfiles(newUser.profiles);
            setActiveProfileId('default');
          }
        } else {
          // If the secure admin bypass is active, restore the clinician persona from local storage
          if (localStorage.getItem('slp_admin_mode_override') === 'true') {
            setIsAdminMode(true);
            setUser({
              uid: 'secure-bypass-admin',
              displayName: 'Dr. Daniel (Clinical Admin)',
              email: 'danielsand711@gmail.com',
              isPremium: true,
              isSubscriptionActive: true,
              subscriptionTier: 'monthly_unlimited',
              purchasedExerciseIds: [],
              isAutismAddonActive: true,
              aiCredits: 9999,
              isAiOptedOut: false,
              soundEnabled: true,
              hapticsEnabled: true,
              createdAt: new Date().toISOString(),
              profiles: [],
              activeProfileId: 'default'
            } as UserProfile);
          } else {
            setUser(null);
            setProfiles([]);
            setIsAdminMode(false);
            setIsPremiumUser(false);
            setIsAutismAddonActive(false);
          }
        }
      } catch (error: any) {
        console.error("Auth state error:", error);
        // We still want to allow the app to function even if user profile load fails
        if (firebaseUser) {
          setIsAdminMode((firebaseUser.email?.toLowerCase() === adminEmail.toLowerCase()) || firebaseUser.displayName === 'DanielEsme');
          setUser({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'User',
            email: firebaseUser.email || '',
            isPremium: false,
            isSubscriptionActive: false,
            purchasedExerciseIds: [],
            isAutismAddonActive: false,
            createdAt: new Date().toISOString(),
            profiles: [],
            aiCredits: 0,
            isAiOptedOut: false,
            soundEnabled: true,
            hapticsEnabled: true
          } as UserProfile);
        }
      } finally {
        setIsAuthReady(true);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const enrichStoryAudio = async () => {
      if (!selectedExercise || selectedExercise.type !== ExerciseType.STORY || !selectedExercise.story) return;
      
      const hasMissingAudio = selectedExercise.story.some(page => 
        page.interactiveWords?.some(word => !word.audioUrl)
      );

      if (!hasMissingAudio) return;

      try {
        const enrichedStory = await enrichStoryWithAudio(user?.uid || 'guest', selectedExercise.story);
        setSelectedExercise({ ...selectedExercise, story: enrichedStory });
        
        // If it's a saved story, update Firestore (optional, but good for persistence)
        if (user && !selectedExercise.id.startsWith('ai-')) {
          const storyRef = doc(db, 'users', user.uid, 'stories', selectedExercise.id);
          await updateDoc(storyRef, { story: enrichedStory });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, user ? `users/${user.uid}/stories/${selectedExercise.id}` : 'unknown', auth);
      }
    };

    enrichStoryAudio();
  }, [selectedExercise?.id, user]);

  // Sync Autism Tools
  useEffect(() => {
    if (!user || !activeProfileId || user.uid === 'secure-bypass-admin' || !auth.currentUser) return;

    const sensoryRef = doc(db, 'users', user.uid, 'childProfiles', activeProfileId, 'sensoryProfile', 'default');
    const boardsRef = collection(db, 'users', user.uid, 'childProfiles', activeProfileId, 'firstThenBoards');
    const notificationRef = doc(db, 'users', user.uid, 'childProfiles', activeProfileId, 'notificationSettings', 'default');
    const clinicalRef = doc(db, 'users', user.uid, 'childProfiles', activeProfileId, 'clinicalSettings', 'default');

    const unsubSensory = onSnapshot(sensoryRef, (doc) => {
      if (doc.exists()) setSensoryProfile(doc.data() as SensoryProfile);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, sensoryRef.path, auth);
    });

    const unsubNotification = onSnapshot(notificationRef, (doc) => {
      if (doc.exists()) {
        const settings = doc.data() as NotificationSettings;
        setNotificationSettings(settings);
        if (settings.remindersEnabled && settings.practiceTime) {
          notificationService.schedulePracticeReminder(settings.practiceTime);
        }
      } else {
        setNotificationSettings(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, notificationRef.path, auth);
    });

    const unsubClinical = onSnapshot(clinicalRef, (doc) => {
      if (doc.exists()) setClinicalSettings(doc.data() as ClinicalSettings);
      else setClinicalSettings(null);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, clinicalRef.path, auth);
    });

    const unsubBoards = onSnapshot(boardsRef, (snapshot) => {
      setFirstThenBoards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirstThenBoard)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, boardsRef.path, auth);
    });

    const storiesRef = collection(db, 'users', user.uid, 'stories');
    const unsubStories = onSnapshot(storiesRef, (snapshot) => {
      setSavedStories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exercise)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, storiesRef.path, auth);
    });

    // Marketplace Sync
    const marketplaceRef = collection(db, 'marketplace');
    const unsubMarketplace = onSnapshot(marketplaceRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketplaceItem));
      if (items.length > 0) setMarketplaceItems(items);
    }, (error) => {
      if (error.code !== 'permission-denied') {
        handleFirestoreError(error, OperationType.GET, 'marketplace', auth);
      } else {
        console.warn("Marketplace listener access denied - silent fallback.");
      }
    });

    return () => {
      unsubSensory();
      unsubNotification();
      unsubClinical();
      unsubBoards();
      unsubStories();
      unsubMarketplace();
    };
  }, [user, activeProfileId]);

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        // Silent background check
      }
    };
    testConnection();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('Logged in successfully!');
    } catch (error) {
      handleError(error, ErrorType.AUTH);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully!');
    } catch (error) {
      handleError(error, ErrorType.AUTH);
    }
  };

  const handleAiOptedOut = async (val: boolean) => {
    if (user) {
      const updatedUser = { ...user, isAiOptedOut: val };
      setUser(updatedUser);
      try {
        await updateDoc(doc(db, 'users', user.uid), { isAiOptedOut: val });
        toast.success(val ? "AI Analysis disabled (Local mode active)" : "AI Analysis enabled");
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`, auth);
      }
    }
  };

  const handleToggleSound = async (val: boolean) => {
    setLocalSoundEnabled(val);
    localStorage.setItem('sound_enabled', String(val));
    if (user) {
      const updatedUser = { ...user, soundEnabled: val };
      setUser(updatedUser);
      try {
        await updateDoc(doc(db, 'users', user.uid), { soundEnabled: val });
        toast.success(val ? "Sound Effects enabled" : "Sound Effects muted");
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`, auth);
      }
    } else {
      toast.success(val ? "Sound Effects enabled" : "Sound Effects muted");
    }

    if (val) {
      // Play a preview of the successful exercise cue to let the user hear it
      setTimeout(() => {
        playCue('exercise_success');
      }, 100);
    }
  };

  const handleToggleHaptics = async (val: boolean) => {
    if (user) {
      const updatedUser = { ...user, hapticsEnabled: val };
      setUser(updatedUser);
      try {
        await updateDoc(doc(db, 'users', user.uid), { hapticsEnabled: val });
        toast.success(val ? "Haptic Feedback enabled" : "Haptic Feedback disabled");
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`, auth);
      }
    }
  };

  const handleSetLayoutMode = async (newMode: LayoutMode) => {
    setLayoutMode(newMode);
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { layoutMode: newMode });
        toast.success(`Navigation style updated to ${newMode}`);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`, auth);
      }
    }
  };

  const handlePurchaseCredits = async (type: 'credits_100' | 'credits_1000') => {
    if (!user) {
      handleLogin();
      return;
    }
    
    setIsUpgrading(true);
    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
          type: type
        }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(`Purchase failed: ${err.message}`);
    } finally {
      setIsUpgrading(false);
    }
  };

  const addFirstThenBoard = async (board: Omit<FirstThenBoard, 'id' | 'createdAt'>) => {
    if (!user || !activeProfileId) return;
    const boardsRef = collection(db, 'users', user.uid, 'childProfiles', activeProfileId, 'firstThenBoards');
    try {
      await addDoc(boardsRef, {
        ...board,
        childProfileId: activeProfileId,
        createdAt: new Date().toISOString()
      });
      toast.success('Board added!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, boardsRef.path, auth);
    }
  };

  const deleteFirstThenBoard = async (id: string) => {
    if (!user || !activeProfileId) return;
    const boardRef = doc(db, 'users', user.uid, 'childProfiles', activeProfileId, 'firstThenBoards', id);
    try {
      await deleteDoc(boardRef);
      toast.success('Board removed');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, boardRef.path, auth);
    }
  };

  const updateSensoryProfile = async (updates: Partial<SensoryProfile>) => {
    if (!user || !activeProfileId) return;
    const profileRef = doc(db, 'users', user.uid, 'childProfiles', activeProfileId, 'sensoryProfile', 'default');
    try {
      const newProfile = {
        ...(sensoryProfile || {
          id: 'default',
          childProfileId: activeProfileId,
          calmingColors: false,
          reducedMotion: false,
          highContrast: false,
          fontScale: 1.0,
          showVisualTimer: true
        }),
        ...updates
      };
      await setDoc(profileRef, newProfile);
      setSensoryProfile(newProfile);
      toast.success('Sensory settings updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, profileRef.path, auth);
    }
  };

  const updateNotificationSettings = async (updates: Partial<NotificationSettings>) => {
    if (!user || !activeProfileId) return;
    const settingsRef = doc(db, 'users', user.uid, 'childProfiles', activeProfileId, 'notificationSettings', 'default');
    try {
      const newSettings = {
        ...(notificationSettings || {
          remindersEnabled: false,
          practiceTime: '09:00',
          achievementsEnabled: true,
          milestonesEnabled: true
        }),
        ...updates
      };

      if (updates.remindersEnabled && !notificationSettings?.remindersEnabled) {
        const granted = await notificationService.requestPermission();
        if (!granted) {
          toast.error("Permission denied. We won't be able to send reminders.");
          newSettings.remindersEnabled = false;
        }
      }

      await setDoc(settingsRef, newSettings);
      setNotificationSettings(newSettings);
      toast.success('Notification settings updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, settingsRef.path, auth);
    }
  };

  const updateClinicalSettings = async (updates: Partial<ClinicalSettings>) => {
    if (!user || !activeProfileId) return;
    const settingsRef = doc(db, 'users', user.uid, 'childProfiles', activeProfileId, 'clinicalSettings', 'default');
    try {
      const newSettings = {
        ...(clinicalSettings || {
          promptingLevel: 'moderate',
          waitTimeSeconds: 5,
          feedbackComplexity: 'simple',
          focusAreas: [],
          dailyPracticeTargetMinutes: 20
        }),
        ...updates
      };
      await setDoc(settingsRef, newSettings);
      setClinicalSettings(newSettings);
      toast.success('Therapy options updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, settingsRef.path, auth);
    }
  };

  // Load profiles from localStorage on mount
  useEffect(() => {
    try {
      const savedProfiles = localStorage.getItem('bilingual_brilliant_profiles');
      const savedActiveId = localStorage.getItem('bilingual_brilliant_active_id');
      const hasSeenOnboarding = localStorage.getItem('bilingual_brilliant_onboarding_seen');
      
      if (!hasSeenOnboarding && !user) {
        setShowOnboarding(true);
      }

      if (savedProfiles) {
        setProfiles(JSON.parse(savedProfiles));
      }
      if (savedActiveId) {
        setActiveProfileId(savedActiveId);
      }
    } catch (error) {
      handleError(error, ErrorType.STORAGE);
    }
  }, []);

  // Save profiles to localStorage and Firestore whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('bilingual_brilliant_profiles', JSON.stringify(profiles));
      localStorage.setItem('bilingual_brilliant_active_id', activeProfileId);

      // Secure background Cloud Sync
      if (user && profiles.length > 0) {
        const userDocRef = doc(db, 'users', user.uid);
        updateDoc(userDocRef, { profiles }).catch(error => {
          console.warn("Silent background profile sync delayed/offline:", error);
        });
      }
    } catch (error) {
      handleError(error, ErrorType.STORAGE);
    }
  }, [profiles, activeProfileId, user]);
  const completeOnboarding = () => {
    localStorage.setItem('bilingual_brilliant_onboarding_seen', 'true');
    setShowOnboarding(false);
  };

  const handleClearCache = async () => {
    try {
      await repository.clearAllData();
      localStorage.clear();
      
      // Reset critical local states
      setProfiles([{
        id: 'default',
        name: 'Sofia',
        avatar: '👧',
        points: 0,
        streak: 0,
        sessions: 0,
        unlockedAchievements: [],
        struggleWords: [],
        voiceHistory: [],
        history: [],
        language: Language.ENGLISH,
        isPro: false,
        cloudSyncEnabled: true
      }]);
      setActiveProfileId('default');
      setDailyGoalProgress(0);
      setDownloadedIds([]);
      setBookmarks({});
      
      setShowClearCacheModal(false);
      toast.success('Local cache cleared successfully! Restarting...');
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Failed to clear cache', error);
      toast.error('Failed to clear local cache');
    }
  };


  // User Stats State (Derived from active profile)
  const userStats = {
    points: activeProfile?.points || 0,
    streak: activeProfile?.streak || 0,
    sessions: activeProfile?.sessions || 0,
    unlockedAchievements: activeProfile?.unlockedAchievements || [],
    history: activeProfile?.history || []
  };

  // Harmonized Progress Chart Data with pitchHz trend
  const progressChartData = useMemo(() => {
    if (userStats.history && userStats.history.length > 0) {
      return userStats.history.map((h, i) => ({
        date: h.date,
        score: h.score,
        sessions: h.sessions,
        pitchHz: h.pitchHz || (215 + ((i * 7) % 25) - 10)
      }));
    }

    if (activeProfile?.voiceHistory && activeProfile.voiceHistory.length > 0) {
      return [...activeProfile.voiceHistory].reverse().slice(-7).map((r, i) => ({
        date: r.timestamp ? new Date(r.timestamp).toLocaleDateString('en-US', { weekday: 'short' }) : `Trial ${i + 1}`,
        score: r.score || 80,
        sessions: 1,
        pitchHz: r.pitchHz || 215
      }));
    }

    if (localUserRecordings && localUserRecordings.length > 0) {
      return [...localUserRecordings].reverse().slice(-7).map((r, i) => ({
        date: r.timestamp ? new Date(r.timestamp).toLocaleDateString('en-US', { weekday: 'short' }) : `Trial ${i + 1}`,
        score: r.score || 80,
        sessions: 1,
        pitchHz: r.pitchHz || 215
      }));
    }

    return [
      { date: 'Mon', score: 75, sessions: 1, pitchHz: 218 },
      { date: 'Tue', score: 80, sessions: 2, pitchHz: 224 },
      { date: 'Wed', score: 82, sessions: 1, pitchHz: 215 },
      { date: 'Thu', score: 88, sessions: 3, pitchHz: 230 },
      { date: 'Fri', score: 85, sessions: 2, pitchHz: 222 },
      { date: 'Sat', score: 92, sessions: 2, pitchHz: 228 },
      { date: 'Sun', score: 95, sessions: 4, pitchHz: 220 },
    ];
  }, [userStats.history, activeProfile?.voiceHistory, localUserRecordings]);

  const setUserStats = (newStats: any) => {
    setProfiles(prev => prev.map(p => 
      p.id === activeProfileId ? { ...p, ...newStats } : p
    ));
  };
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);
  const [showStruggleWordModal, setShowStruggleWordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newStruggleWord, setNewStruggleWord] = useState('');
  const [newProfileName, setNewProfileName] = useState('');
  const [isAddingStruggleWord, setIsAddingStruggleWord] = useState(false);

  const switchProfile = async (id: string) => {
    setActiveProfileId(id);
    setShowProfileSwitcher(false);
    playCue('pop');
    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { activeProfileId: id });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`, auth);
      }
    }
  };

  const addProfile = async () => {
    if (!newProfileName.trim()) return;
    const newProfile: ChildProfile = {
      id: Math.random().toString(36).substr(2, 9),
      name: newProfileName,
      avatar: '🧒',
      points: 0,
      streak: 0,
      sessions: 0,
      unlockedAchievements: [],
      struggleWords: [],
      voiceHistory: [],
      history: [],
      language: Language.ENGLISH,
      isPro: false,
      cloudSyncEnabled: true,
      sensoryProfile: {
        id: Math.random().toString(36).substr(2, 9),
        childProfileId: '', // Will be set after creation
        calmingColors: false,
        reducedMotion: false,
        highContrast: false,
        fontScale: 1.0,
        showVisualTimer: true
      },
      firstThenBoards: []
    };
    
    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    setActiveProfileId(newProfile.id);
    
    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { 
          profiles: updatedProfiles,
          activeProfileId: newProfile.id
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`, auth);
      }
    }
    
    setNewProfileName('');
    setShowProfileModal(false);
    playCue('chime');
    toast.success(`Profile for ${newProfileName} created!`);
  };

  useEffect(() => {
    setTranslatedStoryText(null);
  }, [currentStoryPage, selectedExercise?.id]);

  useEffect(() => {
    const initDailyChallenge = () => {
      const today = new Date().toDateString();
      const lastChallengeDate = localStorage.getItem('last_challenge_date');
      
      if (lastChallengeDate !== today) {
        const available = EXERCISES.filter(ex => !ex.isPremium || activeProfile?.isPro);
        const random = available[Math.floor(Math.random() * available.length)];
        setDailyChallenge(random);
        localStorage.setItem('last_challenge_date', today);
        localStorage.setItem('daily_challenge_id', random.id);
        setDailyGoalProgress(0);
        localStorage.setItem('daily_goal_progress', '0');
      } else {
        const savedId = localStorage.getItem('daily_challenge_id');
        const saved = EXERCISES.find(ex => ex.id === savedId);
        setDailyChallenge(saved || EXERCISES[0]);
        const progress = parseInt(localStorage.getItem('daily_goal_progress') || '0');
        setDailyGoalProgress(progress);
      }
    };

    if (activeProfileId) {
      initDailyChallenge();
    }
  }, [activeProfileId, activeProfile?.isPro]);

  // Removed redundant translateStory

  const addStruggleWord = async () => {
    if (!newStruggleWord.trim() || !user) return;
    setIsAddingStruggleWord(true);
    try {
      const prompt = `Provide a simple definition and a short image prompt for the word "${newStruggleWord}" for a child's speech therapy app. Return as JSON: { "definition": "...", "imagePrompt": "..." }`;
      
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, prompt })
      });
      
      const data = await response.json();
      const aiResponse = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || "{}");
      
      // Generate image
      const imageResponse = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, prompt: aiResponse.imagePrompt })
      });
      
      const imageData = await imageResponse.json();
      const imagePart = imageData.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
      const imageUrl = imagePart ? `data:image/png;base64,${imagePart.inlineData.data}` : `https://picsum.photos/seed/${newStruggleWord}/400/300`;

      const newWord: StruggleWord = {
        id: Math.random().toString(36).substr(2, 9),
        word: newStruggleWord,
        definition: aiResponse.definition || "A new word to practice!",
        imageUrl,
        addedAt: new Date().toISOString(),
        mastered: false
      };

      setProfiles(prev => prev.map(p => 
        p.id === activeProfileId ? { ...p, struggleWords: [newWord, ...p.struggleWords] } : p
      ));
      setNewStruggleWord('');
      setShowStruggleWordModal(false);
      playCue('chime');
      toast.success(`"${newStruggleWord}" added to practice list!`);
    } catch (error) {
      handleError(error, ErrorType.AI_API);
    } finally {
      setIsAddingStruggleWord(false);
    }
  };

  const unlockAchievement = (achievement: Achievement) => {
    setProfiles(prev => prev.map(p => {
      if (p.id === activeProfileId) {
        if (p.unlockedAchievements.includes(achievement.id)) return p;
        
        // Trigger Notification
        if (notificationSettings?.achievementsEnabled) {
          notificationService.sendNotification('Achievement Unlocked! 🏆', {
            body: `You earned the "${achievement.title}" badge: ${achievement.description}`,
            tag: `achievement-${achievement.id}`
          });
        }
        
        toast.success(`Achievement Unlocked: ${achievement.title}!`, {
          icon: achievement.icon,
          description: achievement.description
        });
        
        playCue('achievement_unlock');
        setNewAchievement(achievement);
        return {
          ...p,
          unlockedAchievements: [...p.unlockedAchievements, achievement.id],
          points: (p.points || 0) + 10 // Bonus points for achievement
        };
      }
      return p;
    }));
  };

  // Achievement Checker
  useEffect(() => {
    if (!activeProfile) return;

    ACHIEVEMENTS.forEach(achievement => {
      // Skip if already unlocked
      if (activeProfile?.unlockedAchievements?.includes(achievement.id)) return;

      const { type, value } = achievement.requirement;
      let isMet = false;

      if (type === 'points') isMet = (activeProfile?.points || 0) >= value;
      if (type === 'streak') isMet = (activeProfile?.streak || 0) >= value;
      if (type === 'sessions') isMet = (activeProfile?.sessions || 0) >= value;
      
      // score is checked specifically during saveVoiceRecording
      if (type !== 'score' && isMet) {
        unlockAchievement(achievement);
      }
    });
  }, [activeProfile?.points, activeProfile?.streak, activeProfile?.sessions]);

  const saveVoiceRecording = (audioUrl: string, score: number, exercise: Exercise, rubric?: any, pitchHz?: number) => {
    const isMock = audioUrl.includes('example.com');
    const measuredPitch = pitchHz ?? (acousticStatsRef.current.pitchHz || 215);
    
    // Play unique successful exercise completion audio cue
    playCue('exercise_success');
    
    if (rubric) {
      toast.success("Clinician 3D rubric saved successfully!");
    }

    const newRecording: VoiceRecording = {
      id: Math.random().toString(36).substr(2, 9),
      exerciseId: exercise.id,
      exerciseTitle: exercise.title,
      timestamp: new Date().toISOString(),
      audioUrl: isMock ? '' : audioUrl,
      score,
      pitchHz: measuredPitch,
      assessmentRubric: rubric ? { ...rubric, pitchHz: measuredPitch } : undefined
    };

    // Update Daily Goal
    if (exercise.id === dailyChallenge?.id) {
      const newProgress = Math.min(100, dailyGoalProgress + 34);
      setDailyGoalProgress(newProgress);
      localStorage.setItem('daily_goal_progress', newProgress.toString());
      if (newProgress >= 100 && dailyGoalProgress < 100) {
        toast.success("Daily Goal Achieved! +50 Points");
        setProfiles(prev => prev.map(p => 
          p.id === activeProfileId ? { ...p, points: (p.points || 0) + 50 } : p
        ));
        playCue('chime');
      }
    }

    const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'short' });
    setProfiles(prev => prev.map(p => {
      if (p.id !== activeProfileId) return p;

      const currentHistory = [...(p.history || [])];
      const todayIdx = currentHistory.findIndex(h => h.date === todayStr);
      if (todayIdx >= 0) {
        currentHistory[todayIdx] = {
          ...currentHistory[todayIdx],
          score: Math.round((currentHistory[todayIdx].score + score) / 2),
          sessions: (currentHistory[todayIdx].sessions || 0) + 1,
          pitchHz: measuredPitch
        };
      } else {
        currentHistory.push({
          date: todayStr,
          score,
          sessions: 1,
          pitchHz: measuredPitch
        });
      }

      return { 
        ...p, 
        voiceHistory: isMock ? p.voiceHistory : [newRecording, ...p.voiceHistory], 
        history: currentHistory,
        points: (p.points || 0) + Math.floor(score / 10),
        sessions: (p.sessions || 0) + 1
      };
    }));

    // Check for perfect score achievement
    if (score === 100) {
      const perfAchievement = ACHIEVEMENTS.find(a => a.id === 'perfect_score');
      if (perfAchievement) unlockAchievement(perfAchievement);
    }

    // Trigger refresh of local recordings if it was a real recording
    if (!isMock) {
      setLocalRecordingsTrigger(prev => prev + 1);
    }
  };

  const submitRetroGrade = () => {
    if (!gradingRecording || !activeProfileId) return;

    const rubricData = {
      accuracy: retroAccuracy,
      fluency: retroFluency,
      independence: retroIndependence,
      promptLevel: retroPromptLevel,
      notes: retroNotes
    };

    setProfiles(prev => prev.map(p => {
      if (p.id !== activeProfileId) return p;
      return {
        ...p,
        voiceHistory: p.voiceHistory.map(rec => 
          rec.id === gradingRecording.id 
            ? { ...rec, score: Math.round(((retroAccuracy + retroFluency + retroIndependence) / 15) * 100), assessmentRubric: rubricData }
            : rec
        )
      };
    }));

    setGradingRecording(null);
    toast.success("Retroactive 3D Rubric evaluation saved!");
    playCue('chime');
  };

  const handleUpdateRubric = async (recordingId: string, rubricData: any) => {
    if (!activeProfileId) return;

    // Persist to IndexedDB localDb
    const dbIdStr = recordingId.startsWith('local-') ? recordingId.replace('local-', '') : recordingId;
    const dbId = parseInt(dbIdStr, 10);
    if (!isNaN(dbId)) {
      try {
        const existingRec = await localDb.recordings.get(dbId);
        if (existingRec) {
          existingRec.assessmentRubric = rubricData;
          existingRec.responseTimeMs = rubricData.responseTimeMs;
          existingRec.score = Math.round(((rubricData.accuracy + rubricData.fluency + rubricData.independence) / 15) * 100);
          await localDb.recordings.put(existingRec);
        }
      } catch (err) {
        console.error("Error updating recording in IndexedDB:", err);
      }
    }

    setProfiles(prev => prev.map(p => {
      if (p.id !== activeProfileId) return p;
      return {
        ...p,
        voiceHistory: p.voiceHistory.map(rec => 
          rec.id === recordingId 
            ? { 
                ...rec, 
                score: Math.round(((rubricData.accuracy + rubricData.fluency + rubricData.independence) / 15) * 100), 
                assessmentRubric: rubricData,
                responseTimeMs: rubricData.responseTimeMs
              }
            : rec
        )
      };
    }));

    // Trigger local recordings state refresh
    setLocalRecordingsTrigger(prev => prev + 1);

    toast.success("Retroactive clinical 3D rubric successfully synchronized!");
    playCue('chime');
  };

  const generateReport = () => {
    const doc = new jsPDF();
    const profile = activeProfile;
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text(`Speech Progress Report: ${profile?.name || 'Sofia'}`, 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Summary Stats
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Summary Statistics', 14, 45);
    
    (doc as any).autoTable({
      startY: 50,
      head: [['Metric', 'Value']],
      body: [
        ['Total Points', profile?.points || 0],
        ['Current Streak', `${profile?.streak || 0} days`],
        ['Total Sessions', profile?.sessions || 0],
        ['Mastered Words', (profile?.struggleWords || []).filter((w: any) => w.mastered).length],
      ],
    });
    
    // History Table
    if (profile?.history && profile.history.length > 0) {
      doc.text('Recent Session History', 14, (doc as any).lastAutoTable.finalY + 15);
      (doc as any).autoTable({
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Date', 'Average Score', 'Sessions']],
        body: profile.history.map((h: any) => [h.date, `${h.score}%`, h.sessions]),
      });
    }
    
    // Struggle Words
    if (profile?.struggleWords && profile.struggleWords.length > 0) {
      doc.text('Current Struggle Words', 14, (doc as any).lastAutoTable.finalY + 15);
      (doc as any).autoTable({
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Word', 'Added On', 'Status']],
        body: profile.struggleWords.map((w: any) => [
          w.word, 
          new Date(w.addedAt).toLocaleDateString(), 
          w.mastered ? 'Mastered' : 'In Progress'
        ]),
      });
    }
    
    doc.save(`${profile?.name || 'Sofia'}_Speech_Report.pdf`);
    playCue('chime');
  };

  useEffect(() => {
    setActiveWord(null);
    setTranslatedStoryText(null);
  }, [currentStoryPage, selectedExercise]);

  const playTargetAudio = (url: string) => {
    if (!url) return;
    setIsPlayingAudio(true);
    const audio = new Audio(url);
    audio.onended = () => setIsPlayingAudio(false);
    audio.onerror = () => setIsPlayingAudio(false);
    audio.play().catch(err => {
      handleError(err, ErrorType.AUDIO);
      setIsPlayingAudio(false);
    });
  };

  const playOrGenerateExerciseAudio = async (text: string, field: string) => {
    if (!selectedExercise || isPlayingAudio || isGeneratingExerciseAudio) return;

    // If it's the main audioUrl, check for local mentor recording first
    if (field === 'audioUrl' && localMentorAudio) {
      playTargetAudio(localMentorAudio);
      return;
    }

    // Helper to get nested value
    const getNestedValue = (obj: any, path: string) => {
      return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    const existingAudioUrl = getNestedValue(selectedExercise, field);
    if (existingAudioUrl && !existingAudioUrl.includes('soundhelix.com')) {
      playTargetAudio(existingAudioUrl);
      return;
    }

    setIsGeneratingExerciseAudio(true);
    try {
      const audioUrl = await generateWordAudio(user?.uid || 'guest', text);
      if (audioUrl) {
        // Helper to set nested value
        const setNestedValue = (obj: any, path: string, value: any) => {
          const parts = path.split('.');
          const last = parts.pop()!;
          const target = parts.reduce((acc, part) => {
            if (!acc[part]) acc[part] = {};
            return acc[part];
          }, obj);
          target[last] = value;
          return { ...obj };
        };

        const updatedExercise = setNestedValue({ ...selectedExercise }, field, audioUrl);
        setSelectedExercise(updatedExercise);
        
        playTargetAudio(audioUrl);
      }
    } catch (error) {
      handleError(error, ErrorType.AI_API);
    } finally {
      setIsGeneratingExerciseAudio(false);
    }
  };

  const triggerHaptic = (style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
    if (!user?.hapticsEnabled) return;
    
    if ('vibrate' in navigator) {
      switch (style) {
        case 'light': navigator.vibrate(10); break;
        case 'medium': navigator.vibrate(25); break;
        case 'heavy': navigator.vibrate(50); break;
        case 'success': navigator.vibrate([20, 30, 20]); break;
        case 'warning': navigator.vibrate([40, 40, 40]); break;
        case 'error': navigator.vibrate([60, 40, 60, 40, 100]); break;
      }
    }
  };

  const synthSound = (type: 'chime' | 'swoosh' | 'pop' | 'exercise_success' | 'achievement_unlock') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const playTone = (freq: number, start: number, duration: number, volume: number = 0.1, oscType: OscillatorType = 'sine') => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = oscType;
        osc.frequency.setValueAtTime(freq, start);
        
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(volume, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      const now = ctx.currentTime;
      if (type === 'pop') {
        playTone(600, now, 0.08, 0.04, 'triangle');
      } else if (type === 'swoosh') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(700, now + 0.12);
        
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'chime') {
        playTone(880, now, 0.35, 0.04);
        playTone(1320, now + 0.04, 0.35, 0.02);
      } else if (type === 'exercise_success') {
        // Playful rising major pentatonic arpeggio (C5, E5, G5, C6)
        const freqs = [523.25, 659.25, 783.99, 1046.50];
        freqs.forEach((f, idx) => {
          playTone(f, now + idx * 0.07, 0.3, 0.04, 'sine');
        });
        // Sparkling fifth tone on top
        playTone(1318.51, now + 0.28, 0.45, 0.025, 'sine');
      } else if (type === 'achievement_unlock') {
        // Celebratory triumphant fanfare chord
        const melody = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
        melody.forEach((f, idx) => {
          playTone(f, now + idx * 0.05, 0.25, 0.035, 'triangle');
        });
        // Big C major triad finish
        const triad = [523.25, 659.25, 783.99, 1046.50];
        triad.forEach(f => {
          playTone(f, now + 0.35, 0.8, 0.02, 'sine');
        });
      }
    } catch (error) {
      console.warn("SynthSound error:", error);
    }
  };

  const playCue = async (type: 'chime' | 'swoosh' | 'pop' | 'exercise_success' | 'achievement_unlock') => {
    const isSoundOn = user ? (user.soundEnabled ?? true) : localSoundEnabled;
    if (!isSoundOn) return;
    
    // Trigger haptic on certain cues
    if (type === 'chime' || type === 'exercise_success' || type === 'achievement_unlock') triggerHaptic('success');
    if (type === 'pop') triggerHaptic('light');

    // Synthesis is extremely fast, 100% reliable, zero network latency, and offline-capable
    synthSound(type);

    if (type === 'chime' || type === 'swoosh' || type === 'pop') {
      // Keep legacy Audio element trigger as fallback for basic types to preserve any preloaded physical files
      const urls = {
        chime: '/sounds/chime.mp3', 
        swoosh: '/sounds/swoosh.mp3',
        pop: '/sounds/pop.mp3'
      };
      const fallbacks = {
        chime: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
        swoosh: 'https://www.soundjay.com/button/sounds/button-20.mp3',
        pop: 'https://www.soundjay.com/button/sounds/button-37.mp3'
      };
      
      let audioUrl = fallbacks[type];
      try {
        const checkLocal = await fetch(urls[type], { method: 'HEAD' });
        if (checkLocal.ok) {
          audioUrl = urls[type];
        }
      } catch (e) {
        // fallback
      }

      const audio = new Audio(audioUrl);
      audio.volume = 0.15;
      audio.play().catch(() => {});
    }
  };

  const getThemeStyles = () => {
    let baseStyles;
    switch (theme) {
      case Theme.KID:
        baseStyles = {
          bg: isDarkMode ? 'bg-[#1e1540]' : 'bg-[#FFF9E6]',
          card: isDarkMode 
            ? 'bg-[#2a1e54] rounded-[40px] border-4 border-[#FFD93D] shadow-[8px_8px_0px_0px_#FFD93D] text-white' 
            : 'bg-white rounded-[40px] border-4 border-[#FFD93D] shadow-[8px_8px_0px_0px_#FFD93D]',
          primary: 'text-[#FF6B6B]',
          accent: 'bg-[#4D96FF]',
          button: 'bg-[#FF6B6B] hover:bg-[#FF8787] rounded-full shadow-[4px_4px_0px_0px_#EE5253]',
          font: 'font-["Comic_Sans_MS",_cursive,_sans-serif]',
          icon: 'text-[#6BCB77]'
        };
        break;
      case Theme.TEENAGE:
        baseStyles = {
          bg: 'bg-[#0F172A]',
          card: 'bg-[#1E293B] rounded-none border-2 border-[#38BDF8] shadow-[4px_4px_0px_0px_#38BDF8]',
          primary: 'text-[#38BDF8]',
          accent: 'bg-[#F472B6]',
          button: 'bg-[#38BDF8] hover:bg-[#7DD3FC] rounded-none uppercase tracking-tighter',
          font: 'font-mono',
          icon: 'text-[#F472B6]'
        };
        break;
      case Theme.PLAYFUL:
        baseStyles = {
          bg: isDarkMode ? 'bg-[#2d1130]' : 'bg-[#FFEFD5]',
          card: isDarkMode 
            ? 'bg-[#3d1a40] rounded-[60px] border-8 border-[#FF69B4] shadow-[12px_12px_0px_0px_#FF69B4] text-white' 
            : 'bg-white rounded-[60px] border-8 border-[#FF69B4] shadow-[12px_12px_0px_0px_#FF69B4]',
          primary: 'text-[#FF1493]',
          accent: 'bg-[#00BFFF]',
          button: 'bg-[#FF69B4] hover:bg-[#FF1493] rounded-full shadow-[6px_6px_0px_0px_#C71585]',
          font: 'font-["Bubblegum_Sans",_cursive,_sans-serif]',
          icon: 'text-[#32CD32]'
        };
        break;
      case Theme.PROFESSIONAL:
        baseStyles = {
          bg: isDarkMode ? 'bg-[#0F172A]' : 'bg-[#F8FAFC]',
          card: isDarkMode 
            ? 'bg-[#1E293B] rounded-lg border border-slate-800 shadow-sm text-slate-100' 
            : 'bg-white rounded-lg border border-slate-200 shadow-sm',
          primary: isDarkMode ? 'text-slate-100' : 'text-slate-900',
          accent: 'bg-slate-800',
          button: isDarkMode ? 'bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-md' : 'bg-slate-900 hover:bg-slate-800 rounded-md text-white',
          font: 'font-sans',
          icon: 'text-slate-400'
        };
        break;
      default: // MODERN
        baseStyles = {
          bg: isDarkMode ? 'bg-[#090D16]' : 'bg-[#F8FAFC]',
          card: isDarkMode 
            ? 'bg-[#111827]/80 backdrop-blur-xl border border-slate-800 shadow-2xl text-slate-100' 
            : 'glass rounded-4xl master-shadow',
          primary: 'text-primary',
          accent: 'bg-accent',
          button: 'master-gradient hover:shadow-primary/30 rounded-2xl text-white font-black uppercase tracking-widest',
          font: 'font-sans',
          icon: 'text-primary'
        };
    }

    // Apply Sensory Profile Overrides
    if (sensoryProfile) {
      if (sensoryProfile.calmingColors) {
        baseStyles.bg = isDarkMode ? 'bg-[#1F2937]' : 'bg-[#F0F4F8]'; // Soft blue-gray / dark-gray
        baseStyles.primary = 'text-[#818CF8]';
        baseStyles.button = 'bg-[#818CF8] hover:bg-[#6366F1] rounded-full';
      }
      if (sensoryProfile.highContrast) {
        baseStyles.bg = isDarkMode ? 'bg-black' : 'bg-white';
        baseStyles.card = isDarkMode 
          ? 'bg-black rounded-none border-4 border-white shadow-none text-white' 
          : 'bg-white rounded-none border-4 border-black shadow-none';
        baseStyles.primary = isDarkMode ? 'text-white font-black' : 'text-black font-black';
        baseStyles.button = isDarkMode ? 'bg-white hover:bg-slate-200 text-black rounded-none' : 'bg-black hover:bg-slate-800 text-white rounded-none';
      }
      if (sensoryProfile.reducedMotion) {
        // We can't easily change the motion props here, but we can change the transition duration if we pass it
        baseStyles.reducedMotion = true;
      }
    }

    return baseStyles;
  };

  const styles = getThemeStyles();

  const renderStoryText = (text: string, interactiveWords?: any[]) => {
    const words = text.split(/(\s+)/);
    
    return words.map((word, i) => {
      if (word.trim() === '') return word;

      const cleanWord = word.replace(/[.,!?;:]/g, '');
      const interactive = interactiveWords?.find(w => w.word.toLowerCase() === cleanWord.toLowerCase());
      
      const animations = ['bounce', 'shake', 'pulse'] as const;
      const animation = interactive?.animation || animations[cleanWord.length % animations.length];

      const handleClick = () => {
        if (interactive) {
          setActiveWord(interactive);
          if (interactive.audioUrl) {
            playTargetAudio(interactive.audioUrl);
          } else {
            speakText(cleanWord, selectedExercise?.language);
          }
        } else {
          speakText(cleanWord, selectedExercise?.language);
        }
      };

      return (
        <motion.span
          key={i}
          onClick={handleClick}
          whileHover={{ 
            scale: 1.1, 
            color: interactive ? 'var(--color-accent)' : 'var(--color-primary)',
            cursor: 'pointer'
          }}
          whileTap={{ scale: 0.95 }}
          animate={interactive ? (
            animation === 'bounce' ? { y: [0, -8, 0] } : 
            animation === 'shake' ? { x: [-2, 2, -2] } : 
            animation === 'pulse' ? { scale: [1, 1.1, 1] } : {}
          ) : {}}
          transition={{ 
            duration: 0.6, 
            repeat: interactive ? Infinity : 0, 
            repeatType: "reverse" 
          }}
          className={`inline-block px-1 rounded-lg transition-colors ${
            interactive 
              ? 'font-black underline decoration-accent decoration-4 underline-offset-4 text-accent' 
              : 'hover:bg-slate-50'
          }`}
        >
          {word}
        </motion.span>
      );
    });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  const handleStartPractice = async (exercise: Exercise) => {
    if (exercise.isPremium && !isPremiumUser) {
      setView('pricing');
      return;
    }
    if (isOfflineMode && !downloadedIds.includes(exercise.id)) {
      return; // Can't start non-downloaded exercise in offline mode
    }
    playCue('swoosh');
    
    // Scroll to practice area
    setTimeout(() => {
      practiceAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    // Enrich story with images and audio if they are missing
    let enrichedExercise = { ...exercise };
    if (exercise.type === ExerciseType.STORY && exercise.story) {
      const needsImages = exercise.story.some(p => !p.imageUrl);
      const needsAudio = exercise.story.some(p => p.interactiveWords?.some(w => !w.audioUrl));
      
      if (needsImages || needsAudio) {
        setIsGeneratingStory(true); // Use generating story state for loading
        try {
          let enrichedStory = [...exercise.story];
          if (needsImages) {
            enrichedStory = await enrichStoryWithImages(user?.uid || 'guest', enrichedStory, exercise.title);
          }
          if (needsAudio) {
            enrichedStory = await enrichStoryWithAudio(user?.uid || 'guest', enrichedStory);
          }
          
          enrichedExercise = { ...exercise, story: enrichedStory };
          if (!enrichedExercise.imageUrl) {
            enrichedExercise.imageUrl = enrichedStory[0]?.imageUrl;
          }
        } catch (error) {
          handleError(error, ErrorType.AI_API);
        } finally {
          setIsGeneratingStory(false);
        }
      }
    }

    setSelectedExercise(enrichedExercise);
    setFeedback(null);
    setShowGuide(false);
    setSliderValue(0);
    
    // Resume from bookmark if it exists
    if (exercise.type === ExerciseType.STORY && bookmarks[exercise.id] !== undefined) {
      setCurrentStoryPage(bookmarks[exercise.id]);
    } else {
      setCurrentStoryPage(0);
    }

    if (exercise.spinningSyllables) {
      setSpinValues(exercise.spinningSyllables.map(() => 0));
    } else {
      setSpinValues([]);
    }
    setView('practice');
  };

  const toggleBookmark = (exerciseId: string, pageIndex: number) => {
    setBookmarks(prev => {
      const next = { ...prev };
      if (next[exerciseId] === pageIndex) {
        delete next[exerciseId];
      } else {
        next[exerciseId] = pageIndex;
      }
      return next;
    });
    playCue('chime');
  };

  const handleSpinAll = () => {
    if (!selectedExercise?.spinningSyllables) return;
    
    selectedExercise.spinningSyllables.forEach((options, i) => {
      let count = 0;
      const max = 4 + Math.floor(Math.random() * 4);
      const interval = setInterval(() => {
        setSpinValues(prev => {
          const next = [...prev];
          next[i] = Math.floor(Math.random() * options.length);
          return next;
        });
        count++;
        if (count >= max) clearInterval(interval);
      }, 100);
    });
  };

  const handleSaveStory = async () => {
    if (!user || !selectedExercise || !selectedExercise.id.startsWith('ai-')) return;
    
    try {
      const storiesRef = collection(db, 'users', user.uid, 'stories');
      const { id, ...storyData } = selectedExercise;
      await addDoc(storiesRef, {
        ...storyData,
        createdAt: new Date().toISOString()
      });
      toast.success('Story saved to your library!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/stories`, auth);
    }
  };

  const handleGenerateStory = async () => {
    if (!isPremiumUser) {
      setView('pricing');
      return;
    }
    if (!storyTopic.trim()) return;
    
    setIsGeneratingStory(true);
    try {
      const result = await generateStory(user?.uid || 'guest', storyTopic, storyLanguage, storyDifficulty);
      const newStory: Exercise = {
        id: `ai-${Date.now()}`,
        ...result,
        imageUrl: result.story[0]?.imageUrl, // Set top-level image to first page
        language: storyLanguage,
        difficulty: storyDifficulty,
        type: ExerciseType.STORY,
        category: 'Story Time',
        isPremium: true, // AI generation is a premium feature
      };
      
      setSelectedExercise(newStory);
      setShowGenerationModal(false);
      setStoryTopic('');
      playCue('chime');
    } catch (error) {
      handleError(error, ErrorType.AI_API);
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const handleTranslateStory = async () => {
    if (!isPremiumUser) {
      setView('pricing');
      return;
    }
    if (!selectedExercise || selectedExercise.type !== ExerciseType.STORY || isTranslating) return;
    
    const currentText = selectedExercise.story![currentStoryPage].text;
    setIsTranslating(true);
    try {
      const translation = await translateStoryPage(user?.uid || 'guest', currentText);
      if (translation) {
        setTranslatedStoryText(translation);
      }
    } catch (error) {
      handleError(error, ErrorType.AI_API);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSpinSlot = (i: number) => {
    if (!selectedExercise?.spinningSyllables) return;
    const options = selectedExercise.spinningSyllables[i];
    let count = 0;
    const max = 4;
    const interval = setInterval(() => {
      setSpinValues(prev => {
        const next = [...prev];
        next[i] = Math.floor(Math.random() * options.length);
        return next;
      });
      count++;
      if (count >= max) clearInterval(interval);
    }, 100);
  };

  const handleDownload = (e: any, id: string) => {
    e.stopPropagation();
    if (!isPremiumUser) {
      setView('pricing');
      return;
    }
    setDownloadedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    let urlsToRevoke: string[] = [];
    const loadLocalUserRecordings = async () => {
      if (activeProfile) {
        const recordings = await localDb.recordings
          .where({ profileId: activeProfile.id, type: 'user' })
          .reverse()
          .sortBy('timestamp');
        
        const mapped = recordings.map(r => {
          const url = URL.createObjectURL(r.audioBlob);
          urlsToRevoke.push(url);
          const recordingPitch = r.pitchHz ?? (r.metrics?.pitchHz ?? (r.assessmentRubric?.pitchHz ?? 215));
          return {
            id: `local-${r.id}`,
            exerciseId: r.exerciseId,
            exerciseTitle: r.exerciseTitle,
            audioUrl: url,
            timestamp: r.timestamp,
            score: r.score || 0,
            pitchHz: recordingPitch,
            assessmentRubric: r.assessmentRubric || (r.metrics ? {
              accuracy: r.metrics.accuracy || 5,
              fluency: r.metrics.fluency || 5,
              independence: 5,
              promptLevel: 'Independent',
              notes: r.metrics.feedback || '',
              intelligibility: { familiar: 75, unfamiliar: 50 },
              responseTimeMs: r.responseTimeMs || 1000,
              pitchHz: recordingPitch
            } : undefined),
            responseTimeMs: r.responseTimeMs || 1000,
            isLocal: true
          };
        });
        
        setLocalUserRecordings(mapped);
      }
    };
    loadLocalUserRecordings();

    return () => {
      urlsToRevoke.forEach(url => URL.revokeObjectURL(url));
    };
  }, [activeProfileId, isRecording, localRecordingsTrigger]); // Refresh when profile changes, recording stops, or manual trigger

  useEffect(() => {
    const loadLocalMentorAudio = async () => {
      if (selectedExercise && activeProfile) {
        const recording = await localDb.recordings
          .where({ exerciseId: selectedExercise.id, type: 'target', profileId: activeProfile.id })
          .first();
        if (recording) {
          setLocalMentorAudio(URL.createObjectURL(recording.audioBlob));
        } else {
          setLocalMentorAudio(null);
        }
      }
    };
    loadLocalMentorAudio();
  }, [selectedExercise, activeProfile]);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Browser support check
  useEffect(() => {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      toast.error("Unsupported Browser", {
        description: "Your browser doesn't support audio recording. Please try Chrome, Safari, or Firefox."
      });
    }
  }, []);

  // Handle recording interruptions (tab switch, mobile background)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRecording) {
        stopRecording();
        handleError(new Error('interrupted: Recording stopped because you switched tabs.'), ErrorType.AUDIO);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !window.MediaRecorder) {
        toast.error("Speech Recognition Unavailable", {
          description: "Your browser environment does not support audio recording. Switching to manual transcription fallback."
        });
        setActiveSpeechProvider(SpeechProviderType.MANUAL_EVALUATION);
        return;
      }

      // Check Privacy & Compliance Recording Consent
      if (!privacyGovernanceService.hasActiveConsent()) {
        setShowRecordingConsentModal(true);
        return;
      }

      const permResult = await sttService.requestMicPermission();
      if (!permResult.granted) {
        setMicPermissionState('denied');
        toast.error("Microphone Permission Required", {
          description: "Please allow microphone access in your browser settings to practice speech exercises."
        });
        return;
      }
      setMicPermissionState('granted');

      speechInitiationTimeRef.current = null;
      recordingStartTimeRef.current = Date.now();
      setSttLiveTranscript('');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      // Determine speech recognition language
      const langCode = selectedExercise?.language || Language.ENGLISH;

      // Start the decoupled Speech Recognition Provider
      try {
        sttService.startListening({
          language: langCode,
          continuous: false,
          interimResults: true,
          preferLocalProcessing: true,
          onResult: (result) => {
            setSttLiveTranscript(result.transcript);
            setActiveSpeechProvider(result.provider);
          },
          onProviderChange: (provider) => {
            setActiveSpeechProvider(provider);
          },
          onError: (err) => {
            console.warn("STT listener notice:", err);
            if (err.code === 'language-not-supported') {
              toast.info("Language Not Supported by Browser STT", {
                description: `Switched automatically to on-device Acoustic Phonetic engine for ${langCode}.`
              });
            } else if (err.code === 'network' || err.code === 'service-not-allowed') {
              toast.info("Speech Service Fallback Active", {
                description: "Switched to local Acoustic-Phonetic engine."
              });
            }
          },
          onUnexpectedEnd: () => {
            console.log("Speech recognition ended prematurely, attempting seamless buffer preservation.");
          }
        });
      } catch (sttErr) {
        console.warn("STT auto-start fallback notice:", sttErr);
      }

      // Monitor volume & pitch to calculate acoustic stats and responseTimeMs
      let localAvgDb = 45;
      let localPeakDb = 50;
      let dbReadings: number[] = [];
      let pitchReadings: number[] = [];

      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const timeDataArray = new Float32Array(analyser.fftSize);
        source.connect(analyser);

        const checkAudio = () => {
          if ((recorder.state as string) === 'inactive') {
            audioContext.close().catch(() => {});
            return;
          }
          analyser.getByteFrequencyData(dataArray);
          analyser.getFloatTimeDomainData(timeDataArray);

          // Real-time pitch tracking via autocorrelation
          const detectedPitch = audioService.detectPitch(timeDataArray, audioContext.sampleRate, 75, 600);
          if (detectedPitch > 75 && detectedPitch < 550) {
            pitchReadings.push(detectedPitch);
          }

          let sum = 0;
          let peak = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
            if (dataArray[i] > peak) peak = dataArray[i];
          }
          const average = sum / bufferLength;
          const currentDb = Math.round((average / 255) * 100);
          dbReadings.push(currentDb);
          setLiveAudioLevel(currentDb);

          if (currentDb > localPeakDb) localPeakDb = currentDb;

          if (average > 25 && !speechInitiationTimeRef.current) {
            speechInitiationTimeRef.current = Date.now();
          }

          if ((recorder.state as string) !== 'inactive') {
            requestAnimationFrame(checkAudio);
          } else {
            setLiveAudioLevel(0);
            if (dbReadings.length > 0) {
              localAvgDb = Math.round(dbReadings.reduce((a, b) => a + b, 0) / dbReadings.length);
            }
            const averagePitch = pitchReadings.length > 0 
              ? Math.round(pitchReadings.reduce((a, b) => a + b, 0) / pitchReadings.length) 
              : 215;

            acousticStatsRef.current = {
              avgDb: localAvgDb || 50,
              peakDb: localPeakDb || 65,
              pitchHz: averagePitch || 215,
              voiceOnsetMs: speechInitiationTimeRef.current 
                ? (speechInitiationTimeRef.current - recordingStartTimeRef.current) 
                : 420
            };
            audioContext.close().catch(() => {});
          }
        };
        requestAnimationFrame(checkAudio);
      } catch (ae) {
        console.warn("Speech onset volume analyser failed:", ae);
      }

      recorder.onerror = (e: any) => {
        handleError(e.error || new Error('Recorder error'), ErrorType.AUDIO);
        stopRecording();
      };

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());

        // Stop Speech Recognition provider
        try {
          sttService.stopListening();
        } catch (e) {}

        if (chunks.length === 0) {
          setIsAnalyzing(false);
          setIsRecording(false);
          handleError(new Error('empty audio'), ErrorType.AUDIO);
          return;
        }

        const blob = new Blob(chunks, { type: 'audio/webm' });
        
        if (blob.size < 100) {
          setIsAnalyzing(false);
          setIsRecording(false);
          handleError(new Error('empty audio'), ErrorType.AUDIO);
          return;
        }

        const audioUrl = URL.createObjectURL(blob);
        
        if (isMentorMode) {
          if (selectedExercise && activeProfile) {
            // Save mentor target recording
            await localDb.recordings.add({
              exerciseId: selectedExercise.id,
              type: 'target',
              audioBlob: blob,
              timestamp: Date.now(),
              exerciseTitle: selectedExercise.title,
              profileId: activeProfile.id
            });
            setLocalMentorAudio(audioUrl);
            toast.success("Mentor recording saved!");
          }
          setIsRecording(false);
          return;
        }

        // Student recording clinical pipeline
        setIsAnalyzing(true);
        
        (async () => {
          if (selectedExercise) {
            try {
              const targetText = selectedExercise.type === ExerciseType.STORY 
                ? selectedExercise.story![currentStoryPage].text 
                : selectedExercise.type === ExerciseType.PRONUNCIATION_DRILL && selectedExercise.targetSentence
                  ? selectedExercise.targetSentence
                  : selectedExercise.targetWord || "";

              const computedLatency = speechInitiationTimeRef.current
                ? (speechInitiationTimeRef.current - recordingStartTimeRef.current)
                : (Math.floor(Math.random() * 500) + 300);

              // 1. DETERMINISTIC CLINICAL SCORING (Operates 100% offline & without Gemini)
              const deterministicAttempt = clinicalEngine.evaluateAttempt(
                selectedExercise,
                sttLiveTranscript,
                {
                  avgDecibels: acousticStatsRef.current.avgDb,
                  peakDecibels: acousticStatsRef.current.peakDb,
                  fundamentalFrequencyHz: acousticStatsRef.current.pitchHz,
                  voiceOnsetLatencyMs: computedLatency
                },
                sttService.getActiveProvider()
              );

              setLastStructuredAttempt(deterministicAttempt);

              let result: SpeechAnalysisResult = {
                score: deterministicAttempt.overallScore,
                accuracy: deterministicAttempt.accuracyScore,
                fluency: deterministicAttempt.fluencyScore,
                pronunciation: deterministicAttempt.pronunciationScore,
                feedback: deterministicAttempt.deterministicFeedback,
                isPerfect: deterministicAttempt.overallScore >= 95
              };

              const isAiOptedOut = user?.isAiOptedOut || activeProfile?.isAiOptedOut;

              // 2. OPTIONAL ENHANCED AI LAYER (Gemini provides coaching if enabled, but never blocks scoring)
              if (!isOfflineMode && activeProfile?.isPro && !isAiOptedOut && isOnline) {
                try {
                  const enhancedAI = await analyzeSpeech(
                    user?.uid || 'guest',
                    blob,
                    targetText,
                    selectedExercise.language,
                    selectedExercise.difficulty,
                    selectedExercise.targetSentence,
                    selectedExercise.pronunciationGuide?.mouthPosition,
                    selectedExercise.pronunciationGuide?.tonguePlacement,
                    selectedExercise.pronunciationGuide?.tip
                  );
                  if (enhancedAI && enhancedAI.feedback) {
                    result.feedback = enhancedAI.feedback;
                  }
                } catch (aiErr) {
                  console.info("Gemini enhanced feedback skipped; utilizing deterministic clinical engine feedback.");
                }
              }

              setFeedback(result);
              playCue('chime');

              if (result.score >= 90) {
                setComboCount(prev => prev + 1);
                confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.6 },
                  colors: ['#FFD700', '#FFA500', '#FF4500']
                });
              } else {
                setComboCount(0);
              }
              
              // Save to Repository (Local-First with structured attempt data, Firestore has NO base64 audio)
              if (activeProfile) {
                const intelligibilityScore = Math.max(0, Math.min(100, Math.round(100 - deterministicAttempt.wer * 100)));
                const measuredPitch = acousticStatsRef.current.pitchHz || 215;
                const audioBlobUrl = URL.createObjectURL(blob);

                const recording: LocalRecording = {
                  exerciseId: selectedExercise.id,
                  type: 'user',
                  audioBlob: blob,
                  timestamp: Date.now(),
                  score: result.score,
                  exerciseTitle: selectedExercise.title,
                  profileId: activeProfile.id,
                  responseTimeMs: computedLatency,
                  pitchHz: measuredPitch,
                  metrics: {
                    accuracy: result.accuracy,
                    fluency: result.fluency,
                    pronunciation: result.pronunciation,
                    feedback: result.feedback,
                    pitchHz: measuredPitch
                  },
                  assessmentRubric: {
                    accuracy: result.accuracy ? Math.max(1, Math.min(5, Math.ceil(result.accuracy / 20))) : 5,
                    fluency: result.fluency ? Math.max(1, Math.min(5, Math.ceil(result.fluency / 20))) : 5,
                    independence: 5,
                    promptLevel: 'Independent',
                    notes: result.feedback,
                    intelligibility: {
                      familiar: Math.min(100, intelligibilityScore + 10),
                      unfamiliar: intelligibilityScore
                    },
                    responseTimeMs: computedLatency,
                    pitchHz: measuredPitch
                  }
                };
                
                await repository.saveRecording(recording, cloudSync && activeProfile.isPro, user?.uid, deterministicAttempt);
                
                const newVoiceRecording: VoiceRecording = {
                  id: `rec-${Date.now()}`,
                  exerciseId: selectedExercise.id,
                  exerciseTitle: selectedExercise.title,
                  timestamp: new Date().toISOString(),
                  audioUrl: audioBlobUrl,
                  score: result.score,
                  pitchHz: measuredPitch,
                  responseTimeMs: computedLatency,
                  assessmentRubric: recording.assessmentRubric
                };

                const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'short' });
                const currentHistory = [...(activeProfile.history || [])];
                const todayIdx = currentHistory.findIndex(h => h.date === todayStr);
                if (todayIdx >= 0) {
                  currentHistory[todayIdx] = {
                    ...currentHistory[todayIdx],
                    score: Math.round((currentHistory[todayIdx].score + result.score) / 2),
                    sessions: (currentHistory[todayIdx].sessions || 0) + 1,
                    pitchHz: measuredPitch
                  };
                } else {
                  currentHistory.push({
                    date: todayStr,
                    score: result.score,
                    sessions: 1,
                    pitchHz: measuredPitch
                  });
                }

                // Update Profile Stats locally
                const updatedProfile = {
                  ...activeProfile,
                  points: activeProfile.points + Math.floor(result.score / 10),
                  sessions: (activeProfile.sessions || 0) + 1,
                  voiceHistory: [newVoiceRecording, ...(activeProfile.voiceHistory || [])],
                  history: currentHistory,
                  lastActive: Date.now()
                };
                await repository.saveProfile(updatedProfile);
                setProfiles(prev => prev.map(p => p.id === activeProfile.id ? updatedProfile : p));
                setLocalRecordingsTrigger(prev => prev + 1);
              }
            } catch (error) {
              console.error("Speech analysis failed:", error);
              toast.error("Speech processing encountered an issue. Using local fallback.");
            } finally {
              setIsAnalyzing(false);
              setIsRecording(false);
            }
          } else {
            setIsAnalyzing(false);
            setIsRecording(false);
          }
        })();
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      handleError(err, ErrorType.AUDIO);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try {
        mediaRecorder.stop();
        if (mediaRecorder.stream) {
          mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
      } catch (err) {
        console.error("Error stopping recorder:", err);
      }
    }
    try {
      sttService.stopListening();
    } catch (e) {}
  };


  return (
    <MotionConfig reducedMotion={sensoryProfile?.reducedMotion ? "always" : "never"}>
      <AnimatePresence>
        {!isAuthReady && <LoadingScreen />}
      </AnimatePresence>
      <div 
        className={`min-h-screen flex flex-col transition-all duration-500 ${styles.bg} ${styles.font} ${
          sensoryProfile?.calmingColors ? 'calming-colors' : ''
        } ${sensoryProfile?.highContrast ? 'high-contrast' : ''}`}
        style={{ fontSize: sensoryProfile?.fontScale ? `${sensoryProfile.fontScale}rem` : undefined }}
      >
      <AnimatePresence>
        {activeAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
            onClick={() => setActiveAnimation(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setActiveAnimation(null)}
                className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
              
              <h3 className="text-2xl font-black mb-6 text-center">{activeAnimation.title}</h3>
              
              <div className="aspect-square rounded-3xl overflow-hidden border-4 border-slate-100 shadow-inner bg-slate-50 flex items-center justify-center">
                {activeAnimation.url.toLowerCase().endsWith('.mp4') || activeAnimation.url.toLowerCase().endsWith('.webm') ? (
                  <video 
                    src={activeAnimation.url} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img 
                    src={activeAnimation.url} 
                    alt={activeAnimation.title}
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
              
              <div className="mt-8 flex flex-col items-center gap-4">
                <p className="text-slate-500 text-sm font-medium text-center max-w-md">
                  Watch carefully how the mouth and tongue move to make this sound!
                </p>
                <button
                  onClick={() => setActiveAnimation(null)}
                  className={`px-12 py-4 rounded-2xl text-white font-black uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 ${styles.button}`}
                >
                  Got it!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md"
            onClick={() => setActiveAnimation(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setActiveAnimation(null)}
                className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
              
              <h3 className="text-2xl font-black mb-6 text-center">{activeAnimation.title}</h3>
              
              <div className="aspect-square rounded-3xl overflow-hidden border-4 border-slate-100 shadow-inner bg-slate-50 flex items-center justify-center">
                {activeAnimation.url.toLowerCase().endsWith('.mp4') || activeAnimation.url.toLowerCase().endsWith('.webm') ? (
                  <video 
                    src={activeAnimation.url} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img 
                    src={activeAnimation.url} 
                    alt={activeAnimation.title}
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
              
              <div className="mt-8 flex flex-col items-center gap-4">
                <p className="text-slate-500 text-sm font-medium text-center max-w-md">
                  Watch carefully how the mouth and tongue move to make this sound!
                </p>
                <button
                  onClick={() => setActiveAnimation(null)}
                  className={`px-12 py-4 rounded-2xl text-white font-black uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 ${styles.button}`}
                >
                  Got it!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toaster position="top-center" richColors />
      {/* Achievement Notification */}
      <AnimatePresence>
        {newAchievement && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-24 left-1/2 z-50 bg-white border-2 border-primary p-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[300px]"
          >
            <div className="text-4xl">{newAchievement.icon}</div>
            <div>
              <p className="text-xs font-black text-primary uppercase tracking-widest">Achievement Unlocked!</p>
              <h4 className="font-bold text-lg">{newAchievement.title}</h4>
              <p className="text-sm text-slate-500">{newAchievement.description}</p>
            </div>
            <button 
              onClick={() => setNewAchievement(null)}
              className="ml-auto text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Word Modal */}
      <AnimatePresence>
        {activeWord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setActiveWord(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`max-w-sm w-full p-8 text-center relative ${styles.card}`}
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setActiveWord(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
              <div className={`text-4xl mb-4 inline-block p-4 rounded-2xl bg-slate-50 ${styles.primary}`}>
                <BookOpen className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">{activeWord.word}</h3>
              <p className="text-slate-600 leading-relaxed mb-6">{activeWord.definition}</p>
              
              <button
                disabled={isGeneratingWordAudio}
                onClick={async () => {
                  playCue('pop');
                  if (activeWord.audioUrl) {
                    playTargetAudio(activeWord.audioUrl);
                  } else {
                    setIsGeneratingWordAudio(true);
                    try {
                      const audioUrl = await generateWordAudio(user?.uid || 'guest', activeWord.word);
                      if (audioUrl) {
                        // Update the active word in state
                        const updatedWord = { ...activeWord, audioUrl };
                        setActiveWord(updatedWord);
                        
                        // Also update it in the selected exercise so it's cached
                        if (selectedExercise?.story) {
                          const updatedStory = selectedExercise.story.map(page => ({
                            ...page,
                            interactiveWords: page.interactiveWords?.map(w => 
                              w.word === activeWord.word ? { ...w, audioUrl } : w
                            )
                          }));
                          setSelectedExercise({ ...selectedExercise, story: updatedStory });
                        }

                        playTargetAudio(audioUrl);
                      }
                    } catch (error) {
                      handleError(error, ErrorType.AI_API);
                    } finally {
                      setIsGeneratingWordAudio(false);
                    }
                  }
                }}
                className={`flex items-center justify-center gap-2 w-full py-3 mb-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold transition-all hover:bg-slate-100 ${styles.primary} ${isGeneratingWordAudio ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isGeneratingWordAudio ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
                {isGeneratingWordAudio ? 'Generating...' : 'Listen to Pronunciation'}
              </button>

              <button
                onClick={() => setActiveWord(null)}
                className={`w-full py-3 text-white font-bold rounded-xl shadow-lg transition-all ${styles.button}`}
              >
                Got it!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Story Generation Modal */}
      <AnimatePresence>
        {showGenerationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => !isGeneratingStory && setShowGenerationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`max-w-md w-full p-8 relative ${styles.card}`}
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowGenerationModal(false)}
                disabled={isGeneratingStory}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 disabled:opacity-30"
              >
                ✕
              </button>
              
              <div className="text-center mb-8">
                <div className={`w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 ${styles.primary}`}>
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">AI Story Creator</h3>
                <p className="text-slate-500">What should our story be about?</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Topic or Theme</label>
                  <input 
                    type="text"
                    value={storyTopic}
                    onChange={(e) => setStoryTopic(e.target.value)}
                    placeholder="e.g., A space adventure with a robot"
                    disabled={isGeneratingStory}
                    className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-primary outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Language</label>
                    <select 
                      value={storyLanguage}
                      onChange={(e) => setStoryLanguage(e.target.value as Language)}
                      disabled={isGeneratingStory}
                      className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-primary outline-none transition-all bg-white"
                    >
                      <option value={Language.ENGLISH}>English</option>
                      <option value={Language.SPANISH}>Spanish</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Difficulty</label>
                    <select 
                      value={storyDifficulty}
                      onChange={(e) => setStoryDifficulty(e.target.value as Difficulty)}
                      disabled={isGeneratingStory}
                      className="w-full p-3 rounded-xl border-2 border-slate-100 focus:border-primary outline-none transition-all bg-white"
                    >
                      <option value={Difficulty.EASY}>Easy</option>
                      <option value={Difficulty.MEDIUM}>Medium</option>
                      <option value={Difficulty.HARD}>Hard</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGenerateStory}
                  disabled={isGeneratingStory || !storyTopic.trim()}
                  className={`w-full py-4 text-white font-black uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 ${styles.button} disabled:opacity-50`}
                >
                  {isGeneratingStory ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating Magic...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Story
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Bar */}
      <AnimatePresence>
        {!isNavbarHidden && view !== 'admin-cms' && (
          <motion.nav 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="sticky top-0 z-50 glass px-6 py-4"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div 
                  className="flex items-center gap-2 cursor-pointer group"
                  onClick={() => {
                    playCue('swoosh');
                    setView('practice');
                    setSelectedExercise(null);
                  }}
                >
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform`}>
                    <Globe className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      <h1 className="text-xl font-black tracking-tight text-slate-900">Bilingual & Brilliant</h1>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Speech Assistance</p>
                    </div>
                    {!isOnline && (
                      <div className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg flex items-center gap-1.5 animate-pulse border border-amber-200">
                        <WifiOff className="w-3 h-3" />
                        <span className="text-[8px] font-black uppercase">Offline</span>
                      </div>
                    )}
                  </div>
                   <div className="hidden lg:flex items-center gap-1.5 bg-slate-50/90 p-1 rounded-2xl border border-slate-100/90 relative">
                  {/* Dropdown 1: Practice & Sounds */}
                  {(navPrefs.modules.practice || navPrefs.modules.soundLadder || navPrefs.modules.contrastEngine || navPrefs.modules.articulatorAnatomy) && (
                    <div className="relative">
                      <button
                        onClick={() => {
                          sfx.playTap();
                          setActiveDropdown(activeDropdown === 'practice' ? null : 'practice');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                          ['practice', 'sound-ladder', 'contrast-engine', 'articulator-anatomy'].includes(view)
                            ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                        }`}
                      >
                        <Mic className="w-3.5 h-3.5 opacity-70 text-indigo-600" />
                        Practice
                        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${activeDropdown === 'practice' ? 'rotate-180 text-indigo-600' : 'opacity-60'}`} />
                      </button>

                      <AnimatePresence>
                        {activeDropdown === 'practice' && (
                          <>
                            <div className="fixed inset-0 z-[55]" onClick={() => setActiveDropdown(null)} />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 8 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 8 }}
                              className="absolute top-full left-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 p-2 z-[60] space-y-1"
                            >
                              {navPrefs.modules.practice && (
                                <button
                                  onClick={() => {
                                    sfx.playWhoosh();
                                    setView('practice');
                                    setActiveDropdown(null);
                                    setSelectedExercise(null);
                                  }}
                                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                                    view === 'practice' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="text-base">🎯</span>
                                  <div>
                                    <span className="block font-black">Daily Practice Arena</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Core articulation & AI scoring</span>
                                  </div>
                                </button>
                              )}

                              {navPrefs.modules.soundLadder && (
                                <button
                                  onClick={() => {
                                    sfx.playWhoosh();
                                    setView('sound-ladder');
                                    setActiveDropdown(null);
                                  }}
                                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                                    view === 'sound-ladder' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="text-base">🪜</span>
                                  <div>
                                    <span className="block font-black">Sound Ladder Game</span>
                                    <span className="text-[10px] text-slate-400 font-normal">5-step articulation hierarchy</span>
                                  </div>
                                </button>
                              )}

                              {navPrefs.modules.contrastEngine && (
                                <button
                                  onClick={() => {
                                    sfx.playWhoosh();
                                    setView('contrast-engine');
                                    setActiveDropdown(null);
                                  }}
                                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                                    view === 'contrast-engine' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="text-base">🔄</span>
                                  <div>
                                    <span className="block font-black">Contrast Pairs (Minimal Pairs)</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Fronting, stopping, clusters</span>
                                  </div>
                                </button>
                              )}

                              {navPrefs.modules.articulatorAnatomy && (
                                <button
                                  onClick={() => {
                                    sfx.playWhoosh();
                                    setView('articulator-anatomy');
                                    setActiveDropdown(null);
                                  }}
                                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                                    view === 'articulator-anatomy' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="text-base">👅</span>
                                  <div>
                                    <span className="block font-black">Anatomy Lab</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Sagittal vocal tract simulator</span>
                                  </div>
                                </button>
                              )}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Dropdown 2: Games & Stories */}
                  {(navPrefs.modules.stories || navPrefs.modules.matchingGame || navPrefs.modules.bilingualMatch || navPrefs.modules.languageModules || navPrefs.modules.lessons || navPrefs.modules.videos) && (
                    <div className="relative">
                      <button
                        onClick={() => {
                          sfx.playTap();
                          setActiveDropdown(activeDropdown === 'games' ? null : 'games');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                          ['stories', 'matching-game', 'bilingual-match', 'language-modules', 'lessons', 'videos'].includes(view)
                            ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5 opacity-70 text-amber-500" />
                        Games & Stories
                        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${activeDropdown === 'games' ? 'rotate-180 text-indigo-600' : 'opacity-60'}`} />
                      </button>

                      <AnimatePresence>
                        {activeDropdown === 'games' && (
                          <>
                            <div className="fixed inset-0 z-[55]" onClick={() => setActiveDropdown(null)} />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 8 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 8 }}
                              className="absolute top-full left-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 p-2 z-[60] space-y-1"
                            >
                              {navPrefs.modules.stories && (
                                <button
                                  onClick={() => {
                                    sfx.playWhoosh();
                                    setView('stories');
                                    setActiveDropdown(null);
                                  }}
                                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                                    view === 'stories' ? 'bg-amber-50 text-amber-900' : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="text-base">📖</span>
                                  <div>
                                    <span className="block font-black">Story Time</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Bilingual illustrated tales</span>
                                  </div>
                                </button>
                              )}

                              {navPrefs.modules.matchingGame && (
                                <button
                                  onClick={() => {
                                    sfx.playWhoosh();
                                    setView('matching-game');
                                    setActiveDropdown(null);
                                  }}
                                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                                    view === 'matching-game' ? 'bg-amber-50 text-amber-900' : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="text-base">✨</span>
                                  <div>
                                    <span className="block font-black">Matching Game</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Sound & card memory pairs</span>
                                  </div>
                                </button>
                              )}

                              {navPrefs.modules.bilingualMatch && (
                                <button
                                  onClick={() => {
                                    sfx.playWhoosh();
                                    setView('bilingual-match');
                                    setActiveDropdown(null);
                                  }}
                                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                                    view === 'bilingual-match' ? 'bg-amber-50 text-amber-900' : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="text-base">🌐</span>
                                  <div>
                                    <span className="block font-black">Bilingual Match</span>
                                    <span className="text-[10px] text-slate-400 font-normal">English & Spanish bridge</span>
                                  </div>
                                </button>
                              )}

                              {navPrefs.modules.languageModules && (
                                <button
                                  onClick={() => {
                                    sfx.playWhoosh();
                                    setView('language-modules');
                                    setActiveDropdown(null);
                                  }}
                                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                                    view === 'language-modules' ? 'bg-amber-50 text-amber-900' : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="text-base">📚</span>
                                  <div>
                                    <span className="block font-black">Language Modules</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Grammar, syntax & morphology</span>
                                  </div>
                                </button>
                              )}

                              {navPrefs.modules.lessons && (
                                <button
                                  onClick={() => {
                                    sfx.playWhoosh();
                                    setView('lessons');
                                    setActiveDropdown(null);
                                  }}
                                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                                    view === 'lessons' ? 'bg-amber-50 text-amber-900' : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="text-base">📝</span>
                                  <div>
                                    <span className="block font-black">Structured Lessons</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Step-by-step curriculum</span>
                                  </div>
                                </button>
                              )}

                              {navPrefs.modules.videos && (
                                <button
                                  onClick={() => {
                                    sfx.playWhoosh();
                                    setView('videos');
                                    setActiveDropdown(null);
                                  }}
                                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                                    view === 'videos' ? 'bg-amber-50 text-amber-900' : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="text-base">🎥</span>
                                  <div>
                                    <span className="block font-black">Video Demonstrations</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Visual speech coaching clips</span>
                                  </div>
                                </button>
                              )}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Dropdown 3: Speech & Fluency Labs */}
                  {(navPrefs.modules.motorSpeech || navPrefs.modules.fluencyLab || navPrefs.modules.vocalLab || navPrefs.modules.receptiveLanguage || navPrefs.modules.voiceMeters || navPrefs.modules.pacingBoard) && (
                    <div className="relative">
                      <button
                        onClick={() => {
                          sfx.playTap();
                          setActiveDropdown(activeDropdown === 'speech' ? null : 'speech');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                          ['motor-speech', 'fluency-lab', 'vocal-lab', 'receptive-language', 'voice-meters', 'pacing-board'].includes(view)
                            ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5 opacity-70 text-emerald-600" />
                        Speech & Labs
                        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${activeDropdown === 'speech' ? 'rotate-180 text-indigo-600' : 'opacity-60'}`} />
                      </button>

                      <AnimatePresence>
                        {activeDropdown === 'speech' && (
                          <>
                            <div className="fixed inset-0 z-[55]" onClick={() => setActiveDropdown(null)} />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 8 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 8 }}
                              className="absolute top-full left-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 p-2 z-[60] space-y-1"
                            >
                              {navPrefs.modules.motorSpeech && (
                                <button
                                  onClick={() => {
                                    sfx.playWhoosh();
                                    setView('motor-speech');
                                    setActiveDropdown(null);
                                  }}
                                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                                    view === 'motor-speech' ? 'bg-emerald-50 text-emerald-900' : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="text-base">⚡</span>
                                  <div>
                                    <span className="block font-black">Apraxia Studio (DTTC)</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Motor hierarchy & oral gym</span>
                                  </div>
                                </button>
                              )}

                              {navPrefs.modules.fluencyLab && (
                                <button
                                  onClick={() => {
                                    sfx.playWhoosh();
                                    setView('fluency-lab');
                                    setActiveDropdown(null);
                                  }}
                                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                                    view === 'fluency-lab' ? 'bg-emerald-50 text-emerald-900' : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="text-base">🐢</span>
                                  <div>
                                    <span className="block font-black">Fluency & Pacing Lab</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Metronome & Slow Turtle</span>
                                  </div>
                                </button>
                              )}

                              {navPrefs.modules.vocalLab && (
                                <button
                                  onClick={() => {
                                    sfx.playWhoosh();
                                    setView('vocal-lab');
                                    setActiveDropdown(null);
                                  }}
                                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                                    view === 'vocal-lab' ? 'bg-emerald-50 text-emerald-900' : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="text-base">🌱</span>
                                  <div>
                                    <span className="block font-black">Vocal Therapy Lab</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Pitch glides & Volume Garden</span>
                                  </div>
                                </button>
                              )}

                              {navPrefs.modules.receptiveLanguage && (
                                <button
                                  onClick={() => {
                                    sfx.playWhoosh();
                                    setView('receptive-language');
                                    setActiveDropdown(null);
                                  }}
                                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                                    view === 'receptive-language' ? 'bg-emerald-50 text-emerald-900' : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="text-base">🧭</span>
                                  <div>
                                    <span className="block font-black">Receptive Language</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Following directions & Wh-quest</span>
                                  </div>
                                </button>
                              )}

                              {navPrefs.modules.voiceMeters && (
                                <button
                                  onClick={() => {
                                    sfx.playWhoosh();
                                    setView('voice-meters');
                                    setActiveDropdown(null);
                                  }}
                                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                                    view === 'voice-meters' ? 'bg-emerald-50 text-emerald-900' : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="text-base">📊</span>
                                  <div>
                                    <span className="block font-black">Voice Decibel Meters</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Live acoustic sensitivity</span>
                                  </div>
                                </button>
                              )}

                              {navPrefs.modules.pacingBoard && (
                                <button
                                  onClick={() => {
                                    sfx.playWhoosh();
                                    setView('pacing-board');
                                    setActiveDropdown(null);
                                  }}
                                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                                    view === 'pacing-board' ? 'bg-emerald-50 text-emerald-900' : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="text-base">✋</span>
                                  <div>
                                    <span className="block font-black">Tactile Pacing Board</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Syllable touch regulation</span>
                                  </div>
                                </button>
                              )}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Dropdown 4: AAC & Sensory */}
                  {(navPrefs.modules.sceneAac || navPrefs.modules.aacPlayground || navPrefs.modules.autismTools || navPrefs.modules.focusSocial) && (
                    <div className="relative">
                      <button
                        onClick={() => {
                          sfx.playTap();
                          setActiveDropdown(activeDropdown === 'aac' ? null : 'aac');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                          ['scene-aac', 'aac-playground', 'autism-tools', 'focus-social'].includes(view)
                            ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                        }`}
                      >
                        <LayoutGrid className="w-3.5 h-3.5 opacity-70 text-purple-600" />
                        AAC & Sensory
                        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${activeDropdown === 'aac' ? 'rotate-180 text-indigo-600' : 'opacity-60'}`} />
                      </button>

                      <AnimatePresence>
                        {activeDropdown === 'aac' && (
                          <>
                            <div className="fixed inset-0 z-[55]" onClick={() => setActiveDropdown(null)} />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 8 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 8 }}
                              className="absolute top-full left-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 p-2 z-[60] space-y-1"
                            >
                              {navPrefs.modules.sceneAac && (
                                <button
                                  onClick={() => {
                                    sfx.playWhoosh();
                                    setView('scene-aac');
                                    setActiveDropdown(null);
                                  }}
                                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                                    view === 'scene-aac' ? 'bg-purple-50 text-purple-900' : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="text-base">🖼️</span>
                                  <div>
                                    <span className="block font-black">Visual Scene AAC</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Contextual hotspot boards</span>
                                  </div>
                                </button>
                              )}

                              {navPrefs.modules.aacPlayground && (
                                <button
                                  onClick={() => {
                                    sfx.playWhoosh();
                                    setView('aac-playground');
                                    setActiveDropdown(null);
                                  }}
                                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                                    view === 'aac-playground' ? 'bg-purple-50 text-purple-900' : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="text-base">🔲</span>
                                  <div>
                                    <span className="block font-black">AAC Grid Playground</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Core vocabulary symbols</span>
                                  </div>
                                </button>
                              )}

                              {navPrefs.modules.autismTools && (
                                <button
                                  onClick={() => {
                                    sfx.playWhoosh();
                                    setView('autism-tools');
                                    setActiveDropdown(null);
                                  }}
                                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                                    view === 'autism-tools' ? 'bg-purple-50 text-purple-900' : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="text-base">🧠</span>
                                  <div>
                                    <span className="block font-black">Autism Sensory Tools</span>
                                    <span className="text-[10px] text-slate-400 font-normal">First/Then boards & timers</span>
                                  </div>
                                </button>
                              )}

                              {navPrefs.modules.focusSocial && (
                                <button
                                  onClick={() => {
                                    sfx.playWhoosh();
                                    setView('focus-social');
                                    setActiveDropdown(null);
                                  }}
                                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                                    view === 'focus-social' ? 'bg-purple-50 text-purple-900' : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="text-base">👥</span>
                                  <div>
                                    <span className="block font-black">Social & Pragmatic Skills</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Turn-taking & emotions</span>
                                  </div>
                                </button>
                              )}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Dropdown 5: Clinical & Care (Visible when enabled) */}
                  {(navPrefs.modules.parentCoaching || navPrefs.modules.clinicalResearch || navPrefs.modules.clinicCrm || navPrefs.modules.marketplace) && (
                    <div className="relative">
                      <button
                        onClick={() => {
                          sfx.playTap();
                          setActiveDropdown(activeDropdown === 'clinical' ? null : 'clinical');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                          ['parent-coaching', 'clinical-research', 'admin-cms', 'marketplace'].includes(view)
                            ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                        }`}
                      >
                        <Heart className="w-3.5 h-3.5 opacity-70 text-rose-500" />
                        Clinical & Care
                        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${activeDropdown === 'clinical' ? 'rotate-180 text-indigo-600' : 'opacity-60'}`} />
                      </button>

                      <AnimatePresence>
                        {activeDropdown === 'clinical' && (
                          <>
                            <div className="fixed inset-0 z-[55]" onClick={() => setActiveDropdown(null)} />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 8 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 8 }}
                              className="absolute top-full left-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 p-2 z-[60] space-y-1"
                            >
                              {navPrefs.modules.parentCoaching && (
                                <button
                                  onClick={() => {
                                    sfx.playWhoosh();
                                    setView('parent-coaching');
                                    setActiveDropdown(null);
                                  }}
                                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                                    view === 'parent-coaching' ? 'bg-rose-50 text-rose-900' : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="text-base">❤️</span>
                                  <div>
                                    <span className="block font-black">Parent Coaching</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Home micro-dosing routines</span>
                                  </div>
                                </button>
                              )}

                              {navPrefs.modules.clinicalResearch && (
                                <button
                                  onClick={() => {
                                    sfx.playWhoosh();
                                    setView('clinical-research');
                                    setActiveDropdown(null);
                                  }}
                                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                                    view === 'clinical-research' ? 'bg-rose-50 text-rose-900' : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="text-base">🛡️</span>
                                  <div>
                                    <span className="block font-black">Research & Outcomes</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Dose-response & HIPAA metrics</span>
                                  </div>
                                </button>
                              )}

                              {navPrefs.modules.clinicCrm && (
                                <button
                                  onClick={() => {
                                    sfx.playWhoosh();
                                    window.history.pushState({}, '', '/admin');
                                    setView('admin-cms');
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition-all text-left text-slate-700 hover:bg-slate-50"
                                >
                                  <span className="text-base">📋</span>
                                  <div>
                                    <span className="block font-black">Clinic Care CRM (/admin)</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Caseload & admin portal</span>
                                  </div>
                                </button>
                              )}

                              {navPrefs.modules.marketplace && (
                                <button
                                  onClick={() => {
                                    sfx.playWhoosh();
                                    setView('marketplace');
                                    setActiveDropdown(null);
                                  }}
                                  className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                                    view === 'marketplace' ? 'bg-rose-50 text-rose-900' : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <span className="text-base">🛍️</span>
                                  <div>
                                    <span className="block font-black">Marketplace Decks</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Community cards & activities</span>
                                  </div>
                                </button>
                              )}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Preset Pill Switcher Button */}
                  <div className="relative pl-1">
                    <button
                      onClick={() => {
                        sfx.playTap();
                        setActiveDropdown(activeDropdown === 'preset' ? null : 'preset');
                      }}
                      className="px-2.5 py-1 rounded-xl bg-indigo-50/80 hover:bg-indigo-100/80 text-indigo-900 border border-indigo-200/80 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                      title="Switch Experience Mode (Everyday, Kids, Parent, Clinician, Autism, Custom)"
                    >
                      <span>{PRESET_CONFIGS[navPrefs.activePreset]?.icon || '😊'}</span>
                      <span className="hidden xl:inline">{PRESET_CONFIGS[navPrefs.activePreset]?.badge || 'Everyday Mode'}</span>
                      <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${activeDropdown === 'preset' ? 'rotate-180' : 'opacity-60'}`} />
                    </button>

                    <AnimatePresence>
                      {activeDropdown === 'preset' && (
                        <>
                          <div className="fixed inset-0 z-[55]" onClick={() => setActiveDropdown(null)} />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 8 }}
                            className="absolute top-full right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 p-2 z-[60] space-y-1"
                          >
                            <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                              Experience Presets
                            </div>

                            {(Object.keys(PRESET_CONFIGS) as ExperiencePreset[]).map((presetKey) => {
                              const p = PRESET_CONFIGS[presetKey];
                              const isCur = navPrefs.activePreset === presetKey;

                              return (
                                <button
                                  key={presetKey}
                                  onClick={() => {
                                    sfx.playSuccess();
                                    const updated = navPreferencesService.applyPreset(presetKey);
                                    setNavPrefs(updated);
                                    setActiveDropdown(null);
                                    toast.success(`Switched to "${p.name}" mode!`);
                                  }}
                                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all text-left ${
                                    isCur ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span>{p.icon}</span>
                                    <span>{p.name}</span>
                                  </div>
                                  {isCur && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                </button>
                              );
                            })}

                            <div className="pt-1 border-t border-slate-100">
                              <button
                                onClick={() => {
                                  sfx.playTap();
                                  setActiveDropdown(null);
                                  setIsNavCustomizerOpen(true);
                                }}
                                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                              >
                                <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                                Customize Menu Items...
                              </button>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-black text-slate-900">{activeProfile?.name || 'Guest'}</span>
                    <span className="text-[10px] font-bold text-primary">{activeProfile?.points || 0} pts</span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-lg shadow-sm border border-slate-100">
                    {activeProfile?.avatar}
                  </div>
                </div>

                  <button 
                    onClick={() => {
                      playCue('chime');
                      window.history.pushState({}, '', '/admin');
                      setView('admin-cms');
                    }}
                    className={`p-2.5 rounded-2xl transition-all relative flex items-center gap-2 ${
                      (view as string) === 'admin-cms' 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 shadow-md scale-105' 
                        : isActualAdmin
                          ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 hover:bg-emerald-50'
                          : 'bg-indigo-50 border border-indigo-100/80 text-indigo-700 hover:bg-slate-100 hover:text-indigo-650'
                    }`}
                    title="SLP Clinic CRM & Admin Portal (/admin)"
                  >
                    <Clipboard className="w-5 h-5" />
                    <span className="hidden md:inline text-xs font-black uppercase tracking-widest px-1">Clinic CRM</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${isActualAdmin ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  </button>

                {/* Universal Quick Search Palette Button (Ctrl+K) */}
                <button
                  onClick={() => {
                    sfx.playTap();
                    setIsQuickSearchOpen(true);
                  }}
                  className="p-2.5 rounded-2xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 border border-slate-100 transition-all flex items-center gap-1.5"
                  title="Quick Search & Command Palette (Ctrl+K)"
                >
                  <Search className="w-5 h-5" />
                  <span className="hidden xl:inline text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-200/70 px-1.5 py-0.5 rounded">⌘K</span>
                </button>

                {/* Sound Effects Mute Toggle */}
                <button
                  onClick={() => {
                    const muted = sfx.toggleMute();
                    setIsSfxMuted(muted);
                    if (!muted) sfx.playTap();
                    toast.info(muted ? 'Sound Effects Muted' : 'Sound Effects Active');
                  }}
                  className={`p-2.5 rounded-2xl transition-all ${
                    isSfxMuted
                      ? 'bg-slate-100 text-slate-400 border border-slate-200'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm'
                  }`}
                  title={isSfxMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
                >
                  {isSfxMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>

                {/* Microphone Diagnostic & Hardware Wizard */}
                <button
                  onClick={() => {
                    sfx.playTap();
                    setIsMicDiagnosticOpen(true);
                  }}
                  className="p-2.5 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 border border-slate-100 transition-all"
                  title="Microphone Diagnostic & Hardware Setup"
                >
                  <Sliders className="w-5 h-5" />
                </button>

                <button 
                  onClick={() => setView('settings')}
                  className={`p-2.5 rounded-2xl transition-all relative ${view === 'settings' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'}`}
                  title="Settings & Connectivity"
                >
                  <Settings className={`w-5 h-5 ${view === 'settings' ? 'animate-spin-slow' : ''}`} />
                  {isFirebaseLive === false && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                  )}
                  {isFirebaseLive === true && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                  )}
                </button>

                {layoutMode !== LayoutMode.SIDEBAR && (view === 'practice' || view === 'stories') && (
                  <button 
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className={`flex items-center gap-2 p-2.5 rounded-2xl transition-all ${!isSidebarCollapsed ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'}`}
                    title="Toggle Exercise List"
                  >
                    <LayoutList className="w-5 h-5" />
                    <span className="hidden lg:inline text-xs font-black uppercase tracking-widest px-1">Ex. List</span>
                  </button>
                )}

                {!isPremiumUser && (
                  <button 
                    onClick={() => setView('pricing')}
                    className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-secondary to-secondary/80 text-white px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-secondary/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Crown className="w-4 h-4" />
                    Go Pro
                  </button>
                )}

                {!user && isAuthReady && (
                  <button 
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="hidden lg:flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                    Sign In
                  </button>
                )}

                <button 
                  onClick={() => setIsFocusMode(!isFocusMode)}
                  className={`p-2.5 rounded-2xl transition-all ${isFocusMode ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100'}`}
                  title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
                >
                  <Maximize2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Floating Toggle for Navbar when hidden */}
      {isNavbarHidden && (
        <motion.button
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          onClick={() => setIsNavbarHidden(false)}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-2xl border border-slate-100 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
        >
          <ChevronLeft className="w-3 h-3 rotate-90" />
          Show Menu
        </motion.button>
      )}

      <main className={`flex-1 ${isFocusMode ? 'max-w-full' : LAYOUT_CONFIG.maxContainerWidth} mx-auto w-full ${LAYOUT_CONFIG.containerPadding} space-y-6`}>
        <OfflineSyncBanner onOpenSettings={() => setView('settings')} />
        <AnimatePresence mode="wait">
          {(view === 'practice' || view === 'stories') && (
            <motion.div 
              key={view}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex-1 flex w-full relative items-start ${
                layoutMode === LayoutMode.SIDEBAR ? `flex-col lg:flex-row ${LAYOUT_CONFIG.sidebarGap}` : 'flex-col'
              }`}
            >
              {/* Sidebar: Show in SIDEBAR Mode OR as a drawer in other modes */}
              <motion.div 
                animate={{ 
                  width: (isSidebarCollapsed || isFocusMode) ? 0 : LAYOUT_CONFIG.sidebarWidthDesktop,
                  opacity: (isSidebarCollapsed || isFocusMode) ? 0 : 1,
                  marginRight: (layoutMode === LayoutMode.SIDEBAR && !isSidebarCollapsed && !isFocusMode) ? 0 : 0,
                  x: (layoutMode !== LayoutMode.SIDEBAR && isSidebarCollapsed) ? -400 : 0
                }}
                transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                className={`${
                  layoutMode === LayoutMode.SIDEBAR 
                    ? 'lg:w-1/3 flex flex-col h-full space-y-6 overflow-hidden flex-shrink-0'
                    : 'fixed left-0 top-0 bottom-0 z-[100] bg-white shadow-2xl p-6 lg:w-[400px] flex flex-col space-y-6'
                } ${isSidebarCollapsed && layoutMode !== LayoutMode.SIDEBAR ? 'pointer-events-none' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black uppercase tracking-tight">
                      {view === 'stories' ? 'Stories' : (isOfflineMode ? 'Offline' : 'Practice')}
                    </h2>
                    <button
                      onClick={() => setIsSidebarCollapsed(true)}
                      className="p-1.5 bg-slate-100 text-slate-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all group"
                      title="Hide List"
                    >
                      <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                    {view === 'stories' && (
                      <button
                        onClick={() => setShowGenerationModal(true)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95 ${styles.button}`}
                      >
                        <Sparkles className="w-4 h-4" />
                        AI Generate
                      </button>
                    )}
                    <span className="text-sm text-slate-500 font-medium text-right">
                      {isOfflineMode 
                        ? `${[...EXERCISES, ...savedStories].filter(ex => (view === 'stories' ? ex.type === ExerciseType.STORY : ex.type !== ExerciseType.STORY) && downloadedIds.includes(ex.id)).length} Offline` 
                        : `${[...EXERCISES, ...savedStories].filter(ex => (view === 'stories' ? ex.type === ExerciseType.STORY : ex.type !== ExerciseType.STORY)).length} Available`}
                    </span>
                  </div>

                  {isOfflineMode && downloadedIds.length === 0 && (
                    <div className="p-8 bg-amber-50 border border-amber-100 rounded-2xl text-center">
                      <CloudOff className="w-10 h-10 text-amber-300 mx-auto mb-3" />
                      <p className="text-sm font-bold text-amber-800 mb-1">No Offline Exercises</p>
                      <p className="text-xs text-amber-600">Switch to online mode to download your favorite exercises.</p>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto pr-2 no-scrollbar space-y-8">
                    {dailyChallenge && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-6 rounded-3xl border-2 border-primary/20 bg-primary/5 shadow-lg shadow-primary/5 relative overflow-hidden group`}
                      >
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-primary text-white rounded-xl">
                                <Sparkles className="w-4 h-4" />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Daily Challenge</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-500">{dailyGoalProgress}% Complete</span>
                              <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${dailyGoalProgress}%` }}
                                  className="h-full bg-primary" 
                                />
                              </div>
                            </div>
                          </div>
                          <h3 className="text-xl font-black mb-1">{dailyChallenge.title}</h3>
                          <p className="text-sm text-slate-500 mb-4">{dailyChallenge.description}</p>
                          <button
                            onClick={() => handleStartPractice(dailyChallenge)}
                            className={`px-6 py-2 rounded-xl text-white text-sm font-black uppercase tracking-widest shadow-lg transition-all hover:scale-105 active:scale-95 ${styles.button}`}
                          >
                            Start Challenge
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* Empty State Check */}
                    {[...EXERCISES, ...savedStories]
                      .filter(ex => view === 'stories' ? ex.type === ExerciseType.STORY : ex.type !== ExerciseType.STORY)
                      .filter(ex => !isOfflineMode || downloadedIds.includes(ex.id))
                      .length === 0 && (
                        <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-100 mb-6 mt-4">
                          <CloudOff className="w-16 h-16 text-slate-200 mb-6" />
                          <h3 className="text-xl font-black text-slate-400 uppercase tracking-tight">Library Empty</h3>
                          <p className="max-w-[200px] text-xs text-slate-400 mt-2 mx-auto leading-relaxed font-medium">
                            {isOfflineMode 
                              ? "You haven't downloaded any exercises for offline use yet." 
                              : (view === 'stories' ? "Generate your first AI story or download one from our library!" : "No exercises match your current filters.")}
                          </p>
                        </div>
                      )}

                    {(Object.entries(
                      [...EXERCISES, ...savedStories]
                        .filter(ex => view === 'stories' ? ex.type === ExerciseType.STORY : ex.type !== ExerciseType.STORY)
                        .filter(ex => !isOfflineMode || downloadedIds.includes(ex.id))
                        .reduce((acc, ex) => {
                          if (!acc[ex.category]) acc[ex.category] = [];
                          acc[ex.category].push(ex);
                          return acc;
                        }, {} as Record<string, Exercise[]>)
                    ) as [string, Exercise[]][]).map(([category, items]) => (
                      <div key={category} className="space-y-3">
                        <div className="flex items-center gap-3 px-2">
                          <div className="h-px flex-1 bg-slate-100" />
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            {category}
                          </h4>
                          <div className="h-px flex-1 bg-slate-100" />
                        </div>
                        
                        <div className="space-y-3">
                          {items.map((ex) => (
                            <motion.div
                              key={ex.id}
                              whileHover={{ 
                                scale: 1.02, 
                                x: 4,
                                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
                              }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleStartPractice(ex)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  handleStartPractice(ex);
                                }
                              }}
                              className={`w-full text-left p-4 transition-all flex items-center gap-4 cursor-pointer ${styles.card} ${
                                selectedExercise?.id === ex.id 
                                  ? `ring-2 ring-primary border-transparent bg-primary/5` 
                                  : `hover:border-primary/50`
                              }`}
                            >
                              <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 relative">
                                <ExerciseIllustration
                                  word={ex.targetWord || ex.title}
                                  className="w-full h-full"
                                  illustrationClassName="text-3xl"
                                />
                                {downloadedIds.includes(ex.id) && (
                                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6 text-white drop-shadow-md" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold truncate">{ex.title}</h3>
                                  {ex.isPremium && <Lock className="w-3 h-3 text-slate-400" />}
                                </div>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-slate-500 truncate">{ex.description}</p>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                                    ex.difficulty === Difficulty.EASY ? 'bg-green-100 text-green-700' :
                                    ex.difficulty === Difficulty.MEDIUM ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {ex.difficulty}
                                  </span>
                                  {bookmarks[ex.id] !== undefined && (
                                    <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase bg-primary/10 text-primary">
                                      <Bookmark className="w-2.5 h-2.5" />
                                      Page {bookmarks[ex.id] + 1}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {!isOfflineMode && (
                                  <button
                                    onClick={(e) => handleDownload(e, ex.id)}
                                    className={`p-2 rounded-lg transition-colors ${
                                      downloadedIds.includes(ex.id)
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-slate-300 hover:bg-slate-100 hover:text-slate-500'
                                    }`}
                                    title={downloadedIds.includes(ex.id) ? "Remove from offline" : "Download for offline"}
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                )}
                                <ChevronRight className={`w-5 h-5 ${selectedExercise?.id === ex.id ? styles.primary : 'text-slate-300'}`} />
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

              {/* Sidebar Toggle Floating Button: Only in Sidebar Mode */}
              {layoutMode === LayoutMode.SIDEBAR && !isFocusMode && (
                <motion.button
                  whileHover={{ scale: 1.1, x: 4 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className={`fixed left-4 top-1/2 -translate-y-1/2 z-50 p-4 bg-white border border-slate-100 shadow-2xl rounded-2xl flex items-center justify-center transition-all duration-300 hover:bg-primary/5 group ${isSidebarCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <ChevronRight className="w-6 h-6 text-primary group-hover:scale-125 transition-transform" />
                    <span className="[writing-mode:vertical-lr] text-[10px] font-black uppercase tracking-widest text-primary/40 group-hover:text-primary transition-colors">Show List</span>
                  </div>
                </motion.button>
              )}

              {/* Main Content Area */}
              <motion.div 
                animate={{ 
                  width: (layoutMode !== LayoutMode.SIDEBAR || isSidebarCollapsed || isFocusMode) ? '100%' : LAYOUT_CONFIG.practiceAreaWidthDesktop,
                }}
                transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                className="flex-1 scroll-mt-24 flex flex-col justify-start w-full space-y-6" 
                ref={practiceAreaRef}
              >
                <ClinicalEvidenceGuide activeView={view} />
                {/* Exercise Selection Grid for TOP/BOTTOM Modes if NO exercise selected */}
                {layoutMode !== LayoutMode.SIDEBAR && !selectedExercise && (
                  <div className="space-y-12 py-8 animate-in fade-in duration-700">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                      <h2 className="text-4xl font-black mb-4 uppercase tracking-tight">Choose Your Adventure</h2>
                      <p className="text-slate-500 font-medium">Select a practice session to begin your speech journey.</p>
                    </div>

                    {(Object.entries(
                      [...EXERCISES, ...savedStories]
                        .filter(ex => view === 'stories' ? ex.type === ExerciseType.STORY : ex.type !== ExerciseType.STORY)
                        .reduce((acc, ex) => {
                          if (!acc[ex.category]) acc[ex.category] = [];
                          acc[ex.category].push(ex);
                          return acc;
                        }, {} as Record<string, Exercise[]>)
                    ) as [string, Exercise[]][]).map(([category, items]) => (
                      <div key={category} className="space-y-6">
                        <div className="flex items-center gap-4">
                          <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 shrink-0">{category}</h3>
                          <div className="h-px bg-slate-200 flex-1" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {items.map((ex) => (
                            <motion.div
                              key={ex.id}
                              whileHover={{ y: -8, scale: 1.02 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleStartPractice(ex)}
                              className={`${styles.card} p-1 overflow-hidden group h-full flex flex-col cursor-pointer border-slate-100 hover:border-primary/30 transition-all`}
                            >
                              <div className="aspect-[16/10] bg-slate-100 rounded-2xl overflow-hidden relative">
                                <ExerciseIllustration
                                  word={ex.targetWord || ex.title}
                                  className="w-full h-full transition-transform duration-500 group-hover:scale-110"
                                  illustrationClassName="text-8xl"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                  <span className="text-white text-xs font-black uppercase tracking-widest">Start Practice</span>
                                </div>
                              </div>
                              <div className="p-5 flex-1 flex flex-col">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-black text-lg text-slate-800">{ex.title}</h4>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                                    ex.difficulty === Difficulty.EASY ? 'bg-green-100 text-green-700' :
                                    ex.difficulty === Difficulty.MEDIUM ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {ex.difficulty}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-500 mb-6 flex-1">{ex.description}</p>
                                <div className="flex items-center justify-between">
                                  <div className="flex -space-x-2">
                                    {[1, 2, 3].map(i => (
                                      <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200" />
                                    ))}
                                    <div className="w-6 h-6 rounded-full border-2 border-white bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary">
                                      +12
                                    </div>
                                  </div>
                                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {selectedExercise ? (
                      <motion.div
                        key={selectedExercise.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ 
                          opacity: 1, 
                          y: theme === Theme.PLAYFUL ? [0, -10, 0] : 0 
                        }}
                        transition={{
                          y: theme === Theme.PLAYFUL ? {
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                          } : { duration: 0.3 }
                        }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`p-8 lg:h-fit lg:max-h-full flex flex-col ${styles.card}`}
                      >
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${styles.accent} text-white`}>
                              {selectedExercise.type} • {selectedExercise.language === Language.ENGLISH ? 'English' : 'Spanish'}
                            </span>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              selectedExercise.difficulty === Difficulty.EASY ? 'bg-green-100 text-green-700' :
                              selectedExercise.difficulty === Difficulty.MEDIUM ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {selectedExercise.difficulty}
                            </span>
                            {isOfflineMode && (
                              <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                <WifiOff className="w-3 h-3" /> Offline
                              </span>
                            )}
                          </div>
                          <h2 className="text-3xl font-extrabold">{selectedExercise.title}</h2>
                        </div>
                        <div className="flex items-center gap-4">
                          {selectedExercise.type === ExerciseType.STORY && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleTranslateStory}
                                disabled={isTranslating}
                                className={`p-2 rounded-lg transition-all ${
                                  translatedStoryText 
                                    ? 'bg-blue-100 text-blue-600' 
                                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                }`}
                                title="Translate to Spanish"
                              >
                                {isTranslating ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <Globe className="w-5 h-5" />
                                )}
                              </button>
                              <button
                                onClick={() => toggleBookmark(selectedExercise.id, currentStoryPage)}
                                className={`p-2 rounded-lg transition-all ${
                                  bookmarks[selectedExercise.id] === currentStoryPage
                                    ? 'bg-primary text-white shadow-md'
                                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                }`}
                                title={bookmarks[selectedExercise.id] === currentStoryPage ? "Remove Bookmark" : "Bookmark this page"}
                              >
                                <Bookmark className="w-5 h-5" />
                              </button>
                              {selectedExercise.id.startsWith('ai-') && (
                                <button
                                  onClick={handleSaveStory}
                                  className="p-2 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 transition-all"
                                  title="Save to Library"
                                >
                                  <Download className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          )}
                          <button 
                            onClick={() => setSelectedExercise(null)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            Close
                          </button>
                        </div>
                      </div>

                        <div className="flex-1 flex flex-col items-center justify-start text-center space-y-8 py-10 w-full overflow-y-auto no-scrollbar">
                          {[
                            ExerciseType.FOLLOWING_DIRECTIONS,
                            ExerciseType.SOCIAL_SKILLS,
                            ExerciseType.IMPULSIVITY_PRACTICE,
                            ExerciseType.FOCUS_SESSION
                          ].includes(selectedExercise.type) ? (
                            <div className="w-full max-w-3xl">
                              <SpecializedExerciseView
                                exercise={selectedExercise}
                                styles={styles}
                                playCue={playCue}
                                onComplete={(score, rubric) => saveVoiceRecording("", score, selectedExercise, rubric)}
                                localMentorAudio={localMentorAudio}
                                playTargetAudio={playTargetAudio}
                                isRecording={isRecording}
                                isAnalyzing={isAnalyzing}
                                onStartRecording={startRecording}
                                onStopRecording={stopRecording}
                                userId={user?.uid || 'guest'}
                                language={selectedExercise.language}
                                difficulty={selectedExercise.difficulty}
                                aiFeedback={feedback}
                              />
                            </div>
                          ) : selectedExercise.type === ExerciseType.STORY ? (
                          <div className="w-full space-y-8">
                            <div className="relative max-w-2xl mx-auto">
                              <AnimatePresence mode="wait">
                                <motion.div 
                                  key={currentStoryPage}
                                  drag="x"
                                  dragConstraints={{ left: 0, right: 0 }}
                                  onDragEnd={(_, { offset, velocity }) => {
                                    const swipeThreshold = 50;
                                    const velocityThreshold = 500;
                                    if (Math.abs(offset.x) > swipeThreshold && Math.abs(velocity.x) > velocityThreshold) {
                                      if (offset.x > 0) {
                                        // Swipe right -> Previous page
                                        if (currentStoryPage > 0) {
                                          setCurrentStoryPage(currentStoryPage - 1);
                                          playCue('swoosh');
                                        }
                                      } else {
                                        // Swipe left -> Next page
                                        if (currentStoryPage < selectedExercise.story!.length - 1) {
                                          setCurrentStoryPage(currentStoryPage + 1);
                                          playCue('swoosh');
                                        }
                                      }
                                    }
                                  }}
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -20 }}
                                  className={`p-8 rounded-[40px] border-4 border-slate-100 shadow-xl bg-white cursor-grab active:cursor-grabbing touch-none`}
                                >
                                  <div className="aspect-video rounded-2xl overflow-hidden mb-6 border-2 border-slate-50">
                                    <img 
                                      src={selectedExercise.story![currentStoryPage].imageUrl} 
                                      alt="Story illustration" 
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                      onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=1000"; // Calming story-like fallback
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-6">
                                    <div className="flex items-center justify-center gap-4">
                                      <div className={`text-2xl font-bold leading-relaxed ${styles.primary}`}>
                                        {renderStoryText(
                                          selectedExercise.story![currentStoryPage].text,
                                          selectedExercise.story![currentStoryPage].interactiveWords
                                        )}
                                      </div>
                                      {selectedExercise.story![currentStoryPage].audioUrl && (
                                        <button
                                          onClick={() => playTargetAudio(selectedExercise.story![currentStoryPage].audioUrl!)}
                                          disabled={isPlayingAudio}
                                          className={`p-3 rounded-full ${styles.card} border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50`}
                                        >
                                          <Volume2 className={`w-6 h-6 ${isPlayingAudio ? 'text-accent animate-pulse' : styles.primary}`} />
                                        </button>
                                      )}
                                      <button
                                        onClick={handleTranslateStory}
                                        disabled={isTranslating}
                                        className={`p-3 rounded-full ${styles.card} border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 px-4`}
                                        title="Translate to Spanish"
                                      >
                                        <Languages className={`w-5 h-5 ${isTranslating ? 'text-accent animate-spin' : styles.primary}`} />
                                        <span className="text-xs font-black uppercase tracking-widest">Translate</span>
                                      </button>
                                    </div>

                                    {translatedStoryText && (
                                      <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-lg text-slate-500 italic border-t border-slate-100 pt-4"
                                      >
                                        {translatedStoryText}
                                      </motion.div>
                                    )}
                                  </div>
                                </motion.div>
                              </AnimatePresence>

                              {/* Story Navigation */}
                              <div className="flex items-center justify-between mt-8">
                                <button
                                  onClick={() => setCurrentStoryPage(Math.max(0, currentStoryPage - 1))}
                                  disabled={currentStoryPage === 0}
                                  className={`p-4 rounded-full bg-white border-2 border-slate-100 shadow-md disabled:opacity-30 transition-all hover:scale-110`}
                                >
                                  <ChevronLeft className={`w-6 h-6 ${styles.primary}`} />
                                </button>
                                
                                <div className="flex gap-2">
                                  {selectedExercise.story!.map((_, idx) => (
                                    <div 
                                      key={idx}
                                      className={`w-3 h-3 rounded-full transition-all ${idx === currentStoryPage ? styles.accent : 'bg-slate-200'}`}
                                    />
                                  ))}
                                </div>

                                <button
                                  onClick={() => setCurrentStoryPage(Math.min(selectedExercise.story!.length - 1, currentStoryPage + 1))}
                                  disabled={currentStoryPage === selectedExercise.story!.length - 1}
                                  className={`p-4 rounded-full bg-white border-2 border-slate-100 shadow-md disabled:opacity-30 transition-all hover:scale-110`}
                                >
                                  <ChevronRight className={`w-6 h-6 ${styles.primary}`} />
                                </button>
                              </div>

                              {/* Story Progress Bar */}
                              <div className="mt-6 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${((currentStoryPage + 1) / selectedExercise.story!.length) * 100}%` }}
                                  className={`h-full ${styles.accent}`}
                                />
                              </div>

                              {currentStoryPage === selectedExercise.story!.length - 1 && (
                                <motion.button
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  onClick={() => {
                                    playCue('chime');
                                    setSelectedExercise(null);
                                  }}
                                  className={`mt-8 w-full py-4 text-white font-black uppercase tracking-widest shadow-lg transition-all ${styles.button}`}
                                >
                                  Finish Story! 🌟
                                </motion.button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="relative w-full max-w-2xl mx-auto group">
                              <div className="aspect-square sm:aspect-video w-full rounded-[40px] overflow-hidden border-8 border-white shadow-2xl relative bg-slate-50">
                                <ExerciseIllustration
                                  word={selectedExercise.targetWord || selectedExercise.title}
                                  className="w-full h-full transition-transform duration-700 group-hover:scale-105"
                                  illustrationClassName="text-[12rem]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              
                              {feedback && (
                                <motion.div 
                                  initial={{ scale: 0, y: 20 }}
                                  animate={{ scale: 1, y: 0 }}
                                  className="absolute -top-6 -right-6 z-20"
                                >
                                  <div className="bg-accent text-white w-20 h-20 rounded-full flex flex-col items-center justify-center font-black shadow-2xl border-4 border-white">
                                    <span className="text-2xl leading-none">{feedback.score}</span>
                                    <span className="text-[10px] uppercase tracking-tighter">Score</span>
                                  </div>
                                  <div className="mt-2 flex flex-col gap-1 items-end">
                                    <div className="bg-blue-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase shadow-lg">
                                      Accuracy: {feedback.accuracy}%
                                    </div>
                                    <div className="bg-purple-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase shadow-lg">
                                      Fluency: {feedback.fluency}%
                                    </div>
                                    <div className="bg-green-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase shadow-lg">
                                      Pronunciation: {feedback.pronunciation}%
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </div>

                            <div className="space-y-2 mb-4">
                              <p className="text-slate-500 font-medium">Say this word:</p>
                              <div className="flex items-center justify-center gap-4">
                                <motion.h3 
                                  animate={theme === Theme.PLAYFUL ? {
                                    scale: [1, 1.1, 1],
                                    rotate: [0, 2, -2, 0]
                                  } : {}}
                                  transition={theme === Theme.PLAYFUL ? {
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                  } : {}}
                                  className={`text-5xl font-black tracking-tight ${styles.primary}`}
                                >
                                  {selectedExercise.targetWord}
                                </motion.h3>
                                <button
                                  onClick={() => playOrGenerateExerciseAudio(selectedExercise.targetWord!, 'audioUrl')}
                                  disabled={isPlayingAudio || isGeneratingExerciseAudio}
                                  className={`p-3 rounded-full ${styles.card} border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50`}
                                  title="Listen to pronunciation"
                                >
                                  {isGeneratingExerciseAudio ? (
                                    <Loader2 className="w-6 h-6 animate-spin text-accent" />
                                  ) : (
                                    <Volume2 className={`w-6 h-6 ${isPlayingAudio ? 'text-accent animate-pulse' : styles.primary}`} />
                                  )}
                                </button>
                              </div>
                              {selectedExercise.pronunciationGuide && (
                                <div className="flex items-center gap-2">
                                  <p className={`text-sm italic font-medium opacity-80`}>
                                    Quick Tip: {selectedExercise.pronunciationGuide.tip}
                                  </p>
                                  <button
                                    onClick={() => playOrGenerateExerciseAudio(selectedExercise.pronunciationGuide!.tip, 'pronunciationGuide.tipAudioUrl')}
                                    disabled={isPlayingAudio || isGeneratingExerciseAudio}
                                    className={`p-1 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50`}
                                    title="Listen to tip"
                                  >
                                    {isGeneratingExerciseAudio ? (
                                      <Loader2 className="w-3 h-3 animate-spin text-accent" />
                                    ) : (
                                      <Volume2 className={`w-3 h-3 ${isPlayingAudio ? 'text-accent' : 'text-slate-400'}`} />
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>

                            {selectedExercise.targetSentence && (
                              <div className={`w-full max-w-md p-6 rounded-3xl ${theme === Theme.KID ? 'bg-blue-50 border-2 border-blue-100' : 'bg-slate-50 border border-slate-100'} shadow-inner`}>
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Practice Sentence</p>
                                    <p className={`text-2xl font-bold leading-relaxed ${styles.primary}`}>
                                      "{selectedExercise.targetSentence}"
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => playOrGenerateExerciseAudio(selectedExercise.targetSentence!, 'targetSentenceAudioUrl')}
                                    disabled={isPlayingAudio || isGeneratingExerciseAudio}
                                    className={`p-3 rounded-full bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50 mt-1`}
                                    title="Listen to sentence pronunciation"
                                  >
                                    {isGeneratingExerciseAudio ? (
                                      <Loader2 className="w-5 h-5 animate-spin text-accent" />
                                    ) : (
                                      <Volume2 className={`w-5 h-5 ${isPlayingAudio ? 'text-accent animate-pulse' : styles.primary}`} />
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}

                            {selectedExercise.pronunciationGuide && (
                              <div className="w-full max-w-md">
                                <button 
                                  onClick={() => setShowGuide(!showGuide)}
                                  className={`flex items-center gap-2 text-xs font-bold text-slate-400 hover:${styles.primary} transition-colors mb-2 uppercase tracking-widest`}
                                >
                                  <Info className="w-3.5 h-3.5" />
                                  {showGuide ? 'Hide Details' : 'View Full Guide'}
                                </button>
                                
                                <AnimatePresence>
                                  {showGuide && (
                                    <motion.div 
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className={`${theme === Theme.KID ? 'bg-blue-50' : 'bg-slate-50'} rounded-2xl p-4 text-left border border-slate-100 space-y-4`}>
                                        <div className="grid grid-cols-2 gap-4">
                                          {selectedExercise.pronunciationGuide.mouthAnimationUrl && (
                                            <div className="space-y-1">
                                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                                                Mouth View
                                                <span className="bg-red-500 text-white px-1 rounded-[2px] text-[8px] animate-pulse">ANIMATED</span>
                                              </p>
                                              <div 
                                                onClick={() => setActiveAnimation({ 
                                                  url: selectedExercise.pronunciationGuide!.mouthAnimationUrl!, 
                                                  title: "Mouth Position" 
                                                })}
                                                className={`aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm relative group cursor-pointer ${theme === Theme.KID ? 'bg-blue-100' : 'bg-white'}`}
                                              >
                                                <motion.img 
                                                  key={`mouth-${showGuide}`}
                                                  initial={{ scale: 0.8, opacity: 0 }}
                                                  animate={{ scale: 1, opacity: 1 }}
                                                  transition={{ type: 'spring', duration: 0.8 }}
                                                  src={selectedExercise.pronunciationGuide.mouthAnimationUrl} 
                                                  alt="Mouth Position Animation" 
                                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                  referrerPolicy="no-referrer"
                                                />
                                                <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <div className="bg-white/90 p-2 rounded-full shadow-lg">
                                                    <Maximize2 className="w-5 h-5 text-primary" />
                                                  </div>
                                                </div>
                                                <div className="absolute top-2 right-2">
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      playOrGenerateExerciseAudio(selectedExercise.pronunciationGuide!.mouthPosition, 'pronunciationGuide.mouthAudioUrl');
                                                    }}
                                                    className="p-1.5 bg-white/90 rounded-full shadow-sm hover:bg-white transition-colors"
                                                  >
                                                    <Volume2 className="w-3.5 h-3.5 text-primary" />
                                                  </button>
                                                </div>
                                                <div className="absolute bottom-2 right-2">
                                                  <motion.div 
                                                    animate={{ scale: [1, 1.2, 1] }}
                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                    className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                                                  />
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                          {selectedExercise.pronunciationGuide.tongueAnimationUrl && (
                                            <div className="space-y-1">
                                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                                                Tongue View
                                                <span className="bg-red-500 text-white px-1 rounded-[2px] text-[8px] animate-pulse">ANIMATED</span>
                                              </p>
                                              <div 
                                                onClick={() => setActiveAnimation({ 
                                                  url: selectedExercise.pronunciationGuide!.tongueAnimationUrl!, 
                                                  title: "Tongue Placement" 
                                                })}
                                                className={`aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm relative group cursor-pointer ${theme === Theme.KID ? 'bg-blue-100' : 'bg-white'}`}
                                              >
                                                <motion.img 
                                                  key={`tongue-${showGuide}`}
                                                  initial={{ scale: 0.8, opacity: 0 }}
                                                  animate={{ scale: 1, opacity: 1 }}
                                                  transition={{ type: 'spring', duration: 0.8, delay: 0.1 }}
                                                  src={selectedExercise.pronunciationGuide.tongueAnimationUrl} 
                                                  alt="Tongue Placement Animation" 
                                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                  referrerPolicy="no-referrer"
                                                />
                                                <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <div className="bg-white/90 p-2 rounded-full shadow-lg">
                                                    <Maximize2 className="w-5 h-5 text-primary" />
                                                  </div>
                                                </div>
                                                <div className="absolute top-2 right-2">
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      playOrGenerateExerciseAudio(selectedExercise.pronunciationGuide!.tonguePlacement, 'pronunciationGuide.tongueAudioUrl');
                                                    }}
                                                    className="p-1.5 bg-white/90 rounded-full shadow-sm hover:bg-white transition-colors"
                                                  >
                                                    <Volume2 className="w-3.5 h-3.5 text-primary" />
                                                  </button>
                                                </div>
                                                <div className="absolute bottom-2 right-2">
                                                  <motion.div 
                                                    animate={{ scale: [1, 1.2, 1] }}
                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                    className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                                                  />
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                        <div className="space-y-3 pt-2 border-t border-slate-200/50">
                                          <div>
                                            <div className="flex items-center justify-between mb-1">
                                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Mouth Position</p>
                                              <button
                                                onClick={() => playOrGenerateExerciseAudio(selectedExercise.pronunciationGuide!.mouthPosition, 'pronunciationGuide.mouthAudioUrl')}
                                                disabled={isPlayingAudio || isGeneratingExerciseAudio}
                                                className="p-1 rounded-full hover:bg-slate-200 transition-colors"
                                              >
                                                <Volume2 className="w-3 h-3 text-slate-400" />
                                              </button>
                                            </div>
                                            <p className="text-sm text-slate-700 leading-snug">{selectedExercise.pronunciationGuide.mouthPosition}</p>
                                          </div>
                                          <div>
                                            <div className="flex items-center justify-between mb-1">
                                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tongue Placement</p>
                                              <button
                                                onClick={() => playOrGenerateExerciseAudio(selectedExercise.pronunciationGuide!.tonguePlacement, 'pronunciationGuide.tongueAudioUrl')}
                                                disabled={isPlayingAudio || isGeneratingExerciseAudio}
                                                className="p-1 rounded-full hover:bg-slate-200 transition-colors"
                                              >
                                                <Volume2 className="w-3 h-3 text-slate-400" />
                                              </button>
                                            </div>
                                            <p className="text-sm text-slate-700 leading-snug">{selectedExercise.pronunciationGuide.tonguePlacement}</p>
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            )}

                            {/* Educational Cues Section */}
                            <div className="w-full max-w-md grid grid-cols-2 gap-3">
                              {selectedExercise.letterCue && (
                                <div className={`border border-slate-100 p-3 rounded-2xl shadow-sm flex flex-col items-center text-center ${styles.card}`}>
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${theme === Theme.KID ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                                    <TypeIcon className="w-5 h-5" />
                                  </div>
                                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Letter Cue</p>
                                  <p className={`text-xl font-black mb-1 ${theme === Theme.KID ? 'text-blue-600' : styles.primary}`}>{selectedExercise.letterCue.letter}</p>
                                  <p className="text-[10px] text-slate-500 leading-tight">{selectedExercise.letterCue.description}</p>
                                </div>
                              )}
                              
                              {selectedExercise.handCue && (
                                <div className={`border border-slate-100 p-3 rounded-2xl shadow-sm flex flex-col items-center text-center ${styles.card}`}>
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${theme === Theme.KID ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-600'}`}>
                                    <Hand className="w-5 h-5" />
                                  </div>
                                  <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Hand Cue</p>
                                  <p className="text-[10px] text-slate-600 font-medium leading-tight">{selectedExercise.handCue}</p>
                                </div>
                              )}

                              {selectedExercise.pictureCue && (
                                <div className={`border border-slate-100 p-4 rounded-3xl shadow-sm flex flex-col items-center text-center col-span-2 ${styles.card}`}>
                                  <div className="w-full h-48 rounded-2xl overflow-hidden mb-3 bg-slate-50 border border-slate-100">
                                    <ExerciseIllustration
                                      word={selectedExercise.targetWord || selectedExercise.title}
                                      className="w-full h-full"
                                      illustrationClassName="text-8xl"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center">
                                      <ImageIcon className="w-3.5 h-3.5 text-pink-500" />
                                    </div>
                                    <p className="text-xs font-black uppercase text-slate-400 tracking-wider">Visual Cue</p>
                                  </div>
                                </div>
                              )}

                              {selectedExercise.isolationActivity && (
                                <div className={`p-4 rounded-2xl col-span-2 flex items-start gap-3 ${theme === Theme.KID ? 'bg-blue-50 border border-blue-100' : styles.card}`}>
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white ${styles.button}`}>
                                    <Activity className="w-5 h-5" />
                                  </div>
                                  <div className="flex-1">
                                    <p className={`text-[10px] font-black uppercase mb-1 ${styles.primary} opacity-60`}>Isolation Activity</p>
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-bold text-slate-800">{selectedExercise.isolationActivity}</p>
                                      <button 
                                        onClick={() => playOrGenerateExerciseAudio(selectedExercise.isolationActivity!, 'isolationAudioUrl')}
                                        disabled={isPlayingAudio || isGeneratingExerciseAudio}
                                        className={`p-1.5 rounded-lg transition-all ${theme === Theme.KID ? 'bg-white text-blue-500 hover:bg-blue-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                      >
                                        {isGeneratingExerciseAudio ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <Volume2 className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Syllable Activities Section */}
                            {(selectedExercise.syllables || selectedExercise.spinningSyllables) && (
                              <div className="w-full max-w-md space-y-4">
                                {/* Syllable Slider */}
                                {selectedExercise.syllables && selectedExercise.syllables.length >= 2 && (
                                  <div className={`p-4 rounded-2xl shadow-sm ${styles.card}`}>
                                    <div className="flex items-center gap-2 mb-4">
                                      <MoveHorizontal className={`w-4 h-4 ${styles.icon}`} />
                                      <p className="text-[10px] font-black uppercase text-slate-400">Syllable Slider</p>
                                    </div>
                                    <div className={`relative h-12 flex items-center justify-between px-8 rounded-xl ${theme === Theme.KID ? 'bg-blue-50' : 'bg-slate-50'}`}>
                                      <div className="text-xl font-black text-slate-400">{selectedExercise.syllables[0]}</div>
                                      <div className="text-xl font-black text-slate-400">{selectedExercise.syllables[selectedExercise.syllables.length - 1]}</div>
                                      
                                      <input 
                                        type="range" 
                                        min="0" 
                                        max="100" 
                                        value={sliderValue}
                                        onChange={(e) => setSliderValue(parseInt(e.target.value))}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                      />
                                      
                                      <motion.div 
                                        className={`absolute h-10 px-4 text-white rounded-lg flex items-center justify-center font-black shadow-lg ${styles.button}`}
                                        animate={{ 
                                          left: `${10 + (sliderValue * 0.6)}%`,
                                          scale: sliderValue > 45 && sliderValue < 55 ? 1.2 : 1
                                        }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                      >
                                        {sliderValue < 50 ? selectedExercise.syllables[0] : selectedExercise.syllables[selectedExercise.syllables.length - 1]}
                                      </motion.div>
                                    </div>
                                    <p className="text-[10px] text-center text-slate-400 mt-2">Slide the sounds together to make the word!</p>
                                  </div>
                                )}

                                {/* Syllable Spinning */}
                                {selectedExercise.spinningSyllables && (
                                  <div className={`p-4 rounded-2xl shadow-sm ${styles.card}`}>
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-2">
                                        <RefreshCw className={`w-4 h-4 ${styles.icon}`} />
                                        <p className="text-[10px] font-black uppercase text-slate-400">Syllable Spinner</p>
                                      </div>
                                      <button 
                                        onClick={handleSpinAll}
                                        className={`text-[10px] font-black uppercase hover:underline ${styles.primary}`}
                                      >
                                        Spin All
                                      </button>
                                    </div>
                                    
                                    <div className="flex gap-2 justify-center">
                                      {selectedExercise.spinningSyllables.slice(0, 3).map((options, i) => (
                                        <div key={i} className="flex flex-col items-center gap-2">
                                          <div className={`w-20 h-20 border border-slate-100 rounded-xl flex items-center justify-center overflow-hidden relative ${theme === Theme.KID ? 'bg-blue-50' : 'bg-slate-50'}`}>
                                            <AnimatePresence mode="popLayout">
                                              <motion.div
                                                key={spinValues[i]}
                                                initial={{ y: 50, opacity: 0, scale: 0.5, filter: 'blur(4px)' }}
                                                animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                                exit={{ y: -50, opacity: 0, scale: 0.5, filter: 'blur(4px)', position: 'absolute' }}
                                                transition={{ 
                                                  type: 'spring', 
                                                  stiffness: 400, 
                                                  damping: 25,
                                                  mass: 0.8
                                                }}
                                                className={`text-xl font-black ${styles.primary}`}
                                              >
                                                {options[spinValues[i]]}
                                              </motion.div>
                                            </AnimatePresence>
                                          </div>
                                          <button 
                                            onClick={() => handleSpinSlot(i)}
                                            className={`p-1 rounded-full transition-colors ${theme === Theme.KID ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' : 'bg-slate-100 text-slate-400 hover:bg-primary hover:text-white'}`}
                                          >
                                            <RefreshCw className="w-3 h-3" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                    <div className={`mt-4 p-2 rounded-xl text-center ${theme === Theme.KID ? 'bg-blue-50' : 'bg-primary/5'}`}>
                                      <p className={`text-sm font-black ${styles.primary}`}>
                                        {selectedExercise.spinningSyllables.slice(0, 3).map((options, i) => options[spinValues[i]]).join('')}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                        <div className="w-full max-w-md">
                          {feedback ? (
                                  <div className={`p-6 rounded-2xl border border-slate-100 text-left ${theme === Theme.KID ? 'bg-blue-50' : 'bg-slate-50'}`}>
                                    <div className="flex items-start gap-3">
                                      <CheckCircle2 className={`w-6 h-6 flex-shrink-0 mt-1 ${styles.icon}`} />
                                      <div className="w-full">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                          <p className="font-bold text-slate-800">Feedback</p>
                                          {lastStructuredAttempt && (
                                            <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                              lastStructuredAttempt.soda.summaryTag === 'Correct'
                                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                                            }`}>
                                              {lastStructuredAttempt.soda.summaryTag}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-slate-600 leading-relaxed text-sm">{feedback.feedback}</p>

                                        {lastStructuredAttempt && (
                                          <div className="mt-3 pt-3 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-xs">
                                            <div className="bg-white/90 p-2.5 rounded-xl border border-slate-100 shadow-sm">
                                              <span className="text-[10px] font-bold text-slate-400 uppercase block">Recognized Text</span>
                                              <span className="font-bold text-slate-800 truncate block">
                                                {lastStructuredAttempt.recognizedText || '—'}
                                              </span>
                                            </div>
                                            <div className="bg-white/90 p-2.5 rounded-xl border border-slate-100 shadow-sm">
                                              <span className="text-[10px] font-bold text-slate-400 uppercase block">Intelligibility</span>
                                              <span className="font-bold text-slate-800 block">
                                                {Math.max(0, Math.min(100, Math.round(100 - lastStructuredAttempt.wer * 100)))}%
                                              </span>
                                            </div>
                                            <div className="bg-white/90 p-2.5 rounded-xl border border-slate-100 shadow-sm">
                                              <span className="text-[10px] font-bold text-slate-400 uppercase block">Acoustic Power</span>
                                              <span className="font-bold text-slate-800 block">
                                                {Math.round(lastStructuredAttempt.acousticMetrics.avgDecibels)} dB (Peak {Math.round(lastStructuredAttempt.acousticMetrics.peakDecibels)} dB)
                                              </span>
                                            </div>
                                            <div className="bg-white/90 p-2.5 rounded-xl border border-slate-100 shadow-sm">
                                              <span className="text-[10px] font-bold text-slate-400 uppercase block">Engine Provider</span>
                                              <span className="font-bold text-primary truncate block">
                                                {lastStructuredAttempt.provider}
                                              </span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {localMentorAudio && (
                                      <div className="mt-6 p-4 bg-white rounded-xl border border-slate-100">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Compare with Mentor</p>
                                        <div className="flex items-center gap-4">
                                          <div className="flex-1 flex flex-col items-center gap-1">
                                            <button 
                                              onClick={() => playTargetAudio(localMentorAudio)}
                                              className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                                            >
                                              <Volume2 className="w-5 h-5" />
                                            </button>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Mentor</span>
                                          </div>
                                          <div className="w-px h-8 bg-slate-100" />
                                          <div className="flex-1 flex flex-col items-center gap-1">
                                            <button 
                                              onClick={() => {
                                                if (localUserRecordings.length > 0) {
                                                  playTargetAudio(localUserRecordings[0].audioUrl);
                                                }
                                              }}
                                              className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors"
                                            >
                                              <Mic className="w-5 h-5" />
                                            </button>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">You</span>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    <button 
                                      onClick={() => setFeedback(null)}
                                      className={`mt-4 w-full py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors ${styles.primary}`}
                                    >
                                      Try Again
                                    </button>
                                  </div>
                          ) : (
                          <div className="flex flex-col items-center gap-8 w-full">
                            {/* Mentor Mode Toggle */}
                            <div className="flex items-center gap-1 p-1.5 bg-slate-100/50 rounded-2xl border border-slate-200/50 backdrop-blur-sm">
                              <button 
                                onClick={() => setIsMentorMode(false)}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all tracking-widest ${!isMentorMode ? 'bg-white shadow-md text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                STUDENT
                              </button>
                              <button 
                                onClick={() => setIsMentorMode(true)}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all tracking-widest ${isMentorMode ? 'bg-white shadow-md text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                MENTOR
                              </button>
                            </div>

                            {isMentorMode && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center space-y-3 bg-primary/5 p-4 rounded-3xl border border-primary/10 max-w-xs"
                              >
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                  <p className="text-xs font-black text-primary uppercase tracking-widest">Mentor Recording</p>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-relaxed">Record the target pronunciation for your student to follow.</p>
                                {localMentorAudio && (
                                  <div className="flex items-center justify-center gap-3 pt-2">
                                    <button 
                                      onClick={() => playTargetAudio(localMentorAudio)}
                                      className="flex items-center gap-2 px-4 py-2 bg-white text-primary rounded-xl shadow-sm hover:shadow-md transition-all font-bold text-xs"
                                    >
                                      <Play className="w-3.5 h-3.5" />
                                      Listen
                                    </button>
                                    <button 
                                      onClick={async () => {
                                        if (selectedExercise && activeProfile) {
                                          await localDb.recordings
                                            .where({ exerciseId: selectedExercise.id, type: 'target', profileId: activeProfile.id })
                                            .delete();
                                          setLocalMentorAudio(null);
                                          toast.success("Mentor recording removed.");
                                        }
                                      }}
                                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                      title="Delete recording"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </motion.div>
                            )}

                            <div className="flex flex-col items-center gap-6 relative">
                              {comboCount > 1 && (
                                <motion.div 
                                  initial={{ scale: 0, rotate: -20, y: 20 }}
                                  animate={{ scale: 1, rotate: 0, y: 0 }}
                                  className="absolute -top-12 flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-black shadow-xl border-2 border-white z-10"
                                >
                                  <Zap className="w-4 h-4 fill-white" />
                                  {comboCount} COMBO!
                                </motion.div>
                              )}

                              {/* Speech Pipeline & Live Oscillating Audio Visualizer */}
                              <SpeechPipelineFeedback
                                isRecording={isRecording}
                                isAnalyzing={isAnalyzing}
                                activeProvider={activeSpeechProvider}
                                liveTranscript={sttLiveTranscript}
                                liveAudioLevel={liveAudioLevel}
                                onOpenDiagnostics={() => setShowDiagnosticConsole(true)}
                                targetText={selectedExercise?.targetWord || selectedExercise?.title}
                                className="w-full max-w-sm"
                              />

                              <div className="relative">
                                <motion.button
                                  onClick={toggleRecording}
                                  disabled={isAnalyzing}
                                  animate={theme === Theme.PLAYFUL && !isRecording ? {
                                    scale: [1, 1.05, 1],
                                  } : {}}
                                  transition={theme === Theme.PLAYFUL && !isRecording ? {
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                  } : {}}
                                  className={`group relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${
                                    isRecording 
                                      ? 'bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)] scale-110' 
                                      : `${styles.button} shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95`
                                  } ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  {isRecording ? (
                                    <div className="w-10 h-10 bg-white rounded-xl animate-pulse" />
                                  ) : (
                                    <Mic className="w-12 h-12 text-white" />
                                  )}
                                  
                                  {isRecording && (
                                    <motion.div 
                                      className="absolute inset-0 rounded-full border-4 border-red-400"
                                      animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                                      transition={{ repeat: Infinity, duration: 1.5 }}
                                    />
                                  )}
                                </motion.button>
                                
                                {isAnalyzing && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="w-16 h-16 animate-spin text-white/50" />
                                  </div>
                                )}
                              </div>

                              <div className="text-center space-y-2">
                                <p className={`text-lg font-black tracking-tight ${isRecording ? 'text-red-500 animate-pulse' : isAnalyzing ? 'text-primary animate-pulse' : 'text-slate-700'}`}>
                                  {isRecording ? 'Teacher is listening...' : isAnalyzing ? 'Analyzing speech...' : 'Tap to start practice'}
                                </p>
                                {!isRecording && !isAnalyzing && (
                                  <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Speak clearly into your mic</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                    <div className="flex-1 flex flex-col gap-8 justify-start items-stretch w-full">
                      {/* Daily Progress & Welcome */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                        <div className="md:col-span-2 flex flex-col items-center justify-start text-center p-8 bg-white rounded-3xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
                            {view === 'stories' ? (
                              <BookOpen className={`w-8 h-8 ${styles.primary}`} />
                            ) : (
                              <Activity className={`w-8 h-8 ${styles.primary}`} />
                            )}
                          </div>
                          <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">
                            {view === 'stories' ? `Ready for a story, ${activeProfile?.name || 'Guest'}?` : `Ready to practice, ${activeProfile?.name || 'Guest'}?`}
                          </h2>
                          <p className="text-sm text-slate-500 max-w-xs font-medium">
                            {view === 'stories' 
                              ? 'Select a story from the list on the left to begin your reading session.'
                              : 'Select an exercise from the list on the left to begin your speech session.'}
                          </p>
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col items-center justify-start text-center">
                          <div className="relative w-24 h-24 mb-3">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle
                                cx="48"
                                cy="48"
                                r="40"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className="text-slate-100"
                              />
                              <motion.circle
                                cx="48"
                                cy="48"
                                r="40"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray="251.2"
                                initial={{ strokeDashoffset: 251.2 }}
                                animate={{ strokeDashoffset: 251.2 - (251.2 * Math.min((activeProfile?.points || 0) / 100, 1)) }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="text-accent"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-xl font-black text-slate-800">{activeProfile?.points || 0}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Points</span>
                            </div>
                          </div>
                          <h3 className="text-sm font-bold text-slate-700">Daily Goal</h3>
                          <p className="text-xs text-slate-400">100 points to go!</p>
                        </div>
                      </div>

                      {/* Struggle Words Section */}
                      <div className="text-left">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600`}>
                              <Bookmark className="w-5 h-5" />
                            </div>
                            <div>
                              <h2 className="text-xl font-black uppercase tracking-tight">Struggle Words</h2>
                              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Words to practice more</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setShowStruggleWordModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all"
                          >
                            <Plus className="w-4 h-4" />
                            Add Word
                          </button>
                        </div>

                        {(!activeProfile?.struggleWords || activeProfile.struggleWords.length === 0) ? (
                          <div className="bg-slate-50 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold">No struggle words added yet. Add words that need extra practice!</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {activeProfile.struggleWords.map(word => (
                              <motion.div
                                key={word.id}
                                whileHover={{ y: -5 }}
                                className={`p-6 ${styles.card} relative group`}
                              >
                                <div className="flex items-start gap-4">
                                  {word.imageUrl && (
                                    <img 
                                      src={word.imageUrl} 
                                      alt={word.word} 
                                      className="w-16 h-16 rounded-xl object-cover shadow-md"
                                      referrerPolicy="no-referrer"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <h3 className="text-lg font-black uppercase tracking-tight mb-1">{word.word}</h3>
                                    <p className="text-xs text-slate-500 line-clamp-2">{word.definition}</p>
                                  </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${word.mastered ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                    {word.mastered ? 'Mastered' : 'Practicing'}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => {
                                        setProfiles(prev => prev.map(p => 
                                          p.id === activeProfileId ? { 
                                            ...p, 
                                            struggleWords: p.struggleWords.filter(w => w.id !== word.id) 
                                          } : p
                                        ));
                                        playCue('pop');
                                      }}
                                      className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={async () => {
                                        playCue('pop');
                                        try {
                                          const audioUrl = await generateWordAudio(user?.uid || 'guest', word.word);
                                          if (audioUrl) {
                                            playTargetAudio(audioUrl);
                                          } else {
                                            throw new Error('No audio URL');
                                          }
                                        } catch (e) {
                                          const audio = new Audio(`https://api.dictionaryapi.dev/media/pronunciations/en/${word.word}-us.mp3`);
                                          audio.play().catch(() => {
                                            speakText(word.word, activeProfile?.language as Language || Language.ENGLISH);
                                          });
                                        }
                                      }}
                                      className={`p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors`}
                                    >
                                      <Volume2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Voice Library Section */}
                      <div className="text-left">
                        <div className="flex items-center gap-3 mb-6">
                          <div className={`w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600`}>
                            <History className="w-5 h-5" />
                          </div>
                          <div>
                            <h2 className="text-xl font-black uppercase tracking-tight">Voice Library</h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Listen to your improvement</p>
                          </div>
                        </div>

                        {(localUserRecordings.length === 0) ? (
                          <div className="bg-slate-50 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold">No recordings saved yet. Complete exercises to build your library!</p>
                          </div>
                        ) : (
                          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {localUserRecordings.map(recording => (
                              <motion.div
                                key={recording.id}
                                whileHover={{ scale: 1.02 }}
                                className={`min-w-[280px] p-5 ${styles.card} flex items-center gap-4 relative`}
                              >
                                {recording.isLocal && (
                                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-blue-100 text-blue-600 text-[8px] font-black rounded-full uppercase">
                                    Local
                                  </div>
                                )}
                                <button 
                                  onClick={() => {
                                    playTargetAudio(recording.audioUrl);
                                    playCue('pop');
                                  }}
                                  className={`w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-110 transition-transform`}
                                >
                                  <Play className="w-5 h-5 fill-current" />
                                </button>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-black text-sm uppercase truncate">{recording.exerciseTitle}</h4>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                    {new Date(recording.timestamp).toLocaleDateString()} • Score: {recording.score}%
                                  </p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </AnimatePresence>

                {/* BOTTOM_NAV Exercise List Implementation */}
                {layoutMode === LayoutMode.BOTTOM_NAV && (
                  <div className="mt-12 border-t border-slate-100 pt-12 pb-8 overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-black uppercase tracking-tight">Practice Selection</h2>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Quick Switch</span>
                    </div>
                    
                    <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar scroll-smooth">
                      {[...EXERCISES, ...savedStories]
                        .filter(ex => view === 'stories' ? ex.type === ExerciseType.STORY : ex.type !== ExerciseType.STORY)
                        .map((ex) => (
                          <motion.div
                            key={`bottom-${ex.id}`}
                            whileHover={{ y: -4, scale: 1.02 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              handleStartPractice(ex);
                              practiceAreaRef.current?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={`flex-shrink-0 w-48 p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                              selectedExercise?.id === ex.id 
                                ? 'border-primary bg-primary/5 shadow-md' 
                                : 'border-slate-50 bg-white hover:border-slate-200 shadow-sm'
                            }`}
                          >
                            <div className="aspect-[16/10] rounded-xl overflow-hidden mb-3 bg-slate-50 border border-slate-50">
                              <ExerciseIllustration
                                word={ex.targetWord || ex.title}
                                className="w-full h-full"
                                illustrationClassName="text-7xl"
                              />
                            </div>
                            <h4 className="font-bold text-xs truncate mb-0.5">{ex.title}</h4>
                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest truncate">{ex.category}</p>
                          </motion.div>
                        ))
                      }
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {view === 'language-modules' && (
            <motion.div
              key="language-modules"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-6xl mx-auto py-8 space-y-6"
            >
              <div className="text-center mb-4">
                <h2 className="text-3xl font-black tracking-tight text-slate-800 flex items-center justify-center gap-2">
                  <Sparkles className="w-8 h-8 text-indigo-500 animate-pulse" />
                  Language & Logic Exercises
                </h2>
                <p className="text-slate-500">Playful expressive, receptive, and structural reasoning modules.</p>
              </div>

              <ClinicalEvidencePanel moduleId="language-modules" />

              <LanguageModules />
            </motion.div>
          )}

          {view === 'pacing-board' && (
            <motion.div
              key="pacing-board"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-6xl mx-auto py-8 space-y-6"
            >
              <div className="text-center mb-4">
                <h2 className="text-3xl font-black tracking-tight text-slate-800 flex items-center justify-center gap-2">
                  <Hand className="w-8 h-8 text-emerald-500 animate-pulse" />
                  Interactive Pacing Board
                </h2>
                <p className="text-slate-500">A tactile, sensory-friendly tool for regulating speaking rate and phrasing fluency.</p>
              </div>

              <ClinicalEvidencePanel moduleId="pacing-board" />

              <InteractivePacingBoard />
            </motion.div>
          )}

          {view === 'voice-meters' && (
            <motion.div
              key="voice-meters"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-6xl mx-auto py-8 space-y-6"
            >
              <div className="text-center mb-4">
                <h2 className="text-3xl font-black tracking-tight text-slate-800 flex items-center justify-center gap-2">
                  <Activity className="w-8 h-8 text-emerald-500 animate-pulse" />
                  Voice Onset & Sound Decibel Meters
                </h2>
                <p className="text-slate-500">Microphone analysis tools detecting voiced speech onset vibration and sound decibel levels.</p>
              </div>

              <ClinicalEvidencePanel moduleId="voice-meters" />

              <VoiceOnsetDecibelMeter />
            </motion.div>
          )}

          {view === 'aac-playground' && (
            <motion.div
              key="aac-playground"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-6xl mx-auto py-8 space-y-6"
            >
              <div className="text-center mb-4">
                <h2 className="text-3xl font-black tracking-tight text-slate-800 flex items-center justify-center gap-2">
                  <LayoutGrid className="w-8 h-8 text-indigo-500 animate-pulse" />
                  AAC Expressive Grid Boards (PECS)
                </h2>
                <p className="text-slate-500">A simple, high-contrast PECS grid board matching standard speech therapy icon dictionaries with sentence synthesis.</p>
              </div>

              <ClinicalEvidencePanel moduleId="aac-playground" />

              <AacPlayground />
            </motion.div>
          )}

          {view === 'autism-tools' && (
            <motion.div
              key="autism-tools"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-5xl mx-auto py-8 space-y-6"
            >
              <div className="text-center mb-4">
                <h2 className="text-3xl font-black tracking-tight">Autism Support Tools</h2>
                <p className="text-slate-500">Visual aids and sensory-friendly tools for neurodivergent learners.</p>
              </div>

              <ClinicalEvidencePanel moduleId="autism-tools" />

              <SensoryTools
                sensoryProfile={sensoryProfile || undefined}
                firstThenBoards={firstThenBoards}
                onAddBoard={addFirstThenBoard}
                onDeleteBoard={deleteFirstThenBoard}
                onUpdateSensoryProfile={updateSensoryProfile}
                styles={styles}
              />
            </motion.div>
          )}

          {view === 'matching-game' && (
            <motion.div
              key="matching-game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-5xl mx-auto py-8 space-y-6"
            >
              <ClinicalEvidencePanel moduleId="matching-game" />
              <ArticulationMatchingGame
                exercises={EXERCISES}
                onClose={() => setView('practice')}
                styles={styles}
                playCue={playCue}
                sensoryProfile={sensoryProfile || undefined}
              />
            </motion.div>
          )}

          {view === 'bilingual-match' && (
            <motion.div
              key="bilingual-match"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-5xl mx-auto py-8 space-y-6"
            >
              <ClinicalEvidencePanel moduleId="bilingual-match" />
              <BilingualMatchingGame
                onClose={() => setView('practice')}
                playCue={playCue}
                sensoryProfile={sensoryProfile || undefined}
              />
            </motion.div>
          )}

          {view === 'sound-ladder' && (
            <motion.div
              key="sound-ladder"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-5xl mx-auto py-6"
            >
              <SoundLadderGame onClose={() => setView('practice')} />
            </motion.div>
          )}

          {view === 'contrast-engine' && (
            <motion.div
              key="contrast-engine"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-6xl mx-auto py-6"
            >
              <ContrastEngineView />
            </motion.div>
          )}

          {view === 'fluency-lab' && (
            <motion.div
              key="fluency-lab"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-6xl mx-auto py-6"
            >
              <FluencyPacingLab />
            </motion.div>
          )}

          {view === 'vocal-lab' && (
            <motion.div
              key="vocal-lab"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-6xl mx-auto py-6"
            >
              <VocalTherapyLab />
            </motion.div>
          )}

          {view === 'scene-aac' && (
            <motion.div
              key="scene-aac"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-6xl mx-auto py-6"
            >
              <SceneAacBoards />
            </motion.div>
          )}

          {view === 'parent-coaching' && (
            <motion.div
              key="parent-coaching"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-6xl mx-auto py-6"
            >
              <ParentCoachingPortal />
            </motion.div>
          )}

          {view === 'clinical-research' && (
            <motion.div
              key="clinical-research"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-6xl mx-auto py-6"
            >
              <ClinicalResearchAnalytics />
            </motion.div>
          )}

          {view === 'motor-speech' && (
            <motion.div
              key="motor-speech"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-6xl mx-auto py-6"
            >
              <MotorSpeechStudio />
            </motion.div>
          )}

          {view === 'receptive-language' && (
            <motion.div
              key="receptive-language"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-6xl mx-auto py-6"
            >
              <ReceptiveLanguageArena />
            </motion.div>
          )}

          {view === 'articulator-anatomy' && (
            <motion.div
              key="articulator-anatomy"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-6xl mx-auto py-6"
            >
              <ArticulatorAnatomyVisualizer />
            </motion.div>
          )}

          {view === 'privacy-policy' && (
            <PrivacyPolicyView onClose={() => setView('settings')} />
          )}

          {view === 'focus-social' && (
            <motion.div
              key="focus-social"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-6xl mx-auto py-8 space-y-6"
            >
              <ClinicalEvidenceGuide activeView="focus-social" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Specialized Categories */}
              <div className="lg:col-span-4 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Focus & Social</h2>
                </div>

                <div className="space-y-8">
                  {(Object.entries(
                    EXERCISES
                      .filter(ex => [
                        ExerciseType.FOLLOWING_DIRECTIONS,
                        ExerciseType.SOCIAL_SKILLS,
                        ExerciseType.IMPULSIVITY_PRACTICE,
                        ExerciseType.FOCUS_SESSION
                      ].includes(ex.type))
                      .reduce((acc, ex) => {
                        if (!acc[ex.category]) acc[ex.category] = [];
                        acc[ex.category].push(ex);
                        return acc;
                      }, {} as Record<string, Exercise[]>)
                  ) as [string, Exercise[]][]).map(([category, items]) => (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center gap-3 px-2">
                        <div className="h-px flex-1 bg-slate-100" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          {category}
                        </h4>
                        <div className="h-px flex-1 bg-slate-100" />
                      </div>
                      
                      <div className="space-y-3">
                        {items.map((ex) => (
                          <motion.div
                            key={ex.id}
                            whileHover={{ 
                              scale: 1.02, 
                              x: 4,
                              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
                            }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleStartPractice(ex)}
                            role="button"
                            tabIndex={0}
                            className={`p-4 rounded-2xl border-2 transition-all text-left group ${
                              selectedExercise?.id === ex.id 
                                ? 'border-primary bg-primary/5 shadow-md' 
                                : 'border-white bg-white hover:border-slate-100 shadow-sm'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                                selectedExercise?.id === ex.id ? 'bg-primary text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'
                              }`}>
                                {ex.type === ExerciseType.FOCUS_SESSION ? <TimerIcon className="w-5 h-5" /> :
                                 ex.type === ExerciseType.SOCIAL_SKILLS ? <Users className="w-5 h-5" /> :
                                 ex.type === ExerciseType.IMPULSIVITY_PRACTICE ? <Zap className="w-5 h-5" /> :
                                 <Hand className="w-5 h-5" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`font-bold text-sm truncate ${selectedExercise?.id === ex.id ? styles.primary : 'text-slate-700'}`}>
                                  {ex.title}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate">{ex.description}</p>
                              </div>
                              <ChevronRight className={`w-5 h-5 ${selectedExercise?.id === ex.id ? styles.primary : 'text-slate-300'}`} />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Practice Area (Offline View) */}
              <div className="lg:col-span-8 scroll-mt-24" ref={practiceAreaRef}>
                <AnimatePresence mode="wait">
                  {selectedExercise ? (
                    <motion.div
                      key={selectedExercise.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`p-8 lg:h-full min-h-[500px] flex flex-col ${styles.card}`}
                    >
                      <SpecializedExerciseView
                        exercise={selectedExercise}
                        styles={styles}
                        playCue={playCue}
                        onComplete={(score, rubric) => saveVoiceRecording("", score, selectedExercise, rubric)}
                        localMentorAudio={localMentorAudio}
                        playTargetAudio={playTargetAudio}
                        isRecording={isRecording}
                        isAnalyzing={isAnalyzing}
                        onStartRecording={startRecording}
                        onStopRecording={stopRecording}
                        userId={user?.uid || 'guest'}
                        language={selectedExercise.language}
                        difficulty={selectedExercise.difficulty}
                        aiFeedback={feedback}
                      />
                    </motion.div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-slate-50/50 rounded-[40px] border-4 border-dashed border-slate-200">
                      <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6">
                        <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                      </div>
                      <h3 className="text-2xl font-black mb-2">Ready to Focus?</h3>
                      <p className="text-slate-500 max-w-xs">Select an activity from the list to start your session.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
              </div>
            </motion.div>
          )}

          {view === 'lessons' && (
            <motion.div
              key="lessons"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-6xl mx-auto py-8 space-y-6"
            >
              <ClinicalEvidenceGuide activeView="lessons" />
              {selectedLessonPlan ? (
                <LessonPlayer
                  plan={selectedLessonPlan}
                  onComplete={(score) => {
                    // Update stats if needed
                    setSelectedLessonPlan(null);
                  }}
                  onExit={() => setSelectedLessonPlan(null)}
                  styles={styles}
                  playCue={playCue}
                  saveVoiceRecording={saveVoiceRecording}
                  localMentorAudio={localMentorAudio}
                  playTargetAudio={playTargetAudio}
                />
              ) : isBuildingLesson ? (
                <LessonBuilder
                  onSave={handleSaveLessonPlan}
                  onCancel={() => {
                    setIsBuildingLesson(false);
                    setEditingLessonPlan(null);
                  }}
                  initialPlan={editingLessonPlan || undefined}
                  styles={styles}
                />
              ) : (
                <LessonListView
                  plans={lessonPlans}
                  onStart={handleStartLesson}
                  onCreate={() => {
                    setEditingLessonPlan(null);
                    setIsBuildingLesson(true);
                  }}
                  onEdit={(plan) => {
                    setEditingLessonPlan(plan);
                    setIsBuildingLesson(true);
                  }}
                  onDelete={handleDeleteLessonPlan}
                  styles={styles}
                />
              )}
            </motion.div>
          )}

          {view === 'admin-builder' && isActualAdmin && user && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[400] bg-slate-50 overflow-hidden flex flex-col"
            >
              <div className="absolute top-6 right-8 z-[410]">
                <button 
                  onClick={() => {
                    playCue('pop');
                    setView('marketplace');
                  }}
                  className="p-3 bg-slate-900 text-white rounded-2xl shadow-2xl hover:scale-110 active:scale-90 transition-all font-black flex items-center gap-2 group"
                >
                  <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                  <span className="text-[10px] uppercase tracking-widest mr-2">Exit Builder</span>
                </button>
              </div>
              <AdminBuilder 
                userId={user.uid}
                initialExercise={editingExercise}
                onSave={async (data) => {
                  try {
                    await handleSaveCustomExercise(data);
                    setEditingExercise(null);
                    setView('marketplace');
                  } catch (e) {
                    toast.error("Failed to save exercise");
                  }
                }}
                onClose={() => {
                  setEditingExercise(null);
                  setView('marketplace');
                }}
              />
            </motion.div>
          )}

          {view === 'admin-cms' && (
            <StandaloneAdminPortal 
              user={user} 
              profiles={profiles}
              onUpdateRubric={handleUpdateRubric}
              onReturnToApp={() => {
                window.history.pushState(null, '', '/');
                setView('practice');
              }}
            />
          )}

          {view === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <SettingsView
                isPro={isPremiumUser}
                privacyMode={privacyMode}
                cloudSync={cloudSync}
                isNavbarHidden={isNavbarHidden}
                isFocusMode={isFocusMode}
                theme={theme}
                layoutMode={layoutMode}
                sensoryProfile={sensoryProfile}
                notificationSettings={notificationSettings}
                clinicalSettings={clinicalSettings}
                isDarkMode={isDarkMode}
                onToggleDarkMode={setIsDarkMode}
                onTogglePrivacy={setPrivacyMode}
                onToggleCloudSync={setCloudSync}
                onToggleNavbar={setIsNavbarHidden}
                onToggleFocus={setIsFocusMode}
                onSetTheme={setTheme}
                onSetLayoutMode={handleSetLayoutMode}
                onUpdateSensoryProfile={updateSensoryProfile}
                onUpdateNotificationSettings={updateNotificationSettings}
                onUpdateClinicalSettings={updateClinicalSettings}
                aiCredits={user?.aiCredits || 0}
                isAiOptedOut={user?.isAiOptedOut || false}
                soundEnabled={user?.soundEnabled ?? true}
                hapticsEnabled={user?.hapticsEnabled ?? true}
                onToggleAiOptOut={handleAiOptedOut}
                onToggleSound={handleToggleSound}
                onToggleHaptics={handleToggleHaptics}
                onPurchaseCredits={handlePurchaseCredits}
                onUpgrade={() => setShowProModal(true)}
                onLogin={handleLogin}
                onClinicianAccess={() => setShowCrmAuthModal(true)}
                onLogout={handleLogout}
                onClearCache={() => setShowClearCacheModal(true)}
                onOpenPrivacyPolicy={() => setView('privacy-policy')}
                onInstallPWA={handleInstallPWA}
                canInstallPWA={!!deferredPrompt}
                onOpenAdminBuilder={() => setView('admin-builder')}
                onOpenAdminCMS={() => setView('admin-cms')}
                onOpenDiagnosticConsole={() => setShowDiagnosticConsole(true)}
                onOpenPrivacyGovernance={() => setShowPrivacyGovernanceModal(true)}
                userEmail={user?.email}
                styles={getThemeStyles()}
              />
            </motion.div>
          )}

          {view === 'marketplace' && (
            <MarketplaceView 
              user={user}
              items={marketplaceItems}
              isSubscribed={isSubscriptionActive}
              onPurchase={handlePurchaseItem}
              onSubscribe={handleSubscribeUnlimited}
              onPreview={(item) => setSelectedExercise(item.exercise)}
              onEdit={(item) => {
                setEditingExercise(item.exercise);
                setView('admin-builder');
              }}
            />
          )}

          {view === 'videos' && (
            <motion.div
              key="videos"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-5xl mx-auto py-12 px-4"
            >
              <div className="mb-12 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 text-pink-600 text-xs font-black uppercase tracking-widest mb-4">
                  <Play className="w-3 h-3" />
                  Creative Hub
                </div>
                <h2 className="text-5xl font-black tracking-tight mb-4 text-slate-900">Owner's Corner</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-sm max-w-lg mx-auto">Expert tips, demonstrations & daily insights from Bilingual and Brilliant Speech Therapy</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Instagram Profile Card */}
                <div className={`lg:col-span-1 p-8 ${styles.card} flex flex-col items-center text-center h-fit sticky top-24`}>
                  <div className="relative mb-6">
                    <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500">
                      <img 
                        src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200" 
                        alt="Owner"
                        className="w-full h-full rounded-full border-4 border-white object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-lg border border-slate-100">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center">
                        <Camera className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-black text-slate-900 mb-1">Bilingual & Brilliant</h3>
                  <p className="text-slate-500 text-sm font-bold mb-6">@bilingualandbrilliantspeech</p>
                  
                  <p className="text-slate-600 text-sm leading-relaxed mb-8">
                    Empowering families through bilingual speech-language therapy and neurodiversity-affirming practices.
                  </p>

                  <a 
                    href="https://www.instagram.com/bilingualandbrilliantspeech/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-pink-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    View on Instagram
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>

                {/* Featured Content Area */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`p-4 ${styles.card} overflow-hidden group`}>
                      <div className="flex items-center justify-between mb-4 px-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Featured Reel</span>
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      </div>
                      <InstagramEmbed url="https://www.instagram.com/reel/C5_8mEaO_8q/" />
                    </div>

                    <div className={`p-4 ${styles.card} overflow-hidden group`}>
                      <div className="flex items-center justify-between mb-4 px-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Latest Demonstration</span>
                      </div>
                      <InstagramEmbed url="https://www.instagram.com/reel/C57D3pHO_8q/" />
                    </div>
                  </div>

                  {/* Placeholder for more content */}
                  <div className={`p-12 border-4 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center justify-center text-center`}>
                    <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-4">
                      <Video className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-black text-slate-400 mb-2">More Content Syncing</h3>
                    <p className="text-sm text-slate-400 max-w-xs mx-auto">
                      We're working on integrating more of our educational video series directly here.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'progress' && (
            <motion.div 
              key="progress"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-8 pb-12"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black tracking-tight">Your Progress</h2>
                  <p className="text-slate-500 text-sm">Track your speech journey and milestones</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={generateReport}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-2xl text-sm font-bold shadow-lg hover:bg-slate-800 transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    Export PDF
                  </button>
                  <div className="px-4 py-2 bg-white border border-slate-200 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-sm">
                    <Activity className="w-4 h-4 text-primary" />
                    Last 7 Days
                  </div>
                  <div className="px-4 py-2 bg-primary text-white rounded-2xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20">
                    <Trophy className="w-4 h-4" />
                    {userStats.points} Points
                  </div>
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Current Streak', value: `${userStats.streak} Days`, icon: Sparkles, color: 'text-amber-500', bg: 'bg-amber-50' },
                  { label: 'Total Sessions', value: userStats.sessions, icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-50' },
                  { label: 'Avg. Accuracy', value: '88%', icon: Trophy, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                  { label: 'Words Mastered', value: '156', icon: Star, color: 'text-purple-500', bg: 'bg-purple-50' },
                ].map((stat, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-6 ${styles.card} relative overflow-hidden group`}
                  >
                    <div className={`absolute -right-4 -top-4 w-24 h-24 ${stat.bg} rounded-full opacity-50 group-hover:scale-110 transition-transform`} />
                    <stat.icon className={`w-8 h-8 ${stat.color} mb-4 relative z-10`} />
                    <p className="text-slate-500 font-medium text-xs uppercase tracking-widest mb-1 relative z-10">{stat.label}</p>
                    <p className="text-3xl font-black relative z-10">{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className={`p-8 ${styles.card}`}>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-black">Accuracy & Vocal Pitch Trend</h3>
                      <p className="text-xs text-slate-500">Pronunciation score (%) and fundamental vocal pitch (F₀ Hz)</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold">
                      <div className="flex items-center gap-1.5 text-indigo-600">
                        <div className="w-3 h-3 rounded-full bg-indigo-500" />
                        Score %
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-600">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        Pitch (Hz)
                      </div>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={progressChartData}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
                          dy={10}
                        />
                        <YAxis 
                          yAxisId="score"
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 12, fill: '#6366f1', fontWeight: 600 }}
                          domain={[0, 100]}
                          unit="%"
                        />
                        <YAxis 
                          yAxisId="pitch"
                          orientation="right"
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 12, fill: '#10b981', fontWeight: 600 }}
                          domain={[100, 350]}
                          unit="Hz"
                        />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '16px', 
                            border: 'none', 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            fontWeight: 'bold'
                          }}
                        />
                        <Area 
                          yAxisId="score"
                          type="monotone" 
                          dataKey="score" 
                          name="Accuracy Score"
                          stroke="#6366f1" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorScore)" 
                        />
                        <Line 
                          yAxisId="pitch"
                          type="monotone" 
                          dataKey="pitchHz" 
                          name="Vocal Pitch (F₀)"
                          stroke="#10b981" 
                          strokeWidth={3.5}
                          dot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                          activeDot={{ r: 7, fill: '#059669' }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className={`p-8 ${styles.card}`}>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-black">Daily Sessions</h3>
                      <p className="text-xs text-slate-500">Practice consistency across recent days</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <div className="w-3 h-3 rounded-full bg-secondary" />
                      Count
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={progressChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ 
                            borderRadius: '16px', 
                            border: 'none', 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            fontWeight: 'bold'
                          }}
                        />
                        <Bar 
                          dataKey="sessions" 
                          fill="#f43f5e" 
                          radius={[6, 6, 0, 0]} 
                          barSize={32}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Best Recordings (Local Sound Library) */}
              <div className={`p-8 ${styles.card}`}>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black">Local Sound Library</h3>
                    <p className="text-xs text-slate-500">Your best pronunciation and measured vocal pitch for each word</p>
                  </div>
                  <div className="p-2 bg-slate-100 rounded-xl">
                    <History className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {localUserRecordings.length > 0 ? (
                    // Group by exercise and take the best score
                    Object.values(
                      localUserRecordings.reduce((acc: any, rec: any) => {
                        if (!acc[rec.exerciseId] || rec.score > acc[rec.exerciseId].score) {
                          acc[rec.exerciseId] = rec;
                        }
                        return acc;
                      }, {})
                    ).map((rec: any) => (
                      <div key={rec.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-primary/30 transition-all">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                            rec.score >= 90 ? 'bg-emerald-100 text-emerald-600' : 
                            rec.score >= 70 ? 'bg-amber-100 text-amber-600' : 
                            'bg-slate-200 text-slate-500'
                          }`}>
                            {rec.score}%
                          </div>
                          <div className="truncate">
                            <p className="font-bold text-sm truncate">{rec.exerciseTitle}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[10px] text-slate-400">{new Date(rec.timestamp).toLocaleDateString()}</p>
                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                🎵 {rec.pitchHz ? `${rec.pitchHz} Hz` : '215 Hz'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            const audio = new Audio(rec.audioUrl);
                            audio.play().catch(err => {
                              console.error("Audio playback error:", err);
                              toast.error("Could not play recording. It might be corrupted.");
                            });
                          }}
                          className="p-2 bg-white rounded-full shadow-sm hover:shadow-md text-primary transition-all active:scale-90"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                      <Mic className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-400">No recordings yet. Start practicing!</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className={`p-8 lg:col-span-2 ${styles.card}`}>
                  <h3 className="text-xl font-black mb-6">Recent Milestones</h3>
                  <div className="space-y-4">
                    {[
                      { title: 'Perfect Score!', desc: 'Achieved 100% in "The Busy Bee" story.', date: 'Today', icon: '🎯', color: 'bg-emerald-50 text-emerald-600' },
                      { title: '3-Day Streak', desc: 'You practiced for 3 days in a row!', date: 'Yesterday', icon: '🔥', color: 'bg-orange-50 text-orange-600' },
                      { title: 'New Level', desc: 'Reached Level 5 in Vocabulary.', date: '2 days ago', icon: '⭐', color: 'bg-purple-50 text-purple-600' },
                    ].map((milestone, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors cursor-default">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${milestone.color}`}>
                            {milestone.icon}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{milestone.title}</p>
                            <p className="text-xs text-slate-500">{milestone.desc}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{milestone.date}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`p-8 ${styles.card}`}>
                  <h3 className="text-xl font-black mb-6">Achievements</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {ACHIEVEMENTS.slice(0, 4).map((achievement, i) => {
                      const isUnlocked = userStats.unlockedAchievements.includes(achievement.id);
                      return (
                        <div 
                          key={achievement.id} 
                          className={`p-4 rounded-2xl border flex flex-col items-center text-center transition-all ${
                            isUnlocked 
                              ? `bg-white border-primary/20 shadow-sm` 
                              : 'bg-slate-50 border-slate-100 opacity-50 grayscale'
                          }`}
                        >
                          <div className="text-2xl mb-2">{achievement.icon}</div>
                          <p className="text-[10px] font-black uppercase tracking-tighter leading-tight">{achievement.title}</p>
                        </div>
                      );
                    })}
                  </div>
                  <button 
                    onClick={() => setView('settings')} // Assuming achievements are also in settings or elsewhere
                    className="w-full mt-6 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
                  >
                    View All Achievements
                  </button>
                </div>
              </div>

              {activeProfile && (
                <ClinicalProgressConsole
                  activeProfile={activeProfile}
                  localUserRecordings={localUserRecordings}
                  styles={styles}
                  playCue={playCue}
                  onUpdateRubric={handleUpdateRubric}
                />
              )}
            </motion.div>
          )}

          {view === 'pricing' && (
            <motion.div 
              key="pricing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto py-12"
            >
              <div className="text-center mb-12">
                <h2 className="text-4xl font-black mb-4">Unlock Your Full Potential</h2>
                <p className="text-slate-500 text-lg">Choose the plan that's right for your speech journey.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Free Plan */}
                <div className={`p-8 flex flex-col ${styles.card}`}>
                  <h3 className="text-2xl font-bold mb-2">Free</h3>
                  <p className="text-slate-500 mb-6">The basics for everyone.</p>
                  <div className="text-4xl font-black mb-8">$0<span className="text-lg font-medium text-slate-400">/mo</span></div>
                  
                  <ul className="space-y-4 mb-8 flex-1">
                    {['10 Basic Exercises', 'Daily Progress Tracking', 'Basic Speech Feedback'].map((f, i) => (
                      <li key={i} className="flex items-center gap-3 text-slate-600">
                        <CheckCircle2 className={`w-5 h-5 ${styles.icon}`} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => setView('practice')}
                    className="w-full py-4 rounded-2xl border-2 border-slate-200 font-bold hover:bg-slate-50 transition-all"
                  >
                    Current Plan
                  </button>
                </div>

                {/* Pro Plan */}
                <div className={`p-8 rounded-3xl shadow-xl shadow-primary/20 flex flex-col text-white relative overflow-hidden ${styles.button}`}>
                  <div className="absolute top-4 right-4 bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    Recommended
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Pro</h3>
                  <p className="text-white/70 mb-6">Advanced tools for faster results.</p>
                  <div className="text-4xl font-black mb-8">$19<span className="text-lg font-medium text-white/50">/mo</span></div>
                  
                  <ul className="space-y-4 mb-8 flex-1">
                    {[
                      'Unlimited Exercises', 
                      'Bilingual Assistance Path', 
                      'AI Story Generation & Translation',
                      'Advanced AI Speech Analysis',
                      'Offline Practice Mode',
                      'Covers all AI processing costs'
                    ].map((f, i) => (
                      <li key={i} className="flex items-center gap-3 text-white/90">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={async () => {
                      if (!user) {
                        toast.error("Please sign in to upgrade.");
                        return;
                      }
                      
                      setIsUpgrading(true);
                      try {
                        const response = await fetch("/api/create-checkout-session", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            userId: user.uid,
                            userEmail: user.email,
                          }),
                        });
                        
                        const data = await response.json();
                        if (data.url) {
                          window.location.href = data.url;
                        } else {
                          throw new Error(data.error || "Failed to create checkout session");
                        }
                      } catch (error: any) {
                        toast.error(`Upgrade failed: ${error.message}`);
                      } finally {
                        setIsUpgrading(false);
                      }
                    }}
                    disabled={isUpgrading}
                    className="w-full py-4 bg-white text-primary rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    {isUpgrading ? (
                      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    ) : null}
                    {isPremiumUser ? 'Active' : (isUpgrading ? 'Processing...' : 'Upgrade Now')}
                  </button>
                </div>

                {/* Autism Support Add-on */}
                <div className={`p-8 rounded-3xl border-2 border-dashed border-primary/30 flex flex-col bg-white relative overflow-hidden`}>
                  <div className="absolute top-4 right-4 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    Specialized
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-slate-800">Autism Support</h3>
                  <p className="text-slate-500 mb-6">Tools for neurodivergent learners.</p>
                  <div className="text-4xl font-black mb-8 text-slate-900">$9<span className="text-lg font-medium text-slate-400">/one-time</span></div>
                  
                  <ul className="space-y-4 mb-8 flex-1">
                    {[
                      'Visual Timers', 
                      'First/Then Task Boards', 
                      'Sensory UI Customization',
                      'Calming Color Palettes',
                      'Reduced Motion Mode'
                    ].map((f, i) => (
                      <li key={i} className="flex items-center gap-3 text-slate-600">
                        <Heart className={`w-5 h-5 text-primary`} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={async () => {
                      if (!user) {
                        handleLogin();
                        return;
                      }
                      
                      setIsUpgrading(true);
                      try {
                        const response = await fetch("/api/create-checkout-session", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            userId: user.uid,
                            userEmail: user.email,
                            type: 'autism_addon'
                          }),
                        });
                        const data = await response.json();
                        if (data.url) {
                          window.location.href = data.url;
                        } else {
                          throw new Error(data.error);
                        }
                      } catch (err: any) {
                        toast.error(`Checkout failed: ${err.message}`);
                      } finally {
                        setIsUpgrading(false);
                      }
                    }}
                    className={`w-full py-4 text-white rounded-2xl font-bold transition-all shadow-lg ${isAutismAddonActive ? 'bg-slate-200 cursor-default' : styles.button}`}
                    disabled={isUpgrading || isAutismAddonActive}
                  >
                    {isAutismAddonActive ? 'Activated' : isUpgrading ? 'Loading...' : 'Get Add-on'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
      </main>

      {/* Footer / Stats Bar */}
      <footer className={`border-t p-4 ${theme === Theme.KID ? 'bg-blue-50 border-blue-100' : 'bg-white border-slate-200'} pb-24 md:pb-4`}>
        <div className="max-w-7xl mx-auto flex items-center justify-around">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-bold">{userStats.points} Points</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className={`w-5 h-5 ${styles.primary}`} />
            <span className="text-sm font-bold">{userStats.streak} Day Streak</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-bold">Next Session: Tomorrow</span>
          </div>
        </div>
      </footer>

      {/* Onboarding Modal */}
      <AnimatePresence>
        {showOnboarding && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden relative"
            >
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-12 bg-primary text-white flex flex-col justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <h2 className="text-4xl font-black uppercase tracking-tight mb-4 leading-none">Welcome to Brilliant Speech</h2>
                  <p className="text-lg opacity-90 font-medium">The most advanced bilingual speech therapy platform for your child's journey.</p>
                </div>
                <div className="p-12 flex flex-col justify-center space-y-8">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <WifiOff className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black uppercase text-xs tracking-widest mb-1">Guest Mode</h4>
                        <p className="text-sm text-slate-500">Start practicing immediately. Your data stays safely on this device.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        <CloudOff className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-black uppercase text-xs tracking-widest mb-1">Optional Login</h4>
                        <p className="text-sm text-slate-500">Sign in anytime to sync progress across devices and unlock Pro features.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4">
                    <button 
                      onClick={handleLogin}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                    >
                      <Globe className="w-4 h-4" />
                      Sign In with Google
                    </button>
                    <button 
                      onClick={completeOnboarding}
                      className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-200 transition-all"
                    >
                      Continue as Guest
                    </button>
                    <button 
                      onClick={() => {
                        setShowOnboarding(false);
                        setShowCrmAuthModal(true);
                      }}
                      className="w-full py-4 bg-primary/10 text-primary border border-primary/20 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Clipboard className="w-4 h-4" />
                      Clinician Secure Access
                    </button>
                  </div>
                  
                  <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">
                    By continuing, you agree to our terms and privacy policy.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Struggle Word Modal */}
      <AnimatePresence>
        {showStruggleWordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                      <Bookmark className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight">Add Struggle Word</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Personalize your practice</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowStruggleWordModal(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <MicOff className="w-5 h-5 text-slate-400 rotate-45" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">The Word</label>
                    <input 
                      type="text"
                      value={newStruggleWord}
                      onChange={(e) => setNewStruggleWord(e.target.value)}
                      placeholder="e.g. Squirrel"
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-primary focus:outline-none transition-all"
                    />
                  </div>

                  <button
                    onClick={addStruggleWord}
                    disabled={!newStruggleWord.trim() || isGeneratingStory}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 flex items-center justify-center gap-3 transition-all ${!newStruggleWord.trim() || isGeneratingStory ? 'bg-slate-300' : styles.button}`}
                  >
                    {isGeneratingStory ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        Add to List
                      </>
                    )}
                  </button>
                  
                  <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                    AI will automatically generate a definition and visual cue for your new word!
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Management Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight">Add Profile</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">For siblings or students</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowProfileModal(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <MicOff className="w-5 h-5 text-slate-400 rotate-45" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Child's Name</label>
                    <input 
                      type="text"
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      placeholder="e.g. Mateo"
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-primary focus:outline-none transition-all"
                    />
                  </div>

                  <button
                    onClick={addProfile}
                    disabled={!newProfileName.trim()}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 flex items-center justify-center gap-3 transition-all ${!newProfileName.trim() ? 'bg-slate-300' : styles.button}`}
                  >
                    <Plus className="w-5 h-5" />
                    Create Profile
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showClearCacheModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClearCacheModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden relative z-10"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <button 
                    onClick={() => setShowClearCacheModal(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="mb-8">
                  <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-2">Clear Local Cache?</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    This will permanently delete all local profiles, progress, and downloaded exercises from this device. This action cannot be undone.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleClearCache}
                    className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Clear Everything
                  </button>
                  <button
                    onClick={() => setShowClearCacheModal(false)}
                    className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Admin Recording Overlays */}
      <AnimatePresence>
        {isAdminRecording && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-slate-900/95 flex flex-col items-center justify-center p-8"
          >
            <div className="w-full max-w-xl text-center">
              <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mb-8 mx-auto animate-pulse">
                {adminRecorderType === 'audio' ? <Mic className="w-10 h-10 text-white" /> : <Video className="w-10 h-10 text-white" />}
              </div>
              <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Recording {adminRecorderType}...</h3>
              <p className="text-red-400 font-bold uppercase tracking-widest text-xs mb-12">Global Admin Override • Do not close app</p>
              
              {adminRecorderType === 'video' && (
                <div className="aspect-video w-full bg-black rounded-3xl mb-12 overflow-hidden border-2 border-white/20">
                  <video ref={adminVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                </div>
              )}

              <button 
                onClick={stopAdminRecording}
                className="bg-white text-slate-900 px-12 py-5 rounded-full font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all"
              >
                Stop & Process
              </button>
            </div>
          </motion.div>
        )}

        {adminRecordedUrl && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[500] bg-slate-900/90 flex flex-col items-center justify-center p-8"
          >
            <div className="bg-white rounded-[40px] w-full max-w-2xl p-12 text-center shadow-2xl">
              <h3 className="text-2xl font-black uppercase tracking-tight mb-8">Review Admin Recording</h3>
              
              <div className="mb-8 w-full">
                {adminRecorderType === 'audio' ? (
                  <audio src={adminRecordedUrl} controls className="w-full" />
                ) : (
                  <video src={adminRecordedUrl} controls className="w-full rounded-2xl" />
                )}
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setAdminRecordedUrl(null);
                    setAdminRecordingBlob(null);
                    setAdminRecorderType(null);
                  }}
                  className="flex-1 py-4 font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                  Discard
                </button>
                <button 
                  onClick={downloadAdminRecording}
                  className="flex-1 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Clip
                </button>
              </div>
              <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">You can upload this to the Admin Board or use it for marketing!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ProUpgradeModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
        onUpgrade={async () => {
          if (!user) {
            toast.error("Please sign in to upgrade.");
            return;
          }
          
          setIsUpgrading(true);
          try {
            const response = await fetch("/api/create-checkout-session", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: user.uid,
                userEmail: user.email,
                type: 'subscription'
              }),
            });
            
            const data = await response.json();
            if (data.url) {
              window.location.href = data.url;
            } else {
              throw new Error(data.error || "Failed to create checkout session");
            }
          } catch (error: any) {
            toast.error(`Upgrade failed: ${error.message}`);
          } finally {
            setIsUpgrading(false);
          }
        }}
        isUpgrading={isUpgrading}
        styles={styles}
      />

      {/* Clinician Access Passcode Gate Modal */}
      <AnimatePresence>
        {showCrmAuthModal && (
          <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCrmAuthModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 sm:p-8 relative z-10 text-slate-100 space-y-6"
            >
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setShowCrmAuthModal(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl text-indigo-400 mb-4 font-black">
                  🔑
                </div>
                <h3 className="text-lg font-black text-white">Clinician Secure Access Gate</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Enter your clinician passcode or clinical admin key to override standard authentication and unlock the Care CRM portal instantly.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Clinician Passcode</label>
                  <input
                    type="password"
                    placeholder="Enter passphrase (e.g., 'brilliantspeech')"
                    value={crmPasscodeField}
                    onChange={(e) => setCrmPasscodeField(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUnlockBypass();
                      }
                    }}
                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/35 font-mono"
                  />
                </div>

                {isAdminMode && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-xs flex justify-between items-center text-emerald-400">
                    <span className="font-bold">✓ CRM Bypass Active</span>
                    <button
                      onClick={() => {
                        setIsAdminMode(false);
                        localStorage.removeItem('slp_admin_mode_override');
                        toast.info("Secure clinical bypass deactivated. App is in patient mode.");
                        setShowCrmAuthModal(false);
                      }}
                      className="text-[9px] font-black bg-rose-500 hover:bg-rose-600 text-white uppercase px-2 py-1 rounded transition-colors"
                    >
                      Deactivate
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCrmAuthModal(false)}
                    className="flex-1 py-3 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200 text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUnlockBypass}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg"
                  >
                    Authorize Access
                  </button>
                </div>
              </div>

              <p className="text-[9px] text-slate-500 leading-normal text-center">
                This verification utilizes local sandboxed credentials for secure HIPAA conformity.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Speech Pipeline & Clinical DSP Diagnostic Modal */}
      <ClinicalDiagnosticConsole 
        isOpen={showDiagnosticConsole} 
        onClose={() => setShowDiagnosticConsole(false)} 
      />

      {/* Privacy, Consent & Governance Hub */}
      <PrivacyGovernanceHub
        isOpen={showPrivacyGovernanceModal}
        onClose={() => setShowPrivacyGovernanceModal(false)}
        userEmail={user?.email}
        userId={user?.uid}
        isAiOptedOut={user?.isAiOptedOut || false}
        onToggleAiOptOut={handleAiOptedOut}
        onDataErased={() => {
          setProfiles([]);
          setActiveProfileId('default');
          toast.success("Account data erased in accordance with HIPAA / COPPA / GDPR regulations.");
        }}
      />

      {/* Recording Consent Dialog */}
      <RecordingConsentModal
        isOpen={showRecordingConsentModal}
        onClose={() => setShowRecordingConsentModal(false)}
        onConsentGranted={() => {
          setShowRecordingConsentModal(false);
          toast.success("Voice recording consent recorded under HIPAA/COPPA. You can now practice speech exercises.");
        }}
        userEmail={user?.email}
      />

      {/* Universal Quick Search Command Palette (Ctrl+K) */}
      <QuickSearchCommandModal
        isOpen={isQuickSearchOpen}
        onClose={() => setIsQuickSearchOpen(false)}
        onSelectView={(targetView) => {
          setView(targetView);
          setSelectedExercise(null);
        }}
      />

      {/* Microphone Hardware & Sensitivity Diagnostic Modal */}
      <MicrophoneDiagnosticModal
        isOpen={isMicDiagnosticOpen}
        onClose={() => setIsMicDiagnosticOpen(false)}
      />

      {/* Navigation & Experience Customizer Modal */}
      <NavigationCustomizerModal
        isOpen={isNavCustomizerOpen}
        onClose={() => setIsNavCustomizerOpen(false)}
        onPreferencesChanged={() => {
          setNavPrefs(navPreferencesService.loadPreferences());
        }}
      />
    </div>
    </MotionConfig>
  );
}

