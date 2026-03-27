import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn, formatDate, isOverdue } from '../../lib/utils';
import { useUIStore } from '../../stores/uiStore';
import { useTagStore } from '../../stores/tagStore';
import { useOrgStore } from '../../stores/orgStore';
import { PriorityBadge } from '../shared/PriorityBadge';
import { TagChip } from '../tags/TagChip';
import type { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

export function TaskCard({ task, isDragging }: TaskCardProps) {
  const setSelectedTaskId = useUIStore((s) => s.setSelectedTaskId);
  const tags = useTagStore((s) => s.tags);
  const organizations = useOrgStore((s) => s.organizations);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const orgColor = task.organizationId ? organizations[task.organizationId]?.color : null;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(orgColor ? { borderLeft: `4px solid ${orgColor}` } : {}),
  };

  const dragging = isDragging || isSortableDragging;

  const taskTags = task.tags
    .map((id) => tags[id])
    .filter(Boolean);

  const org = task.organizationId ? organizations[task.organizationId] : null;
  const overdue = isOverdue(task.dueDate);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => setSelectedTaskId(task.id)}
      className={cn(
        'bg-surface p-3 rounded-lg border border-surface-border cursor-pointer',
        'hover:border-accent/30 hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/20',
        'transition-all duration-200',
        dragging && 'opacity-50 ring-2 ring-accent/30',
      )}
    >
      {/* Title */}
      <p className="text-sm font-medium text-slate-200 truncate">{task.title}</p>

      {/* Tags */}
      {taskTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {taskTags.slice(0, 3).map((tag) => (
            <TagChip key={tag.id} tag={tag} size="sm" />
          ))}
          {taskTags.length > 3 && (
            <span className="text-xs text-slate-500 self-center">
              +{taskTags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-2">
        <PriorityBadge priority={task.priority} />
        {org && (
          <span className="text-xs text-slate-500 truncate max-w-[80px]">
            {org.name}
          </span>
        )}
        {task.dueDate && (
          <span
            className={cn(
              'text-xs',
              overdue ? 'text-red-400' : 'text-slate-500',
            )}
          >
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
}
