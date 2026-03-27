import { create } from 'zustand';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db, getCurrentUserId } from '../lib/firebase';
import { generateId } from '../lib/utils';
import type { Organization } from '../types';

interface OrgState {
  organizations: Record<string, Organization>;
  loading: boolean;

  fetchOrgs: () => Promise<void>;
  createOrg: (name: string) => Promise<void>;
  updateOrg: (id: string, name: string) => Promise<void>;
  deleteOrg: (id: string) => Promise<void>;
}

export const useOrgStore = create<OrgState>()((set) => ({
  organizations: {},
  loading: false,

  fetchOrgs: async () => {
    set({ loading: true });
    try {
      const userId = getCurrentUserId();
      const q = query(
        collection(db, 'organizations'),
        where('userId', '==', userId),
      );
      const snapshot = await getDocs(q);
      const organizations: Record<string, Organization> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Organization;
        organizations[docSnap.id] = { ...data, id: docSnap.id };
      });
      set({ organizations });
    } finally {
      set({ loading: false });
    }
  },

  createOrg: async (name) => {
    const userId = getCurrentUserId();
    const id = generateId();
    const org: Organization = {
      id,
      userId,
      name,
      createdAt: Timestamp.now(),
    };
    await setDoc(doc(db, 'organizations', id), org);
    set((state) => ({
      organizations: { ...state.organizations, [id]: org },
    }));
  },

  updateOrg: async (id, name) => {
    await updateDoc(doc(db, 'organizations', id), { name });
    set((state) => ({
      organizations: {
        ...state.organizations,
        [id]: { ...state.organizations[id], name },
      },
    }));
  },

  deleteOrg: async (id) => {
    const userId = getCurrentUserId();
    const batch = writeBatch(db);

    // Delete the organization
    batch.delete(doc(db, 'organizations', id));

    // Set organizationId to null for all tasks referencing this org
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('userId', '==', userId),
      where('organizationId', '==', id),
    );
    const tasksSnapshot = await getDocs(tasksQuery);
    tasksSnapshot.forEach((docSnap) => {
      batch.update(doc(db, 'tasks', docSnap.id), { organizationId: null });
    });

    await batch.commit();

    // Update local state
    set((state) => {
      const { [id]: _removed, ...remainingOrgs } = state.organizations;
      return { organizations: remainingOrgs };
    });

    // Update task store state
    const { useTaskStore } = await import('./taskStore');
    const taskState = useTaskStore.getState();
    const updatedTasks = { ...taskState.tasks };
    tasksSnapshot.forEach((docSnap) => {
      if (updatedTasks[docSnap.id]) {
        updatedTasks[docSnap.id] = {
          ...updatedTasks[docSnap.id],
          organizationId: null,
        };
      }
    });
    useTaskStore.setState({ tasks: updatedTasks });
  },
}));
