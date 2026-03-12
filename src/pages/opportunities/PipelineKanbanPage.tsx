import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import { getPipeline, updateOpportunityStage } from '../../services/opportunityApi';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import type { Opportunity, PipelineStage } from '../../utils/types';

const STAGES = [
  'DISCOVERY',
  'BUSINESS_VALIDATION',
  'TECHNICAL_VALIDATION',
  'PROPOSAL',
  'NEGOTIATION',
  'CONTRACT_SENT',
] as const;

const STAGE_LABELS: Record<string, string> = {
  DISCOVERY: 'Discovery',
  BUSINESS_VALIDATION: 'Business Validation',
  TECHNICAL_VALIDATION: 'Technical Validation',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  CONTRACT_SENT: 'Contract Sent',
};

const STAGE_COLORS: Record<string, { border: string; bg: string; header: string }> = {
  DISCOVERY: {
    border: 'border-t-teal-300',
    bg: 'bg-teal-50/50',
    header: 'bg-teal-50',
  },
  BUSINESS_VALIDATION: {
    border: 'border-t-teal-400',
    bg: 'bg-teal-50/60',
    header: 'bg-teal-100/60',
  },
  TECHNICAL_VALIDATION: {
    border: 'border-t-teal-500',
    bg: 'bg-teal-50/70',
    header: 'bg-teal-100/80',
  },
  PROPOSAL: {
    border: 'border-t-teal-600',
    bg: 'bg-teal-50/80',
    header: 'bg-teal-100',
  },
  NEGOTIATION: {
    border: 'border-t-teal-700',
    bg: 'bg-teal-100/60',
    header: 'bg-teal-200/60',
  },
  CONTRACT_SENT: {
    border: 'border-t-teal-800',
    bg: 'bg-teal-100/80',
    header: 'bg-teal-200/80',
  },
};

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function getInitials(name?: string): string {
  if (!name) return '??';
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ---------------------------------------------------------------------------
// Opportunity card (sortable)
// ---------------------------------------------------------------------------

interface OpportunityCardProps {
  opportunity: Opportunity;
  isDragOverlay?: boolean;
}

function OpportunityCard({ opportunity, isDragOverlay }: OpportunityCardProps) {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: opportunity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={isDragOverlay ? undefined : style}
      {...(isDragOverlay ? {} : attributes)}
      {...(isDragOverlay ? {} : listeners)}
      onClick={() => !isDragging && navigate(`/opportunities/${opportunity.id}`)}
      className={`bg-white rounded-lg border border-gray-200 p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        isDragOverlay ? 'shadow-lg ring-2 ring-teal-500/30 rotate-2' : ''
      }`}
    >
      <p className="text-sm font-medium text-gray-900 truncate">{opportunity.name}</p>
      <p className="text-xs text-gray-500 mt-0.5 truncate">
        {opportunity.account?.companyName ?? 'No account'}
      </p>

      <div className="flex items-center justify-between mt-2">
        <span className="text-sm font-semibold text-gray-800">
          {formatCurrency(opportunity.dealValue)}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{opportunity.probability}%</span>
          {opportunity.owner && (
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-[10px] font-semibold text-teal-700">
              {getInitials(`${opportunity.owner.firstName} ${opportunity.owner.lastName}`)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stage column (droppable)
// ---------------------------------------------------------------------------

interface StageColumnProps {
  stage: PipelineStage;
}

function StageColumn({ stage }: StageColumnProps) {
  const colors = STAGE_COLORS[stage.stage] ?? {
    border: 'border-t-gray-400',
    bg: 'bg-gray-50',
    header: 'bg-gray-100',
  };
  const oppIds = (stage.opportunities ?? []).map((o) => o.id);

  return (
    <div
      className={`flex-shrink-0 w-72 rounded-xl border border-gray-200 border-t-4 ${colors.border} ${colors.bg} flex flex-col`}
    >
      <div className={`px-3 py-3 border-b border-gray-200 ${colors.header}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            {STAGE_LABELS[stage.stage] ?? stage.stage.replace(/_/g, ' ')}
          </h3>
          <span className="text-xs text-gray-500 bg-white/80 px-2 py-0.5 rounded-full font-medium">
            {stage.count}
          </span>
        </div>
        <p className="text-sm font-semibold text-gray-900 mt-1">
          {formatCurrency(stage.totalValue)}
        </p>
      </div>

      <SortableContext items={oppIds} strategy={verticalListSortingStrategy}>
        <div className="p-2 space-y-2 min-h-[180px] flex-1">
          {(stage.opportunities ?? []).map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function PipelineKanbanPage() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOpp, setActiveOpp] = useState<Opportunity | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getPipeline();
        if (!cancelled) setStages(res.data ?? []);
      } catch {
        if (!cancelled) toast.error('Failed to load pipeline');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Build a normalised map: every expected stage is present
  const allStages = useMemo(() => {
    const map = new Map(stages.map((s) => [s.stage, s]));
    return STAGES.map(
      (stage) =>
        map.get(stage) ?? { stage, count: 0, totalValue: 0, opportunities: [] },
    );
  }, [stages]);

  const totalPipelineValue = useMemo(
    () => allStages.reduce((sum, s) => sum + s.totalValue, 0),
    [allStages],
  );

  // Find which stage an opportunity belongs to
  const findStageForOpp = useCallback(
    (oppId: string): string | undefined => {
      for (const s of allStages) {
        if (s.opportunities?.some((o) => String(o.id) === oppId)) return s.stage;
      }
      return undefined;
    },
    [allStages],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const oppId = String(event.active.id);
      for (const s of allStages) {
        const opp = s.opportunities?.find((o) => String(o.id) === oppId);
        if (opp) {
          setActiveOpp(opp);
          break;
        }
      }
    },
    [allStages],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveOpp(null);
      const { active, over } = event;
      if (!over) return;

      const oppId = String(active.id);
      const sourceStage = findStageForOpp(oppId);
      if (!sourceStage) return;

      // Determine target stage: could be dropped on another opp or on the column itself
      let targetStage: string | undefined;

      // If dropped over an opportunity, find its stage
      const overOppStage = findStageForOpp(String(over.id));
      if (overOppStage) {
        targetStage = overOppStage;
      } else {
        // The over id might be a stage name used as a droppable
        const isStage = STAGES.includes(over.id as (typeof STAGES)[number]);
        if (isStage) targetStage = String(over.id);
      }

      if (!targetStage || targetStage === sourceStage) return;

      // Optimistic update
      const movedOpp = allStages
        .find((s) => s.stage === sourceStage)
        ?.opportunities?.find((o) => String(o.id) === oppId);
      if (!movedOpp) return;

      setStages((prev) =>
        prev.map((s) => {
          if (s.stage === sourceStage) {
            return {
              ...s,
              count: s.count - 1,
              totalValue: s.totalValue - movedOpp.dealValue,
              opportunities: (s.opportunities ?? []).filter((o) => o.id !== oppId),
            };
          }
          if (s.stage === targetStage) {
            const updated = { ...movedOpp, stage: targetStage };
            return {
              ...s,
              count: s.count + 1,
              totalValue: s.totalValue + movedOpp.dealValue,
              opportunities: [...(s.opportunities ?? []), updated],
            };
          }
          return s;
        }),
      );

      try {
        await updateOpportunityStage(Number(oppId), targetStage);
        toast.success(
          `Moved to ${STAGE_LABELS[targetStage] ?? targetStage.replace(/_/g, ' ')}`,
        );
      } catch {
        // Revert on failure
        setStages((prev) =>
          prev.map((s) => {
            if (s.stage === targetStage) {
              return {
                ...s,
                count: s.count - 1,
                totalValue: s.totalValue - movedOpp.dealValue,
                opportunities: (s.opportunities ?? []).filter((o) => o.id !== oppId),
              };
            }
            if (s.stage === sourceStage) {
              return {
                ...s,
                count: s.count + 1,
                totalValue: s.totalValue + movedOpp.dealValue,
                opportunities: [...(s.opportunities ?? []), movedOpp],
              };
            }
            return s;
          }),
        );
        toast.error('Failed to update stage');
      }
    },
    [allStages, findStageForOpp],
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Pipeline" subtitle="Drag opportunities between stages to update progress" />

      <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
        <span className="font-medium text-gray-900">Total Pipeline:</span>
        <span className="text-lg font-bold text-teal-700">
          {formatCurrency(totalPipelineValue)}
        </span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-6">
          {allStages.map((stage) => (
            <StageColumn key={stage.stage} stage={stage} />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeOpp ? (
            <div className="w-72">
              <OpportunityCard opportunity={activeOpp} isDragOverlay />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
