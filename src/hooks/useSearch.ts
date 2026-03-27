import { useMemo } from 'react';
import type { Task, Note } from '../types';
import { useUIStore } from '../stores/uiStore';

export function useFilteredTasks(tasks: Record<string, Task>): Task[] {
  const { searchQuery, filters } = useUIStore();

  return useMemo(() => {
    return Object.values(tasks).filter((task) => {
      // Text search: case-insensitive on title + description
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !task.title.toLowerCase().includes(q) &&
          !task.description.toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      // Tag filter: AND logic - task must have ALL selected tags
      if (filters.selectedTags.length > 0) {
        if (!filters.selectedTags.every((tagId) => task.tags.includes(tagId))) {
          return false;
        }
      }

      // Priority filter
      if (filters.priority) {
        if (task.priority !== filters.priority) return false;
      }

      // Organization filter
      if (filters.organizationId) {
        if (task.organizationId !== filters.organizationId) return false;
      }

      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        if (!task.dueDate) return false;
        const taskDate = task.dueDate.toDate();
        if (filters.dateRange.start && taskDate < filters.dateRange.start)
          return false;
        if (filters.dateRange.end && taskDate > filters.dateRange.end)
          return false;
      }

      return true;
    });
  }, [tasks, searchQuery, filters]);
}

export function useFilteredNotes(notes: Record<string, Note>): Note[] {
  const { searchQuery, filters } = useUIStore();

  return useMemo(() => {
    return Object.values(notes).filter((note) => {
      // Text search on title + content
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !note.title.toLowerCase().includes(q) &&
          !note.content.toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      // Tag filter (AND logic)
      if (filters.selectedTags.length > 0) {
        if (!filters.selectedTags.every((tagId) => note.tags.includes(tagId))) {
          return false;
        }
      }

      return true;
    });
  }, [notes, searchQuery, filters]);
}
