import { Globe, FileCode } from 'lucide-react';
import { cn, formatRelativeDate } from '../../lib/utils';
import { useTagStore } from '../../stores/tagStore';
import type { VaultEntry } from '../../types/vault';

interface VaultEntryRowProps {
  entry: VaultEntry;
  isSelected: boolean;
  onClick: () => void;
}

export function VaultEntryRow({ entry, isSelected, onClick }: VaultEntryRowProps) {
  const { tags } = useTagStore();

  const subtitle =
    entry.type === 'credential'
      ? entry.url
      : entry.description;

  const entryTags = entry.tags
    .map((id) => tags[id])
    .filter(Boolean)
    .slice(0, 3);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 px-3 py-3 text-left transition-colors relative',
        isSelected
          ? 'bg-surface-light border-l-2 border-accent'
          : 'hover:bg-surface-light/50 border-l-2 border-transparent',
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 mt-0.5 rounded-md p-1.5',
          isSelected ? 'bg-accent/20 text-accent' : 'bg-surface-light text-slate-400',
        )}
      >
        {entry.type === 'credential' ? (
          <Globe size={15} />
        ) : (
          <FileCode size={15} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium truncate',
            isSelected ? 'text-slate-100' : 'text-slate-200',
          )}
        >
          {entry.name}
        </p>
        {subtitle && (
          <p className="text-xs text-slate-500 truncate mt-0.5">{subtitle}</p>
        )}

        {/* Tags and date */}
        <div className="flex items-center gap-1.5 mt-1.5">
          {/* Tag dots */}
          {entryTags.map((tag) => (
            <span
              key={tag.id}
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: tag.color }}
              title={tag.name}
            />
          ))}
          {entry.tags.length > 3 && (
            <span className="text-xs text-slate-600">+{entry.tags.length - 3}</span>
          )}

          {/* Spacer */}
          {entryTags.length > 0 && (
            <span className="text-slate-700 text-xs">·</span>
          )}

          {/* Date */}
          <span className="text-xs text-slate-600">
            {formatRelativeDate(entry.updatedAt)}
          </span>
        </div>
      </div>
    </button>
  );
}
