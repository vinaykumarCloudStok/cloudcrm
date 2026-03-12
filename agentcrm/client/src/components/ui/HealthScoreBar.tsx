import { clsx } from 'clsx';

interface HealthScoreBarProps {
  score: number;
}

export default function HealthScoreBar({ score }: HealthScoreBarProps) {
  const color = score >= 75 ? 'bg-green-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = score >= 75 ? 'text-green-700' : score >= 40 ? 'text-amber-700' : 'text-red-700';

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      <span className={clsx('text-sm font-semibold min-w-[2rem] text-right', textColor)}>{score}</span>
    </div>
  );
}
