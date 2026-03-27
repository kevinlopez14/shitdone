import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Tag,
  Filter,
  Calendar,
  X,
  ChevronDown,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useTagStore } from '../../stores/tagStore';
import { useOrgStore } from '../../stores/orgStore';
import { TagChip } from '../tags/TagChip';
import { cn } from '../../lib/utils';
import type { Priority } from '../../types';

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
];

const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

type OpenDropdown = 'tags' | 'priority' | 'org' | 'date' | null;

export default function SearchBar() {
  const { searchQuery, setSearchQuery, filters, setFilters, clearFilters } =
    useUIStore();
  const { tags } = useTagStore();
  const { organizations } = useOrgStore();

  // Local state for debounced search input
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null);
  const [showFilters, setShowFilters] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search query updates to store
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(localQuery);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [localQuery, setSearchQuery]);

  // Keep local state in sync if store is cleared externally
  useEffect(() => {
    if (searchQuery === '' && localQuery !== '') {
      setLocalQuery('');
    }
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdowns on click-outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Listen for global focus-search event (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handler = () => {
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    document.addEventListener('shitdone:focus-search', handler);
    return () => document.removeEventListener('shitdone:focus-search', handler);
  }, []);

  const toggleDropdown = useCallback(
    (name: OpenDropdown) => {
      setOpenDropdown((prev) => (prev === name ? null : name));
    },
    [],
  );

  // Derived: which filters are active
  const hasTagFilter = filters.selectedTags.length > 0;
  const hasPriorityFilter = !!filters.priority;
  const hasOrgFilter = !!filters.organizationId;
  const hasDateFilter = !!filters.dateRange.start || !!filters.dateRange.end;
  const hasAnyFilter =
    hasTagFilter || hasPriorityFilter || hasOrgFilter || hasDateFilter;

  // Show filter row when there are active filters or user toggled it
  const filterRowVisible = showFilters || hasAnyFilter;

  // ---- Filter mutators ----
  const toggleTag = (tagId: string) => {
    const current = filters.selectedTags;
    const next = current.includes(tagId)
      ? current.filter((id) => id !== tagId)
      : [...current, tagId];
    setFilters({ ...filters, selectedTags: next });
  };

  const removeTag = (tagId: string) => {
    setFilters({
      ...filters,
      selectedTags: filters.selectedTags.filter((id) => id !== tagId),
    });
  };

  const setPriority = (p: Priority | null) => {
    setFilters({ ...filters, priority: p });
    setOpenDropdown(null);
  };

  const setOrg = (orgId: string | null) => {
    setFilters({ ...filters, organizationId: orgId });
    setOpenDropdown(null);
  };

  const setDateRange = (
    field: 'start' | 'end',
    value: string,
  ) => {
    const date = value ? new Date(value + 'T00:00:00') : null;
    setFilters({
      ...filters,
      dateRange: { ...filters.dateRange, [field]: date },
    });
  };

  const clearDateRange = () => {
    setFilters({ ...filters, dateRange: { start: null, end: null } });
  };

  const handleClearAll = () => {
    clearFilters();
    setLocalQuery('');
    setSearchQuery('');
    setOpenDropdown(null);
    setShowFilters(false);
  };

  // Format date for input value (YYYY-MM-DD)
  const toInputDate = (d: Date | null) => {
    if (!d) return '';
    return d.toISOString().slice(0, 10);
  };

  const selectedOrgName = filters.organizationId
    ? (organizations[filters.organizationId]?.name ?? 'Desconocida')
    : null;

  const tagList = Object.values(tags);
  const orgList = Object.values(organizations);

  return (
    <div ref={containerRef} className="flex flex-row gap-1 w-full">
      {/* ── Row 1: Search input + Filters toggle ── */}
      <div className="flex items-center gap-1.5">
        {/* Search input */}
        <div className="relative flex items-center flex-1">
          <Search
            size={15}
            className="absolute left-2.5 text-slate-500 pointer-events-none"
          />
          <input
            ref={inputRef}
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Buscar tareas y notas..."
            className="
              w-full pl-8 pr-3 py-1.5
              bg-surface-dark border border-surface-border rounded-lg
              text-sm text-slate-200 placeholder:text-slate-500
              focus:outline-none focus:ring-1 focus:ring-accent
              transition-shadow duration-150
            "
          />
          {localQuery && (
            <button
              onClick={() => setLocalQuery('')}
              className="absolute right-2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filters toggle button */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          title="Mostrar filtros"
          className={cn(
            'flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs transition-colors duration-150 shrink-0',
            filterRowVisible
              ? 'bg-accent/10 text-accent border-accent/30'
              : 'text-slate-400 border-surface-border hover:text-slate-200 hover:border-slate-500',
          )}
        >
          <Filter size={13} />
          {hasAnyFilter && (
            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-accent text-white text-[10px] font-bold leading-none">
              {[hasTagFilter, hasPriorityFilter, hasOrgFilter, hasDateFilter].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* ── Row 2: Filter buttons (shown when toggled or active filters) ── */}
      {filterRowVisible && (
        <div className="flex flex-row items-center gap-1">
          {/* Tags dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('tags')}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-md border text-xs transition-colors duration-150',
                hasTagFilter
                  ? 'bg-accent/10 text-accent border-accent/30'
                  : 'text-slate-400 border-surface-border hover:text-slate-200',
              )}
            >
              <Tag size={11} />
              Tags
              {hasTagFilter && (
                <span className="font-semibold">({filters.selectedTags.length})</span>
              )}
              <ChevronDown
                size={11}
                className={cn(
                  'transition-transform duration-150',
                  openDropdown === 'tags' && 'rotate-180',
                )}
              />
            </button>

            {openDropdown === 'tags' && (
              <div className="absolute top-full left-0 mt-1 min-w-[160px] max-h-52 overflow-y-auto bg-surface border border-surface-border rounded-lg shadow-lg z-50 py-1">
                {tagList.length === 0 ? (
                  <p className="text-xs text-slate-500 px-3 py-2">Sin tags</p>
                ) : (
                  tagList.map((tag) => {
                    const isChecked = filters.selectedTags.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-slate-300 hover:bg-surface-dark transition-colors"
                      >
                        <span
                          className={cn(
                            'flex items-center justify-center w-3.5 h-3.5 rounded border flex-shrink-0 transition-colors',
                            isChecked
                              ? 'bg-accent border-accent'
                              : 'border-slate-600',
                          )}
                        >
                          {isChecked && (
                            <svg
                              viewBox="0 0 10 8"
                              fill="none"
                              className="w-2.5 h-2.5"
                            >
                              <path
                                d="M1 4l3 3 5-6"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </span>
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="truncate">{tag.name}</span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Priority dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('priority')}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-md border text-xs transition-colors duration-150',
                hasPriorityFilter
                  ? 'bg-accent/10 text-accent border-accent/30'
                  : 'text-slate-400 border-surface-border hover:text-slate-200',
              )}
            >
              Prioridad
              {hasPriorityFilter && (
                <span className="font-semibold">
                  : {PRIORITY_LABELS[filters.priority!]}
                </span>
              )}
              <ChevronDown
                size={11}
                className={cn(
                  'transition-transform duration-150',
                  openDropdown === 'priority' && 'rotate-180',
                )}
              />
            </button>

            {openDropdown === 'priority' && (
              <div className="absolute top-full left-0 mt-1 min-w-[130px] bg-surface border border-surface-border rounded-lg shadow-lg z-50 py-1">
                <button
                  onClick={() => setPriority(null)}
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-xs transition-colors',
                    !filters.priority
                      ? 'text-accent font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-surface-dark',
                  )}
                >
                  Todas
                </button>
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPriority(opt.value)}
                    className={cn(
                      'w-full text-left px-3 py-1.5 text-xs transition-colors',
                      filters.priority === opt.value
                        ? 'text-accent font-medium bg-accent/5'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-surface-dark',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Organization dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('org')}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-md border text-xs transition-colors duration-150',
                hasOrgFilter
                  ? 'bg-accent/10 text-accent border-accent/30'
                  : 'text-slate-400 border-surface-border hover:text-slate-200',
              )}
            >
              Organización
              <ChevronDown
                size={11}
                className={cn(
                  'transition-transform duration-150',
                  openDropdown === 'org' && 'rotate-180',
                )}
              />
            </button>

            {openDropdown === 'org' && (
              <div className="absolute top-full left-0 mt-1 min-w-[170px] max-h-52 overflow-y-auto bg-surface border border-surface-border rounded-lg shadow-lg z-50 py-1">
                <button
                  onClick={() => setOrg(null)}
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-xs transition-colors',
                    !filters.organizationId
                      ? 'text-accent font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-surface-dark',
                  )}
                >
                  Todas
                </button>
                {orgList.length === 0 ? (
                  <p className="text-xs text-slate-500 px-3 py-2">
                    Sin organizaciones
                  </p>
                ) : (
                  orgList.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => setOrg(org.id)}
                      className={cn(
                        'w-full text-left px-3 py-1.5 text-xs transition-colors truncate',
                        filters.organizationId === org.id
                          ? 'text-accent font-medium bg-accent/5'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-surface-dark',
                      )}
                    >
                      {org.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Date range dropdown */}
          <div className="relative">
            <button
              onClick={() => toggleDropdown('date')}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-md border text-xs transition-colors duration-150',
                hasDateFilter
                  ? 'bg-accent/10 text-accent border-accent/30'
                  : 'text-slate-400 border-surface-border hover:text-slate-200',
              )}
            >
              <Calendar size={11} />
              Fecha
              <ChevronDown
                size={11}
                className={cn(
                  'transition-transform duration-150',
                  openDropdown === 'date' && 'rotate-180',
                )}
              />
            </button>

            {openDropdown === 'date' && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-surface border border-surface-border rounded-lg shadow-lg z-50 p-3">
                <div className="flex flex-col gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Desde
                    </span>
                    <input
                      type="date"
                      value={toInputDate(filters.dateRange.start)}
                      onChange={(e) => setDateRange('start', e.target.value)}
                      className="
                        w-full px-2 py-1 rounded-md bg-surface-dark border border-surface-border
                        text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-accent
                      "
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Hasta
                    </span>
                    <input
                      type="date"
                      value={toInputDate(filters.dateRange.end)}
                      onChange={(e) => setDateRange('end', e.target.value)}
                      className="
                        w-full px-2 py-1 rounded-md bg-surface-dark border border-surface-border
                        text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-accent
                      "
                    />
                  </label>
                  {hasDateFilter && (
                    <button
                      onClick={clearDateRange}
                      className="text-[11px] text-slate-500 hover:text-red-400 text-left transition-colors mt-0.5"
                    >
                      Limpiar fechas
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Row 3: Active filter chips ── */}
      {hasAnyFilter && (
        <div className="flex flex-wrap items-center gap-1">
          {/* Selected tag chips */}
          {filters.selectedTags.map((tagId) => {
            const tag = tags[tagId];
            if (!tag) return null;
            return (
              <TagChip key={tagId} tag={tag} onRemove={() => removeTag(tagId)} />
            );
          })}

          {/* Priority chip */}
          {hasPriorityFilter && (
            <span className="inline-flex items-center gap-1 rounded-full text-xs px-2 py-0.5 bg-violet-500/20 text-violet-300 font-medium">
              Prioridad: {PRIORITY_LABELS[filters.priority!]}
              <button
                onClick={() => setPriority(null)}
                className="flex items-center opacity-70 hover:opacity-100 transition-opacity"
                aria-label="Quitar filtro de prioridad"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {/* Org chip */}
          {hasOrgFilter && selectedOrgName && (
            <span className="inline-flex items-center gap-1 rounded-full text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-medium">
              {selectedOrgName}
              <button
                onClick={() => setOrg(null)}
                className="flex items-center opacity-70 hover:opacity-100 transition-opacity"
                aria-label="Quitar filtro de organización"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {/* Date range chip */}
          {hasDateFilter && (
            <span className="inline-flex items-center gap-1 rounded-full text-xs px-2 py-0.5 bg-sky-500/20 text-sky-300 font-medium">
              {filters.dateRange.start && !filters.dateRange.end
                ? `Desde ${toInputDate(filters.dateRange.start)}`
                : !filters.dateRange.start && filters.dateRange.end
                  ? `Hasta ${toInputDate(filters.dateRange.end)}`
                  : `${toInputDate(filters.dateRange.start)} – ${toInputDate(filters.dateRange.end)}`}
              <button
                onClick={clearDateRange}
                className="flex items-center opacity-70 hover:opacity-100 transition-opacity"
                aria-label="Quitar filtro de fecha"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {/* Clear all */}
          <button
            onClick={handleClearAll}
            className="text-[11px] text-slate-500 hover:text-red-400 transition-colors ml-0.5 flex items-center gap-0.5"
          >
            <X size={11} />
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}
