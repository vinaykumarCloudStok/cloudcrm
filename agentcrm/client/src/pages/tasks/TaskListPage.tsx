import { useState, useEffect } from 'react';
import { Plus, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { getTasks, updateTask, createTask } from '../../services/taskApi';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import type { Task } from '../../utils/types';

export default function TaskListPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'PENDING',
    dueDate: '',
  });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      const res = await getTasks(params);
      setTasks(res.data.data ?? res.data ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter]);

  const handleMarkComplete = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    try {
      const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      await updateTask(task.id, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
      toast.success(`Task ${newStatus === 'COMPLETED' ? 'completed' : 'reopened'}`);
    } catch {
      toast.error('Failed to update task');
    }
  };

  const handleCreate = async () => {
    try {
      const payload: any = { ...form };
      if (!payload.dueDate) delete payload.dueDate;
      await createTask(payload);
      toast.success('Task created');
      setShowCreate(false);
      setForm({ title: '', description: '', priority: 'MEDIUM', status: 'PENDING', dueDate: '' });
      fetchTasks();
    } catch {
      toast.error('Failed to create task');
    }
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const priorityDot = (priority: string) => {
    const colors: Record<string, string> = {
      URGENT: 'bg-red-500',
      HIGH: 'bg-orange-500',
      MEDIUM: 'bg-amber-500',
      LOW: 'bg-gray-400',
    };
    return <div className={`h-2.5 w-2.5 rounded-full ${colors[priority] ?? 'bg-gray-400'}`} />;
  };

  const columns = [
    {
      key: 'title',
      label: 'Task',
      sortable: true,
      render: (row: Task) => (
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => handleMarkComplete(e, row)}
            className={`h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
              row.status === 'COMPLETED'
                ? 'bg-teal-600 border-teal-600 text-white'
                : 'border-gray-300 hover:border-teal-400'
            }`}
          >
            {row.status === 'COMPLETED' && (
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </button>
          <div className="min-w-0">
            <span
              className={`block truncate ${
                row.status === 'COMPLETED' ? 'line-through text-gray-400' : 'text-gray-900'
              }`}
            >
              {row.title}
            </span>
            {row.description && (
              <p className="text-xs text-gray-500 line-clamp-1">{row.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (row: Task) => (
        <div className="flex items-center gap-2">
          {priorityDot(row.priority)}
          <span className="text-sm capitalize">{row.priority.toLowerCase()}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: Task) => <StatusBadge status={row.status} />,
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      sortable: true,
      render: (row: Task) => {
        if (!row.dueDate) return <span className="text-gray-400">-</span>;
        const overdue = isOverdue(row.dueDate) && row.status !== 'COMPLETED';
        return (
          <span className={overdue ? 'text-red-600 font-medium' : 'text-gray-700'}>
            {new Date(row.dueDate).toLocaleDateString()}
            {overdue && <span className="ml-1 text-xs">(overdue)</span>}
          </span>
        );
      },
    },
    {
      key: 'assignedTo',
      label: 'Assigned To',
      render: (row: Task) =>
        row.assignedTo ? `${row.assignedTo.firstName} ${row.assignedTo.lastName}` : '-',
    },
  ];

  return (
    <div>
      <PageHeader title="Tasks" subtitle="Manage your to-do list">
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Task
        </button>
      </PageHeader>

      <div className="flex items-center gap-4 mb-4">
        <Filter className="h-4 w-4 text-gray-400" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700"
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>

      <DataTable columns={columns} data={tasks} loading={loading} emptyMessage="No tasks found" />

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Task">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Task title"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Optional description"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!form.title.trim()}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              Create
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
