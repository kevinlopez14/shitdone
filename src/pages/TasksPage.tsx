import { useEffect, useMemo } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { useUIStore } from '../stores/uiStore';
import { useTagStore } from '../stores/tagStore';
import { useOrgStore } from '../stores/orgStore';
import { useFilteredTasks } from '../hooks/useSearch';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { TaskDetail } from '../components/kanban/TaskDetail';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import type { Task } from '../types';

export default function TasksPage() {
  const { tasks, columns, loading, fetchTasks, fetchColumns } = useTaskStore();
  const { selectedTaskId, setSelectedTaskId } = useUIStore();
  const { tags, fetchTags } = useTagStore();
  const { fetchOrgs } = useOrgStore();

  useEffect(() => {
    // Fetch data on mount if stores are empty
    if (Object.keys(tasks).length === 0) void fetchTasks();
    if (Object.keys(columns).length === 0) void fetchColumns();
    if (Object.keys(tags).length === 0) void fetchTags();
    void fetchOrgs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTasks = useFilteredTasks(tasks);

  // Group tasks by column and sort by order
  const tasksByColumn = useMemo(() => {
    const grouped: Record<string, Task[]> = {};

    // Initialize all columns with empty arrays
    for (const colId of Object.keys(columns)) {
      grouped[colId] = [];
    }

    for (const task of filteredTasks) {
      if (!grouped[task.columnId]) {
        grouped[task.columnId] = [];
      }
      grouped[task.columnId].push(task);
    }

    // Sort tasks within each column by order
    for (const colId of Object.keys(grouped)) {
      grouped[colId].sort((a, b) => a.order - b.order);
    }

    return grouped;
  }, [filteredTasks, columns]);

  // Sort columns by order
  const sortedColumns = useMemo(
    () => Object.values(columns).sort((a, b) => a.order - b.order),
    [columns],
  );

  if (loading && Object.keys(columns).length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <KanbanBoard columns={sortedColumns} tasksByColumn={tasksByColumn} />
      {selectedTaskId && (
        <TaskDetail
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  );
}
