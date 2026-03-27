import { cn } from '../../lib/utils';

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
}

export function DatePicker({ value, onChange, label }: DatePickerProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (!raw) {
      onChange(null);
    } else {
      onChange(new Date(raw));
    }
  };

  // Convert Date to YYYY-MM-DD string for the native input
  const inputValue = value
    ? value.toISOString().split('T')[0]
    : '';

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm text-slate-400">{label}</label>
      )}
      <input
        type="date"
        value={inputValue}
        onChange={handleChange}
        className={cn(
          'bg-surface-dark border border-surface-border rounded-lg px-3 py-2',
          'text-slate-200 text-sm',
          'focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent',
          '[color-scheme:dark]',
        )}
      />
    </div>
  );
}
