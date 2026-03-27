import { useEffect, useState } from 'react';
import { useUIStore } from './stores/uiStore';
import { useTaskStore } from './stores/taskStore';
import { useNoteStore } from './stores/noteStore';
import { useTagStore } from './stores/tagStore';
import { useOrgStore } from './stores/orgStore';
import { initAuth } from './lib/firebase';
import TopNav from './components/layout/TopNav';
import SplitView from './components/layout/SplitView';
import TasksPage from './pages/TasksPage';
import NotesPage from './pages/NotesPage';
import VaultPage from './pages/VaultPage';
import { LoadingScreen } from './components/shared/LoadingSpinner';
import { ToastContainer } from './components/shared/Toast';

function App() {
  const { activeView, isSplitView, toggleSplitView } = useUIStore();
  const { fetchTasks, fetchColumns } = useTaskStore();
  const { fetchNotes } = useNoteStore();
  const { fetchTags } = useTagStore();
  const { fetchOrgs } = useOrgStore();

  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Firebase initialization + initial data load
  useEffect(() => {
    initAuth()
      .then(async () => {
        // Load all data after auth is ready
        await Promise.all([
          fetchTasks(),
          fetchColumns(),
          fetchNotes(),
          fetchTags(),
          fetchOrgs(),
        ]);
        setInitialized(true);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Error de inicialización';
        setError(message);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;

      if (e.key === 'k') {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('shitdone:focus-search'));
      }

      if (e.key === '\\') {
        e.preventDefault();
        toggleSplitView();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSplitView]);

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-surface-dark text-slate-400">
        <p className="text-lg font-medium text-red-400">Error de conexión</p>
        <p className="text-sm text-slate-500 max-w-sm text-center">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-accent text-white px-4 py-2 rounded-lg text-sm hover:bg-accent/80 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!initialized) {
    return <LoadingScreen />;
  }

  return (
    <div className="h-screen flex flex-col bg-surface-dark">
      <TopNav />
      <main className="flex-1 overflow-hidden">
        {isSplitView ? (
          <SplitView
            left={<TasksPage />}
            right={<NotesPage />}
          />
        ) : activeView === 'tasks' ? (
          <TasksPage />
        ) : activeView === 'vault' ? (
          <VaultPage />
        ) : (
          <NotesPage />
        )}
      </main>
      <ToastContainer />
    </div>
  );
}

export default App;
