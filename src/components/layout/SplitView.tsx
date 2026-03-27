import React from 'react';

interface SplitViewProps {
  left: React.ReactNode;
  right: React.ReactNode;
}

export default function SplitView({ left, right }: SplitViewProps) {
  return (
    <div className="grid grid-cols-2 h-full">
      <div className="overflow-auto border-r border-surface-border">
        {left}
      </div>
      <div className="overflow-auto">
        {right}
      </div>
    </div>
  );
}
