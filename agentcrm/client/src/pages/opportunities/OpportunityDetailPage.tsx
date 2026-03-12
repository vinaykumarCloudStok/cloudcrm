import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  DollarSign,
  Calendar,
  BarChart3,
  Bot,
  User,
  Building2,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getOpportunity, updateOpportunity } from '../../services/opportunityApi';
import { generateBrief } from '../../services/agentApi';
import { getActivities } from '../../services/activityApi';
import type { Opportunity, Activity, DealCoachBrief } from '../../utils/types';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Timeline from '../../components/ui/Timeline';

const STAGES = [
  'DISCOVERY',
  'PROPOSAL',
  'TECHNICAL_VALIDATION',
  'BUSINESS_VALIDATION',
  'NEGOTIATION',
  'CONTRACT_SENT',
  'CLOSED_WON',
  'CLOSED_LOST',
];

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [briefLoading, setBriefLoading] = useState(false);
  const [brief, setBrief] = useState<DealCoachBrief | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    dealValue: 0,
    stage: '',
    expectedCloseDate: '',
    probability: 0,
  });

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const [oppRes, actRes] = await Promise.all([
          getOpportunity(Number(id)),
          getActivities({ opportunityId: Number(id) }).catch(() => ({ data: [] })),
        ]);
        const opp = oppRes.data;
        setOpportunity(opp);
        setActivities(actRes.data.data ?? actRes.data ?? []);

        if (opp.dealCoachBriefs?.length) {
          setBrief(opp.dealCoachBriefs[opp.dealCoachBriefs.length - 1]);
        }
      } catch {
        toast.error('Failed to load opportunity');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const openEditModal = () => {
    if (!opportunity) return;
    setEditForm({
      dealValue: opportunity.dealValue,
      stage: opportunity.stage,
      expectedCloseDate: opportunity.expectedCloseDate
        ? opportunity.expectedCloseDate.slice(0, 10)
        : '',
      probability: opportunity.probability,
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!id || !opportunity) return;
    setSaving(true);
    try {
      const res = await updateOpportunity(Number(id), {
        dealValue: Number(editForm.dealValue),
        stage: editForm.stage,
        expectedCloseDate: editForm.expectedCloseDate || null,
        probability: Number(editForm.probability),
      });
      setOpportunity(res.data);
      setEditOpen(false);
      toast.success('Opportunity updated');
    } catch {
      toast.error('Failed to update opportunity');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this opportunity?')) return;
    try {
      await updateOpportunity(Number(id!), { stage: 'CLOSED_LOST', lostReason: 'Deleted' });
      toast.success('Opportunity removed');
      navigate('/opportunities');
    } catch {
      toast.error('Failed to delete opportunity');
    }
  };

  const handleGenerateBrief = async () => {
    if (!id) return;
    setBriefLoading(true);
    try {
      const res = await generateBrief(Number(id));
      setBrief(res.data);
      toast.success('Pre-call brief generated');
    } catch {
      toast.error('Failed to generate brief');
    } finally {
      setBriefLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (!opportunity) {
    return <p className="text-gray-500 text-center py-8">Opportunity not found</p>;
  }

  const currentStageIndex = STAGES.indexOf(opportunity.stage);

  return (
    <div>
      <button
        onClick={() => navigate('/opportunities')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Opportunities
      </button>

      <PageHeader title={opportunity.name} subtitle={opportunity.account?.companyName}>
        <StatusBadge status={opportunity.stage} size="md" />
        <button
          onClick={openEditModal}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Pencil className="h-4 w-4" /> Edit
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
        >
          <Trash2 className="h-4 w-4" /> Delete
        </button>
      </PageHeader>

      {/* Stage Progression Bar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Deal Stage Progression
        </h3>
        <div className="flex items-center gap-1">
          {STAGES.map((stage, i) => {
            const isActive = i === currentStageIndex;
            const isPast = i < currentStageIndex;
            const isClosed = stage === 'CLOSED_WON' || stage === 'CLOSED_LOST';

            let bgColor = 'bg-gray-200 text-gray-500';
            if (isActive) {
              bgColor =
                stage === 'CLOSED_WON'
                  ? 'bg-green-500 text-white'
                  : stage === 'CLOSED_LOST'
                    ? 'bg-red-500 text-white'
                    : 'bg-teal-600 text-white';
            } else if (isPast) {
              bgColor = 'bg-teal-100 text-teal-700';
            }

            return (
              <div
                key={stage}
                className={`flex-1 text-center py-2 text-xs font-medium rounded-md transition-colors ${bgColor} ${isClosed && !isActive ? 'opacity-50' : ''}`}
              >
                {stage.replace(/_/g, ' ')}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deal Info Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-teal-600" /> Deal Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Deal Value</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${opportunity.dealValue.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Probability</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[120px]">
                    <div
                      className="h-full bg-teal-500 rounded-full transition-all"
                      style={{ width: `${opportunity.probability}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {opportunity.probability}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Expected Close Date</p>
                <p className="text-sm text-gray-700 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {opportunity.expectedCloseDate
                    ? new Date(opportunity.expectedCloseDate).toLocaleDateString()
                    : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Weighted Value</p>
                <p className="text-sm font-medium text-gray-700">
                  ${Math.round(opportunity.dealValue * (opportunity.probability / 100)).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Stage</p>
                <StatusBadge status={opportunity.stage} size="md" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="text-sm text-gray-700">
                  {new Date(opportunity.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            {opportunity.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {opportunity.description}
                </p>
              </div>
            )}
            {opportunity.winReason && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1">Win Reason</p>
                <p className="text-sm text-green-700">{opportunity.winReason}</p>
              </div>
            )}
            {opportunity.lostReason && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1">Lost Reason</p>
                <p className="text-sm text-red-700">{opportunity.lostReason}</p>
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-teal-600" /> Activity Timeline
            </h3>
            <Timeline activities={activities} />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Account Card */}
          {opportunity.account && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-teal-600" /> Account
              </h3>
              <Link
                to={`/accounts/${opportunity.accountId}`}
                className="text-sm font-medium text-teal-600 hover:text-teal-700 hover:underline"
              >
                {opportunity.account.companyName}
              </Link>
              {opportunity.account.industry && (
                <p className="text-xs text-gray-500 mt-1">{opportunity.account.industry}</p>
              )}
            </div>
          )}

          {/* Primary Contact Card */}
          {opportunity.primaryContact && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-teal-600" /> Primary Contact
              </h3>
              <p className="text-sm font-medium text-gray-900">
                {opportunity.primaryContact.firstName} {opportunity.primaryContact.lastName}
              </p>
              {opportunity.primaryContact.jobTitle && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {opportunity.primaryContact.jobTitle}
                </p>
              )}
              {opportunity.primaryContact.email && (
                <a
                  href={`mailto:${opportunity.primaryContact.email}`}
                  className="text-xs text-teal-600 hover:underline mt-1 block"
                >
                  {opportunity.primaryContact.email}
                </a>
              )}
              {opportunity.primaryContact.phone && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {opportunity.primaryContact.phone}
                </p>
              )}
              <div className="mt-2">
                <StatusBadge status={opportunity.primaryContact.roleType} size="sm" />
              </div>
            </div>
          )}

          {/* Owner Card */}
          {opportunity.owner && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-teal-600" /> Deal Owner
              </h3>
              <p className="text-sm font-medium text-gray-900">
                {opportunity.owner.firstName} {opportunity.owner.lastName}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{opportunity.owner.email}</p>
            </div>
          )}

          {/* AI Deal Coach */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Bot className="h-4 w-4 text-purple-600" /> AI Deal Coach
            </h3>
            <button
              onClick={handleGenerateBrief}
              disabled={briefLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              <Bot className="h-4 w-4" />
              {briefLoading ? 'Generating...' : 'Generate Pre-Call Brief'}
            </button>
            {brief && (
              <div className="mt-4 p-3 bg-purple-50 border border-purple-100 rounded-lg">
                <p className="text-xs font-medium text-purple-700 mb-1">
                  {brief.briefType.replace(/_/g, ' ')}
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{brief.content}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(brief.createdAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Opportunity">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deal Value ($)</label>
            <input
              type="number"
              value={editForm.dealValue}
              onChange={(e) => setEditForm({ ...editForm, dealValue: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
            <select
              value={editForm.stage}
              onChange={(e) => setEditForm({ ...editForm, stage: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expected Close Date
            </label>
            <input
              type="date"
              value={editForm.expectedCloseDate}
              onChange={(e) => setEditForm({ ...editForm, expectedCloseDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Probability (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={editForm.probability}
              onChange={(e) => setEditForm({ ...editForm, probability: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
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
