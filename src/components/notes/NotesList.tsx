import { Plus } from 'lucide-react';
import { cn, formatRelativeDate, stripMarkdown } from '../../lib/utils';
import { useTagStore } from '../../stores/tagStore';
import { TagChip } from '../tags/TagChip';
import type { Note } from '../../types';

interface NotesListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (noteId: string) => void;
  onCreateNote: () => void;
}

export function NotesList({
  notes,
  selectedNoteId,
  onSelectNote,
  onCreateNote,
}: NotesListProps) {
  const { tags } = useTagStore();

  return (
    <div className="w-72 min-w-72 bg-surface border-r border-surface-border flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border shrink-0">
        <h2 className="text-lg font-semibold text-slate-100">Notas</h2>
        <button
          onClick={onCreateNote}
          className="flex items-center gap-1 bg-accent text-white rounded-lg text-sm px-3 py-1.5 hover:bg-accent/80 transition-colors"
        >
          <Plus size={14} />
          Nueva Nota
        </button>
      </div>

      {/* Note list */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {notes.length === 0 && (
          <p className="text-xs text-slate-500 text-center py-8 px-4">
            No hay notas. Crea una nueva.
          </p>
        )}
        {notes.map((note) => {
          const isSelected = note.id === selectedNoteId;
          const preview = stripMarkdown(note.content).slice(0, 80);
          const noteTags = note.tags
            .map((id) => tags[id])
            .filter(Boolean)
            .slice(0, 2);

          return (
            <div
              key={note.id}
              onClick={() => onSelectNote(note.id)}
              className={cn(
                'p-3 border-b border-surface-border cursor-pointer',
                isSelected
                  ? 'bg-surface-light border-l-2 border-l-accent'
                  : 'hover:bg-surface-light/50',
              )}
            >
              <p className="text-sm font-medium text-slate-200 truncate">
                {note.title || 'Sin título'}
              </p>
              {preview && (
                <p className="text-xs text-slate-500 truncate mt-0.5">{preview}</p>
              )}
              <div className="flex items-center justify-between mt-1.5 gap-1">
                <div className="flex items-center gap-1 flex-wrap min-w-0">
                  {noteTags.map((tag) => (
                    <TagChip key={tag.id} tag={tag} size="sm" />
                  ))}
                </div>
                <span className="text-xs text-slate-600 shrink-0 whitespace-nowrap">
                  {formatRelativeDate(note.updatedAt)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
