import { Columns2 } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../lib/utils';
import SearchBar from './SearchBar';

const TABS = [
  { id: 'tasks' as const, label: 'Tareas' },
  { id: 'notes' as const, label: 'Notas' },
] as const;

export default function TopNav() {
  const { activeView, setActiveView, isSplitView, toggleSplitView } =
    useUIStore();

  return (
    <header
      className={cn(
        'flex flex-col px-4 bg-surface border-b border-surface-border shrink-0 transition-all duration-200',
      )}
    >
      {/* Main nav row */}
      <div className="h-12 flex items-center gap-4">
        {/* Left: App title */}
        <div className="flex items-center w-40 shrink-0">
          <span className="font-semibold text-lg text-white">ShitDone</span>
        </div>

        {/* Center: Tab buttons + SearchBar */}
        <div className="flex flex-1 items-center gap-6 min-w-0">
          <nav className="flex items-center gap-1 shrink-0">
            {TABS.map((tab) => {
              const isActive = !isSplitView && activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={cn(
                    'relative h-12 px-4 text-sm font-medium transition-colors duration-200',
                    isActive
                      ? 'text-accent border-b-2 border-accent'
                      : 'text-slate-400 hover:text-slate-200',
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* SearchBar — sits in a flex child that can grow vertically */}
          <div className="flex-1 min-w-0 py-1.5">
            <SearchBar />
          </div>
        </div>

        {/* Right: Split view toggle */}
        <div className="flex items-center justify-end w-40 shrink-0">
          <button
            onClick={toggleSplitView}
            title={isSplitView ? 'Exit split view' : 'Enter split view'}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-200',
              isSplitView
                ? 'bg-accent/20 text-accent'
                : 'text-slate-400 hover:text-slate-200',
            )}
          >
            <Columns2 size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
