import { useRef, useState, useEffect, useCallback } from 'react';
import { Search, Plus, Globe, FileCode, Settings, Lock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useVaultStore } from '../../stores/vaultStore';
import { debounce } from '../../lib/utils';

interface VaultToolbarProps {
  onNewCredential: () => void;
  onNewFile: () => void;
  onSettings: () => void;
  onLock: () => void;
}

export function VaultToolbar({ onNewCredential, onNewFile, onSettings, onLock }: VaultToolbarProps) {
  const { searchQuery, setSearchQuery, typeFilter, setTypeFilter } = useVaultStore();
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetSearch = useCallback(
    debounce((q: unknown) => setSearchQuery(q as string), 300),
    [setSearchQuery],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalSearch(val);
    debouncedSetSearch(val);
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  const filterOptions: { label: string; value: 'all' | 'credential' | 'env-file' }[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Credenciales', value: 'credential' },
    { label: 'Archivos', value: 'env-file' },
  ];

  const activeFilter = typeFilter ?? 'all';

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border bg-surface shrink-0">
      {/* Search input */}
      <div className="relative flex-1 min-w-0">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
        />
        <input
          type="text"
          value={localSearch}
          onChange={handleSearchChange}
          placeholder="Buscar entradas..."
          className="w-full bg-surface-dark border border-surface-border rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
        />
      </div>

      {/* Filter buttons */}
      <div className="flex items-center gap-1">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTypeFilter(opt.value === 'all' ? null : opt.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              activeFilter === opt.value
                ? 'bg-accent/20 text-accent'
                : 'text-slate-400 hover:text-slate-200',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Settings & Lock buttons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onSettings}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Configuración de bóveda"
          title="Configuración"
        >
          <Settings size={16} />
        </button>
        <button
          type="button"
          onClick={onLock}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Bloquear bóveda"
          title="Bloquear"
        >
          <Lock size={16} />
        </button>
      </div>

      {/* Add button with dropdown */}
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => setDropdownOpen((v) => !v)}
          className="bg-accent text-white rounded-lg p-2 hover:bg-accent/80 transition-colors"
          aria-label="Nueva entrada"
        >
          <Plus size={18} />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-48 bg-surface border border-surface-border rounded-lg shadow-lg z-50 overflow-hidden">
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                onNewCredential();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-200 hover:bg-surface-light transition-colors"
            >
              <Globe size={15} className="text-slate-400" />
              Nueva Credencial
            </button>
            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                onNewFile();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-200 hover:bg-surface-light transition-colors"
            >
              <FileCode size={15} className="text-slate-400" />
              Nuevo Archivo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
