import { create } from 'zustand';
import type { ActiveView, FilterState } from '../types';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface UIState {
  activeView: ActiveView;
  searchQuery: string;
  filters: FilterState;
  selectedTaskId: string | null;
  selectedNoteId: string | null;
  isSplitView: boolean;
  toasts: Toast[];

  setActiveView: (view: ActiveView) => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: FilterState) => void;
  setSelectedTaskId: (id: string | null) => void;
  setSelectedNoteId: (id: string | null) => void;
  toggleSplitView: () => void;
  clearFilters: () => void;
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
}

const defaultFilters: FilterState = {
  selectedTags: [],
  priority: null,
  organizationId: null,
  dateRange: { start: null, end: null },
};

export const useUIStore = create<UIState>()((set, get) => ({
  activeView: 'tasks',
  searchQuery: '',
  filters: { ...defaultFilters },
  selectedTaskId: null,
  selectedNoteId: null,
  isSplitView: false,
  toasts: [],

  setActiveView: (view) =>
    set({
      activeView: view,
      isSplitView: view === 'split',
      ...(view === 'vault' ? { isSplitView: false } : {}),
    }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setFilters: (filters) => set({ filters }),

  setSelectedTaskId: (id) => set({ selectedTaskId: id }),

  setSelectedNoteId: (id) => set({ selectedNoteId: id }),

  toggleSplitView: () => {
    const { isSplitView, activeView } = get();
    if (isSplitView) {
      // Go back to the last non-split view, default to 'tasks'
      const previousView = activeView === 'split' ? 'tasks' : activeView;
      set({ isSplitView: false, activeView: previousView });
    } else {
      set({ isSplitView: true, activeView: 'split' });
    }
  },

  clearFilters: () =>
    set({
      filters: {
        selectedTags: [],
        priority: null,
        organizationId: null,
        dateRange: { start: null, end: null },
      },
    }),

  addToast: (message, type) => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      get().removeToast(id);
    }, 3000);
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
