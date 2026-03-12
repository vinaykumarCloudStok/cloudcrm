import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Shuffle, Pencil, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { getLead, updateLead, updateLeadStage, convertLead } from '../../services/leadApi';
import { scoreLead, generateBrief } from '../../services/agentApi';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import ScoreBadge from '../../components/ui/ScoreBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import type { Lead } from '../../utils/types';

const STAGE_ORDER = ['NEW', 'CONTACTED', 'ENGAGED', 'QUALIFIED', 'DISQUALIFIED'] as const;

function getNextStages(current: string): string[] {
  const idx = STAGE_ORDER.indexOf(current as (typeof STAGE_ORDER)[number]);
  if (idx === -1) return [];
  const next: string[] = [];
  if (idx < STAGE_ORDER.length - 2) next.push(STAGE_ORDER[idx + 1]);
  if (current !== 'DISQUALIFIED') next.push('DISQUALIFIED');
  return next;
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [briefing, setBriefing] = useState(false);
  const [showConvert, setShowConvert] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [convertData, setConvertData] = useState({ name: '', dealValue: '' });
  const [editData, setEditData] = useState({ firstName: '', lastName: '', email: '', source: '' });

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        const res = await getLead(Number(id));
        setLead(res.data);
      } catch {
        toast.error('Failed to load lead');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleScore = async () => {
    if (!id) return;
    setScoring(true);
    try {
      const res = await scoreLead(Number(id));
      setLead((prev) => (prev ? { ...prev, aiScore: res.data.newScore ?? prev.aiScore } : prev));
      toast.success('Lead scored successfully');
    } catch {
      toast.error('Failed to score lead');
    } finally {
      setScoring(false);
    }
  };

  const handleBrief = async () => {
    if (!id) return;
    setBriefing(true);
    try {
      await generateBrief(Number(id));
      toast.success('Brief generated');
    } catch {
      toast.error('Failed to generate brief');
    } finally {
      setBriefing(false);
    }
  };

  const handleConvert = async () => {
    if (!id) return;
    try {
      const res = await convertLead(Number(id), {
        name: convertData.name,
        dealValue: Number(convertData.dealValue),
      });
      toast.success('Lead converted to opportunity');
      setShowConvert(false);
      navigate(`/opportunities/${res.data.id}`);
    } catch {
      toast.error('Failed to convert lead');
    }
  };

  const handleStageChange = async (newStage: string) => {
    if (!id) return;
    try {
      await updateLeadStage(Number(id), newStage);
      setLead((prev) => (prev ? { ...prev, stage: newStage } : prev));
      toast.success(`Stage updated to ${newStage}`);
    } catch {
      toast.error('Failed to update stage');
    }
  };

  const openEdit = () => {
    if (!lead) return;
    setEditData({
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      source: lead.source ?? '',
    });
    setShowEdit(true);
  };

  const handleEdit = async () => {
    if (!id) return;
    try {
      const res = await updateLead(Number(id), editData);
      setLead(res.data);
      setShowEdit(false);
      toast.success('Lead updated');
    } catch {
      toast.error('Failed to update lead');
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;
  if (!lead) return <p className="text-gray-500 text-center py-8">Lead not found</p>;

  const nextStages = getNextStages(lead.stage);

  return (
    <div>
      <button
        onClick={() => navigate('/leads')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Leads
      </button>

      <PageHeader title={`${lead.firstName} ${lead.lastName}`} subtitle={lead.email}>
        <button
          onClick={openEdit}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </button>
        <button
          onClick={handleScore}
          disabled={scoring}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          <Bot className="h-4 w-4" />
          {scoring ? 'Scoring...' : 'AI Score'}
        </button>
        <button
          onClick={handleBrief}
          disabled={briefing}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <Bot className="h-4 w-4" />
          {briefing ? 'Generating...' : 'Deal Brief'}
        </button>
        {lead.stage === 'QUALIFIED' && (
          <button
            onClick={() => setShowConvert(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Shuffle className="h-4 w-4" />
            Convert
          </button>
        )}
      </PageHeader>

      {/* Stage Transition Buttons */}
      {nextStages.length > 0 && (
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm text-gray-500">Move to:</span>
          {nextStages.map((stage) => (
            <button
              key={stage}
              onClick={() => handleStageChange(stage)}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                stage === 'DISQUALIFIED'
                  ? 'border border-red-300 text-red-600 hover:bg-red-50'
                  : 'border border-teal-300 text-teal-700 hover:bg-teal-50'
              }`}
            >
              <ChevronRight className="h-3.5 w-3.5" />
              {stage}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Details */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Lead Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Stage</p>
              <StatusBadge status={lead.stage} size="md" />
            </div>
            <div>
              <p className="text-xs text-gray-500">AI Score</p>
              <ScoreBadge score={lead.aiScore} size="lg" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <a href={`mailto:${lead.email}`} className="text-sm text-teal-600 hover:underline">
                {lead.email}
              </a>
            </div>
            <div>
              <p className="text-xs text-gray-500">Source</p>
              <p className="text-sm text-gray-700">{lead.source ?? '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Account</p>
              {lead.account ? (
                <button
                  onClick={() => navigate(`/accounts/${lead.accountId}`)}
                  className="text-sm text-teal-600 hover:underline"
                >
                  {lead.account.companyName}
                </button>
              ) : (
                <p className="text-sm text-gray-700">Unlinked</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500">Assigned Rep</p>
              <p className="text-sm text-gray-700">
                {lead.assignedRep ? `${lead.assignedRep.firstName} ${lead.assignedRep.lastName}` : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Created</p>
              <p className="text-sm text-gray-700">
                {new Date(lead.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* AI Lead Score */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">AI Lead Score</h3>
          <div className="flex flex-col items-center py-4">
            <ScoreBadge score={lead.aiScore} size="lg" />
            <button
              onClick={handleScore}
              disabled={scoring}
              className="mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
            >
              {scoring ? 'Scoring...' : 'Re-score'}
            </button>
          </div>
        </div>

        {/* Score History */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Score History</h3>
          {!lead.scoreLogs?.length ? (
            <p className="text-sm text-gray-500 text-center py-4">No scoring history</p>
          ) : (
            <div className="space-y-3">
              {lead.scoreLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <ScoreBadge score={log.previousScore} size="sm" />
                      <span className="text-gray-400">-&gt;</span>
                      <ScoreBadge score={log.newScore} size="sm" />
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{log.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deal Coach Briefs */}
        {lead.dealCoachBriefs && lead.dealCoachBriefs.length > 0 && (
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Deal Coach Briefs</h3>
            <div className="space-y-3">
              {lead.dealCoachBriefs.map((brief) => (
                <div key={brief.id} className="p-4 rounded-lg border border-gray-100 bg-purple-50/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="h-4 w-4 text-purple-600" />
                    <span className="text-xs font-medium text-purple-700 uppercase">
                      {brief.briefType}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{brief.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Convert Modal */}
      <Modal isOpen={showConvert} onClose={() => setShowConvert(false)} title="Convert Lead to Opportunity">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opportunity Name</label>
            <input
              type="text"
              value={convertData.name}
              onChange={(e) => setConvertData((d) => ({ ...d, name: e.target.value }))}
              placeholder={`${lead.firstName} ${lead.lastName} - Deal`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deal Value ($)</label>
            <input
              type="number"
              value={convertData.dealValue}
              onChange={(e) => setConvertData((d) => ({ ...d, dealValue: e.target.value }))}
              placeholder="50000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowConvert(false)}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConvert}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
            >
              Convert
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Lead">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={editData.firstName}
                onChange={(e) => setEditData((d) => ({ ...d, firstName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={editData.lastName}
                onChange={(e) => setEditData((d) => ({ ...d, lastName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={editData.email}
              onChange={(e) => setEditData((d) => ({ ...d, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <input
              type="text"
              value={editData.source}
              onChange={(e) => setEditData((d) => ({ ...d, source: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowEdit(false)}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
