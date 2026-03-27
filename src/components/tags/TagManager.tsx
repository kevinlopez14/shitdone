import { useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTagStore } from '../../stores/tagStore';
import { Modal } from '../shared/Modal';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { TagChip } from './TagChip';

interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TagManager({ isOpen, onClose }: TagManagerProps) {
  const { tags, createTag, updateTag, deleteTag } = useTagStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#3B82F6');
  const [creating, setCreating] = useState(false);

  const sortedTags = Object.values(tags).sort((a, b) => a.name.localeCompare(b.name));

  const startEdit = (id: string) => {
    const tag = tags[id];
    if (!tag) return;
    setEditingId(id);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditColor('');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const name = editName.trim();
    if (!name) return;
    await updateTag(editingId, { name, color: editColor });
    cancelEdit();
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await createTag(name, newColor);
      setNewName('');
      setNewColor('#3B82F6');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await deleteTag(deletingId);
    setDeletingId(null);
  };

  const deletingTag = deletingId ? tags[deletingId] : null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Gestionar Tags" maxWidth="max-w-md">
        {/* Tag list */}
        <div className="px-6 py-4 max-h-80 overflow-y-auto space-y-2">
          {sortedTags.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-4">No hay tags creados</p>
          )}
          {sortedTags.map((tag) => (
            <div key={tag.id} className="flex items-center gap-2">
              {editingId === tag.id ? (
                // Inline edit form
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); void saveEdit(); }
                      if (e.key === 'Escape') cancelEdit();
                    }}
                    autoFocus
                    className="flex-1 bg-surface-dark border border-surface-border rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <input
                    type="color"
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-surface-border bg-surface-dark p-0.5"
                    title="Color del tag"
                  />
                  <button
                    onClick={() => void saveEdit()}
                    className="px-2 py-1 text-xs bg-accent text-white rounded hover:bg-accent/80 transition-colors"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                // Normal row
                <>
                  <div className="flex-1">
                    <TagChip tag={tag} size="md" />
                  </div>
                  <button
                    onClick={() => startEdit(tag.id)}
                    className="p-1 text-slate-500 hover:text-slate-200 transition-colors"
                    aria-label={`Editar tag ${tag.name}`}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeletingId(tag.id)}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    aria-label={`Eliminar tag ${tag.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Footer: new tag form */}
        <div className="border-t border-surface-border px-6 py-4">
          <p className="text-sm text-slate-400 font-medium mb-2">Nuevo Tag</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleCreate(); } }}
              placeholder="Nombre del tag"
              className="flex-1 bg-surface-dark border border-surface-border rounded-lg px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-9 h-9 rounded cursor-pointer border border-surface-border bg-surface-dark p-0.5"
              title="Color del tag"
            />
            <button
              onClick={() => void handleCreate()}
              disabled={!newName.trim() || creating}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg text-white transition-colors',
                'bg-accent hover:bg-accent/80 disabled:opacity-50',
              )}
            >
              <Plus size={14} />
              Crear
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={() => void handleDelete()}
        title="Eliminar Tag"
        message={
          deletingTag
            ? `¿Eliminar el tag "${deletingTag.name}"? Se eliminará de todas las tareas y notas que lo usen.`
            : '¿Eliminar este tag?'
        }
        confirmLabel="Eliminar"
        confirmVariant="danger"
      />
    </>
  );
}
