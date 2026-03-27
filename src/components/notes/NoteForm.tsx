import { useState } from 'react';
import { Modal } from '../shared/Modal';

interface NoteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string) => void;
}

export function NoteForm({ isOpen, onClose, onCreate }: NoteFormProps) {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setTitle('');
    onClose();
  };

  const handleClose = () => {
    setTitle('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nueva Nota">
      <form onSubmit={handleSubmit}>
        <div className="px-6 py-4">
          <label className="block text-sm text-slate-400 mb-1.5">Título</label>
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nombre de la nota"
            className="w-full bg-surface-dark border border-surface-border rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
          />
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-border">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!title.trim()}
            className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent/80 disabled:opacity-50 transition-colors"
          >
            Crear
          </button>
        </div>
      </form>
    </Modal>
  );
}
