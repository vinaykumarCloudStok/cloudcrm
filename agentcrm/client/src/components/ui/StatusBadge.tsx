import { clsx } from 'clsx';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const colorMap: Record<string, string> = {
  PROSPECT: 'bg-blue-100 text-blue-700',
  NEW: 'bg-blue-100 text-blue-700',
  ACTIVE_LEAD: 'bg-yellow-100 text-yellow-700',
  CONTACTED: 'bg-yellow-100 text-yellow-700',
  CLIENT: 'bg-green-100 text-green-700',
  QUALIFIED: 'bg-green-100 text-green-700',
  CLOSED_WON: 'bg-green-100 text-green-700',
  CHURNED: 'bg-red-100 text-red-700',
  DISQUALIFIED: 'bg-red-100 text-red-700',
  CLOSED_LOST: 'bg-red-100 text-red-700',
  DORMANT: 'bg-gray-100 text-gray-600',
  NURTURE: 'bg-gray-100 text-gray-600',
  ENGAGED: 'bg-purple-100 text-purple-700',
  DISCOVERY: 'bg-blue-100 text-blue-700',
  PROPOSAL: 'bg-indigo-100 text-indigo-700',
  BUSINESS_VALIDATION: 'bg-indigo-100 text-indigo-700',
  TECHNICAL_VALIDATION: 'bg-violet-100 text-violet-700',
  NEGOTIATION: 'bg-yellow-100 text-yellow-700',
  CONTRACT_SENT: 'bg-orange-100 text-orange-700',
  CHAMPION: 'bg-green-100 text-green-700',
  DECISION_MAKER: 'bg-blue-100 text-blue-700',
  INFLUENCER: 'bg-purple-100 text-purple-700',
  BLOCKER: 'bg-red-100 text-red-700',
  END_USER: 'bg-gray-100 text-gray-600',
  DRAFT: 'bg-gray-100 text-gray-600',
  ACTIVE: 'bg-green-100 text-green-700',
  PAUSED: 'bg-yellow-100 text-yellow-700',
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  if (!status) return null;
  const colors = colorMap[status] || 'bg-gray-100 text-gray-600';
  const label = status.replace(/_/g, ' ');

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full whitespace-nowrap',
        colors,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      {label}
    </span>
  );
}
