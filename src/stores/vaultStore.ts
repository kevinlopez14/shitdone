import { create } from 'zustand';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db, getCurrentUserId } from '../lib/firebase';
import { generateId } from '../lib/utils';
import type {
  VaultConfig,
  VaultCredential,
  VaultFile,
  VaultEntry,
  VaultEntryType,
} from '../types/vault';

interface VaultState {
  entries: Record<string, VaultEntry>;
  config: VaultConfig | null;
  isUnlocked: boolean;
  isSetup: boolean;
  loading: boolean;
  searchQuery: string;
  typeFilter: VaultEntryType | null;

  // Init
  checkSetup: () => Promise<void>;

  // Auth
  setup: (password: string) => Promise<void>;
  unlock: (password: string) => Promise<boolean>;
  lock: () => Promise<void>;

  // CRUD
  fetchEntries: () => Promise<void>;
  createCredential: (data: {
    name: string;
    url: string;
    username: string;
    password: string;
    tags: string[];
    notes: string;
  }) => Promise<void>;
  createFile: (data: {
    name: string;
    description: string;
    content: string;
    tags: string[];
  }) => Promise<void>;
  updateCredential: (
    id: string,
    data: {
      name?: string;
      url?: string;
      username?: string;
      password?: string;
      tags?: string[];
      notes?: string;
    },
  ) => Promise<void>;
  updateFile: (
    id: string,
    data: {
      name?: string;
      description?: string;
      content?: string;
      tags?: string[];
    },
  ) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;

  // Decrypt (returns plaintext, NEVER stored in state)
  decryptField: (encrypted: string, iv: string, authTag: string) => Promise<string>;

  // Filters
  setSearchQuery: (q: string) => void;
  setTypeFilter: (type: VaultEntryType | null) => void;
}

export const useVaultStore = create<VaultState>()((set, get) => ({
  entries: {},
  config: null,
  isUnlocked: false,
  isSetup: false,
  loading: false,
  searchQuery: '',
  typeFilter: null,

  checkSetup: async () => {
    const userId = getCurrentUserId();
    const q = query(collection(db, 'vaultConfig'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      const config = { ...docSnap.data(), id: docSnap.id } as VaultConfig;
      set({ config, isSetup: true });
    } else {
      set({ isSetup: false });
    }
  },

  setup: async (password) => {
    const userId = getCurrentUserId();
    const { salt, verificationHash } = await window.electronAPI.vaultSetup(password);
    const id = generateId();
    const now = Timestamp.now();
    const config: VaultConfig = {
      id,
      userId,
      salt,
      verificationHash,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, 'vaultConfig', id), config);
    set({ config, isSetup: true, isUnlocked: true });
    await get().fetchEntries();
  },

  unlock: async (password) => {
    const { config } = get();
    if (!config) return false;
    const success = await window.electronAPI.vaultUnlock(
      password,
      config.salt,
      config.verificationHash,
    );
    if (success) {
      set({ isUnlocked: true });
      await get().fetchEntries();
    }
    return success;
  },

  lock: async () => {
    await window.electronAPI.vaultLock();
    set({ isUnlocked: false });
  },

  fetchEntries: async () => {
    set({ loading: true });
    try {
      const q = query(collection(db, 'vaultEntries'));
      const snapshot = await getDocs(q);
      const entries: Record<string, VaultEntry> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as VaultEntry;
        entries[docSnap.id] = { ...data, id: docSnap.id };
      });
      set({ entries });
    } finally {
      set({ loading: false });
    }
  },

  createCredential: async (data) => {
    const userId = getCurrentUserId();
    const { encrypted, iv, authTag } = await window.electronAPI.vaultEncrypt(data.password);
    const id = generateId();
    const now = Timestamp.now();
    const credential: VaultCredential = {
      id,
      userId,
      type: 'credential',
      name: data.name,
      url: data.url,
      username: data.username,
      encryptedPassword: encrypted,
      iv,
      authTag,
      tags: data.tags,
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, 'vaultEntries', id), credential);
    set((state) => ({ entries: { ...state.entries, [id]: credential } }));
  },

  createFile: async (data) => {
    const userId = getCurrentUserId();
    const { encrypted, iv, authTag } = await window.electronAPI.vaultEncrypt(data.content);
    const id = generateId();
    const now = Timestamp.now();
    const file: VaultFile = {
      id,
      userId,
      type: 'env-file',
      name: data.name,
      description: data.description,
      encryptedContent: encrypted,
      iv,
      authTag,
      tags: data.tags,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, 'vaultEntries', id), file);
    set((state) => ({ entries: { ...state.entries, [id]: file } }));
  },

  updateCredential: async (id, data) => {
    const updatedFields: Partial<VaultCredential> & { updatedAt: Timestamp } = {
      updatedAt: Timestamp.now(),
    };

    if (data.name !== undefined) updatedFields.name = data.name;
    if (data.url !== undefined) updatedFields.url = data.url;
    if (data.username !== undefined) updatedFields.username = data.username;
    if (data.tags !== undefined) updatedFields.tags = data.tags;
    if (data.notes !== undefined) updatedFields.notes = data.notes;

    if (data.password !== undefined) {
      const { encrypted, iv, authTag } = await window.electronAPI.vaultEncrypt(data.password);
      updatedFields.encryptedPassword = encrypted;
      updatedFields.iv = iv;
      updatedFields.authTag = authTag;
    }

    await updateDoc(doc(db, 'vaultEntries', id), updatedFields);
    set((state) => ({
      entries: {
        ...state.entries,
        [id]: { ...state.entries[id], ...updatedFields } as VaultEntry,
      },
    }));
  },

  updateFile: async (id, data) => {
    const updatedFields: Partial<VaultFile> & { updatedAt: Timestamp } = {
      updatedAt: Timestamp.now(),
    };

    if (data.name !== undefined) updatedFields.name = data.name;
    if (data.description !== undefined) updatedFields.description = data.description;
    if (data.tags !== undefined) updatedFields.tags = data.tags;

    if (data.content !== undefined) {
      const { encrypted, iv, authTag } = await window.electronAPI.vaultEncrypt(data.content);
      updatedFields.encryptedContent = encrypted;
      updatedFields.iv = iv;
      updatedFields.authTag = authTag;
    }

    await updateDoc(doc(db, 'vaultEntries', id), updatedFields);
    set((state) => ({
      entries: {
        ...state.entries,
        [id]: { ...state.entries[id], ...updatedFields } as VaultEntry,
      },
    }));
  },

  deleteEntry: async (id) => {
    await deleteDoc(doc(db, 'vaultEntries', id));
    set((state) => {
      const { [id]: _removed, ...remainingEntries } = state.entries;
      return { entries: remainingEntries };
    });
  },

  decryptField: async (encrypted, iv, authTag) => {
    return await window.electronAPI.vaultDecrypt(encrypted, iv, authTag);
  },

  setSearchQuery: (q) => set({ searchQuery: q }),

  setTypeFilter: (type) => set({ typeFilter: type }),
}));
