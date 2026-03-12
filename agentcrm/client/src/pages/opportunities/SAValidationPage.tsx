import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertTriangle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getOpportunity } from '../../services/opportunityApi';
import { getChecklists, updateChecklist, getHandoff, updateHandoff } from '../../services/validationApi';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import type { Opportunity, ValidationChecklist, SolutionHandoff } from '../../utils/types';

interface ChecklistItem {
  label: string;
  checked: boolean;
  notes: string;
}

const BUSINESS_ITEMS: string[] = [
  'Budget confirmed',
  'Decision-maker identified',
  'Timeline defined',
  'Pain points documented',
  'Competition assessed',
  'ROI calculated',
  'Legal/procurement process mapped',
];

const TECHNICAL_ITEMS: string[] = [
  'Architecture reviewed',
  'Integration points mapped',
  'Security requirements documented',
  'Performance requirements defined',
  'Data migration plan',
  'Infrastructure requirements',
  'Compliance requirements',
  'Technical POC completed',
];

function buildDefaults(labels: string[]): ChecklistItem[] {
  return labels.map((label) => ({ label, checked: false, notes: '' }));
}

function parseItems(raw: string | undefined, defaults: ChecklistItem[]): ChecklistItem[] {
  if (!raw) return defaults;
  try {
    const parsed = JSON.parse(raw) as ChecklistItem[];
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    /* fall through */
  }
  return defaults;
}

