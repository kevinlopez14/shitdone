import { useState } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useOrgStore } from '../../stores/orgStore';
import { Modal } from '../shared/Modal';
import { ConfirmDialog } from '../shared/ConfirmDialog';

interface OrgManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrgManager({ isOpen, onClose }: OrgManagerProps) {
  const { organizations, createOrg, updateOrg, deleteOrg } = useOrgStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#3B82F6');
  const [creating, setCreating] = useState(false);

  const sortedOrgs = Object.values(organizations).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  const startEdit = (id: string) => {
    const org = organizations[id];
    if (!org) return;
    setEditingId(id);
    setEditName(org.name);
    setEditColor(org.color);
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
    await updateOrg(editingId, { name, color: editColor });
    cancelEdit();
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await createOrg(name, newColor);
      setNewName('');
      setNewColor('#3B82F6');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await deleteOrg(deletingId);
    setDeletingId(null);
  };

  const deletingOrg = deletingId ? organizations[deletingId] : null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Gestionar Organizaciones"
        maxWidth="max-w-md"
      >
        {/* Org list */}
        <div className="px-6 py-4 max-h-80 overflow-y-auto space-y-2">
          {sortedOrgs.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-4">
              No hay organizaciones creadas
            </p>
          )}
          {sortedOrgs.map((org) => (
            <div key={org.id} className="flex items-center gap-2">
              {editingId === org.id ? (
                // Inline edit
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
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: org.color }} />
                  <span className="flex-1 text-sm text-slate-200">{org.name}</span>
                  <button
                    onClick={() => startEdit(org.id)}
                    className="p-1 text-slate-500 hover:text-slate-200 transition-colors"
                    aria-label={`Editar organización ${org.name}`}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeletingId(org.id)}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    aria-label={`Eliminar organización ${org.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Footer: new org form */}
        <div className="border-t border-surface-border px-6 py-4">
          <p className="text-sm text-slate-400 font-medium mb-2">Nueva Organización</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleCreate(); } }}
              placeholder="Nombre de la organización"
              className="flex-1 bg-surface-dark border border-surface-border rounded-lg px-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-9 h-9 rounded cursor-pointer border border-surface-border bg-surface-dark p-0.5"
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
        title="Eliminar Organización"
        message={
          deletingOrg
            ? `¿Eliminar la organización "${deletingOrg.name}"? Se eliminarán las referencias en las tareas.`
            : '¿Eliminar esta organización?'
        }
        confirmLabel="Eliminar"
        confirmVariant="danger"
      />
    </>
  );
}
