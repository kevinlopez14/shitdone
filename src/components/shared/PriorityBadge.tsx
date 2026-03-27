import { cn } from '../../lib/utils';
import type { Priority } from '../../types';

interface PriorityBadgeProps {
  priority: Priority;
  showLabel?: boolean;
}

const colorMap: Record<Priority, { dot: string; pill: string; label: string }> = {
  low: {
    dot: 'bg-gray-500',
    pill: 'bg-gray-500/20 text-gray-400',
    label: 'Baja',
  },
  medium: {
    dot: 'bg-blue-500',
    pill: 'bg-blue-500/20 text-blue-400',
    label: 'Media',
  },
  high: {
    dot: 'bg-amber-500',
    pill: 'bg-amber-500/20 text-amber-400',
    label: 'Alta',
  },
  urgent: {
    dot: 'bg-red-500',
    pill: 'bg-red-500/20 text-red-400',
    label: 'Urgente',
  },
};

export function PriorityBadge({ priority, showLabel = false }: PriorityBadgeProps) {
  const colors = colorMap[priority];

  if (!showLabel) {
    return <span className={cn('w-2.5 h-2.5 rounded-full inline-block', colors.dot)} />;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
        colors.pill,
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', colors.dot)} />
      {colors.label}
    </span>
  );
}
