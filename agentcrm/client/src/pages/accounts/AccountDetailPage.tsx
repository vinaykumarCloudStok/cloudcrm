import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Globe,
  MapPin,
  Users,
  Briefcase,
  Bot,
  Pencil,
  Signal,
  Activity as ActivityIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getAccount, updateAccount } from '../../services/accountApi';
import { getActivities } from '../../services/activityApi';
import { generateAccountIntel } from '../../services/agentApi';
import type { Account, Contact, Opportunity, Activity, AccountSignal } from '../../utils/types';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import HealthScoreBar from '../../components/ui/HealthScoreBar';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Timeline from '../../components/ui/Timeline';

type Tab = 'overview' | 'contacts' | 'opportunities' | 'signals' | 'activities';

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'opportunities', label: 'Opportunities' },
  { key: 'signals', label: 'Signals' },
  { key: 'activities', label: 'Activities' },
];

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [account, setAccount] = useState<Account | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [signals, setSignals] = useState<AccountSignal[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [intelLoading, setIntelLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    companyName: '',
    website: '',
    industry: '',
    companySize: '',
    country: '',
    annualRevenue: '',
    status: '',
    notes: '',
  });

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const [accRes, actRes] = await Promise.all([
          getAccount(Number(id)),
          getActivities({ accountId: Number(id) }).catch(() => ({ data: [] })),
        ]);
        const acc = accRes.data;
        setAccount(acc);
        setContacts(acc.contacts ?? []);
        setOpportunities(acc.opportunities ?? []);
        setSignals(acc.signals ?? []);
        setActivities(actRes.data.data ?? actRes.data ?? []);
      } catch {
        toast.error('Failed to load account');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const openEditModal = () => {
    if (!account) return;
    setEditForm({
      companyName: account.companyName,
      website: account.website ?? '',
      industry: account.industry ?? '',
      companySize: account.companySize ?? '',
      country: account.country ?? '',
      annualRevenue: account.annualRevenue?.toString() ?? '',
      status: account.status,
      notes: account.notes ?? '',
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!id || !account) return;
    setSaving(true);
    try {
      const res = await updateAccount(Number(id), {
        companyName: editForm.companyName,
        website: editForm.website || null,
        industry: editForm.industry || null,
        companySize: editForm.companySize || null,
        country: editForm.country || null,
        annualRevenue: editForm.annualRevenue ? Number(editForm.annualRevenue) : null,
        status: editForm.status,
        notes: editForm.notes || null,
      });
      setAccount(res.data);
      setEditOpen(false);
      toast.success('Account updated');
    } catch {
      toast.error('Failed to update account');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateIntel = async () => {
    if (!id) return;
    setIntelLoading(true);
    try {
      const res = await generateAccountIntel(Number(id));
      if (res.data?.signals) {
        setSignals(res.data.signals);
      }
      toast.success('Account intelligence generated');
    } catch {
      toast.error('Failed to generate intelligence');
    } finally {
      setIntelLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (!account) {
    return <p className="text-gray-500 text-center py-8">Account not found</p>;
  }

  return (
    <div>
      <button
        onClick={() => navigate('/accounts')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Accounts
      </button>

      {/* Header */}
      <PageHeader title={account.companyName} subtitle={account.industry ?? undefined}>
        <div className="flex items-center gap-3">
          <StatusBadge status={account.status} size="md" />
          <div className="w-32">
            <HealthScoreBar score={account.healthScore} />
          </div>
          <button
            onClick={openEditModal}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Pencil className="h-4 w-4" /> Edit
          </button>
        </div>
      </PageHeader>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab account={account} />}
      {activeTab === 'contacts' && <ContactsTab contacts={contacts} />}
      {activeTab === 'opportunities' && <OpportunitiesTab opportunities={opportunities} />}
      {activeTab === 'signals' && (
        <SignalsTab
          signals={signals}
          onGenerate={handleGenerateIntel}
          intelLoading={intelLoading}
        />
      )}
      {activeTab === 'activities' && <ActivitiesTab activities={activities} />}

      {/* Edit Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Account" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input
              type="text"
              value={editForm.companyName}
              onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
            <input
              type="text"
              value={editForm.industry}
              onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
            <input
              type="text"
              value={editForm.companySize}
              onChange={(e) => setEditForm({ ...editForm, companySize: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input
              type="text"
              value={editForm.country}
              onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Annual Revenue</label>
            <input
              type="number"
              value={editForm.annualRevenue}
              onChange={(e) => setEditForm({ ...editForm, annualRevenue: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input
              type="text"
              value={editForm.website}
              onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            >
              {['PROSPECT', 'ACTIVE_LEAD', 'CLIENT', 'CHURNED', 'DORMANT'].map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={3}
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
            />
          </div>
          <div className="col-span-2 flex justify-end gap-3 pt-2">
            <button
              onClick={() => setEditOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ─── Tab Components ─── */

function OverviewTab({ account }: { account: Account }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Company Info Grid */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-teal-600" /> Company Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {account.industry && (
              <div>
                <p className="text-xs text-gray-500">Industry</p>
                <p className="text-sm text-gray-700">{account.industry}</p>
              </div>
            )}
            {account.companySize && (
              <div>
                <p className="text-xs text-gray-500">Company Size</p>
                <p className="text-sm text-gray-700">{account.companySize}</p>
              </div>
            )}
            {account.country && (
              <div>
                <p className="text-xs text-gray-500">Country</p>
                <p className="text-sm text-gray-700 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {account.country}
                </p>
              </div>
            )}
            {account.annualRevenue != null && (
              <div>
                <p className="text-xs text-gray-500">Annual Revenue</p>
                <p className="text-sm text-gray-700">${account.annualRevenue.toLocaleString()}</p>
              </div>
            )}
            {account.website && (
              <div>
                <p className="text-xs text-gray-500">Website</p>
                <a
                  href={account.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-teal-600 hover:underline flex items-center gap-1"
                >
                  <Globe className="h-3 w-3" /> {account.website}
                </a>
              </div>
            )}
            {account.source && (
              <div>
                <p className="text-xs text-gray-500">Source</p>
                <p className="text-sm text-gray-700">{account.source}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">Owner</p>
              <p className="text-sm text-gray-700">
                {account.owner
                  ? `${account.owner.firstName} ${account.owner.lastName}`
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <StatusBadge status={account.status} size="md" />
            </div>
          </div>
        </div>

        {/* Tech Stack Tags */}
        {account.techTags && account.techTags.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Tech Stack</h3>
            <div className="flex flex-wrap gap-2">
              {account.techTags.map((t) => (
                <span
                  key={t.id}
                  className="px-3 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-full border border-teal-200"
                >
                  {t.tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {account.notes && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{account.notes}</p>
          </div>
        )}
      </div>

      {/* Quick Stats Sidebar */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Health Score</h3>
          <HealthScoreBar score={account.healthScore} />
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <Users className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <p className="text-xl font-semibold text-gray-900">{account._count?.contacts ?? 0}</p>
            <p className="text-xs text-gray-500">Contacts</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <Briefcase className="h-5 w-5 text-teal-500 mx-auto mb-1" />
            <p className="text-xl font-semibold text-gray-900">
              {account._count?.opportunities ?? 0}
            </p>
            <p className="text-xs text-gray-500">Opportunities</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactsTab({ contacts }: { contacts: Contact[] }) {
  if (contacts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No contacts linked to this account.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
              Name
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
              Job Title
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
              Role
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
              Email
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
              Phone
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {contacts.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-900">
                {c.firstName} {c.lastName}
              </td>
              <td className="px-4 py-3 text-gray-600">{c.jobTitle ?? '-'}</td>
              <td className="px-4 py-3">
                <StatusBadge status={c.roleType} size="sm" />
              </td>
              <td className="px-4 py-3">
                {c.email ? (
                  <a href={`mailto:${c.email}`} className="text-teal-600 hover:underline">
                    {c.email}
                  </a>
                ) : (
                  '-'
                )}
              </td>
              <td className="px-4 py-3 text-gray-600">{c.phone ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OpportunitiesTab({ opportunities }: { opportunities: Opportunity[] }) {
  if (opportunities.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
        <Briefcase className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No opportunities for this account.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
              Name
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
              Stage
            </th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
              Value
            </th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
              Probability
            </th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
              Expected Close
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {opportunities.map((opp) => (
            <tr key={opp.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                <Link
                  to={`/opportunities/${opp.id}`}
                  className="font-medium text-teal-600 hover:text-teal-700 hover:underline"
                >
                  {opp.name}
                </Link>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={opp.stage} size="sm" />
              </td>
              <td className="px-4 py-3 text-right font-medium text-gray-900">
                ${opp.dealValue.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right text-gray-600">{opp.probability}%</td>
              <td className="px-4 py-3 text-gray-600">
                {opp.expectedCloseDate
                  ? new Date(opp.expectedCloseDate).toLocaleDateString()
                  : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SignalsTab({
  signals,
  onGenerate,
  intelLoading,
}: {
  signals: AccountSignal[];
  onGenerate: () => void;
  intelLoading: boolean;
}) {
  const severityColor: Record<string, string> = {
    HIGH: 'bg-red-100 text-red-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    LOW: 'bg-blue-100 text-blue-700',
    INFO: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={onGenerate}
          disabled={intelLoading}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          <Bot className="h-4 w-4" />
          {intelLoading ? 'Generating...' : 'Run AI Enrichment'}
        </button>
      </div>

      {signals.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <Signal className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            No signals yet. Run AI Enrichment to generate account intelligence.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {signals.map((signal) => (
            <div
              key={signal.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900">{signal.title}</h4>
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        severityColor[signal.severity] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {signal.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{signal.summary}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400">
                      {new Date(signal.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-gray-400">
                      {signal.signalType.replace(/_/g, ' ')}
                    </span>
                    {signal.isActioned && (
                      <span className="text-xs text-green-600 font-medium">Actioned</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActivitiesTab({ activities }: { activities: Activity[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <ActivityIcon className="h-4 w-4 text-teal-600" /> Activity History
      </h3>
      <Timeline activities={activities} />
    </div>
  );
}
