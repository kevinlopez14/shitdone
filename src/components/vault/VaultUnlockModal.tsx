import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Modal } from '../shared/Modal';
import { useVaultStore } from '../../stores/vaultStore';

interface VaultUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// No-op close — prevents closing via Escape or backdrop
const noop = () => {};

export function VaultUnlockModal({ isOpen, onClose }: VaultUnlockModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setShowPassword(false);
      setError(false);
      setSubmitting(false);
    }
  }, [isOpen]);

  const canSubmit = password.length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;

    setError(false);
    setSubmitting(true);

    try {
      const success = await useVaultStore.getState().unlock(password);
      if (success) {
        onClose();
      } else {
        setError(true);
        setSubmitting(false);
        // Re-focus input and clear password on failure
        setPassword('');
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    } catch {
      setError(true);
      setSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      void handleSubmit();
    }
  }

  function handleChange(value: string) {
    setPassword(value);
    if (error) setError(false);
  }

  return (
    <Modal isOpen={isOpen} onClose={noop} title="Desbloquear Bóveda" maxWidth="max-w-sm">
      <div className="px-6 py-5 flex flex-col items-center gap-5">
        {/* Lock icon */}
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-dark border border-surface-border">
          <Lock size={26} strokeWidth={1.5} className="text-accent" />
        </div>

        {/* Password field */}
        <div className="w-full flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Contraseña maestra
          </label>
          <div className="relative">
            <input
              ref={inputRef}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Introduce tu contraseña"
              className={`w-full bg-surface-dark border rounded-lg px-3 py-2 pr-10 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors ${
                error
                  ? 'border-red-500/60 focus:ring-red-500/30 focus:border-red-500'
                  : 'border-surface-border'
              }`}
              autoComplete="current-password"
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
          {error && (
            <p className="text-red-400 text-xs">Contraseña incorrecta.</p>
          )}
        </div>

        {/* Submit button */}
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!canSubmit}
          className="w-full bg-accent text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Desbloqueando...' : 'Desbloquear'}
        </button>
      </div>
    </Modal>
  );
}
