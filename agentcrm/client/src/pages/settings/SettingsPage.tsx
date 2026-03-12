import { useState, useEffect } from 'react';
import {
  Users,
  RotateCcw,
  Bot,
  Plus,
  UserX,
  ToggleLeft,
  ToggleRight,
  Save,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getUsers, createUser, deactivateUser } from '../../services/userApi';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import type { User } from '../../utils/types';

type TabKey = 'users' | 'assignment' | 'agent';

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'users', label: 'Users', icon: <Users className="h-4 w-4" /> },
  { key: 'assignment', label: 'Assignment Rules', icon: <RotateCcw className="h-4 w-4" /> },
  { key: 'agent', label: 'Agent Config', icon: <Bot className="h-4 w-4" /> },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('users');

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage users and system configuration" />

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'assignment' && <AssignmentRulesTab />}
      {activeTab === 'agent' && <AgentConfigTab />}
    </div>
  );
}

/* ──────────────────────── Users Tab ──────────────────────── */

function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'SALES_REP',
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getUsers();
      setUsers(res.data.data ?? res.data ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async () => {
    try {
      await createUser(form);
      toast.success('User created');
      setShowCreate(false);
      setForm({ firstName: '', lastName: '', email: '', password: '', role: 'SALES_REP' });
      fetchUsers();
    } catch {
      toast.error('Failed to create user');
    }
  };

  const handleDeactivate = async (userId: number) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) return;
    try {
      await deactivateUser(userId);
      toast.success('User deactivated');
      fetchUsers();
    } catch {
      toast.error('Failed to deactivate user');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (row: User) => (
        <div>
          <p className="font-medium text-gray-900">
            {row.firstName} {row.lastName}
          </p>
          <p className="text-xs text-gray-500">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (row: User) => (
        <span className="text-sm text-gray-700">{row.role.replace(/_/g, ' ')}</span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (row: User) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            row.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (row: User) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: '',
      render: (row: User) =>
        row.isActive ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeactivate(row.id);
            }}
            className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <UserX className="h-3.5 w-3.5" /> Deactivate
          </button>
        ) : null,
    },
  ];

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Team Members</h3>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add User
          </button>
        </div>
        <DataTable columns={columns} data={users} loading={loading} emptyMessage="No users found" />
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create User">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="ADMIN">Admin</option>
              <option value="SALES_MANAGER">Sales Manager</option>
              <option value="SALES_REP">Sales Rep</option>
              <option value="SOLUTION_ARCHITECT">Solution Architect</option>
            </select>
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
              disabled={!form.firstName || !form.email || !form.password}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              Create User
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/* ──────────────────── Assignment Rules Tab ──────────────────── */

function AssignmentRulesTab() {
  const [roundRobinEnabled, setRoundRobinEnabled] = useState(true);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Round-Robin Assignment</h3>
        <p className="text-sm text-gray-500 mb-5">
          Automatically distribute new leads and tasks among available sales reps in a round-robin
          fashion.
        </p>

        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-900">Round-Robin Distribution</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {roundRobinEnabled
                ? 'New leads will be assigned to the next available rep in rotation'
                : 'Automatic assignment is paused. Leads must be assigned manually.'}
            </p>
          </div>
          <button
            onClick={() => {
              setRoundRobinEnabled(!roundRobinEnabled);
              toast.success(
                roundRobinEnabled ? 'Round-robin disabled' : 'Round-robin enabled'
              );
            }}
            className="shrink-0"
          >
            {roundRobinEnabled ? (
              <ToggleRight className="h-8 w-8 text-teal-600" />
            ) : (
              <ToggleLeft className="h-8 w-8 text-gray-400" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────── Agent Config Tab ──────────────────── */

function AgentConfigTab() {
  const [config, setConfig] = useState({
    leadScoringThreshold: 70,
    leadScoringAutoQualify: true,
    accountIntelEnabled: true,
    accountIntelRefreshDays: 7,
    dealCoachEnabled: true,
    dealCoachMinDealValue: 10000,
    followUpDefaultDays: 3,
    followUpUrgentDays: 1,
  });

  const handleSave = () => {
    toast.success('Agent configuration saved');
  };

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="space-y-6">
      {/* Lead Scoring */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Lead Scoring</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Qualification Threshold</label>
            <input
              type="number"
              min={0}
              max={100}
              value={config.leadScoringThreshold}
              onChange={(e) =>
                setConfig((c) => ({ ...c, leadScoringThreshold: Number(e.target.value) }))
              }
              className={inputClass}
            />
            <p className="text-xs text-gray-500 mt-1">
              Leads scoring above this value are auto-qualified
            </p>
          </div>
          <div className="flex items-center gap-3 pt-6">
            <button
              onClick={() =>
                setConfig((c) => ({ ...c, leadScoringAutoQualify: !c.leadScoringAutoQualify }))
              }
            >
              {config.leadScoringAutoQualify ? (
                <ToggleRight className="h-7 w-7 text-teal-600" />
              ) : (
                <ToggleLeft className="h-7 w-7 text-gray-400" />
              )}
            </button>
            <span className="text-sm text-gray-700">Auto-qualify leads above threshold</span>
          </div>
        </div>
      </div>

      {/* Account Intel */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Account Intelligence</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                setConfig((c) => ({ ...c, accountIntelEnabled: !c.accountIntelEnabled }))
              }
            >
              {config.accountIntelEnabled ? (
                <ToggleRight className="h-7 w-7 text-teal-600" />
              ) : (
                <ToggleLeft className="h-7 w-7 text-gray-400" />
              )}
            </button>
            <span className="text-sm text-gray-700">Enable Account Intelligence signals</span>
          </div>
          <div>
            <label className={labelClass}>Signal Refresh Interval (days)</label>
            <input
              type="number"
              min={1}
              value={config.accountIntelRefreshDays}
              onChange={(e) =>
                setConfig((c) => ({ ...c, accountIntelRefreshDays: Number(e.target.value) }))
              }
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Deal Coach */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Deal Coach</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                setConfig((c) => ({ ...c, dealCoachEnabled: !c.dealCoachEnabled }))
              }
            >
              {config.dealCoachEnabled ? (
                <ToggleRight className="h-7 w-7 text-teal-600" />
              ) : (
                <ToggleLeft className="h-7 w-7 text-gray-400" />
              )}
            </button>
            <span className="text-sm text-gray-700">Enable AI Deal Coach briefs</span>
          </div>
          <div>
            <label className={labelClass}>Minimum Deal Value ($)</label>
            <input
              type="number"
              min={0}
              value={config.dealCoachMinDealValue}
              onChange={(e) =>
                setConfig((c) => ({ ...c, dealCoachMinDealValue: Number(e.target.value) }))
              }
              className={inputClass}
            />
            <p className="text-xs text-gray-500 mt-1">
              Only generate briefs for deals above this value
            </p>
          </div>
        </div>
      </div>

      {/* Follow-Up Timing */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Follow-Up Timing</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Default Follow-Up (days)</label>
            <input
              type="number"
              min={1}
              value={config.followUpDefaultDays}
              onChange={(e) =>
                setConfig((c) => ({ ...c, followUpDefaultDays: Number(e.target.value) }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Urgent Follow-Up (days)</label>
            <input
              type="number"
              min={1}
              value={config.followUpUrgentDays}
              onChange={(e) =>
                setConfig((c) => ({ ...c, followUpUrgentDays: Number(e.target.value) }))
              }
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Save className="h-4 w-4" /> Save Configuration
        </button>
      </div>
    </div>
  );
}
