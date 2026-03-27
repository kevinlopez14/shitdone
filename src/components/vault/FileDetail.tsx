import { useEffect, useRef, useState } from 'react';
import { Copy, Download, Eye, EyeOff, FileCode, Pencil, Trash2 } from 'lucide-react';
import { TagChip } from '../tags/TagChip';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { useVaultStore } from '../../stores/vaultStore';
import { useUIStore } from '../../stores/uiStore';
import { useTagStore } from '../../stores/tagStore';
import { formatDate, formatRelativeDate } from '../../lib/utils';
import { copyToClipboard } from '../../lib/clipboard';
import type { VaultFile } from '../../types/vault';

interface FileDetailProps {
  entry: VaultFile;
  onEdit: () => void;
  onDelete: () => void;
}

const AUTO_HIDE_DELAY_MS = 30_000;

export function FileDetail({ entry, onEdit, onDelete }: FileDetailProps) {
  const { decryptField, deleteEntry } = useVaultStore();
  const { addToast } = useUIStore();
  const { tags } = useTagStore();

  const [revealedContent, setRevealedContent] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const autoHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear revealed content on unmount or entry change
  useEffect(() => {
    return () => {
      setRevealedContent(null);
      if (autoHideTimerRef.current) {
        clearTimeout(autoHideTimerRef.current);
      }
    };
  }, [entry.id]);

  const clearAutoHideTimer = () => {
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current);
      autoHideTimerRef.current = null;
    }
  };

  const startAutoHideTimer = () => {
    clearAutoHideTimer();
    autoHideTimerRef.current = setTimeout(() => {
      setRevealedContent(null);
    }, AUTO_HIDE_DELAY_MS);
  };

  const handleReveal = async () => {
    if (revealedContent !== null) {
      // Hide
      setRevealedContent(null);
      clearAutoHideTimer();
      return;
    }

    setRevealing(true);
    try {
      const plaintext = await decryptField(entry.encryptedContent, entry.iv, entry.authTag);
      setRevealedContent(plaintext);
      startAutoHideTimer();
    } catch {
      addToast('Error al descifrar el contenido', 'error');
    } finally {
      setRevealing(false);
    }
  };

  const handleCopy = () => {
    if (revealedContent === null) return;
    copyToClipboard(revealedContent, addToast);
  };

  const handleDownload = () => {
    if (revealedContent === null) return;
    const blob = new Blob([revealedContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = entry.name;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    addToast(`"${entry.name}" descargado`, 'success');
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await deleteEntry(entry.id);
      addToast('Archivo eliminado', 'success');
      onDelete();
    } catch {
      addToast('Error al eliminar el archivo', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const isRevealed = revealedContent !== null;

  const labelClass = 'text-xs font-medium text-slate-500 uppercase tracking-wide';
  const valueClass = 'text-sm text-slate-200';

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-4 border-b border-surface-border shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent/10 text-accent shrink-0">
            <FileCode size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-100 truncate">{entry.name}</h2>
            <p className="text-xs text-slate-500">Archivo / ENV</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-4">
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-surface-light rounded-lg hover:bg-surface-light/80 transition-colors"
            aria-label="Editar archivo"
          >
            <Pencil size={13} />
            Editar
          </button>
          <button
            type="button"
            onClick={() => setConfirmDeleteOpen(true)}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
            aria-label="Eliminar archivo"
          >
            <Trash2 size={13} />
            Eliminar
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-5 px-6 py-5">
        {/* Description */}
        {entry.description && (
          <div className="flex flex-col gap-1">
            <span className={labelClass}>Descripción</span>
            <p className={valueClass}>{entry.description}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className={labelClass}>Contenido</span>
            <button
              type="button"
              onClick={() => void handleReveal()}
              disabled={revealing}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
            >
              {revealing ? (
                <>
                  <span className="w-3 h-3 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
                  Descifrando...
                </>
              ) : isRevealed ? (
                <>
                  <EyeOff size={13} />
                  Ocultar
                </>
              ) : (
                <>
                  <Eye size={13} />
                  Revelar
                </>
              )}
            </button>
          </div>

          {isRevealed ? (
            <pre className="bg-surface-dark rounded-lg p-4 font-mono text-sm text-slate-300 border border-surface-border overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap break-all">
              {revealedContent}
            </pre>
          ) : (
            <div className="bg-surface-dark rounded-lg p-4 border border-surface-border flex items-center gap-2">
              <span className="font-mono text-sm text-slate-500 select-none tracking-widest">
                ••••••••••••••••••••
              </span>
              <span className="text-xs text-slate-600 ml-2">Contenido encriptado</span>
            </div>
          )}

          {/* Action buttons — only active when revealed */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!isRevealed}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-surface-light text-slate-300 rounded-lg hover:bg-surface-light/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Copy size={13} />
              Copiar Todo
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!isRevealed}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-surface-light text-slate-300 rounded-lg hover:bg-surface-light/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={13} />
              Descargar
            </button>
            {isRevealed && (
              <span className="text-xs text-slate-600 ml-auto">
                Se ocultará automáticamente en 30 s
              </span>
            )}
          </div>
        </div>

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className={labelClass}>Tags</span>
            <div className="flex flex-wrap gap-1.5">
              {entry.tags.map((tagId) => {
                const tag = tags[tagId];
                if (!tag) return null;
                return <TagChip key={tagId} tag={tag} />;
              })}
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 pt-1 border-t border-surface-border">
          <div className="flex flex-col gap-1">
            <span className={labelClass}>Creado</span>
            <span className="text-xs text-slate-400" title={formatDate(entry.createdAt)}>
              {formatRelativeDate(entry.createdAt)}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className={labelClass}>Actualizado</span>
            <span className="text-xs text-slate-400" title={formatDate(entry.updatedAt)}>
              {formatRelativeDate(entry.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={() => void handleDeleteConfirm()}
        title="Eliminar Archivo"
        message={`¿Estás seguro de que quieres eliminar "${entry.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        confirmVariant="danger"
      />
    </div>
  );
}
