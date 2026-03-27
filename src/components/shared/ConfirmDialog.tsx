import { cn } from '../../lib/utils';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Eliminar',
  confirmVariant = 'danger',
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="px-6 py-4">
        <p className="text-slate-300">{message}</p>
      </div>
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-border">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirm}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors',
            confirmVariant === 'danger'
              ? 'bg-red-600 hover:bg-red-500'
              : 'bg-accent hover:bg-accent/80',
          )}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
