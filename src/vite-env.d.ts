/// <reference types="vite/client" />

interface ElectronAPI {
  saveFile: (filename: string, content: string) => Promise<boolean>;
  vaultSetup: (password: string) => Promise<{ salt: string; verificationHash: string }>;
  vaultUnlock: (password: string, salt: string, verificationHash: string) => Promise<boolean>;
  vaultLock: () => Promise<void>;
  vaultEncrypt: (plaintext: string) => Promise<{ encrypted: string; iv: string; authTag: string }>;
  vaultDecrypt: (encrypted: string, iv: string, authTag: string) => Promise<string>;
  vaultIsUnlocked: () => Promise<boolean>;
  vaultChangePassword: (oldPw: string, newPw: string, salt: string, hash: string) => Promise<{ salt: string; verificationHash: string }>;
  vaultPing: () => Promise<void>;
  onVaultAutoLocked: (callback: () => void) => () => void;
  removeVaultAutoLockedListeners: () => void;
}

declare interface Window {
  electronAPI: ElectronAPI
}
