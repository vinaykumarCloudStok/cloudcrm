import { clsx } from 'clsx';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
};

export default function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const bg = score >= 75 ? 'bg-green-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <span
      className={clsx(
        'inline-flex items-center justify-center rounded-full font-semibold text-white',
        bg,
        sizeClasses[size]
      )}
    >
      {score}
    </span>
  );
}