export default function SAValidationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [businessItems, setBusinessItems] = useState<ChecklistItem[]>(buildDefaults(BUSINESS_ITEMS));
  const [technicalItems, setTechnicalItems] = useState<ChecklistItem[]>(buildDefaults(TECHNICAL_ITEMS));
  const [handoff, setHandoff] = useState<Partial<SolutionHandoff>>({});
  const [loading, setLoading] = useState(true);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingTechnical, setSavingTechnical] = useState(false);
  const [savingHandoff, setSavingHandoff] = useState(false);

  const oppId = Number(id);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const [oppRes, checkRes, handoffRes] = await Promise.all([
        getOpportunity(oppId),
        getChecklists(oppId),
        getHandoff(oppId),
      ]);
      const opp: Opportunity = oppRes.data;
      setOpportunity(opp);

      const checklists: ValidationChecklist[] = Array.isArray(checkRes.data)
        ? checkRes.data
        : checkRes.data?.data ?? [];

      const bizChecklist = checklists.find((c) => c.type === 'BUSINESS');
      const techChecklist = checklists.find((c) => c.type === 'TECHNICAL');

      setBusinessItems(parseItems(bizChecklist?.items, buildDefaults(BUSINESS_ITEMS)));
      setTechnicalItems(parseItems(techChecklist?.items, buildDefaults(TECHNICAL_ITEMS)));

      if (handoffRes.data) {
        setHandoff(handoffRes.data);
      }
    } catch {
      toast.error('Failed to load validation data');
    } finally {
      setLoading(false);
    }
  }, [id, oppId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleItem = (
    items: ChecklistItem[],
    setter: React.Dispatch<React.SetStateAction<ChecklistItem[]>>,
    index: number,
  ) => {
    setter(items.map((item, i) => (i === index ? { ...item, checked: !item.checked } : item)));
  };

  const updateNotes = (
    items: ChecklistItem[],
    setter: React.Dispatch<React.SetStateAction<ChecklistItem[]>>,
    index: number,
    notes: string,
  ) => {
    setter(items.map((item, i) => (i === index ? { ...item, notes } : item)));
  };

  const saveChecklist = async (type: 'BUSINESS' | 'TECHNICAL') => {
    const items = type === 'BUSINESS' ? businessItems : technicalItems;
    const setSaving = type === 'BUSINESS' ? setSavingBusiness : setSavingTechnical;
    setSaving(true);
    try {
      await updateChecklist(oppId, type, items);
      toast.success(`${type === 'BUSINESS' ? 'Business' : 'Technical'} checklist saved`);
    } catch {
      toast.error('Failed to save checklist');
    } finally {
      setSaving(false);
    }
  };

  const saveHandoff = async () => {
    setSavingHandoff(true);
    try {
      await updateHandoff(oppId, handoff);
      toast.success('Solution handoff saved');
    } catch {
      toast.error('Failed to save handoff');
    } finally {
      setSavingHandoff(false);
    }
  };

  const scopeChangePercent =
    opportunity?.proposalValueAtSubmit && opportunity.dealValue
      ? Math.abs(
          ((opportunity.dealValue - opportunity.proposalValueAtSubmit) /
            opportunity.proposalValueAtSubmit) *
            100,
        )
      : 0;
  const showScopeWarning = scopeChangePercent > 20;

  if (loading) return <LoadingSpinner size="lg" />;
  if (!opportunity) return <p className="text-gray-500 text-center py-8">Opportunity not found</p>;

  const completedBiz = businessItems.filter((i) => i.checked).length;
  const completedTech = technicalItems.filter((i) => i.checked).length;

  return (
    <div>
      <button
        onClick={() => navigate(`/opportunities/${oppId}`)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Opportunity
      </button>

      <PageHeader
        title="SA Technical Validation"
        subtitle={opportunity.name}
      />

      {showScopeWarning && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Scope Change Warning</p>
            <p className="text-sm text-amber-700">
              Current deal value differs from proposal value at submission by{' '}
              <span className="font-medium">{scopeChangePercent.toFixed(1)}%</span>. Original:{' '}
              ${opportunity.proposalValueAtSubmit?.toLocaleString()} | Current: $
              {opportunity.dealValue.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* Business Validation Checklist */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-gray-900">Business Validation Checklist</h2>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {completedBiz}/{businessItems.length}
              </span>
            </div>
            <button
              onClick={() => saveChecklist('BUSINESS')}
              disabled={savingBusiness}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              {savingBusiness ? 'Saving...' : 'Save'}
            </button>
          </div>
          <div className="space-y-3">
            {businessItems.map((item, idx) => (
              <ChecklistRow
                key={item.label}
                item={item}
                onToggle={() => toggleItem(businessItems, setBusinessItems, idx)}
                onNotesChange={(notes) => updateNotes(businessItems, setBusinessItems, idx, notes)}
              />
            ))}
          </div>
        </section>

        {/* Technical Validation Checklist */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-gray-900">Technical Validation Checklist</h2>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {completedTech}/{technicalItems.length}
              </span>
            </div>
            <button
              onClick={() => saveChecklist('TECHNICAL')}
              disabled={savingTechnical}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              {savingTechnical ? 'Saving...' : 'Save'}
            </button>
          </div>
          <div className="space-y-3">
            {technicalItems.map((item, idx) => (
              <ChecklistRow
                key={item.label}
                item={item}
                onToggle={() => toggleItem(technicalItems, setTechnicalItems, idx)}
                onNotesChange={(notes) => updateNotes(technicalItems, setTechnicalItems, idx, notes)}
              />
            ))}
          </div>
        </section>

        {/* Solution Handoff */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Solution Handoff</h2>
            <button
              onClick={saveHandoff}
              disabled={savingHandoff}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              {savingHandoff ? 'Saving...' : 'Save Handoff'}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <HandoffField
              label="Final Architecture"
              value={handoff.finalArchitecture ?? ''}
              onChange={(v) => setHandoff((h) => ({ ...h, finalArchitecture: v }))}
            />
            <HandoffField
              label="Key Decisions"
              value={handoff.keyDecisions ?? ''}
              onChange={(v) => setHandoff((h) => ({ ...h, keyDecisions: v }))}
            />
            <HandoffField
              label="Technical Risks"
              value={handoff.technicalRisks ?? ''}
              onChange={(v) => setHandoff((h) => ({ ...h, technicalRisks: v }))}
            />
            <HandoffField
              label="Assumptions"
              value={handoff.assumptions ?? ''}
              onChange={(v) => setHandoff((h) => ({ ...h, assumptions: v }))}
            />
            <HandoffField
              label="Delivery Team Composition"
              value={handoff.deliveryTeamComposition ?? ''}
              onChange={(v) => setHandoff((h) => ({ ...h, deliveryTeamComposition: v }))}
            />
            <HandoffField
              label="Phase Breakdown"
              value={handoff.phaseBreakdown ?? ''}
              onChange={(v) => setHandoff((h) => ({ ...h, phaseBreakdown: v }))}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function ChecklistRow({
  item,
  onToggle,
  onNotesChange,
}: {
  item: ChecklistItem;
  onToggle: () => void;
  onNotesChange: (notes: string) => void;
}) {
  const [expanded, setExpanded] = useState(!!item.notes);

  return (
    <div className="rounded-lg border border-gray-100 p-3">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className={`shrink-0 flex items-center justify-center h-5 w-5 rounded border transition-colors ${
            item.checked
              ? 'bg-teal-600 border-teal-600 text-white'
              : 'border-gray-300 hover:border-teal-400'
          }`}
        >
          {item.checked && <CheckCircle2 className="h-3.5 w-3.5" />}
        </button>
        <span
          className={`text-sm flex-1 ${item.checked ? 'text-gray-400 line-through' : 'text-gray-800'}`}
        >
          {item.label}
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-teal-600 hover:text-teal-700 font-medium"
        >
          {expanded ? 'Hide notes' : 'Add notes'}
        </button>
      </div>
      {expanded && (
        <textarea
          value={item.notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Add notes..."
          rows={2}
          className="mt-2 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
        />
      )}
    </div>
  );
}

function HandoffField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
        placeholder={`Enter ${label.toLowerCase()}...`}
      />
    </div>
  );
}
