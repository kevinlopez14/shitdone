import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTaskStore } from '../../stores/taskStore';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import type { KanbanColumn as KanbanColumnType, Task } from '../../types';

interface KanbanBoardProps {
  columns: KanbanColumnType[];
  tasksByColumn: Record<string, Task[]>;
}

export function KanbanBoard({ columns, tasksByColumn }: KanbanBoardProps) {
  const { moveTask, createColumn } = useTaskStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formColumnId, setFormColumnId] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const handleAddTask = useCallback(
    (columnId: string) => {
      setFormColumnId(columnId);
      setShowForm(true);
    },
    [],
  );

  const handleAddColumn = async () => {
    await createColumn('Nueva Columna');
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const taskId = active.id as string;

    // Find the task across all columns
    for (const tasks of Object.values(tasksByColumn)) {
      const found = tasks.find((t) => t.id === taskId);
      if (found) {
        setActiveTask(found);
        break;
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Find which column the task came from
    let sourceColumnId = '';
    for (const [colId, tasks] of Object.entries(tasksByColumn)) {
      if (tasks.some((t) => t.id === taskId)) {
        sourceColumnId = colId;
        break;
      }
    }

    // Determine the target column
    let targetColumnId = '';
    let targetIndex = -1;

    // Check if dropped over a column directly
    const isColumn = columns.some((c) => c.id === overId);
    if (isColumn) {
      targetColumnId = overId;
      // Append to end
      const tasksInTarget = tasksByColumn[targetColumnId] || [];
      targetIndex = tasksInTarget.length;
    } else {
      // Dropped over another task -- find which column that task is in
      for (const [colId, tasks] of Object.entries(tasksByColumn)) {
        const idx = tasks.findIndex((t) => t.id === overId);
        if (idx !== -1) {
          targetColumnId = colId;
          targetIndex = idx;
          break;
        }
      }
    }

    if (!targetColumnId) return;

    // If same column and same position, skip
    if (sourceColumnId === targetColumnId) {
      const tasks = tasksByColumn[sourceColumnId] || [];
      const currentIdx = tasks.findIndex((t) => t.id === taskId);
      if (currentIdx === targetIndex) return;
    }

    void moveTask(taskId, targetColumnId, targetIndex);
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex gap-4 p-4 overflow-x-auto overflow-y-hidden">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasksByColumn[column.id] || []}
              onAddTask={handleAddTask}
            />
          ))}

          {/* Add column button */}
          <button
            onClick={() => void handleAddColumn()}
            className={cn(
              'flex items-center gap-2 px-4 py-2 h-fit',
              'text-sm text-slate-400 hover:text-slate-200',
              'bg-surface/30 hover:bg-surface/50 rounded-lg',
              'border border-dashed border-surface-border hover:border-slate-500',
              'transition-colors flex-shrink-0',
            )}
          >
            <Plus size={16} />
            Nueva Columna
          </button>
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeTask ? (
            <div className="opacity-80 rotate-2 w-72">
              <TaskCard task={activeTask} isDragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Task creation form */}
      <TaskForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        defaultColumnId={formColumnId}
      />
    </>
  );
}
