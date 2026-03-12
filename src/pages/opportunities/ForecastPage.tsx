import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, DollarSign, Target, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getForecast } from '../../services/opportunityApi';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ForecastStageValue {
  stage: string;
  value: number;
  weighted: number;
}

interface ForecastMonth {
  month: string;
  stages: ForecastStageValue[];
}

interface ForecastSummary {
  totalPipeline: number;
  weightedForecast: number;
  expectedThisQuarter: number;
  winRate: number;
}

interface ForecastResponse {
  months: ForecastMonth[];
  summary: ForecastSummary;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STAGE_COLORS: Record<string, string> = {
  DISCOVERY: '#5eead4',        // teal-300
  BUSINESS_VALIDATION: '#2dd4bf', // teal-400
  TECHNICAL_VALIDATION: '#14b8a6', // teal-500
  PROPOSAL: '#0d9488',         // teal-600
  NEGOTIATION: '#0891b2',      // cyan-600
  CONTRACT_SENT: '#f59e0b',    // amber-500
};

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
}

function formatTooltipValue(value: number): string {
  return formatCurrency(value);
}

// ---------------------------------------------------------------------------
// Chart data transformer
// ---------------------------------------------------------------------------

function buildChartData(months: ForecastMonth[]): Record<string, unknown>[] {
  return months.map((m) => {
    const row: Record<string, unknown> = { month: m.month };
    for (const s of m.stages) {
      row[s.stage] = s.weighted;
    }
    return row;
  });
}

function collectStages(months: ForecastMonth[]): string[] {
  const stageSet = new Set<string>();
  for (const m of months) {
    for (const s of m.stages) {
      stageSet.add(s.stage);
    }
  }
  return Array.from(stageSet);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ForecastPage() {
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getForecast();
        if (!cancelled) setData(res.data);
      } catch {
        if (!cancelled) toast.error('Failed to load forecast data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const summary = data?.summary ?? {
    totalPipeline: 0,
    weightedForecast: 0,
    expectedThisQuarter: 0,
    winRate: 0,
  };
  const months = data?.months ?? [];
  const chartData = buildChartData(months);
  const stageKeys = collectStages(months);

  return (
    <div>
      <PageHeader
        title="Forecast"
        subtitle="Revenue forecast based on weighted pipeline probability"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Pipeline"
          value={formatCurrency(summary.totalPipeline)}
          icon={DollarSign}
          color="teal"
        />
        <StatCard
          label="Weighted Forecast"
          value={formatCurrency(summary.weightedForecast)}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          label="Expected This Quarter"
          value={formatCurrency(summary.expectedThisQuarter)}
          icon={Target}
          color="amber"
        />
        <StatCard
          label="Win Rate"
          value={`${summary.winRate}%`}
          icon={BarChart3}
          color="purple"
        />
      </div>

      {/* Stacked bar chart */}
      {months.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Weighted Revenue by Month
          </h2>
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={{ stroke: '#d1d5db' }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => formatCurrency(v)}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatTooltipValue(value),
                  name.replace(/_/g, ' '),
                ]}
                contentStyle={{
                  borderRadius: '0.5rem',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Legend
                formatter={(value: string) => (
                  <span className="text-xs text-gray-600">
                    {value.replace(/_/g, ' ')}
                  </span>
                )}
                iconType="circle"
                wrapperStyle={{ paddingTop: 12 }}
              />
              {stageKeys.map((stage) => (
                <Bar
                  key={stage}
                  dataKey={stage}
                  stackId="revenue"
                  fill={STAGE_COLORS[stage] ?? '#94a3b8'}
                  radius={stage === stageKeys[stageKeys.length - 1] ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">No forecast data</h3>
          <p className="mt-1 text-sm text-gray-500">
            Forecast data will appear once opportunities with close dates exist in the pipeline.
          </p>
        </div>
      )}
    </div>
  );
}
