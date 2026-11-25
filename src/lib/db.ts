import Dexie, { type Table } from 'dexie';

/**
 * ============================================================================
 * 1. NORMALIZED DATA MODEL TYPES
 * ============================================================================
 */

export type SyncStatus = 'synced' | 'pending' | 'failed';

/**
 * User account representation (offline-first with master sync metadata)
 */
export interface LocalUser {
  id: string; // Master key (e.g., Firebase Auth UID)
  email: string;
  displayName: string;
  photoURL?: string;
  isPremium: boolean;
  isSubscriptionActive: boolean;
  subscriptionTier: 'free' | 'monthly_unlimited';
  aiCredits: number;
  isAiOptedOut: boolean;
  createdAt: number; // UTC timestamp (ms)
  updatedAt: number; // UTC timestamp (ms)
  syncStatus: SyncStatus;
}

/**
 * Profile preferences & sensory options configuration
 */
export interface LocalSettings {
  id: string; // 'global' or 'user-specific'
  userId: string; // Foreign key relation to LocalUser
  privacyMode: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  calmingColors: boolean;
  fontScale: number; // e.g., 1.0 (default), 1.2, 1.5, etc.
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  volume: number; // audio playback scale 0.0 to 1.0
  vocalSensitivity: number; // multiplier/divisor for vocal meter triggers
  language: 'en' | 'es';
  hapticsEnabled: boolean;
  soundEnabled: boolean;
  updatedAt: number;
  syncStatus: SyncStatus;
}

/**
 * Unified patient record representation for pediatric speech therapy tracking
 */
export interface LocalPatient {
  id: string; // Maps to ChildProfile id
  clinicianId?: string; // Optional foreign key link to LocalClinician
  name: string;
  avatar: string;
  dateOfBirth?: string; // YYYY-MM-DD
  diagnoses: string[]; // e.g., ['ASD', 'Apraxia of Speech']
  notes: string; // Narrative history and clinical assessments
  active: boolean;
  points: number;
  streak: number;
  sessionsCount: number;
  createdAt: number;
  updatedAt: number;
  syncStatus: SyncStatus;
}

/**
 * Clinician profile for teletherapy, supervision, and homework delegation
 */
export interface LocalClinician {
  id: string; // Unique primary identifier
  email: string;
  displayName: string;
  clinicName: string;
  licenseNumber: string;
  createdAt: number;
  updatedAt: number;
  syncStatus: SyncStatus;
}

/**
 * Detailed homework delegation assignments created by Clinicians
 */
export interface LocalHomeworkAssignment {
  id: string;
  patientId: string; // Foreign key referencing LocalPatient
  clinicianId: string; // Foreign key referencing LocalClinician
  exerciseIds: string[]; // List of assigned exercise identifiers
  assignedDate: number;
  dueDate: number;
  status: 'assigned' | 'in_progress' | 'completed' | 'graded';
  therapistFeedback?: string;
  completionDate?: number;
  updatedAt: number;
  syncStatus: SyncStatus;
}

/**
 * TherapySession encapsulates high-level session-based logging and tracking analytics
 */
export interface LocalTherapySession {
  id: string;
  patientId: string; // Foreign key referencing LocalPatient
  clinicianId?: string; // Optional foreign key referencing LocalClinician
  exerciseId: string;
  timestamp: number; // Start time UTC ms
  durationSeconds: number;
  score: number;
  notes?: string;
  accuracy: number; // 0 to 100 metric calculated for the session
  fluency: number; // 0 to 100 metric calculated for the session
  independence: number; // 1 to 5 prompt level index
  promptLevel: 'maximal' | 'moderate' | 'minimal' | 'none';
  syncStatus: SyncStatus;
}

/**
 * SpeechAttempt logs individual verbal trials, providing high-resolution metrics
 */
