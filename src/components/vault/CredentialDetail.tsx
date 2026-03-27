import { useState, useEffect, useRef } from 'react';
import {
  Globe,
  Pencil,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
} from 'lucide-react';
import { TagChip } from '../tags/TagChip';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { useVaultStore } from '../../stores/vaultStore';
import { useUIStore } from '../../stores/uiStore';
import { useTagStore } from '../../stores/tagStore';
import { formatDate, formatRelativeDate } from '../../lib/utils';
import { copyToClipboard } from '../../lib/clipboard';
import type { VaultCredential } from '../../types/vault';

interface CredentialDetailProps {
  entry: VaultCredential;
  onEdit: () => void;
  onDelete: () => void;
}

export function CredentialDetail({ entry, onEdit, onDelete }: CredentialDetailProps) {
  const { decryptField, deleteEntry } = useVaultStore();
  const { addToast } = useUIStore();
  const { tags } = useTagStore();

  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear revealed password on unmount or entry change
  useEffect(() => {
    return () => {
      setRevealedPassword(null);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [entry.id]);

  const handleReveal = async () => {
    if (revealedPassword !== null) {
      // Toggle hide
      setRevealedPassword(null);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      return;
    }

    setIsRevealing(true);
    try {
      const plaintext = await decryptField(entry.encryptedPassword, entry.iv, entry.authTag);
      setRevealedPassword(plaintext);

      // Auto-hide after 30 seconds
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        setRevealedPassword(null);
      }, 30_000);
    } catch {
      addToast('Error al descifrar la contraseña', 'error');
    } finally {
      setIsRevealing(false);
    }
  };

  const handleCopyField = (value: string) => {
    copyToClipboard(value, addToast);
  };

  const handleCopyPassword = async () => {
    if (revealedPassword !== null) {
      handleCopyField(revealedPassword);
      return;
    }
    // Decrypt silently just for copying
    try {
      const plaintext = await decryptField(entry.encryptedPassword, entry.iv, entry.authTag);
      handleCopyField(plaintext);
    } catch {
      addToast('Error al descifrar la contraseña', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteEntry(entry.id);
      addToast('Credencial eliminada', 'success');
      onDelete();
    } catch {
      addToast('Error al eliminar la credencial', 'error');
    }
  };

  const entryTags = entry.tags.map((id) => tags[id]).filter(Boolean);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-start gap-3 px-6 py-5 border-b border-surface-border">
        <div className="flex-shrink-0 bg-accent/15 rounded-lg p-2.5 mt-0.5">
          <Globe size={20} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-slate-100 truncate">{entry.name}</h2>
          {entry.url && (
            <p className="text-sm text-slate-500 truncate">{entry.url}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-light transition-colors"
            aria-label="Editar credencial"
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={() => setShowConfirmDelete(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            aria-label="Eliminar credencial"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-0 px-6 py-4">
        {/* URL */}
        {entry.url && (
          <FieldRow label="URL">
            <div className="flex items-center gap-2 min-w-0">
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent hover:underline truncate flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                {entry.url}
                <ExternalLink size={12} className="flex-shrink-0" />
              </a>
            </div>
          </FieldRow>
        )}

        {/* Username */}
        {entry.username && (
          <FieldRow label="Usuario">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-sm text-slate-200 truncate">{entry.username}</span>
              <CopyButton onClick={() => handleCopyField(entry.username)} />
            </div>
          </FieldRow>
        )}

        {/* Password */}
        <FieldRow label="Contraseña">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-sm text-slate-200 font-mono tracking-wider">
              {revealedPassword !== null ? revealedPassword : '••••••••'}
            </span>
            <button
              type="button"
              onClick={() => void handleReveal()}
              disabled={isRevealing}
              className="flex-shrink-0 p-1 rounded text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50"
              aria-label={revealedPassword !== null ? 'Ocultar contraseña' : 'Revelar contraseña'}
            >
              {revealedPassword !== null ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <CopyButton onClick={() => void handleCopyPassword()} />
          </div>
          {revealedPassword !== null && (
            <p className="text-xs text-slate-600 mt-1">Se ocultará automáticamente en 30 segundos</p>
          )}
        </FieldRow>

        {/* Tags */}
        {entryTags.length > 0 && (
          <FieldRow label="Tags">
            <div className="flex flex-wrap gap-1.5">
              {entryTags.map((tag) => (
                <TagChip key={tag.id} tag={tag} />
              ))}
            </div>
          </FieldRow>
        )}

        {/* Notes */}
        {entry.notes && (
          <FieldRow label="Notas">
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{entry.notes}</p>
          </FieldRow>
        )}

        {/* Dates */}
        <div className="mt-4 pt-4 border-t border-surface-border flex flex-col gap-2">
          <MetaRow label="Creado" value={formatDate(entry.createdAt)} />
          <MetaRow
            label="Actualizado"
            value={`${formatDate(entry.updatedAt)} (${formatRelativeDate(entry.updatedAt)})`}
          />
        </div>
      </div>

      {/* Confirm delete */}
      <ConfirmDialog
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={() => void handleDelete()}
        title="Eliminar credencial"
        message={`¿Estás seguro de que quieres eliminar "${entry.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        confirmVariant="danger"
      />
    </div>
  );
}

// ── Small helper sub-components ──────────────────────────────────────────────

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 py-3 border-b border-surface-border last:border-0">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      <div className="flex items-start gap-2">{children}</div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 w-24 flex-shrink-0">{label}</span>
      <span className="text-xs text-slate-400">{value}</span>
    </div>
  );
}

function CopyButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-shrink-0 p-1 rounded text-slate-500 hover:text-slate-300 transition-colors"
      aria-label="Copiar"
    >
      <Copy size={14} />
    </button>
  );
}
