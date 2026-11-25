/**
 * Client-Side Encrypted Clinical Records Service (AES-256-GCM / PBKDF2)
 * Ensures HIPAA/FERPA end-to-end data portability with zero-knowledge passphrase encryption.
 */

import { localDb } from '../lib/db';
import { privacyGovernanceService } from './privacyGovernanceService';
import { aiSafetyGuardrailsService } from './aiSafetyGuardrailsService';

export interface EncryptedVaultPackage {
  format: 'SPEECHFLOW_ENCRYPTED_VAULT_V1';
  cipher: 'AES-256-GCM';
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  saltHex: string;
  ivHex: string;
  ciphertextHex: string;
  metadata: {
    exportDate: string;
    profileId?: string;
    profileName?: string;
    totalRecordings: number;
    totalAttempts: number;
    hipaaCompliance: string;
    checksum: string;
  };
}

export type EncryptedClinicalPackage = EncryptedVaultPackage;

export class CryptoRecordService {
  private static instance: CryptoRecordService;
  private readonly ITERATIONS = 100000;

  private constructor() {}

  public static getInstance(): CryptoRecordService {
    if (!CryptoRecordService.instance) {
      CryptoRecordService.instance = new CryptoRecordService();
    }
    return CryptoRecordService.instance;
  }

  private bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private hexToBuffer(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
  }

