import { Phone, Mail, Calendar, FileText, Bot, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { type Activity } from '../../utils/types';

interface TimelineProps {
  activities: Activity[];
}

const iconMap: Record<string, typeof Phone> = {
  CALL: Phone,
  EMAIL: Mail,
  MEETING: Calendar,
  NOTE: FileText,
  AGENT_ACTION: Bot,
};

const colorMap: Record<string, string> = {
  CALL: 'bg-blue-100 text-blue-600',
  EMAIL: 'bg-green-100 text-green-600',
  MEETING: 'bg-purple-100 text-purple-600',
  NOTE: 'bg-amber-100 text-amber-600',
  AGENT_ACTION: 'bg-teal-100 text-teal-600',
};

export default function Timeline({ activities }: TimelineProps) {
  if (activities.length === 0) {
    return <p className="text-sm text-gray-500 py-4 text-center">No activities yet.</p>;
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = iconMap[activity.type] || MessageSquare;
          const colors = colorMap[activity.type] || 'bg-gray-100 text-gray-600';

          return (
            <div key={activity.id} className="relative flex gap-3 pl-1">
              <div className={`relative z-10 flex items-center justify-center h-8 w-8 rounded-full shrink-0 ${colors}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2 mb-0.5">
                  {activity.user && (
                    <span className="text-sm font-medium text-gray-900">
                      {activity.user.firstName} {activity.user.lastName}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{activity.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