export interface LocalSpeechAttempt {
  id: string; // Unique GUID
  patientId: string; // Foreign key referencing LocalPatient
  exerciseId: string; // ID of the Speech Exercise
  timestamp: number;
  textAttempted: string; // Target pronunciation phrase
  recognizedText: string; // Speech-to-text transcription output
  accuracyScore: number; // 0 to 100 percent
  fluencyScore: number; // 0 to 100 percent
  pronunciationScore: number; // 0 to 100 percent
  audioBlobId?: string; // References offline blob database or local storage key
  durationMs: number;
  syncStatus: SyncStatus;
}

/**
 * High-frequency pitch and vocal resonance samples for real-time spectrograph analysis
 */
export interface LocalPitchSample {
  id: string; // GUID
  attemptId: string; // Foreign key referencing LocalSpeechAttempt
  frequencies: number[]; // Array of detected fundamentals (F0) in Hz
  timestamps: number[]; // Milisecond offset arrays corresponding to frequency bins
  decibelLevels: number[]; // DB levels array
  averagePitch: number;
  maxPitch: number;
  minPitch: number;
}

/**
 * Folder structure for organizing Picture Exchange Communication (PECS) assets
 */
export interface LocalFolder {
  id: string;
  patientId: string; // Foreign key referencing LocalPatient
  name: string;
  color: string; // Hex representation
  icon: string; // Lucide icon reference
  sortOrder: number;
  syncStatus: SyncStatus;
}

/**
 * PECSCard represents individual AAC communication panels (labeled and bilingual)
 */
export interface LocalPECSCard {
  id: string;
  folderId?: string; // Optional foreign key referencing LocalFolder
  labelEn: string;
  labelEs: string;
  imageUrl: string; // Local storage path or Cloud Storage secure link
  voiceAudioUrlEn?: string;
  voiceAudioUrlEs?: string;
  category: 'actions' | 'objects' | 'feelings' | 'social' | 'custom';
  createdBy: string; // User or Clinician ID
  isCustom: boolean;
  sortOrder: number;
  syncStatus: SyncStatus;
}

/**
 * FavoritePhrase tracks popular speech construction paths for swift AAC reuse
 */
export interface LocalFavoritePhrase {
  id: string;
  patientId: string; // Foreign key referencing LocalPatient
  textEn: string;
  textEs: string;
  cardIds: string[]; // Ordered list of LocalPECSCard IDs forming the phrase
  usageCount: number;
  lastUsed: number;
  syncStatus: SyncStatus;
}

/**
 * Reward represents point balances, virtual stickers, and child reward milestones
 */
export interface LocalReward {
  id: string;
  patientId: string; // Foreign key referencing LocalPatient
  title: string;
  type: 'points' | 'cosmetic' | 'unlocked_feature';
  cost: number;
  isRedeemed: boolean;
  unlockedAt: number;
  syncStatus: SyncStatus;
}

/**
 * Badge logs achieved milestones and trophies
 */
export interface LocalBadge {
  id: string;
  patientId: string; // Foreign key referencing LocalPatient
  title: string;
  description: string;
  icon: string; // Emoji or Lucide icon string
  unlockedAt: number;
  requirementType: 'points' | 'streak' | 'sessions' | 'score';
  requirementValue: number;
  syncStatus: SyncStatus;
}

/**
 * Serialized operational sync queues for offline transactions
 */
export interface LocalSyncQueue {
  id?: number; // Auto-incrementing local primary key
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  collection: string; // Target Firestore collection (e.g. 'users', 'patients', 'therapy_sessions')
  documentId: string;
  payload: any; // Serialized document payload
  timestamp: number;
  retryCount: number;
}

/**
 * ============================================================================
 * 2. LEGACY / COMPATIBILITY INTERFACES
 * ============================================================================
 */

