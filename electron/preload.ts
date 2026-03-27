import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (filename: string, content: string): Promise<boolean> => {
    return ipcRenderer.invoke('save-file', filename, content)
  },
  vaultSetup: (password: string) => ipcRenderer.invoke('vault:setup', password),
  vaultUnlock: (password: string, salt: string, verificationHash: string) => ipcRenderer.invoke('vault:unlock', password, salt, verificationHash),
  vaultLock: () => ipcRenderer.invoke('vault:lock'),
  vaultEncrypt: (plaintext: string) => ipcRenderer.invoke('vault:encrypt', plaintext),
  vaultDecrypt: (encrypted: string, iv: string, authTag: string) => ipcRenderer.invoke('vault:decrypt', encrypted, iv, authTag),
  vaultIsUnlocked: () => ipcRenderer.invoke('vault:is-unlocked'),
  vaultChangePassword: (oldPw: string, newPw: string, salt: string, hash: string) => ipcRenderer.invoke('vault:change-password', oldPw, newPw, salt, hash),
  vaultPing: () => ipcRenderer.invoke('vault:ping'),
  onVaultAutoLocked: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('vault:auto-locked', handler);
    return () => { ipcRenderer.removeListener('vault:auto-locked', handler); };
  },
  removeVaultAutoLockedListeners: () => {
    ipcRenderer.removeAllListeners('vault:auto-locked');
  },
})
