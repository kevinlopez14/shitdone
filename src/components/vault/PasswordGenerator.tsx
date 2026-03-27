import { useState, useEffect, useCallback } from 'react';
import { Copy, RefreshCw } from 'lucide-react';

interface PasswordGeneratorProps {
  onUse: (password: string) => void;
}

interface Options {
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

const CHARSET = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{}|;:,.<>?',
} as const;

function generatePassword(length: number, options: Options): string {
  let charset = '';
  if (options.uppercase) charset += CHARSET.uppercase;
  if (options.lowercase) charset += CHARSET.lowercase;
  if (options.numbers) charset += CHARSET.numbers;
  if (options.symbols) charset += CHARSET.symbols;

  if (!charset) return '';

  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  return Array.from(array)
    .map((val) => charset[val % charset.length])
    .join('');
}

export function PasswordGenerator({ onUse }: PasswordGeneratorProps) {
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState<Options>({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const regenerate = useCallback(() => {
    setPassword(generatePassword(length, options));
  }, [length, options]);

  // Generate on mount and whenever length/options change
  useEffect(() => {
    regenerate();
  }, [regenerate]);

  const activeCount = Object.values(options).filter(Boolean).length;

  const toggleOption = (key: keyof Options) => {
    if (options[key] && activeCount === 1) return; // Prevent disabling the last one
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password).catch(() => {/* ignore */});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const toggleLabels: { key: keyof Options; label: string }[] = [
    { key: 'uppercase', label: 'Mayúsculas' },
    { key: 'lowercase', label: 'Minúsculas' },
    { key: 'numbers', label: 'Números' },
    { key: 'symbols', label: 'Símbolos' },
  ];

  return (
    <div className="bg-surface-dark rounded-lg p-4 border border-surface-border flex flex-col gap-3">
      {/* Password display */}
      <div className="flex items-center gap-2">
        <div className="flex-1 font-mono text-sm bg-surface rounded px-3 py-2 text-accent break-all min-h-[36px]">
          {password}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex-shrink-0 p-1.5 rounded text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Copiar contraseña"
          title={copied ? '¡Copiado!' : 'Copiar'}
        >
          <Copy size={15} className={copied ? 'text-green-400' : ''} />
        </button>
      </div>

      {/* Length slider */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Longitud</span>
          <span className="text-xs font-mono text-slate-300">{length}</span>
        </div>
        <input
          type="range"
          min={12}
          max={64}
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((length - 12) / (64 - 12)) * 100}%, #2A2D3A ${((length - 12) / (64 - 12)) * 100}%, #2A2D3A 100%)`,
          }}
        />
      </div>

      {/* Toggle options */}
      <div className="grid grid-cols-2 gap-2">
        {toggleLabels.map(({ key, label }) => {
          const isOn = options[key];
          const isDisabled = isOn && activeCount === 1;
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleOption(key)}
              disabled={isDisabled}
              className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-surface border border-surface-border hover:border-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="text-xs text-slate-300">{label}</span>
              {/* Pill toggle */}
              <div
                className={`relative w-8 h-4 rounded-full transition-colors flex-shrink-0 ${
                  isOn ? 'bg-accent' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                    isOn ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={regenerate}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-surface border border-surface-border rounded-lg hover:border-slate-500 transition-colors"
        >
          <RefreshCw size={13} />
          Regenerar
        </button>
        <button
          type="button"
          onClick={() => onUse(password)}
          disabled={!password}
          className="flex-1 px-3 py-1.5 text-xs font-medium bg-accent text-white rounded-lg hover:bg-accent/80 disabled:opacity-50 transition-colors"
        >
          Usar
        </button>
      </div>
    </div>
  );
}
