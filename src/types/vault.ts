import { Timestamp } from 'firebase/firestore';

export type VaultEntryType = 'credential' | 'env-file';

export interface EncryptedField {
  encrypted: string;  // base64
  iv: string;         // base64
  authTag: string;    // base64
}

export interface VaultConfig {
  id: string;
  userId: string;
  salt: string;
  verificationHash: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface VaultCredential {
  id: string;
  userId: string;
  type: 'credential';
  name: string;
  url: string;
  username: string;
  encryptedPassword: string;
  iv: string;
  authTag: string;
  tags: string[];
  notes: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface VaultFile {
  id: string;
  userId: string;
  type: 'env-file';
  name: string;
  description: string;
  encryptedContent: string;
  iv: string;
  authTag: string;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type VaultEntry = VaultCredential | VaultFile;
