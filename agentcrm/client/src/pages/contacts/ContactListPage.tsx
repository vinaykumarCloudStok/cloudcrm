import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search } from 'lucide-react';
import { getContacts } from '../../services/contactApi';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import type { Contact } from '../../utils/types';

export default function ContactListPage() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const params: any = {};
        if (search) params.search = search;
        const res = await getContacts(params);
        setContacts(res.data.data ?? res.data ?? []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [search]);

  const columns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (row: Contact) => (
        <div>
          <p className="font-medium text-gray-900">{row.firstName} {row.lastName}</p>
          {row.jobTitle && <p className="text-xs text-gray-500">{row.jobTitle}</p>}
        </div>
      ),
    },
    {
      key: 'account',
      label: 'Account',
      render: (row: Contact) => row.account?.companyName ?? '-',
    },
    {
      key: 'roleType',
      label: 'Role',
      render: (row: Contact) => <StatusBadge status={row.roleType} />,
    },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone', render: (row: Contact) => row.phone || '-' },
    { key: 'department', label: 'Department', render: (row: Contact) => row.department || '-' },
  ];

  return (
    <div>
      <PageHeader title="Contacts" subtitle="Manage your contact relationships">
        <button
          onClick={() => navigate('/contacts/new')}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Contact
        </button>
      </PageHeader>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2 flex-1 max-w-sm bg-white border border-gray-200 rounded-lg px-3 py-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="flex-1 text-sm outline-none bg-transparent"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={contacts}
        loading={loading}
        onRowClick={(row) => navigate(`/contacts/${row.id}`)}
        emptyMessage="No contacts found"
      />
    </div>
  );
}
