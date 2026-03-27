import { useState, useEffect } from 'react';
import { Eye, EyeOff, Wand2, ChevronUp } from 'lucide-react';
import { Modal } from '../shared/Modal';
import { TagSelector } from '../tags/TagSelector';
import { TagChip } from '../tags/TagChip';
import { PasswordGenerator } from './PasswordGenerator';
import { useVaultStore } from '../../stores/vaultStore';
import { useUIStore } from '../../stores/uiStore';
import { useTagStore } from '../../stores/tagStore';
import type { VaultCredential } from '../../types/vault';

interface CredentialFormProps {
  isOpen: boolean;
  onClose: () => void;
  editEntry?: VaultCredential | null;
}

interface FormState {
  name: string;
  url: string;
  username: string;
  password: string;
  tags: string[];
  notes: string;
}

const emptyForm: FormState = {
  name: '',
  url: '',
  username: '',
  password: '',
  tags: [],
  notes: '',
};

export function CredentialForm({ isOpen, onClose, editEntry }: CredentialFormProps) {
  const { createCredential, updateCredential } = useVaultStore();
  const { addToast } = useUIStore();
  const { tags } = useTagStore();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const isEdit = !!editEntry;

  // Populate form when editing
  useEffect(() => {
    if (isOpen) {
      if (editEntry) {
        setForm({
          name: editEntry.name,
          url: editEntry.url,
          username: editEntry.username,
          password: '',
          tags: editEntry.tags,
          notes: editEntry.notes,
        });
      } else {
        setForm(emptyForm);
      }
      setErrors({});
      setShowPassword(false);
      setShowGenerator(false);
    }
  }, [isOpen, editEntry]);

  const validate = (): boolean => {
    const newErrors: Partial<FormState> = {};
    if (!form.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (isEdit && editEntry) {
        const updateData: Parameters<typeof updateCredential>[1] = {
          name: form.name.trim(),
          url: form.url.trim(),
          username: form.username.trim(),
          tags: form.tags,
          notes: form.notes.trim(),
        };
        if (form.password.trim()) {
          updateData.password = form.password;
        }
        await updateCredential(editEntry.id, updateData);
        addToast('Credencial actualizada', 'success');
      } else {
        await createCredential({
          name: form.name.trim(),
          url: form.url.trim(),
          username: form.username.trim(),
          password: form.password,
          tags: form.tags,
          notes: form.notes.trim(),
        });
        addToast('Credencial creada', 'success');
      }
      onClose();
    } catch {
      addToast('Error al guardar la credencial', 'error');
    } finally {
      setLoading(false);
    }
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Editar Credencial' : 'Nueva Credencial'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={(e) => void handleSubmit(e)}>
        <div className="px-6 py-4 flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="Ej: Gmail personal"
              className="bg-surface-dark border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
            />
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name}</p>
            )}
          </div>

          {/* URL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">URL</label>
            <input
              type="text"
              value={form.url}
              onChange={(e) => setField('url', e.target.value)}
              placeholder="https://gmail.com"
              className="bg-surface-dark border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
            />
          </div>

          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Usuario</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setField('username', e.target.value)}
              placeholder="usuario@ejemplo.com"
              autoComplete="off"
              className="bg-surface-dark border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                placeholder={isEdit ? 'Dejar vacío para mantener' : ''}
                autoComplete="new-password"
                className="w-full bg-surface-dark border border-surface-border rounded-lg px-3 py-2 pr-10 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Password generator toggle */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setShowGenerator((v) => !v)}
              className="flex items-center gap-1.5 self-start text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              {showGenerator ? <ChevronUp size={13} /> : <Wand2 size={13} />}
              {showGenerator ? 'Ocultar generador' : 'Generar contraseña'}
            </button>
            {showGenerator && (
              <PasswordGenerator
                onUse={(pw) => {
                  setField('password', pw);
                  setShowPassword(true);
                  setShowGenerator(false);
                }}
              />
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Tags</label>
            <div className="flex flex-wrap items-center gap-1.5">
              {form.tags.map((tagId) => {
                const tag = tags[tagId];
                if (!tag) return null;
                return (
                  <TagChip
                    key={tagId}
                    tag={tag}
                    onRemove={() => setField('tags', form.tags.filter((t) => t !== tagId))}
                  />
                );
              })}
              <TagSelector
                selectedTagIds={form.tags}
                onChange={(ids) => setField('tags', ids)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Notas</label>
            <textarea
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              placeholder="Notas adicionales..."
              rows={3}
              className="bg-surface-dark border border-surface-border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accent transition-colors resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent/80 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
