import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Inbox } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ColumnHeader } from './ColumnHeader';
import { TaskCard } from './TaskCard';
import { EmptyState } from '../shared/EmptyState';
import type { KanbanColumn as KanbanColumnType, Task } from '../../types';

interface KanbanColumnProps {
  column: KanbanColumnType;
  tasks: Task[];
  onAddTask: (columnId: string) => void;
}

export function KanbanColumn({ column, tasks, onAddTask }: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: column.id });

  const taskIds = tasks.map((t) => t.id);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'w-72 min-w-[18rem] flex-shrink-0 bg-surface/50 rounded-lg flex flex-col max-h-full',
        isOver && 'bg-accent/5 ring-1 ring-accent/20',
      )}
    >
      {/* Header */}
      <ColumnHeader column={column} taskCount={tasks.length} />

      {/* Task list */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <EmptyState
            icon={<Inbox size={48} strokeWidth={1.5} />}
            title="Sin tareas"
            description="Arrastra tareas aquí o crea una nueva"
          />
        )}
      </div>

      {/* Add task button */}
      <button
        onClick={() => onAddTask(column.id)}
        className={cn(
          'flex items-center gap-1 px-3 py-2 text-sm text-slate-400',
          'hover:text-slate-200 transition-colors',
        )}
      >
        <Plus size={16} />
        Agregar tarea
      </button>
    </div>
  );
}
