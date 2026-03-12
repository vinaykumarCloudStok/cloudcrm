import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { getCampaigns, createCampaign } from '../../services/campaignApi';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import type { Campaign } from '../../utils/types';

export default function CampaignListPage() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', targetSegment: '' });

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const res = await getCampaigns(params);
      setCampaigns(res.data.data ?? res.data ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [statusFilter]);

  const handleCreate = async () => {
    try {
      await createCampaign(form);
      toast.success('Campaign created');
      setShowCreate(false);
      setForm({ name: '', description: '', targetSegment: '' });
      fetchCampaigns();
    } catch {
      toast.error('Failed to create campaign');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Campaign',
      sortable: true,
      render: (row: Campaign) => (
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          {row.description && (
            <p className="text-xs text-gray-500 line-clamp-1">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: Campaign) => <StatusBadge status={row.status} />,
    },
    {
      key: 'steps',
      label: 'Steps',
      render: (row: Campaign) => row._count?.steps ?? row.steps?.length ?? 0,
    },
    {
      key: 'enrollments',
      label: 'Enrollments',
      render: (row: Campaign) => row._count?.enrollments ?? row.enrollments?.length ?? 0,
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (row: Campaign) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <PageHeader title="Campaigns" subtitle="Manage outbound campaigns">
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Campaign
        </button>
      </PageHeader>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={campaigns}
        loading={loading}
        onRowClick={(row) => navigate(`/campaigns/${row.id}`)}
        emptyMessage="No campaigns found"
      />

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Campaign">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Campaign name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Brief description of this campaign"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Segment</label>
            <input
              type="text"
              value={form.targetSegment}
              onChange={(e) => setForm((f) => ({ ...f, targetSegment: e.target.value }))}
              placeholder="e.g. Enterprise, SMB, Churned"
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
              disabled={!form.name.trim()}
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
