import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Target, AlertTriangle, CheckSquare, TrendingUp, Users } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getRepDashboard, getManagerDashboard } from '../../services/dashboardApi';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import type { DashboardData } from '../../utils/types';

export default function DashboardPage() {
  const { user, isManager } = useAuthStore();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = isManager() ? await getManagerDashboard() : await getRepDashboard();
        setData(res.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isManager]);

  if (loading) return <LoadingSpinner size="lg" />;

  const totalPipelineValue = data?.pipelineValue?.reduce((sum, s) => sum + s.totalValue, 0) ?? 0;
  const totalDeals = data?.pipelineValue?.reduce((sum, s) => sum + s.count, 0) ?? 0;

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.firstName ?? 'User'}`}
        subtitle="Here's what's happening with your pipeline today."
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Pipeline Value"
          value={`$${(totalPipelineValue / 1000).toFixed(0)}K`}
          icon={DollarSign}
          color="teal"
        />
        <StatCard
          label="Active Deals"
          value={totalDeals}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          label="Leads Needing Attention"
          value={data?.leadsNeedingAttention ?? 0}
          icon={Target}
          color="amber"
        />
        <StatCard
          label="Deals at Risk"
          value={data?.dealsAtRisk?.length ?? 0}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deals at Risk */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Deals at Risk
            </h2>
          </div>
          <div className="p-5">
            {!data?.dealsAtRisk?.length ? (
              <p className="text-sm text-gray-500 text-center py-4">No deals at risk. Looking good!</p>
            ) : (
              <div className="space-y-3">
                {data.dealsAtRisk.slice(0, 5).map((opp) => (
                  <button
                    key={opp.id}
                    onClick={() => navigate(`/opportunities/${opp.id}`)}
                    className="w-full text-left flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{opp.name}</p>
                      <p className="text-xs text-gray-500">{opp.account?.companyName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        ${(opp.dealValue / 1000).toFixed(0)}K
                      </p>
                      <StatusBadge status={opp.stage} size="sm" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-teal-600" />
              Upcoming Tasks
            </h2>
          </div>
          <div className="p-5">
            {!data?.upcomingTasks?.length ? (
              <p className="text-sm text-gray-500 text-center py-4">No upcoming tasks.</p>
            ) : (
              <div className="space-y-3">
                {data.upcomingTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          task.priority === 'HIGH' || task.priority === 'URGENT'
                            ? 'bg-red-500'
                            : task.priority === 'MEDIUM'
                            ? 'bg-amber-500'
                            : 'bg-gray-400'
                        }`}
                      />
                      <span className="text-sm text-gray-700">{task.title}</span>
                    </div>
                    <StatusBadge status={task.status} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Priorities */}
        {data?.priorities && data.priorities.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm lg:col-span-2">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                AI-Recommended Priorities
              </h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.priorities.slice(0, 6).map((p, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(p.link)}
                    className="text-left p-3 rounded-lg border border-gray-100 hover:border-teal-200 hover:bg-teal-50/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                          p.urgency === 'HIGH'
                            ? 'bg-red-100 text-red-700'
                            : p.urgency === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {p.urgency}
                      </span>
                      <span className="text-xs text-gray-500 uppercase">{p.type}</span>
                    </div>
                    <p className="text-sm text-gray-900">{p.title}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
