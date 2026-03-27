import { Timestamp } from 'firebase/firestore';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type ActiveView = 'tasks' | 'notes' | 'split';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;          // Markdown content
  tags: string[];               // Array of tag IDs
  priority: Priority;
  dueDate: Timestamp | null;
  organizationId: string | null;
  columnId: string;             // Which kanban column
  order: number;                // Position within column
  linkedNoteIds: string[];      // Bidirectional link to notes
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;              // Markdown content
  tags: string[];               // Array of tag IDs
  linkedTaskIds: string[];      // Bidirectional link to tasks
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string;                // Hex color e.g. "#3B82F6"
  createdAt: Timestamp;
}

export interface Organization {
  id: string;
  userId: string;
  name: string;
  createdAt: Timestamp;
}

export interface KanbanColumn {
  id: string;
  userId: string;
  name: string;
  order: number;
  createdAt: Timestamp;
}

export interface FilterState {
  selectedTags: string[];
  priority: Priority | null;
  organizationId: string | null;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}
