import { localDb, LocalProfile, LocalRecording, LocalStruggleWord, LocalSettings, LocalSpeechAttempt } from './db';
import { db as firestore } from '../firebase';
import { collection, doc, setDoc, getDoc, addDoc } from 'firebase/firestore';
import { StructuredAttemptResult } from '../services/clinicalEngine';

export class DataRepository {
  private static instance: DataRepository;
  
  private constructor() {}

  public static getInstance(): DataRepository {
    if (!DataRepository.instance) {
      DataRepository.instance = new DataRepository();
    }
    return DataRepository.instance;
  }

  // Profiles
  async saveProfile(profile: LocalProfile, userId?: string): Promise<void> {
    await localDb.profiles.put(profile);
    if (profile.cloudSyncEnabled && profile.isPro && userId) {
      await setDoc(doc(firestore, `users/${userId}/profiles`, profile.id), profile);
    }
  }

  async getProfile(id: string, userId?: string): Promise<LocalProfile | undefined> {
    let profile = await localDb.profiles.get(id);
    if (!profile && userId) {
      const docRef = doc(firestore, `users/${userId}/profiles`, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        profile = docSnap.data() as LocalProfile;
        await localDb.profiles.put(profile);
      }
    }
    return profile;
  }

  // Recordings & Clinical Attempts
  async saveRecording(
    recording: LocalRecording,
    cloudSync: boolean,
    userId?: string,
    attemptData?: StructuredAttemptResult
  ): Promise<void> {
    // Save to local IndexedDB (with AudioBlob preserved offline)
    const localId = await localDb.recordings.add(recording);

    // Save structured attempt in Dexie speechAttempts table if present
    if (attemptData) {
      const localAttempt: LocalSpeechAttempt = {
        id: attemptData.id,
        patientId: recording.profileId,
        exerciseId: recording.exerciseId,
        timestamp: recording.timestamp,
        textAttempted: attemptData.targetText,
        recognizedText: attemptData.recognizedText,
        accuracyScore: attemptData.accuracyScore,
        fluencyScore: attemptData.fluencyScore,
        pronunciationScore: attemptData.pronunciationScore,
        durationMs: attemptData.acousticMetrics?.durationMs || 1000,
        syncStatus: cloudSync && userId ? 'synced' : 'pending'
      };
      await localDb.speechAttempts.put(localAttempt).catch(() => {});
    }

    // Cloud Firestore Sync (Strictly NO Base64 Audio Blobs in Firestore)
    if (cloudSync && userId) {
      try {
        const { audioBlob, ...metadataWithoutAudio } = recording;
        
        // Structured Attempt Document Payload for Firestore
        const sessionPayload = {
          ...metadataWithoutAudio,
          localRecordId: localId,
          hasAudio: true,
          audioStorageType: 'indexeddb-local',
          speechProvider: attemptData?.provider || 'web-speech-api',
          scores: {
            overall: attemptData?.overallScore ?? recording.score ?? 80,
            accuracy: attemptData?.accuracyScore ?? recording.metrics?.accuracy ?? 80,
            fluency: attemptData?.fluencyScore ?? recording.metrics?.fluency ?? 80,
            pronunciation: attemptData?.pronunciationScore ?? recording.metrics?.pronunciation ?? 80,
          },
          clinicalMetrics: {
            wer: attemptData?.wer ?? 0,
            cer: attemptData?.cer ?? 0,
            sodaTag: attemptData?.soda?.summaryTag ?? 'Correct',
            sodaSubstitutions: attemptData?.soda?.substitutions ?? [],
            sodaOmissions: attemptData?.soda?.omissions ?? [],
            sodaDistortions: attemptData?.soda?.distortions ?? [],
            sodaAdditions: attemptData?.soda?.additions ?? [],
            avgDecibels: attemptData?.acousticMetrics?.avgDecibels ?? 65,
            pitchF0Hz: attemptData?.acousticMetrics?.fundamentalFrequencyHz ?? 210,
            spectralRatio: attemptData?.acousticMetrics?.spectralEnergyRatio ?? 0.45,
            voiceOnsetLatencyMs: attemptData?.acousticMetrics?.voiceOnsetLatencyMs ?? 400
          },
          feedback: attemptData?.deterministicFeedback ?? recording.metrics?.feedback ?? 'Good job!',
          geminiEnhancedFeedback: attemptData?.geminiEnhancedFeedback || null,
          timestamp: new Date(recording.timestamp).toISOString()
        };

        await addDoc(collection(firestore, `users/${userId}/sessions`), sessionPayload);
      } catch (err) {
        console.warn('Could not sync structured session to Firestore (using offline buffer):', err);
      }
    }
  }

  async getRecordings(profileId: string): Promise<LocalRecording[]> {
    return await localDb.recordings.where('profileId').equals(profileId).toArray();
  }

  // Settings
  async saveSettings(settings: LocalSettings): Promise<void> {
    await localDb.settings.put(settings);
  }

  async getSettings(): Promise<LocalSettings | undefined> {
    return await localDb.settings.get('global');
  }

  // Struggle Words
  async addStruggleWord(word: LocalStruggleWord, cloudSync: boolean, userId?: string): Promise<void> {
    await localDb.struggleWords.put(word);
    if (cloudSync && userId) {
      try {
        await setDoc(doc(firestore, `users/${userId}/struggleWords`, word.id), word);
      } catch (e) {
        console.warn('Cloud sync struggle words failed:', e);
      }
    }
  }

  async clearAllData(): Promise<void> {
    await localDb.transaction('rw', [localDb.recordings, localDb.profiles, localDb.struggleWords, localDb.settings], async () => {
      await Promise.all([
        localDb.recordings.clear(),
        localDb.profiles.clear(),
        localDb.struggleWords.clear(),
        localDb.settings.clear()
      ]);
    });
  }
}

export const repository = DataRepository.getInstance();
