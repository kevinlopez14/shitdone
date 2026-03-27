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
import type { Tag } from '../types';

interface TagState {
  tags: Record<string, Tag>;
  loading: boolean;

  fetchTags: () => Promise<void>;
  createTag: (name: string, color: string) => Promise<void>;
  updateTag: (id: string, updates: Partial<Pick<Tag, 'name' | 'color'>>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
}

export const useTagStore = create<TagState>()((set) => ({
  tags: {},
  loading: false,

  fetchTags: async () => {
    set({ loading: true });
    try {
      // const userId = getCurrentUserId();
      const q = query(collection(db, 'tags'), 
      // where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const tags: Record<string, Tag> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Tag;
        tags[docSnap.id] = { ...data, id: docSnap.id };
      });
      set({ tags });
    } finally {
      set({ loading: false });
    }
  },

  createTag: async (name, color) => {
    const userId = getCurrentUserId();
    const id = generateId();
    const tag: Tag = {
      id,
      userId,
      name,
      color,
      createdAt: Timestamp.now(),
    };
    await setDoc(doc(db, 'tags', id), tag);
    set((state) => ({ tags: { ...state.tags, [id]: tag } }));
  },

  updateTag: async (id, updates) => {
    await updateDoc(doc(db, 'tags', id), { ...updates });
    set((state) => ({
      tags: {
        ...state.tags,
        [id]: { ...state.tags[id], ...updates },
      },
    }));
  },

  deleteTag: async (id) => {
    // const userId = getCurrentUserId();
    const batch = writeBatch(db);

    // Delete the tag itself
    batch.delete(doc(db, 'tags', id));

    // Remove tag from all tasks that reference it
    const tasksQuery = query(
      collection(db, 'tasks'),
      // where('userId', '==', userId),
      where('tags', 'array-contains', id),
    );
    const tasksSnapshot = await getDocs(tasksQuery);
    tasksSnapshot.forEach((docSnap) => {
      const taskData = docSnap.data();
      const updatedTags = (taskData.tags as string[]).filter((t) => t !== id);
      batch.update(doc(db, 'tasks', docSnap.id), { tags: updatedTags });
    });

    // Remove tag from all notes that reference it
    const notesQuery = query(
      collection(db, 'notes'),
      // where('userId', '==', userId),
      where('tags', 'array-contains', id),
    );
    const notesSnapshot = await getDocs(notesQuery);
    notesSnapshot.forEach((docSnap) => {
      const noteData = docSnap.data();
      const updatedTags = (noteData.tags as string[]).filter((t) => t !== id);
      batch.update(doc(db, 'notes', docSnap.id), { tags: updatedTags });
    });

    await batch.commit();

    // Update local state: remove tag and update task/note stores
    set((state) => {
      const { [id]: _removed, ...remainingTags } = state.tags;
      return { tags: remainingTags };
    });

    // Update task store state
    const { useTaskStore } = await import('./taskStore');
    const taskState = useTaskStore.getState();
    const updatedTasks = { ...taskState.tasks };
    tasksSnapshot.forEach((docSnap) => {
      if (updatedTasks[docSnap.id]) {
        updatedTasks[docSnap.id] = {
          ...updatedTasks[docSnap.id],
          tags: updatedTasks[docSnap.id].tags.filter((t) => t !== id),
        };
      }
    });
    useTaskStore.setState({ tasks: updatedTasks });

    // Update note store state
    const { useNoteStore } = await import('./noteStore');
    const noteState = useNoteStore.getState();
    const updatedNotes = { ...noteState.notes };
    notesSnapshot.forEach((docSnap) => {
      if (updatedNotes[docSnap.id]) {
        updatedNotes[docSnap.id] = {
          ...updatedNotes[docSnap.id],
          tags: updatedNotes[docSnap.id].tags.filter((t) => t !== id),
        };
      }
    });
    useNoteStore.setState({ notes: updatedNotes });
  },
}));
