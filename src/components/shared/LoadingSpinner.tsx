const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
} as const;

interface LoadingSpinnerProps {
  size?: keyof typeof sizeMap;
}

export function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
  return (
    <div
      className={`${sizeMap[size]} border-2 border-surface-border border-t-accent rounded-full animate-spin`}
      role="status"
      aria-label="Cargando"
    />
  );
}

export function LoadingScreen() {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-3 bg-surface-dark">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-slate-500">Cargando...</p>
    </div>
  );
}
