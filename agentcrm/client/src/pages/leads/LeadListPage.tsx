import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Plus, Search } from 'lucide-react';
import { getLeads } from '../../services/leadApi';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import ScoreBadge from '../../components/ui/ScoreBadge';
import type { Lead } from '../../utils/types';

export default function LeadListPage() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const params: any = {};
        if (search) params.search = search;
        if (stageFilter) params.stage = stageFilter;
        const res = await getLeads(params);
        setLeads(res.data.data ?? res.data ?? []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [search, stageFilter]);

  const columns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (row: Lead) => (
        <div>
          <p className="font-medium text-gray-900">{row.firstName} {row.lastName}</p>
          <p className="text-xs text-gray-500">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'stage',
      label: 'Stage',
      render: (row: Lead) => <StatusBadge status={row.stage} />,
    },
    {
      key: 'aiScore',
      label: 'AI Score',
      sortable: true,
      render: (row: Lead) => <ScoreBadge score={row.aiScore} />,
    },
    {
      key: 'account',
      label: 'Account',
      render: (row: Lead) => row.account?.companyName ?? '-',
    },
    {
      key: 'assignedRep',
      label: 'Assigned Rep',
      render: (row: Lead) =>
        row.assignedRep ? `${row.assignedRep.firstName} ${row.assignedRep.lastName}` : '-',
    },
    {
      key: 'source',
      label: 'Source',
      render: (row: Lead) => row.source ?? '-',
    },
  ];

  return (
    <div>
      <PageHeader title="Leads" subtitle="Track and manage your sales leads">
        <button
          onClick={() => navigate('/leads/new')}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Lead
        </button>
      </PageHeader>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2 flex-1 max-w-sm bg-white border border-gray-200 rounded-lg px-3 py-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads..."
            className="flex-1 text-sm outline-none bg-transparent"
          />
        </div>
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700"
        >
          <option value="">All Stages</option>
          <option value="NEW">New</option>
          <option value="CONTACTED">Contacted</option>
          <option value="ENGAGED">Engaged</option>
          <option value="QUALIFIED">Qualified</option>
          <option value="NURTURE">Nurture</option>
          <option value="DISQUALIFIED">Disqualified</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={leads}
        loading={loading}
        onRowClick={(row) => navigate(`/leads/${row.id}`)}
        emptyMessage="No leads found"
      />
    </div>
  );
}
