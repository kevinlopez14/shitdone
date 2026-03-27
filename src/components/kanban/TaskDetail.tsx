import { useState, useEffect, useCallback } from 'react';
import { X, Eye, Edit3, Trash2, Link, Unlink2, FileText } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { cn } from '../../lib/utils';
import { useTaskStore } from '../../stores/taskStore';
import { useNoteStore } from '../../stores/noteStore';
import { useUIStore } from '../../stores/uiStore';
import { useOrgStore } from '../../stores/orgStore';
import { useTagStore } from '../../stores/tagStore';
import { PriorityBadge } from '../shared/PriorityBadge';
import { LinkSelector } from '../shared/LinkSelector';
import { TagSelector } from '../tags/TagSelector';
import { TagChip } from '../tags/TagChip';
import { DatePicker } from '../shared/DatePicker';
import { MarkdownRenderer } from '../shared/MarkdownRenderer';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import type { Priority } from '../../types';

interface TaskDetailProps {
  taskId: string;
  onClose: () => void;
}

const priorities: Priority[] = ['low', 'medium', 'high', 'urgent'];

export function TaskDetail({ taskId, onClose }: TaskDetailProps) {
  const task = useTaskStore((s) => s.tasks[taskId]);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const linkNote = useTaskStore((s) => s.linkNote);
  const unlinkNote = useTaskStore((s) => s.unlinkNote);
  const allNotes = useNoteStore((s) => s.notes);
  const { activeView, setActiveView, setSelectedNoteId } = useUIStore();
  const organizations = useOrgStore((s) => s.organizations);
  const tags = useTagStore((s) => s.tags);

  const isSplitView = activeView === 'split';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync local state when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
    }
  }, [task]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleTitleBlur = useCallback(() => {
    const trimmed = title.trim();
    if (task && trimmed && trimmed !== task.title) {
      void updateTask(taskId, { title: trimmed });
    }
  }, [title, task, taskId, updateTask]);

  const handleDescriptionBlur = useCallback(() => {
    if (task && description !== task.description) {
      void updateTask(taskId, { description });
    }
  }, [description, task, taskId, updateTask]);

  const handlePriorityChange = (priority: Priority) => {
    void updateTask(taskId, { priority });
  };

  const handleOrgChange = (orgId: string | null) => {
    void updateTask(taskId, { organizationId: orgId });
  };

  const handleTagsChange = (tagIds: string[]) => {
    void updateTask(taskId, { tags: tagIds });
  };

  const handleDueDateChange = (date: Date | null) => {
    void updateTask(taskId, {
      dueDate: date ? Timestamp.fromDate(date) : null,
    });
  };

  const handleDelete = async () => {
    await deleteTask(taskId);
    onClose();
  };

  if (!task) return null;

  const orgList = Object.values(organizations).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const taskTags = task.tags.map((id) => tags[id]).filter(Boolean);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-full max-w-lg z-50',
          'bg-surface border-l border-surface-border',
          'flex flex-col',
          'animate-in slide-in-from-right duration-200',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="text-lg font-semibold text-slate-100">
            Detalle de tarea
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-5">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            className={cn(
              'bg-transparent border-none text-xl font-semibold text-slate-100',
              'focus:outline-none w-full',
            )}
          />

          {/* Description */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-400">Descripción</label>
              <button
                type="button"
                onClick={() => {
                  if (editingDescription) {
                    handleDescriptionBlur();
                  }
                  setEditingDescription(!editingDescription);
                }}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                {editingDescription ? (
                  <>
                    <Eye size={14} /> Vista previa
                  </>
                ) : (
                  <>
                    <Edit3 size={14} /> Editar
                  </>
                )}
              </button>
            </div>

            {editingDescription ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                rows={8}
                placeholder="Descripción en Markdown..."
                className={cn(
                  'bg-surface-dark border border-surface-border rounded-lg px-3 py-2',
                  'text-slate-200 text-sm font-mono resize-none',
                  'focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent',
                )}
              />
            ) : (
              <div
                className={cn(
                  'bg-surface-dark rounded-lg px-3 py-2 min-h-[80px]',
                  'border border-surface-border',
                )}
                onDoubleClick={() => setEditingDescription(true)}
              >
                {description ? (
                  <MarkdownRenderer content={description} />
                ) : (
                  <p className="text-sm text-slate-500 italic">
                    Sin descripción. Haz doble clic para editar.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-400">Prioridad</label>
            <div className="flex gap-2">
              {priorities.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePriorityChange(p)}
                  className={cn(
                    'rounded-lg px-2 py-1 border transition-colors',
                    task.priority === p
                      ? 'border-accent bg-accent/10'
                      : 'border-surface-border hover:border-slate-500',
                  )}
                >
                  <PriorityBadge priority={p} showLabel />
                </button>
              ))}
            </div>
          </div>

          {/* Organization */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-400">Organización</label>
            <select
              value={task.organizationId ?? ''}
              onChange={(e) => handleOrgChange(e.target.value || null)}
              className={cn(
                'bg-surface-dark border border-surface-border rounded-lg px-3 py-2',
                'text-slate-200 text-sm',
                'focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent',
              )}
            >
              <option value="">Sin organización</option>
              {orgList.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-slate-400">Tags</label>
            <div className="flex flex-wrap items-center gap-1">
              {taskTags.map((tag) => (
                <TagChip
                  key={tag.id}
                  tag={tag}
                  onRemove={() =>
                    handleTagsChange(task.tags.filter((t) => t !== tag.id))
                  }
                />
              ))}
              <TagSelector
                selectedTagIds={task.tags}
                onChange={handleTagsChange}
              />
            </div>
          </div>

          {/* Due date */}
          <DatePicker
            value={task.dueDate ? task.dueDate.toDate() : null}
            onChange={handleDueDateChange}
            label="Fecha límite"
          />

          {/* Linked Notes */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <Link size={14} className="text-slate-400" />
              <label className="text-sm text-slate-400">Notas Vinculadas</label>
            </div>
            {task.linkedNoteIds.length === 0 ? (
              <p className="text-sm text-slate-500 italic">
                Sin notas vinculadas
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {task.linkedNoteIds.map((noteId) => {
                  const note = allNotes[noteId];
                  if (!note) return null;
                  return (
                    <li
                      key={noteId}
                      className="flex items-center gap-2 text-sm bg-surface-dark rounded-lg px-2.5 py-1.5 group"
                    >
                      <FileText size={14} className="text-slate-500 shrink-0" />
                      <button
                        type="button"
                        onClick={() => {
                          if (isSplitView) {
                            setSelectedNoteId(noteId);
                          } else {
                            setActiveView('notes');
                            setSelectedNoteId(noteId);
                          }
                        }}
                        className="flex-1 text-left text-slate-300 hover:text-accent transition-colors truncate"
                      >
                        {note.title}
                      </button>
                      <button
                        type="button"
                        onClick={() => void unlinkNote(taskId, noteId)}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all shrink-0"
                        title="Desvincular nota"
                      >
                        <Unlink2 size={14} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <LinkSelector
              items={Object.values(allNotes).map((n) => ({
                id: n.id,
                title: n.title,
              }))}
              excludeIds={task.linkedNoteIds}
              onSelect={(noteId) => void linkNote(taskId, noteId)}
              placeholder="Buscar nota..."
              triggerLabel="Vincular Nota"
            />
          </div>

          {/* Delete */}
          <div className="pt-4 border-t border-surface-border">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg',
                'text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors',
              )}
            >
              <Trash2 size={16} />
              Eliminar tarea
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => void handleDelete()}
        title="Eliminar tarea"
        message={`Se eliminará la tarea "${task.title}". Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        confirmVariant="danger"
      />
    </>
  );
}
