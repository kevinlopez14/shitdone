import { Shield } from 'lucide-react';
import { VaultEntryRow } from './VaultEntryRow';
import type { VaultEntry } from '../../types/vault';

interface VaultEntryListProps {
  entries: VaultEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function VaultEntryList({ entries, selectedId, onSelect }: VaultEntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
        <Shield size={36} strokeWidth={1.5} className="text-slate-600" />
        <p className="text-sm text-slate-500">No hay entradas</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-y-auto h-full py-1">
      {entries.map((entry) => (
        <VaultEntryRow
          key={entry.id}
          entry={entry}
          isSelected={entry.id === selectedId}
          onClick={() => onSelect(entry.id)}
        />
      ))}
    </div>
  );
}
