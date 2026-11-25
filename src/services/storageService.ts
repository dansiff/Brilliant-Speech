import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export interface Profile {
  id: string;
  name: string;
  avatar?: string;
  xp: number;
  streak: number;
  lastActiveDate?: string;
  preferences?: {
    highContrast?: boolean;
    sensoryFriendlyMode?: boolean;
    voiceSensitivity?: number;
    volume?: number;
  };
}

class StorageService {
  private prefix = 'bilingual_brilliant_';

  /**
   * General string storage
   */
  public get(key: string): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.prefix + key);
  }

  public set(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.prefix + key, value);
  }

  public remove(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.prefix + key);
  }

  /**
   * General JSON storage
   */
  public getJSON<T>(key: string): T | null {
    const raw = this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  public setJSON<T>(key: string, value: T): void {
    this.set(key, JSON.stringify(value));
  }

  /**
   * Helper for loading profiles
   */
  public loadProfiles(): Profile[] {
    return this.getJSON<Profile[]>('profiles') || [];
  }

  public saveProfiles(profiles: Profile[]): void {
    this.setJSON<Profile[]>('profiles', profiles);
  }

  public getActiveProfileId(): string | null {
    return this.get('active_profile_id');
  }

  public setActiveProfileId(id: string): void {
    this.set('active_profile_id', id);
  }

  public hasSeenOnboarding(): boolean {
    return this.get('onboarding_seen') === 'true';
  }

  public setOnboardingSeen(seen = true): void {
    this.set('onboarding_seen', seen ? 'true' : 'false');
  }

  /**
   * Sync Profile to Cloud Firestore
   */
  public async syncProfileToCloud(profile: Profile): Promise<boolean> {
    try {
      const userDocRef = doc(db, 'profiles', profile.id);
      await setDoc(userDocRef, profile, { merge: true });
      return true;
    } catch (e) {
      console.warn('Could not sync profile to Firestore (using offline buffer):', e);
      return false;
    }
  }

  /**
   * Fetch Profile from Cloud Firestore
   */
  public async fetchProfileFromCloud(profileId: string): Promise<Profile | null> {
    try {
      const userDocRef = doc(db, 'profiles', profileId);
      const snapshot = await getDoc(userDocRef);
      if (snapshot.exists()) {
        return snapshot.data() as Profile;
      }
    } catch (e) {
      console.warn('Could not read profile from Firestore, using local cache:', e);
    }
    return null;
  }

  /**
   * Admin & Override checks
   */
  public isAdminOverride(): boolean {
    return this.get('admin_mode_override') === 'true';
  }

  public setAdminOverride(isAdmin: boolean): void {
    if (isAdmin) {
      this.set('admin_mode_override', 'true');
    } else {
      this.remove('admin_mode_override');
    }
  }
}

export const storageService = new StorageService();
export type { Profile as StorageProfile };
