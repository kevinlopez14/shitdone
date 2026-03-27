import { useEffect, useState } from 'react';
import { Shield, Lock } from 'lucide-react';
import { useVaultStore } from '../stores/vaultStore';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { VaultSetupModal } from '../components/vault/VaultSetupModal';
import { VaultUnlockModal } from '../components/vault/VaultUnlockModal';
import { VaultToolbar } from '../components/vault/VaultToolbar';
import { VaultEntryList } from '../components/vault/VaultEntryList';
import { CredentialForm } from '../components/vault/CredentialForm';
import { CredentialDetail } from '../components/vault/CredentialDetail';
import { FileForm } from '../components/vault/FileForm';
import { FileDetail } from '../components/vault/FileDetail';
import { VaultSettings } from '../components/vault/VaultSettings';
import type { VaultCredential, VaultEntry, VaultFile } from '../types/vault';

export default function VaultPage() {
  const { checkSetup, isSetup, isUnlocked, loading, lock, entries, searchQuery, typeFilter } =
    useVaultStore();

  // Local UI state
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [showCredentialForm, setShowCredentialForm] = useState(false);
  const [showFileForm, setShowFileForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null);

  useEffect(() => {
    void checkSetup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-lock listener
  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.onVaultAutoLocked) return;

    api.onVaultAutoLocked(() => {
      void lock();
    });

    return () => {
      api.removeVaultAutoLockedListeners?.();
    };
  }, [lock]);

  // Ping vault on user activity to reset the auto-lock timer (throttled to once per minute)
  useEffect(() => {
    if (!isUnlocked) return;
    let lastPing = 0;
    const throttledPing = () => {
      const now = Date.now();
      if (now - lastPing > 60_000) {
        lastPing = now;
        window.electronAPI?.vaultPing();
      }
    };
    window.addEventListener('mousemove', throttledPing);
    window.addEventListener('keydown', throttledPing);
    window.addEventListener('click', throttledPing);
    return () => {
      window.removeEventListener('mousemove', throttledPing);
      window.removeEventListener('keydown', throttledPing);
      window.removeEventListener('click', throttledPing);
    };
  }, [isUnlocked]);

  // Clear selection when vault locks
  useEffect(() => {
    if (!isUnlocked) {
      setSelectedEntryId(null);
      setShowCredentialForm(false);
      setShowFileForm(false);
      setEditingEntry(null);
    }
  }, [isUnlocked]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-surface-dark">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isSetup) {
    return (
      <div className="flex h-full items-center justify-center bg-surface-dark">
        <div className="flex flex-col items-center gap-4 text-center">
          <Shield size={48} strokeWidth={1.5} className="text-slate-500" />
          <p className="text-lg font-medium text-slate-300">Configura tu bóveda</p>
          <p className="text-sm text-slate-500 max-w-xs">
            Tu bóveda aún no ha sido configurada. Establece una contraseña maestra para comenzar.
          </p>
        </div>
        <VaultSetupModal isOpen={true} onClose={() => {/* required step — no dismiss */}} />
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="flex h-full items-center justify-center bg-surface-dark">
        <div className="flex flex-col items-center gap-4 text-center">
          <Lock size={48} strokeWidth={1.5} className="text-slate-500" />
          <p className="text-lg font-medium text-slate-300">Bóveda bloqueada</p>
          <p className="text-sm text-slate-500 max-w-xs">
            Introduce tu contraseña maestra para desbloquear la bóveda.
          </p>
        </div>
        <VaultUnlockModal isOpen={true} onClose={() => {/* required step — no dismiss */}} />
      </div>
    );
  }

  // ── Filter entries ────────────────────────────────────────────────────────
  const allEntries = Object.values(entries);

  const filteredEntries = allEntries.filter((entry) => {
    // Type filter
    if (typeFilter && entry.type !== typeFilter) return false;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = entry.name.toLowerCase().includes(q);
      const urlMatch =
        entry.type === 'credential' && entry.url.toLowerCase().includes(q);
      const usernameMatch =
        entry.type === 'credential' && entry.username.toLowerCase().includes(q);
      const descriptionMatch =
        entry.type === 'env-file' && entry.description.toLowerCase().includes(q);
      if (!nameMatch && !urlMatch && !usernameMatch && !descriptionMatch) return false;
    }

    return true;
  });

  // Sort by updatedAt descending
  const sortedEntries: VaultEntry[] = filteredEntries.sort((a, b) => {
    const aTime = a.updatedAt?.toMillis() ?? 0;
    const bTime = b.updatedAt?.toMillis() ?? 0;
    return bTime - aTime;
  });

  // Selected entry
  const selectedEntry = selectedEntryId ? entries[selectedEntryId] ?? null : null;

  const handleEntrySelect = (id: string) => {
    setSelectedEntryId(id);
  };

  const handleEdit = () => {
    if (!selectedEntry) return;
    setEditingEntry(selectedEntry);
    if (selectedEntry.type === 'credential') {
      setShowCredentialForm(true);
    } else {
      setShowFileForm(true);
    }
  };

  const handleDeleteDone = () => {
    setSelectedEntryId(null);
  };

  const handleCredentialFormClose = () => {
    setShowCredentialForm(false);
    setEditingEntry(null);
  };

  const handleFileFormClose = () => {
    setShowFileForm(false);
    setEditingEntry(null);
  };

  // ── Unlocked layout ───────────────────────────────────────────────────────
  return (
    <div className="flex h-full bg-surface-dark overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r border-surface-border bg-surface overflow-hidden">
        {/* Sidebar header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-border">
          <Shield size={16} className="text-accent flex-shrink-0" />
          <h1 className="text-sm font-semibold text-slate-200">Bóveda</h1>
          <span className="ml-auto text-xs text-slate-500">{sortedEntries.length}</span>
        </div>

        {/* Entry list */}
        <div className="flex-1 overflow-hidden">
          <VaultEntryList
            entries={sortedEntries}
            selectedId={selectedEntryId}
            onSelect={handleEntrySelect}
          />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <VaultToolbar
          onNewCredential={() => {
            setEditingEntry(null);
            setShowCredentialForm(true);
          }}
          onNewFile={() => {
            setEditingEntry(null);
            setShowFileForm(true);
          }}
          onSettings={() => setShowSettings(true)}
          onLock={() => void lock()}
        />

        {/* Detail area */}
        <div className="flex-1 overflow-hidden">
          {selectedEntry ? (
            selectedEntry.type === 'credential' ? (
              <CredentialDetail
                entry={selectedEntry as VaultCredential}
                onEdit={handleEdit}
                onDelete={handleDeleteDone}
              />
            ) : (
              <FileDetail
                entry={selectedEntry as VaultFile}
                onEdit={handleEdit}
                onDelete={handleDeleteDone}
              />
            )
          ) : (
            /* Empty state */
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center px-6">
              <Lock size={40} strokeWidth={1.5} className="text-slate-700" />
              <p className="text-slate-500 text-sm">Selecciona una entrada</p>
            </div>
          )}
        </div>
      </div>

      {/* Credential form modal */}
      <CredentialForm
        isOpen={showCredentialForm}
        onClose={handleCredentialFormClose}
        editEntry={editingEntry?.type === 'credential' ? (editingEntry as VaultCredential) : null}
      />

      {/* File form modal */}
      <FileForm
        isOpen={showFileForm}
        onClose={handleFileFormClose}
        editEntry={editingEntry?.type === 'env-file' ? (editingEntry as VaultFile) : null}
      />

      {/* Vault settings modal */}
      <VaultSettings isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