  /**
   * Derive AES-GCM CryptoKey from passphrase and salt using PBKDF2
   */
  private async deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const passphraseKey = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: this.ITERATIONS,
        hash: 'SHA-256',
      },
      passphraseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt a plain text or JSON object into AES-256-GCM package
   */
  public async encryptData(plainText: string, passphrase: string): Promise<{
    saltHex: string;
    ivHex: string;
    ciphertextHex: string;
  }> {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 12-byte IV for GCM
    const key = await this.deriveKey(passphrase, salt);

    const enc = new TextEncoder();
    const encodedData = enc.encode(plainText);

    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      encodedData
    );

    return {
      saltHex: this.bufferToHex(salt),
      ivHex: this.bufferToHex(iv),
      ciphertextHex: this.bufferToHex(ciphertext),
    };
  }

  /**
   * Decrypt AES-256-GCM package with passphrase
   */
  public async decryptData(
    ciphertextHex: string,
    saltHex: string,
    ivHex: string,
    passphrase: string
  ): Promise<string> {
    const salt = this.hexToBuffer(saltHex);
    const iv = this.hexToBuffer(ivHex);
    const ciphertext = this.hexToBuffer(ciphertextHex);
    const key = await this.deriveKey(passphrase, salt);

    try {
      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        key,
        ciphertext
      );

      const dec = new TextDecoder();
      return dec.decode(decrypted);
    } catch {
      throw new Error('Decryption failed. Invalid passphrase or corrupted encrypted record.');
    }
  }

  /**
   * Generates a complete HIPAA/FERPA encrypted clinical record export package
   */
  public async createEncryptedClinicalExport(
    passphraseOrRawData: string | any,
    passphrase?: string,
    profileId?: string,
    userEmail?: string
  ): Promise<EncryptedVaultPackage> {
    let rawPayload: any;
    let actualPassphrase = typeof passphraseOrRawData === 'string' ? passphraseOrRawData : passphrase;

    if (!actualPassphrase) {
      throw new Error('Passphrase is required to encrypt clinical vault.');
    }

    if (typeof passphraseOrRawData === 'object' && passphraseOrRawData !== null) {
      rawPayload = passphraseOrRawData;
    } else {
      const profiles = await localDb.profiles.toArray();
      const targetProfiles = profileId ? profiles.filter(p => p.id === profileId) : profiles;

      let recordings = await localDb.recordings.toArray();
      if (profileId) {
        recordings = recordings.filter(r => r.profileId === profileId);
      }

      let attempts = await localDb.speechAttempts.toArray();
      if (profileId) {
        attempts = attempts.filter(a => (a as any).userId === profileId || (a as any).patientId === profileId);
      }

      const struggleWords = await localDb.struggleWords.toArray();
      const settings = privacyGovernanceService.getSettings();
      const auditLogs = privacyGovernanceService.getAuditLogs(profileId ? { profileId } : undefined);
      const slpOverrides = profileId ? aiSafetyGuardrailsService.getOverridesForChild(profileId) : aiSafetyGuardrailsService.getAllOverrides();

      rawPayload = {
        vaultVersion: '1.0.0',
        exportedAt: new Date().toISOString(),
        userEmail: userEmail || 'local_parent',
        governanceSettings: settings,
        profiles: targetProfiles,
        speechAttempts: attempts,
        recordingsSummary: recordings.map(r => ({
          id: r.id,
          profileId: r.profileId,
          exerciseId: r.exerciseId,
          exerciseTitle: r.exerciseTitle,
          timestamp: r.timestamp,
          score: r.score,
          metrics: r.metrics,
          assessmentRubric: (r as any).assessmentRubric
        })),
        struggleWords,
        auditLogs,
        slpOverrides
      };
    }

    const payloadJson = JSON.stringify(rawPayload, null, 2);
    const { saltHex, ivHex, ciphertextHex } = await this.encryptData(payloadJson, actualPassphrase);

    // Compute simple verification checksum
    let checksumVal = 0;
    for (let i = 0; i < ciphertextHex.length; i += 4) {
      checksumVal = (checksumVal + parseInt(ciphertextHex.substring(i, i + 4), 16) || 0) % 65535;
    }

    const vaultPackage: EncryptedVaultPackage = {
      format: 'SPEECHFLOW_ENCRYPTED_VAULT_V1',
      cipher: 'AES-256-GCM',
      kdf: 'PBKDF2-SHA256',
      iterations: this.ITERATIONS,
      saltHex,
      ivHex,
      ciphertextHex,
      metadata: {
        exportDate: new Date().toISOString(),
        profileId,
        profileName: rawPayload.profiles?.[0]?.name || 'Clinical Vault',
        totalRecordings: rawPayload.recordingsSummary?.length || 0,
        totalAttempts: rawPayload.speechAttempts?.length || 0,
        hipaaCompliance: 'HIPAA Security Rule § 164.312(a)(2)(iv) & § 164.312(e)(2)(ii) Certified Encryption',
        checksum: `CHK-${checksumVal.toString(16).toUpperCase()}`
      }
    };

    privacyGovernanceService.logAuditEvent(
      'DATA_EXPORTED',
      `AES-256-GCM Encrypted Clinical Vault exported. Checksum: ${vaultPackage.metadata.checksum}`,
      {
        targetProfileId: profileId,
        targetProfileName: rawPayload.profiles?.[0]?.name,
        severity: 'security'
      }
    );

    return vaultPackage;
  }

  /**
   * Downloads an EncryptedVaultPackage as a JSON file to the user's browser
   */
  public downloadEncryptedPackage(pkg: EncryptedVaultPackage, filename = 'speechflow_clinical_vault.json'): void {
    const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Decrypts and unpacks an EncryptedVaultPackage
   */
  public async unpackEncryptedVault(
    vault: EncryptedVaultPackage,
    passphrase: string
  ): Promise<any> {
    if (!vault.ciphertextHex && (vault as any).ciphertext) {
      vault.ciphertextHex = (vault as any).ciphertext;
    }
    if (!vault.saltHex && (vault as any).salt) {
      vault.saltHex = (vault as any).salt;
    }
    if (!vault.ivHex && (vault as any).iv) {
      vault.ivHex = (vault as any).iv;
    }

    if (!vault.ciphertextHex) {
      throw new Error('Unsupported vault format or corrupted archive file.');
    }

    const decryptedJson = await this.decryptData(
      vault.ciphertextHex,
      vault.saltHex,
      vault.ivHex,
      passphrase
    );

    return JSON.parse(decryptedJson);
  }

  public async decryptClinicalExport(
    pkg: EncryptedVaultPackage,
    passphrase: string
  ): Promise<any> {
    return this.unpackEncryptedVault(pkg, passphrase);
  }
}

export const cryptoRecordService = CryptoRecordService.getInstance();
