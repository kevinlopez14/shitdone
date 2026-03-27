import { useEffect, useRef, useState } from 'react';
import {
  StickyNote,
  Download,
  Trash2,
  Eye,
  Edit3,
  Columns2,
  Check,
  Link,
  Unlink2,
  CheckSquare,
} from 'lucide-react';
import { useNoteStore } from '../stores/noteStore';
import { useTaskStore } from '../stores/taskStore';
import { useUIStore } from '../stores/uiStore';
import { useTagStore } from '../stores/tagStore';
import { useFilteredNotes } from '../hooks/useSearch';
import { cn } from '../lib/utils';
import { NotesList } from '../components/notes/NotesList';
import { NoteEditor } from '../components/notes/NoteEditor';
import { NotePreview } from '../components/notes/NotePreview';
import { NoteForm } from '../components/notes/NoteForm';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { PriorityBadge } from '../components/shared/PriorityBadge';
import { LinkSelector } from '../components/shared/LinkSelector';
import { TagChip } from '../components/tags/TagChip';
import { TagSelector } from '../components/tags/TagSelector';
import { EmptyState } from '../components/shared/EmptyState';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';

type ViewMode = 'editor' | 'preview' | 'both';

export default function NotesPage() {
  const { notes, loading, fetchNotes, createNote, updateNote, deleteNote, downloadAsMd, linkTask, unlinkTask } =
    useNoteStore();
  const allTasks = useTaskStore((s) => s.tasks);
  const { activeView, setActiveView, selectedNoteId, setSelectedNoteId, setSelectedTaskId } = useUIStore();
  const { tags } = useTagStore();

  const filteredNotesList = useFilteredNotes(notes);

  const isSplitView = activeView === 'split';

  const priorityLabels: Record<string, string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    urgent: 'Urgente',
  };

  // Local editor state
  const [editorContent, setEditorContent] = useState('');
  const [editorTitle, setEditorTitle] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('both');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saved, setSaved] = useState(false);

  // Auto-save debounce ref
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch on mount if empty
  useEffect(() => {
    if (Object.keys(notes).length === 0) {
      void fetchNotes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync local state when selected note changes
  useEffect(() => {
    if (selectedNoteId && notes[selectedNoteId]) {
      const note = notes[selectedNoteId];
      setEditorContent(note.content);
      setEditorTitle(note.title);
    }
  }, [selectedNoteId]); // intentionally only on id change

  // Clear auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, []);

  // Sort filtered notes by updatedAt desc
  const sortedNotes = [...filteredNotesList].sort(
    (a, b) =>
      (b.updatedAt?.toMillis() ?? 0) - (a.updatedAt?.toMillis() ?? 0),
  );

  const selectedNote = selectedNoteId ? notes[selectedNoteId] : null;

  const handleEditorChange = (content: string) => {
    setEditorContent(content);
    if (!selectedNoteId) return;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      void updateNote(selectedNoteId, { content }).then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      });
    }, 1000);
  };

  const handleTitleBlur = () => {
    if (!selectedNoteId || !editorTitle.trim()) return;
    if (editorTitle !== selectedNote?.title) {
      void updateNote(selectedNoteId, { title: editorTitle });
    }
  };

  const handleCreateNote = async (title: string) => {
    await createNote(title);
    // Select the newly created note (it will be first after re-sort)
    const newNotes = useNoteStore.getState().notes;
    const newest = Object.values(newNotes).sort(
      (a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0),
    )[0];
    if (newest) setSelectedNoteId(newest.id);
  };

  const handleDeleteNote = async () => {
    if (!selectedNoteId) return;
    await deleteNote(selectedNoteId);
    setSelectedNoteId(null);
  };

  const handleTagChange = (tagIds: string[]) => {
    if (!selectedNoteId) return;
    void updateNote(selectedNoteId, { tags: tagIds });
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <NotesList
        notes={sortedNotes}
        selectedNoteId={selectedNoteId}
        onSelectNote={setSelectedNoteId}
        onCreateNote={() => setShowNoteForm(true)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {selectedNote ? (
          <>
            {/* Toolbar */}
            <div className="shrink-0 flex items-center gap-3 px-4 py-2.5 border-b border-surface-border bg-surface">
              {/* Title input */}
              <input
                value={editorTitle}
                onChange={(e) => setEditorTitle(e.target.value)}
                onBlur={handleTitleBlur}
                className="flex-1 text-xl font-semibold bg-transparent text-slate-100 border-none outline-none focus:ring-0 placeholder-slate-500 truncate"
                placeholder="Sin título"
              />

              {/* Saved indicator */}
              {saved && (
                <span className="flex items-center gap-1 text-xs text-emerald-400 shrink-0">
                  <Check size={12} />
                  Guardado
                </span>
              )}

              {/* View mode toggle */}
              <div className="flex items-center bg-surface-dark rounded-lg border border-surface-border overflow-hidden shrink-0">
                <button
                  onClick={() => setViewMode('editor')}
                  title="Editor"
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 text-xs transition-colors',
                    viewMode === 'editor'
                      ? 'bg-accent text-white'
                      : 'text-slate-400 hover:text-slate-200',
                  )}
                >
                  <Edit3 size={13} />
                  Editor
                </button>
                <button
                  onClick={() => setViewMode('preview')}
                  title="Vista Previa"
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 text-xs transition-colors border-x border-surface-border',
                    viewMode === 'preview'
                      ? 'bg-accent text-white'
                      : 'text-slate-400 hover:text-slate-200',
                  )}
                >
                  <Eye size={13} />
                  Vista Previa
                </button>
                <button
                  onClick={() => setViewMode('both')}
                  title="Ambos"
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 text-xs transition-colors',
                    viewMode === 'both'
                      ? 'bg-accent text-white'
                      : 'text-slate-400 hover:text-slate-200',
                  )}
                >
                  <Columns2 size={13} />
                  Ambos
                </button>
              </div>

              {/* Download */}
              <button
                onClick={() => void downloadAsMd(selectedNote.id)}
                title="Descargar como .md"
                className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors rounded"
              >
                <Download size={16} />
              </button>

              {/* Delete */}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                title="Eliminar nota"
                className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Tags row */}
            <div className="shrink-0 flex items-center gap-2 px-4 py-2 border-b border-surface-border bg-surface flex-wrap">
              {selectedNote.tags.map((tagId) => {
                const tag = tags[tagId];
                if (!tag) return null;
                return (
                  <TagChip
                    key={tagId}
                    tag={tag}
                    onRemove={() =>
                      handleTagChange(
                        selectedNote.tags.filter((t) => t !== tagId),
                      )
                    }
                  />
                );
              })}
              <TagSelector
                selectedTagIds={selectedNote.tags}
                onChange={handleTagChange}
              />
            </div>

            {/* Linked Tasks row */}
            <div className="shrink-0 flex flex-col gap-2 px-4 py-2 border-b border-surface-border bg-surface">
              <div className="flex items-center gap-1.5">
                <Link size={14} className="text-slate-400" />
                <span className="text-xs text-slate-400 font-medium">Tareas Vinculadas</span>
              </div>
              {selectedNote.linkedTaskIds.length > 0 && (
                <div className="flex flex-col gap-1">
                  {selectedNote.linkedTaskIds.map((taskId) => {
                    const task = allTasks[taskId];
                    if (!task) return null;
                    return (
                      <div
                        key={taskId}
                        className="flex items-center gap-2 text-sm bg-surface-dark rounded-lg px-2.5 py-1.5 group"
                      >
                        <CheckSquare size={14} className="text-slate-500 shrink-0" />
                        <button
                          type="button"
                          onClick={() => {
                            if (isSplitView) {
                              setSelectedTaskId(taskId);
                            } else {
                              setActiveView('tasks');
                              setSelectedTaskId(taskId);
                            }
                          }}
                          className="flex-1 text-left text-slate-300 hover:text-accent transition-colors truncate"
                        >
                          {task.title}
                        </button>
                        <PriorityBadge priority={task.priority} />
                        <button
                          type="button"
                          onClick={() => void unlinkTask(selectedNote.id, taskId)}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all shrink-0"
                          title="Desvincular tarea"
                        >
                          <Unlink2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <LinkSelector
                items={Object.values(allTasks).map((t) => ({
                  id: t.id,
                  title: t.title,
                  subtitle: priorityLabels[t.priority] ?? t.priority,
                }))}
                excludeIds={selectedNote.linkedTaskIds}
                onSelect={(taskId) => void linkTask(selectedNote.id, taskId)}
                placeholder="Buscar tarea..."
                triggerLabel="Vincular Tarea"
              />
            </div>

            {/* Editor / Preview area */}
            <div className="flex-1 overflow-hidden flex">
              {viewMode === 'editor' && (
                <div className="flex-1 overflow-hidden">
                  <NoteEditor
                    content={editorContent}
                    onChange={handleEditorChange}
                  />
                </div>
              )}

              {viewMode === 'preview' && (
                <div className="flex-1 overflow-hidden">
                  <NotePreview content={editorContent} />
                </div>
              )}

              {viewMode === 'both' && (
                <>
                  <div className="flex-1 overflow-hidden border-r border-surface-border">
                    <NoteEditor
                      content={editorContent}
                      onChange={handleEditorChange}
                    />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <NotePreview content={editorContent} />
                  </div>
                </>
              )}
            </div>
          </>
        ) : loading ? (
          /* Loading state */
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={<StickyNote size={48} strokeWidth={1.5} />}
              title="Sin nota seleccionada"
              description="Selecciona una nota de la lista o crea una nueva para comenzar"
              action={{ label: 'Nueva Nota', onClick: () => setShowNoteForm(true) }}
            />
          </div>
        )}
      </div>

      {/* Note creation form */}
      <NoteForm
        isOpen={showNoteForm}
        onClose={() => setShowNoteForm(false)}
        onCreate={(title) => void handleCreateNote(title)}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => void handleDeleteNote()}
        title="Eliminar nota"
        message={`¿Estás seguro de que deseas eliminar "${selectedNote?.title ?? 'esta nota'}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        confirmVariant="danger"
      />
    </div>
  );
}
