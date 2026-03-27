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
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db, getCurrentUserId } from '../lib/firebase';
import { generateId } from '../lib/utils';
import type { Note } from '../types';

interface NoteState {
  notes: Record<string, Note>;
  loading: boolean;

  fetchNotes: () => Promise<void>;
  createNote: (title: string, content?: string) => Promise<void>;
  updateNote: (
    id: string,
    updates: Partial<Pick<Note, 'title' | 'content' | 'tags'>>,
  ) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  linkTask: (noteId: string, taskId: string) => Promise<void>;
  unlinkTask: (noteId: string, taskId: string) => Promise<void>;
  downloadAsMd: (noteId: string) => Promise<void>;
}

export const useNoteStore = create<NoteState>()((set, get) => ({
  notes: {},
  loading: false,

  fetchNotes: async () => {
    set({ loading: true });
    try {
      // const userId = getCurrentUserId();
      const q = query(collection(db, 'notes'), 
      // where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const notes: Record<string, Note> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Note;
        notes[docSnap.id] = { ...data, id: docSnap.id };
      });
      set({ notes });
    } finally {
      set({ loading: false });
    }
  },

  createNote: async (title, content) => {
    const userId = getCurrentUserId();
    const id = generateId();
    const now = Timestamp.now();
    const note: Note = {
      id,
      userId,
      title,
      content: content ?? '',
      tags: [],
      linkedTaskIds: [],
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, 'notes', id), note);
    set((state) => ({ notes: { ...state.notes, [id]: note } }));
  },

  updateNote: async (id, updates) => {
    const updatedFields = { ...updates, updatedAt: Timestamp.now() };
    await updateDoc(doc(db, 'notes', id), updatedFields);
    set((state) => ({
      notes: {
        ...state.notes,
        [id]: { ...state.notes[id], ...updatedFields } as Note,
      },
    }));
  },

  deleteNote: async (id) => {
    // const userId = getCurrentUserId();
    const batch = writeBatch(db);

    // Delete the note
    batch.delete(doc(db, 'notes', id));

    // Remove note ID from linkedNoteIds of any task that references it
    const tasksQuery = query(
      collection(db, 'tasks'),
      // where('userId', '==', userId),
      where('linkedNoteIds', 'array-contains', id),
    );
    const tasksSnapshot = await getDocs(tasksQuery);
    tasksSnapshot.forEach((docSnap) => {
      batch.update(doc(db, 'tasks', docSnap.id), {
        linkedNoteIds: arrayRemove(id),
      });
    });

    await batch.commit();

    // Update local state
    set((state) => {
      const { [id]: _removed, ...remainingNotes } = state.notes;
      return { notes: remainingNotes };
    });

    // Update task store state
    const { useTaskStore } = await import('./taskStore');
    const taskState = useTaskStore.getState();
    const updatedTasks = { ...taskState.tasks };
    tasksSnapshot.forEach((docSnap) => {
      if (updatedTasks[docSnap.id]) {
        updatedTasks[docSnap.id] = {
          ...updatedTasks[docSnap.id],
          linkedNoteIds: updatedTasks[docSnap.id].linkedNoteIds.filter(
            (nid) => nid !== id,
          ),
        };
      }
    });
    useTaskStore.setState({ tasks: updatedTasks });
  },

  linkTask: async (noteId, taskId) => {
    const batch = writeBatch(db);
    batch.update(doc(db, 'notes', noteId), {
      linkedTaskIds: arrayUnion(taskId),
    });
    batch.update(doc(db, 'tasks', taskId), {
      linkedNoteIds: arrayUnion(noteId),
    });
    await batch.commit();

    // Update note state
    set((state) => ({
      notes: {
        ...state.notes,
        [noteId]: {
          ...state.notes[noteId],
          linkedTaskIds: [...state.notes[noteId].linkedTaskIds, taskId],
        },
      },
    }));

    // Update task store state
    const { useTaskStore } = await import('./taskStore');
    const taskState = useTaskStore.getState();
    if (taskState.tasks[taskId]) {
      useTaskStore.setState({
        tasks: {
          ...taskState.tasks,
          [taskId]: {
            ...taskState.tasks[taskId],
            linkedNoteIds: [...taskState.tasks[taskId].linkedNoteIds, noteId],
          },
        },
      });
    }
  },

  unlinkTask: async (noteId, taskId) => {
    const batch = writeBatch(db);
    batch.update(doc(db, 'notes', noteId), {
      linkedTaskIds: arrayRemove(taskId),
    });
    batch.update(doc(db, 'tasks', taskId), {
      linkedNoteIds: arrayRemove(noteId),
    });
    await batch.commit();

    // Update note state
    set((state) => ({
      notes: {
        ...state.notes,
        [noteId]: {
          ...state.notes[noteId],
          linkedTaskIds: state.notes[noteId].linkedTaskIds.filter(
            (tid) => tid !== taskId,
          ),
        },
      },
    }));

    // Update task store state
    const { useTaskStore } = await import('./taskStore');
    const taskState = useTaskStore.getState();
    if (taskState.tasks[taskId]) {
      useTaskStore.setState({
        tasks: {
          ...taskState.tasks,
          [taskId]: {
            ...taskState.tasks[taskId],
            linkedNoteIds: taskState.tasks[taskId].linkedNoteIds.filter(
              (nid) => nid !== noteId,
            ),
          },
        },
      });
    }
  },

  downloadAsMd: async (noteId) => {
    const { notes } = get();
    const note = notes[noteId];
    if (!note) return;
    await window.electronAPI.saveFile(note.title + '.md', note.content);
  },
}));
