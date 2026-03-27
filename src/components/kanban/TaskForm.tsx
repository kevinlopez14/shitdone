import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { cn } from '../../lib/utils';
import { useTaskStore } from '../../stores/taskStore';
import { useOrgStore } from '../../stores/orgStore';
import { Modal } from '../shared/Modal';
import { PriorityBadge } from '../shared/PriorityBadge';
import { TagSelector } from '../tags/TagSelector';
import { TagChip } from '../tags/TagChip';
import { DatePicker } from '../shared/DatePicker';
import { useTagStore } from '../../stores/tagStore';
import type { Priority } from '../../types';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  defaultColumnId: string;
}

const priorities: Priority[] = ['low', 'medium', 'high', 'urgent'];

export function TaskForm({ isOpen, onClose, defaultColumnId }: TaskFormProps) {
  const { createTask, tasks } = useTaskStore();
  const { organizations } = useOrgStore();
  const tags = useTagStore((s) => s.tags);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setSelectedTags([]);
    setOrganizationId(null);
    setDueDate(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      // Calculate order: append to end of column
      const tasksInColumn = Object.values(tasks).filter(
        (t) => t.columnId === defaultColumnId,
      );
      const maxOrder = tasksInColumn.reduce(
        (max, t) => Math.max(max, t.order),
        -1,
      );

      await createTask({
        title: title.trim(),
        description,
        tags: selectedTags,
        priority,
        dueDate: dueDate ? Timestamp.fromDate(dueDate) : null,
        organizationId,
        columnId: defaultColumnId,
        order: maxOrder + 1,
        linkedNoteIds: [],
      });

      resetForm();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const orgList = Object.values(organizations).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nueva Tarea">
      <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-4 flex flex-col gap-4">
        {/* Title */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-slate-400">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            required
            placeholder="Nombre de la tarea"
            className={cn(
              'bg-surface-dark border border-surface-border rounded-lg px-3 py-2',
              'text-slate-200 text-sm',
              'focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent',
            )}
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-slate-400">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Descripción en Markdown..."
            className={cn(
              'bg-surface-dark border border-surface-border rounded-lg px-3 py-2',
              'text-slate-200 text-sm font-mono resize-none',
              'focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent',
            )}
          />
        </div>

        {/* Priority */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-slate-400">Prioridad</label>
          <div className="flex gap-2">
            {priorities.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={cn(
                  'rounded-lg px-2 py-1 border transition-colors',
                  priority === p
                    ? 'border-accent bg-accent/10'
                    : 'border-surface-border hover:border-slate-500',
                )}
              >
                <PriorityBadge priority={p} showLabel />
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-slate-400">Tags</label>
          <div className="flex flex-wrap items-center gap-1">
            {selectedTags.map((id) => {
              const tag = tags[id];
              if (!tag) return null;
              return (
                <TagChip
                  key={id}
                  tag={tag}
                  onRemove={() => setSelectedTags(selectedTags.filter((t) => t !== id))}
                />
              );
            })}
            <TagSelector
              selectedTagIds={selectedTags}
              onChange={setSelectedTags}
            />
          </div>
        </div>

        {/* Organization */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-slate-400">Organización</label>
          <select
            value={organizationId ?? ''}
            onChange={(e) => setOrganizationId(e.target.value || null)}
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

        {/* Due date */}
        <DatePicker
          value={dueDate}
          onChange={setDueDate}
          label="Fecha límite"
        />

        {/* Submit */}
        <div className="flex justify-end pt-2 border-t border-surface-border">
          <button
            type="submit"
            disabled={!title.trim() || submitting}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors',
              'bg-accent hover:bg-accent/80 disabled:opacity-50',
            )}
          >
            Crear Tarea
          </button>
        </div>
      </form>
    </Modal>
  );
}
