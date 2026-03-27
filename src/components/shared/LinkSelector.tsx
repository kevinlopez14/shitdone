import { useState, useRef, useEffect } from 'react';
import { Link, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LinkSelectorProps {
  items: Array<{ id: string; title: string; subtitle?: string }>;
  excludeIds: string[];
  onSelect: (id: string) => void;
  placeholder: string;
  triggerLabel: string;
  triggerIcon?: React.ReactNode;
}

export function LinkSelector({
  items,
  excludeIds,
  onSelect,
  placeholder,
  triggerLabel,
  triggerIcon,
}: LinkSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filteredItems = items.filter((item) => {
    if (excludeIds.includes(item.id)) return false;
    if (!search) return true;
    return item.title.toLowerCase().includes(search.toLowerCase());
  });

  const handleSelect = (id: string) => {
    onSelect(id);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors',
          'border border-dashed border-surface-border rounded-lg px-2.5 py-1.5',
          'hover:border-slate-500',
        )}
      >
        {triggerIcon ?? <Link size={13} />}
        {triggerLabel}
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute top-full left-0 mt-1 w-64 z-50',
            'bg-surface border border-surface-border rounded-lg shadow-lg',
            'max-h-48 overflow-y-auto',
          )}
        >
          {/* Search input */}
          <div className="sticky top-0 bg-surface p-2 border-b border-surface-border">
            <div className="flex items-center gap-2 bg-surface-dark rounded px-2 py-1.5">
              <Search size={13} className="text-slate-500 shrink-0" />
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={placeholder}
                className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none border-none"
              />
            </div>
          </div>

          {/* Items */}
          {filteredItems.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-500 italic">
              Sin resultados
            </div>
          ) : (
            filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={cn(
                  'w-full text-left px-3 py-2 hover:bg-surface-light transition-colors',
                  'flex flex-col gap-0.5',
                )}
              >
                <span className="text-sm text-slate-200 truncate">
                  {item.title}
                </span>
                {item.subtitle && (
                  <span className="text-xs text-slate-500">{item.subtitle}</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
