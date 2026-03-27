import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Modal } from '../shared/Modal';
import { useVaultStore } from '../../stores/vaultStore';

interface VaultSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StrengthResult {
  score: number; // 0–4
  label: string;
  color: string;
  barColor: string;
}

function evaluateStrength(password: string): StrengthResult {
  if (password.length === 0) {
    return { score: 0, label: '', color: 'bg-slate-700', barColor: 'bg-slate-700' };
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  // Normalize to 0–4
  const normalized = Math.min(4, score);

  if (normalized <= 1) {
    return { score: normalized, label: 'Débil', color: 'text-red-400', barColor: 'bg-red-500' };
  } else if (normalized <= 2) {
    return { score: normalized, label: 'Regular', color: 'text-orange-400', barColor: 'bg-orange-400' };
  } else if (normalized <= 3) {
    return { score: normalized, label: 'Media', color: 'text-yellow-400', barColor: 'bg-yellow-400' };
  } else {
    return { score: normalized, label: 'Fuerte', color: 'text-green-400', barColor: 'bg-green-500' };
  }
}

// No-op close — prevents closing via Escape or backdrop
const noop = () => {};

export function VaultSetupModal({ isOpen, onClose }: VaultSetupModalProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mismatchError, setMismatchError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const passwordRef = useRef<HTMLInputElement>(null);
  const strength = evaluateStrength(password);

  // Auto-focus first input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        passwordRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setConfirm('');
      setShowPassword(false);
      setShowConfirm(false);
      setMismatchError(false);
      setSubmitting(false);
    }
  }, [isOpen]);

  const tooShort = password.length > 0 && password.length < 8;
  const canSubmit = password.length >= 8 && confirm.length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;

    if (password !== confirm) {
      setMismatchError(true);
      return;
    }

    setMismatchError(false);
    setSubmitting(true);

    try {
      await useVaultStore.getState().setup(password);
      onClose();
    } catch {
      // If setup throws, allow retrying
      setSubmitting(false);
      console.error('Error setting up vault');
    }
  }

  function handlePasswordChange(value: string) {
    setPassword(value);
    if (mismatchError) setMismatchError(false);
  }

  function handleConfirmChange(value: string) {
    setConfirm(value);
    if (mismatchError) setMismatchError(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      void handleSubmit();
    }
  }

  // Strength bar segments
  const segments = [1, 2, 3, 4];

  return (
    <Modal isOpen={isOpen} onClose={noop} title="Configurar Bóveda" maxWidth="max-w-md">
      <div className="px-6 py-5 flex flex-col gap-5">
        {/* Password field */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Contraseña maestra
          </label>
          <div className="relative">
            <input
              ref={passwordRef}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Mínimo 8 caracteres"
              className="w-full bg-surface-dark border border-surface-border rounded-lg px-3 py-2 pr-10 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-200 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {tooShort && (
            <p className="text-red-400 text-xs">La contraseña debe tener al menos 8 caracteres.</p>
          )}
        </div>

        {/* Strength indicator */}
        {password.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-1">
              {segments.map((seg) => (
                <div
                  key={seg}
                  className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                    strength.score >= seg ? strength.barColor : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
            <p className={`text-xs ${strength.color}`}>
              Seguridad: {strength.label}
            </p>
          </div>
        )}

        {/* Confirm field */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Confirmar contraseña
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => handleConfirmChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Repite la contraseña"
              className="w-full bg-surface-dark border border-surface-border rounded-lg px-3 py-2 pr-10 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-200 transition-colors"
              tabIndex={-1}
              aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {mismatchError && (
            <p className="text-red-400 text-xs">Las contraseñas no coinciden.</p>
          )}
        </div>

        {/* Warning */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
          <p className="text-amber-400/80 text-xs leading-relaxed">
            Esta contraseña no se puede recuperar. Si la olvidas, perderás acceso a tus datos.
          </p>
        </div>

        {/* Submit button */}
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!canSubmit || tooShort}
          className="w-full bg-accent text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Creando...' : 'Crear Contraseña'}
        </button>
      </div>
    </Modal>
  );
}
