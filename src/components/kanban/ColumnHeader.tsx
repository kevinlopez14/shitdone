import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTaskStore } from '../../stores/taskStore';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import type { KanbanColumn } from '../../types';

interface ColumnHeaderProps {
  column: KanbanColumn;
  taskCount: number;
}

export function ColumnHeader({ column, taskCount }: ColumnHeaderProps) {
  const { renameColumn, deleteColumn } = useTaskStore();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(column.name);
  const [showDelete, setShowDelete] = useState(false);

  const handleSubmit = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== column.name) {
      void renameColumn(column.id, trimmed);
    } else {
      setEditName(column.name);
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setEditName(column.name);
      setEditing(false);
    }
  };

  return (
    <div className="flex items-center justify-between px-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        {editing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSubmit}
            onKeyDown={handleKeyDown}
            autoFocus
            className={cn(
              'bg-surface-dark border border-surface-border rounded px-2 py-0.5',
              'text-sm font-semibold text-slate-100',
              'focus:outline-none focus:ring-1 focus:ring-accent',
              'w-full',
            )}
          />
        ) : (
          <h3
            onDoubleClick={() => {
              setEditName(column.name);
              setEditing(true);
            }}
            className="text-sm font-semibold text-slate-200 truncate cursor-default select-none"
          >
            {column.name}
          </h3>
        )}
        <span className="text-xs bg-surface-light px-1.5 rounded-full text-slate-400 flex-shrink-0">
          {taskCount}
        </span>
      </div>

      <button
        onClick={() => setShowDelete(true)}
        className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
        aria-label="Eliminar columna"
      >
        <Trash2 size={14} />
      </button>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={() => void deleteColumn(column.id)}
        title="Eliminar columna"
        message={`Se eliminará la columna "${column.name}" y todas sus tareas (${taskCount}). Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        confirmVariant="danger"
      />
    </div>
  );
}