export interface LocalRecording {
  id?: number;
  exerciseId: string;
  type: 'target' | 'user'; 
  audioBlob: Blob;
  timestamp: number;
  score?: number;
  exerciseTitle: string;
  profileId: string;
  pitchHz?: number; // Fundamental vocal frequency (F0) in Hz from acousticStatsRef
  metrics?: {
    accuracy: number;
    fluency: number;
    pronunciation: number;
    feedback: string;
    pitchHz?: number;
  };
  assessmentRubric?: {
    accuracy: number;
    fluency: number;
    independence: number;
    promptLevel: string;
    notes?: string;
    intelligibility?: {
      familiar: number;
      unfamiliar: number;
    };
    responseTimeMs?: number;
    pitchHz?: number;
  };
  responseTimeMs?: number;
}

export interface LocalProfile {
  id: string;
  name: string;
  avatar: string;
  language: 'en' | 'es';
  points: number;
  streak: number;
  lastActive: number;
  isPro: boolean;
  cloudSyncEnabled: boolean;
}

export interface LocalStruggleWord {
  id: string;
  profileId: string;
  word: string;
  definition: string;
  imageUrl?: string;
  mastered: boolean;
  timestamp: number;
}

/**
 * ============================================================================
 * 3. DEXIE INDEXEDDB APP DATABASE DEFINITION
 * ============================================================================
 */

export class AppDatabase extends Dexie {
  // Primary Active Tables
  users!: Table<LocalUser, string>;
  settings!: Table<LocalSettings, string>;
  patients!: Table<LocalPatient, string>;
  clinicians!: Table<LocalClinician, string>;
  homeworkAssignments!: Table<LocalHomeworkAssignment, string>;
  therapySessions!: Table<LocalTherapySession, string>;
  speechAttempts!: Table<LocalSpeechAttempt, string>;
  pitchSamples!: Table<LocalPitchSample, string>;
  folders!: Table<LocalFolder, string>;
  pecsCards!: Table<LocalPECSCard, string>;
  favoritePhrases!: Table<LocalFavoritePhrase, string>;
  rewards!: Table<LocalReward, string>;
  badges!: Table<LocalBadge, string>;
  syncQueue!: Table<LocalSyncQueue, number>;

  // Legacy / Companion Tables (retained for backward compatibility with App.tsx)
  recordings!: Table<LocalRecording, number>;
  profiles!: Table<LocalProfile, string>;
  struggleWords!: Table<LocalStruggleWord, string>;

  constructor() {
    // Database schema name initialized to SpeechAppDB_v2 to handle migration
    super('SpeechAppDB_v2');

    this.version(1).stores({
      recordings: '++id, exerciseId, type, profileId, timestamp',
      profiles: 'id, name, isPro',
      struggleWords: 'id, profileId, word, mastered',
      settings: 'id'
    });

    // Version 2: Integrated comprehensive and normalized clinical and AAC tables
    this.version(2).stores({
      // Retained legacy stores with correct mappings
      recordings: '++id, exerciseId, type, profileId, timestamp',
      profiles: 'id, name, isPro',
      struggleWords: 'id, profileId, word, mastered',
      
      // Normalized user, clinician, and sensory parameters
      users: 'id, email, subscriptionTier',
      settings: 'id, userId, language',
      patients: 'id, clinicianId, active, streak',
      clinicians: 'id, email',
      homeworkAssignments: 'id, patientId, clinicianId, status, dueDate',
      
      // Analytics, sessions and speech attempt structures
      therapySessions: 'id, patientId, clinicianId, timestamp, score',
      speechAttempts: 'id, patientId, exerciseId, timestamp, accuracyScore',
      pitchSamples: 'id, attemptId',
      
      // Augmented AAC (PECS) Communication engine structures
      folders: 'id, patientId, sortOrder',
      pecsCards: 'id, folderId, category, isCustom, sortOrder',
      favoritePhrases: 'id, patientId, lastUsed',
      
      // Achievement and child reward balances
      rewards: 'id, patientId, type, isRedeemed',
      badges: 'id, patientId, requirementType',
      
      // Local sync coordinator tables
      syncQueue: '++id, operation, collection, documentId, timestamp'
    });
  }
}

export const localDb = new AppDatabase();
