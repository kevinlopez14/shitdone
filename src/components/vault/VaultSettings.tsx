import { useState } from 'react';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Modal } from '../shared/Modal';
import { useVaultStore } from '../../stores/vaultStore';
import { useUIStore } from '../../stores/uiStore';
import type { VaultCredential, VaultFile } from '../../types/vault';

interface VaultSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const emptyForm: FormState = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export function VaultSettings({ isOpen, onClose }: VaultSettingsProps) {
  const { config, entries, decryptField } = useVaultStore();
  const { addToast } = useUIStore();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [show, setShow] = useState({ current: false, newPw: false, confirm: false });
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<FormState> = {};
    if (!form.currentPassword) newErrors.currentPassword = 'La contraseña actual es requerida';
    if (!form.newPassword) newErrors.newPassword = 'La nueva contraseña es requerida';
    else if (form.newPassword.length < 8)
      newErrors.newPassword = 'Mínimo 8 caracteres';
    if (form.newPassword !== form.confirmPassword)
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !config) return;

    setLoading(true);
    setProgress(null);

    try {
      // 1. Change password in the crypto layer — validates old password
      let newCredentials: { salt: string; verificationHash: string };
      try {
        newCredentials = await window.electronAPI.vaultChangePassword(
          form.currentPassword,
          form.newPassword,
          config.salt,
          config.verificationHash,
        );
      } catch {
        setErrors({ currentPassword: 'Contraseña actual incorrecta' });
        return;
      }

      const allEntries = Object.values(entries);
      setProgress({ current: 0, total: allEntries.length });

      // 2. Re-encrypt all entries
      const batch = writeBatch(db);

      for (let i = 0; i < allEntries.length; i++) {
        const entry = allEntries[i];
        setProgress({ current: i + 1, total: allEntries.length });

        if (entry.type === 'credential') {
          const cred = entry as VaultCredential;
          const plaintext = await decryptField(cred.encryptedPassword, cred.iv, cred.authTag);
          const { encrypted, iv, authTag } = await window.electronAPI.vaultEncrypt(plaintext);
          batch.update(doc(db, 'vaultEntries', entry.id), {
            encryptedPassword: encrypted,
            iv,
            authTag,
          });
        } else {
          const file = entry as VaultFile;
          const plaintext = await decryptField(file.encryptedContent, file.iv, file.authTag);
          const { encrypted, iv, authTag } = await window.electronAPI.vaultEncrypt(plaintext);
          batch.update(doc(db, 'vaultEntries', entry.id), {
            encryptedContent: encrypted,
            iv,
            authTag,
          });
        }
      }

      // 3. Update vault config in Firestore
      await updateDoc(doc(db, 'vaultConfig', config.id), {
        salt: newCredentials.salt,
        verificationHash: newCredentials.verificationHash,
      });

      // 4. Commit re-encrypted entries
      await batch.commit();

      // 5. Update local store config
      useVaultStore.setState({
        config: {
          ...config,
          salt: newCredentials.salt,
          verificationHash: newCredentials.verificationHash,
        },
      });

      addToast('Contraseña maestra actualizada correctamente', 'success');
      setForm(emptyForm);
      setProgress(null);
      onClose();
    } catch {
      addToast('Error al cambiar la contraseña maestra', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setForm(emptyForm);
    setErrors({});
    setProgress(null);
    onClose();
  };

  const inputClass =
    'w-full bg-surface-dark border border-surface-border rounded-lg px-3 py-2 pr-10 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accent transition-colors';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Configuración de Bóveda" maxWidth="max-w-md">
      <form onSubmit={(e) => void handleSubmit(e)}>
        <div className="px-6 py-4 flex flex-col gap-5">
          {/* Section heading */}
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-1">
              Cambiar Contraseña Maestra
            </h3>
            {/* Warning */}
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2.5 mt-2">
              <AlertTriangle size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">
                Todas las entradas serán re-encriptadas con la nueva contraseña.
              </p>
            </div>
          </div>

          {/* Current password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Contraseña actual</label>
            <div className="relative">
              <input
                type={show.current ? 'text' : 'password'}
                value={form.currentPassword}
                onChange={(e) => setField('currentPassword', e.target.value)}
                placeholder="Tu contraseña actual"
                autoComplete="current-password"
                disabled={loading}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShow((s) => ({ ...s, current: !s.current }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                tabIndex={-1}
                aria-label={show.current ? 'Ocultar' : 'Mostrar'}
              >
                {show.current ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-xs text-red-400">{errors.currentPassword}</p>
            )}
          </div>

          {/* New password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Nueva contraseña</label>
            <div className="relative">
              <input
                type={show.newPw ? 'text' : 'password'}
                value={form.newPassword}
                onChange={(e) => setField('newPassword', e.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                disabled={loading}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShow((s) => ({ ...s, newPw: !s.newPw }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                tabIndex={-1}
                aria-label={show.newPw ? 'Ocultar' : 'Mostrar'}
              >
                {show.newPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-xs text-red-400">{errors.newPassword}</p>
            )}
          </div>

          {/* Confirm new password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Confirmar nueva contraseña</label>
            <div className="relative">
              <input
                type={show.confirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(e) => setField('confirmPassword', e.target.value)}
                placeholder="Repite la nueva contraseña"
                autoComplete="new-password"
                disabled={loading}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                tabIndex={-1}
                aria-label={show.confirm ? 'Ocultar' : 'Mostrar'}
              >
                {show.confirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-400">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Progress indicator */}
          {loading && progress && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-slate-400">
                Re-encriptando entradas... {progress.current}/{progress.total}
              </p>
              <div className="h-1.5 bg-surface-dark rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-300"
                  style={{
                    width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : '0%',
                  }}
                />
              </div>
            </div>
          )}
          {loading && !progress && (
            <p className="text-xs text-slate-400">Verificando contraseña...</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-border">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent/80 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Procesando...' : 'Cambiar Contraseña'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
