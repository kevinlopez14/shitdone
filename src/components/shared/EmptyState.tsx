import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="text-slate-600 w-12 h-12 flex items-center justify-center">
        {icon}
      </div>
      <p className="text-lg font-medium text-slate-400">{title}</p>
      <p className="text-sm text-slate-600 text-center max-w-xs">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="bg-accent text-white px-4 py-2 rounded-lg text-sm hover:bg-accent/80 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
