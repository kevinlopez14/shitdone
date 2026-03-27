import { useState, useRef, useEffect } from 'react';
import { Tag, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTagStore } from '../../stores/tagStore';
import { TagChip } from './TagChip';

interface TagSelectorProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

export function TagSelector({ selectedTagIds, onChange }: TagSelectorProps) {
  const { tags, createTag } = useTagStore();
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const toggleTag = (id: string) => {
    if (selectedTagIds.includes(id)) {
      onChange(selectedTagIds.filter((t) => t !== id));
    } else {
      onChange([...selectedTagIds, id]);
    }
  };

  const handleCreateTag = async () => {
    const name = newTagName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await createTag(name, newTagColor);
      setNewTagName('');
      setNewTagColor('#3B82F6');
    } finally {
      setCreating(false);
    }
  };

  const sortedTags = Object.values(tags).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors',
        )}
      >
        <Tag size={14} />
        Agregar tags
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-surface border border-surface-border rounded-lg shadow-lg z-50 flex flex-col">
          {/* Tag list */}
          <div className="max-h-48 overflow-y-auto py-1">
            {sortedTags.length === 0 && (
              <p className="text-xs text-slate-500 px-3 py-2">No hay tags</p>
            )}
            {sortedTags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-surface-light transition-colors"
                >
                  <span
                    className={cn(
                      'w-4 h-4 rounded flex items-center justify-center border',
                      isSelected ? 'border-transparent' : 'border-surface-border',
                    )}
                    style={isSelected ? { backgroundColor: tag.color } : {}}
                  >
                    {isSelected && <Check size={10} className="text-white" />}
                  </span>
                  <TagChip tag={tag} />
                </button>
              );
            })}
          </div>

          {/* Create tag form */}
          <div className="border-t border-surface-border px-3 py-2 flex flex-col gap-1.5">
            <p className="text-xs text-slate-500 font-medium">Crear tag</p>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleCreateTag(); } }}
                placeholder="Nombre del tag"
                className="flex-1 min-w-0 bg-surface-dark border border-surface-border rounded px-2 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-7 h-7 rounded cursor-pointer border border-surface-border bg-surface-dark p-0.5"
                title="Color del tag"
              />
              <button
                type="button"
                onClick={() => void handleCreateTag()}
                disabled={!newTagName.trim() || creating}
                className="px-2 py-1 text-xs bg-accent text-white rounded hover:bg-accent/80 disabled:opacity-50 transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
