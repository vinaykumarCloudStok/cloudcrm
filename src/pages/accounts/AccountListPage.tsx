import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Search } from 'lucide-react';
import { getAccounts } from '../../services/accountApi';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import HealthScoreBar from '../../components/ui/HealthScoreBar';
import EmptyState from '../../components/ui/EmptyState';
import type { Account } from '../../utils/types';

export default function AccountListPage() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const params: any = {};
        if (search) params.search = search;
        if (statusFilter) params.status = statusFilter;
        const res = await getAccounts(params);
        setAccounts(res.data.data ?? res.data ?? []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [search, statusFilter]);

  const columns = [
    {
      key: 'companyName',
      label: 'Company',
      sortable: true,
      render: (row: Account) => (
        <div>
          <p className="font-medium text-gray-900">{row.companyName}</p>
          {row.industry && <p className="text-xs text-gray-500">{row.industry}</p>}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: Account) => <StatusBadge status={row.status} />,
    },
    {
      key: 'healthScore',
      label: 'Health',
      sortable: true,
      render: (row: Account) => (
        <div className="w-32">
          <HealthScoreBar score={row.healthScore} />
        </div>
      ),
    },
    {
      key: 'owner',
      label: 'Owner',
      render: (row: Account) =>
        row.owner ? `${row.owner.firstName} ${row.owner.lastName}` : '-',
    },
    {
      key: '_count',
      label: 'Contacts',
      render: (row: Account) => row._count?.contacts ?? 0,
    },
    {
      key: 'annualRevenue',
      label: 'Revenue',
      sortable: true,
      render: (row: Account) =>
        row.annualRevenue ? `$${(row.annualRevenue / 1000).toFixed(0)}K` : '-',
    },
  ];

  return (
    <div>
      <PageHeader title="Accounts" subtitle="Manage your company accounts">
        <button
          onClick={() => navigate('/accounts/new')}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Account
        </button>
      </PageHeader>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2 flex-1 max-w-sm bg-white border border-gray-200 rounded-lg px-3 py-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search accounts..."
            className="flex-1 text-sm outline-none bg-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700"
        >
          <option value="">All Statuses</option>
          <option value="PROSPECT">Prospect</option>
          <option value="ACTIVE_LEAD">Active Lead</option>
          <option value="CLIENT">Client</option>
          <option value="CHURNED">Churned</option>
          <option value="DORMANT">Dormant</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={accounts}
        loading={loading}
        onRowClick={(row) => navigate(`/accounts/${row.id}`)}
        emptyMessage="No accounts found"
      />
    </div>
  );
}
