import { useRef, useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { Modal } from '../shared/Modal';
import { TagSelector } from '../tags/TagSelector';
import { TagChip } from '../tags/TagChip';
import { useVaultStore } from '../../stores/vaultStore';
import { useUIStore } from '../../stores/uiStore';
import { useTagStore } from '../../stores/tagStore';
import type { VaultFile } from '../../types/vault';

interface FileFormProps {
  isOpen: boolean;
  onClose: () => void;
  editEntry?: VaultFile | null;
}

export function FileForm({ isOpen, onClose, editEntry }: FileFormProps) {
  const { createFile, updateFile } = useVaultStore();
  const { addToast } = useUIStore();
  const { tags } = useTagStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; content?: string }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!editEntry;

  // Populate form when editing or when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editEntry) {
        setName(editEntry.name);
        setDescription(editEntry.description ?? '');
        setContent('');
        setSelectedTagIds(editEntry.tags ?? []);
      } else {
        setName('');
        setDescription('');
        setContent('');
        setSelectedTagIds([]);
      }
      setErrors({});
    }
  }, [isOpen, editEntry]);

  const validate = (): boolean => {
    const newErrors: { name?: string; content?: string } = {};
    if (!name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    if (!isEditing && !content.trim()) {
      newErrors.content = 'El contenido es requerido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (isEditing && editEntry) {
        const updateData: {
          name?: string;
          description?: string;
          content?: string;
          tags?: string[];
        } = {
          name: name.trim(),
          description: description.trim(),
          tags: selectedTagIds,
        };
        if (content.trim()) {
          updateData.content = content.trim();
        }
        await updateFile(editEntry.id, updateData);
        addToast('Archivo actualizado correctamente', 'success');
      } else {
        await createFile({
          name: name.trim(),
          description: description.trim(),
          content: content.trim(),
          tags: selectedTagIds,
        });
        addToast('Archivo creado correctamente', 'success');
      }
      onClose();
    } catch {
      addToast('Error al guardar el archivo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Auto-fill name from filename if name is empty
    if (!name.trim()) {
      setName(file.name);
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === 'string') {
        setContent(text);
        // Clear content error if it was set
        if (errors.content) {
          setErrors((prev) => ({ ...prev, content: undefined }));
        }
      }
    };
    reader.readAsText(file);

    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const handleRemoveTag = (tagId: string) => {
    setSelectedTagIds((prev) => prev.filter((id) => id !== tagId));
  };

  const inputClass =
    'w-full bg-surface-dark border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Archivo' : 'Nuevo Archivo'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={(e) => void handleSubmit(e)}>
        <div className="px-6 py-4 flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="Ej: .env.production, config.json"
              className={inputClass}
              autoFocus
            />
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Descripción
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción opcional del archivo"
              className={inputClass}
            />
          </div>

          {/* Content */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Contenido {!isEditing && <span className="text-red-400">*</span>}
              </label>
              <button
                type="button"
                onClick={handleFileImport}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                <Upload size={13} />
                Importar Archivo
              </button>
            </div>
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (errors.content) setErrors((prev) => ({ ...prev, content: undefined }));
              }}
              placeholder={
                isEditing
                  ? 'Contenido encriptado — dejar vacío para mantener'
                  : 'Pega el contenido del archivo aquí...'
              }
              rows={8}
              className={`${inputClass} font-mono resize-y min-h-[12rem]`}
              spellCheck={false}
            />
            {errors.content && (
              <p className="text-xs text-red-400">{errors.content}</p>
            )}
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".env,.json,.txt,.yml,.yaml,.toml,.conf,.cfg,.properties"
              onChange={handleFileChange}
              className="hidden"
              aria-hidden="true"
            />
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Tags
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {selectedTagIds.map((tagId) => {
                const tag = tags[tagId];
                if (!tag) return null;
                return (
                  <TagChip
                    key={tagId}
                    tag={tag}
                    onRemove={() => handleRemoveTag(tagId)}
                  />
                );
              })}
              <TagSelector
                selectedTagIds={selectedTagIds}
                onChange={setSelectedTagIds}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-border">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent/80 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando...
              </>
            ) : isEditing ? (
              'Actualizar Archivo'
            ) : (
              'Crear Archivo'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
