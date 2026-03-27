import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Tag } from '../../types';

interface TagChipProps {
  tag: Tag;
  onRemove?: () => void;
  onClick?: () => void;
  size?: 'sm' | 'md';
}

export function TagChip({ tag, onRemove, onClick, size = 'sm' }: TagChipProps) {
  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1',
        onClick && 'cursor-pointer',
      )}
      style={{
        backgroundColor: tag.color + '33',
        color: tag.color,
      }}
    >
      {tag.name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="flex items-center opacity-70 hover:opacity-100 transition-opacity"
          aria-label={`Eliminar tag ${tag.name}`}
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
}
