import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Plus, Search } from 'lucide-react';
import { getOpportunities } from '../../services/opportunityApi';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import type { Opportunity } from '../../utils/types';

export default function OpportunityListPage() {
  const navigate = useNavigate();
  const [opps, setOpps] = useState<Opportunity[]>([]);
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
        const res = await getOpportunities(params);
        setOpps(res.data.data ?? res.data ?? []);
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
      label: 'Opportunity',
      sortable: true,
      render: (row: Opportunity) => (
        <div>
          <p className="font-medium text-gray-900">{row.name}</p>
          <p className="text-xs text-gray-500">{row.account?.companyName}</p>
        </div>
      ),
    },
    {
      key: 'stage',
      label: 'Stage',
      render: (row: Opportunity) => <StatusBadge status={row.stage} />,
    },
    {
      key: 'dealValue',
      label: 'Value',
      sortable: true,
      render: (row: Opportunity) => `$${(row.dealValue / 1000).toFixed(0)}K`,
    },
    {
      key: 'probability',
      label: 'Probability',
      sortable: true,
      render: (row: Opportunity) => `${row.probability}%`,
    },
    {
      key: 'owner',
      label: 'Owner',
      render: (row: Opportunity) =>
        row.owner ? `${row.owner.firstName} ${row.owner.lastName}` : '-',
    },
    {
      key: 'expectedCloseDate',
      label: 'Close Date',
      sortable: true,
      render: (row: Opportunity) =>
        row.expectedCloseDate ? new Date(row.expectedCloseDate).toLocaleDateString() : '-',
    },
  ];

  return (
    <div>
      <PageHeader title="Opportunities" subtitle="Manage your sales opportunities">
        <button
          onClick={() => navigate('/opportunities/new')}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Opportunity
        </button>
      </PageHeader>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2 flex-1 max-w-sm bg-white border border-gray-200 rounded-lg px-3 py-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search opportunities..."
            className="flex-1 text-sm outline-none bg-transparent"
          />
        </div>
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700"
        >
          <option value="">All Stages</option>
          <option value="DISCOVERY">Discovery</option>
          <option value="PROPOSAL">Proposal</option>
          <option value="TECHNICAL_VALIDATION">Technical Validation</option>
          <option value="BUSINESS_VALIDATION">Business Validation</option>
          <option value="NEGOTIATION">Negotiation</option>
          <option value="CONTRACT_SENT">Contract Sent</option>
          <option value="CLOSED_WON">Closed Won</option>
          <option value="CLOSED_LOST">Closed Lost</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={opps}
        loading={loading}
        onRowClick={(row) => navigate(`/opportunities/${row.id}`)}
        emptyMessage="No opportunities found"
      />
    </div>
  );
}
