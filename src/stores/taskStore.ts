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
import type { Task, KanbanColumn } from '../types';

interface TaskState {
  tasks: Record<string, Task>;
  columns: Record<string, KanbanColumn>;
  loading: boolean;

  fetchTasks: () => Promise<void>;
  fetchColumns: () => Promise<void>;
  createTask: (data: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (taskId: string, toColumnId: string, newOrder: number) => Promise<void>;
  createColumn: (name: string) => Promise<void>;
  renameColumn: (id: string, name: string) => Promise<void>;
  deleteColumn: (id: string) => Promise<void>;
  reorderColumns: (orderedIds: string[]) => Promise<void>;
  linkNote: (taskId: string, noteId: string) => Promise<void>;
  unlinkNote: (taskId: string, noteId: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>()((set, get) => ({
  tasks: {},
  columns: {},
  loading: false,

  fetchTasks: async () => {
    set({ loading: true });
    try {
      const userId = getCurrentUserId();
      const q = query(collection(db, 'tasks'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const tasks: Record<string, Task> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Task;
        tasks[docSnap.id] = { ...data, id: docSnap.id };
      });
      set({ tasks });
    } finally {
      set({ loading: false });
    }
  },

  fetchColumns: async () => {
    const userId = getCurrentUserId();
    const q = query(
      collection(db, 'kanbanColumns'),
      where('userId', '==', userId),
    );
    const snapshot = await getDocs(q);
    const columns: Record<string, KanbanColumn> = {};
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as KanbanColumn;
      columns[docSnap.id] = { ...data, id: docSnap.id };
    });

    // If no columns exist, create defaults
    if (snapshot.empty) {
      const defaults = [
        { name: 'Por Hacer', order: 0 },
        { name: 'En Progreso', order: 1 },
        { name: 'Hecho', order: 2 },
      ];
      const batch = writeBatch(db);
      for (const def of defaults) {
        const id = generateId();
        const col: KanbanColumn = {
          id,
          userId,
          name: def.name,
          order: def.order,
          createdAt: Timestamp.now(),
        };
        batch.set(doc(db, 'kanbanColumns', id), col);
        columns[id] = col;
      }
      await batch.commit();
    }

    set({ columns });
  },

  createTask: async (data) => {
    const userId = getCurrentUserId();
    const id = generateId();
    const now = Timestamp.now();
    const task: Task = {
      ...data,
      id,
      userId,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, 'tasks', id), task);
    set((state) => ({ tasks: { ...state.tasks, [id]: task } }));
  },

  updateTask: async (id, updates) => {
    const updatedFields = { ...updates, updatedAt: Timestamp.now() };
    await updateDoc(doc(db, 'tasks', id), updatedFields);
    set((state) => ({
      tasks: {
        ...state.tasks,
        [id]: { ...state.tasks[id], ...updatedFields } as Task,
      },
    }));
  },

  deleteTask: async (id) => {
    const userId = getCurrentUserId();
    const batch = writeBatch(db);

    // Delete the task
    batch.delete(doc(db, 'tasks', id));

    // Remove task ID from linkedTaskIds of any note that references it
    const notesQuery = query(
      collection(db, 'notes'),
      where('userId', '==', userId),
      where('linkedTaskIds', 'array-contains', id),
    );
    const notesSnapshot = await getDocs(notesQuery);
    notesSnapshot.forEach((docSnap) => {
      batch.update(doc(db, 'notes', docSnap.id), {
        linkedTaskIds: arrayRemove(id),
      });
    });

    await batch.commit();

    // Update local state
    set((state) => {
      const { [id]: _removed, ...remainingTasks } = state.tasks;
      return { tasks: remainingTasks };
    });

    // Update note store state
    const { useNoteStore } = await import('./noteStore');
    const noteState = useNoteStore.getState();
    const updatedNotes = { ...noteState.notes };
    notesSnapshot.forEach((docSnap) => {
      if (updatedNotes[docSnap.id]) {
        updatedNotes[docSnap.id] = {
          ...updatedNotes[docSnap.id],
          linkedTaskIds: updatedNotes[docSnap.id].linkedTaskIds.filter(
            (tid) => tid !== id,
          ),
        };
      }
    });
    useNoteStore.setState({ notes: updatedNotes });
  },

  moveTask: async (taskId, toColumnId, newOrder) => {
    const { tasks } = get();
    const batch = writeBatch(db);

    // Update the moved task
    batch.update(doc(db, 'tasks', taskId), {
      columnId: toColumnId,
      order: newOrder,
      updatedAt: Timestamp.now(),
    });

    // Recalculate order for other tasks in the destination column that need to shift
    const tasksInColumn = Object.values(tasks)
      .filter((t) => t.columnId === toColumnId && t.id !== taskId)
      .sort((a, b) => a.order - b.order);

    const updatedTasks = { ...tasks };
    updatedTasks[taskId] = {
      ...updatedTasks[taskId],
      columnId: toColumnId,
      order: newOrder,
      updatedAt: Timestamp.now(),
    };

    let currentOrder = 0;
    for (const task of tasksInColumn) {
      // Skip the slot where the moved task will be
      if (currentOrder === newOrder) {
        currentOrder++;
      }
      if (task.order !== currentOrder) {
        batch.update(doc(db, 'tasks', task.id), {
          order: currentOrder,
          updatedAt: Timestamp.now(),
        });
        updatedTasks[task.id] = {
          ...updatedTasks[task.id],
          order: currentOrder,
          updatedAt: Timestamp.now(),
        };
      }
      currentOrder++;
    }

    await batch.commit();
    set({ tasks: updatedTasks });
  },

  createColumn: async (name) => {
    const userId = getCurrentUserId();
    const { columns } = get();
    const maxOrder = Object.values(columns).reduce(
      (max, col) => Math.max(max, col.order),
      -1,
    );
    const id = generateId();
    const column: KanbanColumn = {
      id,
      userId,
      name,
      order: maxOrder + 1,
      createdAt: Timestamp.now(),
    };
    await setDoc(doc(db, 'kanbanColumns', id), column);
    set((state) => ({ columns: { ...state.columns, [id]: column } }));
  },

  renameColumn: async (id, name) => {
    await updateDoc(doc(db, 'kanbanColumns', id), { name });
    set((state) => ({
      columns: {
        ...state.columns,
        [id]: { ...state.columns[id], name },
      },
    }));
  },

  deleteColumn: async (id) => {
    const userId = getCurrentUserId();
    const { tasks } = get();
    const batch = writeBatch(db);

    // Delete the column
    batch.delete(doc(db, 'kanbanColumns', id));

    // Find all tasks in this column
    const tasksInColumn = Object.values(tasks).filter(
      (t) => t.columnId === id,
    );

    // Delete each task and cascade: remove from linked notes
    const noteIdsToUpdate: Record<string, string[]> = {};
    for (const task of tasksInColumn) {
      batch.delete(doc(db, 'tasks', task.id));

      // Collect note references to clean up
      for (const noteId of task.linkedNoteIds) {
        if (!noteIdsToUpdate[noteId]) {
          noteIdsToUpdate[noteId] = [];
        }
        noteIdsToUpdate[noteId].push(task.id);
      }
    }

    // Query notes that reference any of these tasks and update them
    for (const task of tasksInColumn) {
      const notesQuery = query(
        collection(db, 'notes'),
        where('userId', '==', userId),
        where('linkedTaskIds', 'array-contains', task.id),
      );
      const notesSnapshot = await getDocs(notesQuery);
      notesSnapshot.forEach((docSnap) => {
        batch.update(doc(db, 'notes', docSnap.id), {
          linkedTaskIds: arrayRemove(task.id),
        });
      });
    }

    await batch.commit();

    // Update local state
    set((state) => {
      const { [id]: _removedCol, ...remainingColumns } = state.columns;
      const remainingTasks = { ...state.tasks };
      for (const task of tasksInColumn) {
        delete remainingTasks[task.id];
      }
      return { columns: remainingColumns, tasks: remainingTasks };
    });

    // Update note store state
    const { useNoteStore } = await import('./noteStore');
    const noteState = useNoteStore.getState();
    const updatedNotes = { ...noteState.notes };
    for (const [noteId, taskIds] of Object.entries(noteIdsToUpdate)) {
      if (updatedNotes[noteId]) {
        updatedNotes[noteId] = {
          ...updatedNotes[noteId],
          linkedTaskIds: updatedNotes[noteId].linkedTaskIds.filter(
            (tid) => !taskIds.includes(tid),
          ),
        };
      }
    }
    useNoteStore.setState({ notes: updatedNotes });
  },

  reorderColumns: async (orderedIds) => {
    const batch = writeBatch(db);
    const { columns } = get();
    const updatedColumns = { ...columns };

    orderedIds.forEach((id, index) => {
      batch.update(doc(db, 'kanbanColumns', id), { order: index });
      updatedColumns[id] = { ...updatedColumns[id], order: index };
    });

    await batch.commit();
    set({ columns: updatedColumns });
  },

  linkNote: async (taskId, noteId) => {
    const batch = writeBatch(db);
    batch.update(doc(db, 'tasks', taskId), {
      linkedNoteIds: arrayUnion(noteId),
    });
    batch.update(doc(db, 'notes', noteId), {
      linkedTaskIds: arrayUnion(taskId),
    });
    await batch.commit();

    // Update task state
    set((state) => ({
      tasks: {
        ...state.tasks,
        [taskId]: {
          ...state.tasks[taskId],
          linkedNoteIds: [...state.tasks[taskId].linkedNoteIds, noteId],
        },
      },
    }));

    // Update note store state
    const { useNoteStore } = await import('./noteStore');
    const noteState = useNoteStore.getState();
    if (noteState.notes[noteId]) {
      useNoteStore.setState({
        notes: {
          ...noteState.notes,
          [noteId]: {
            ...noteState.notes[noteId],
            linkedTaskIds: [...noteState.notes[noteId].linkedTaskIds, taskId],
          },
        },
      });
    }
  },

  unlinkNote: async (taskId, noteId) => {
    const batch = writeBatch(db);
    batch.update(doc(db, 'tasks', taskId), {
      linkedNoteIds: arrayRemove(noteId),
    });
    batch.update(doc(db, 'notes', noteId), {
      linkedTaskIds: arrayRemove(taskId),
    });
    await batch.commit();

    // Update task state
    set((state) => ({
      tasks: {
        ...state.tasks,
        [taskId]: {
          ...state.tasks[taskId],
          linkedNoteIds: state.tasks[taskId].linkedNoteIds.filter(
            (nid) => nid !== noteId,
          ),
        },
      },
    }));

    // Update note store state
    const { useNoteStore } = await import('./noteStore');
    const noteState = useNoteStore.getState();
    if (noteState.notes[noteId]) {
      useNoteStore.setState({
        notes: {
          ...noteState.notes,
          [noteId]: {
            ...noteState.notes[noteId],
            linkedTaskIds: noteState.notes[noteId].linkedTaskIds.filter(
              (tid) => tid !== taskId,
            ),
          },
        },
      });
    }
  },
}));
