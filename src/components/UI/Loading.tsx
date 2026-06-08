import { cn } from '@/lib/utils';

export type LoadingSize = 'sm' | 'md' | 'lg' | 'xl';

interface LoadingProps {
  size?: LoadingSize;
  text?: string;
  className?: string;
  fullScreen?: boolean;
  color?: 'primary' | 'white';
}

const sizeClasses: Record<LoadingSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const textSizeClasses: Record<LoadingSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

export function Loading({
  size = 'md',
  text,
  className,
  fullScreen = false,
  color = 'primary',
}: LoadingProps) {
  const spinner = (
    <svg
      className={cn(
        'animate-spin',
        sizeClasses[size],
        color === 'primary' ? 'text-primary-600' : 'text-white',
        className
      )}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
        <div className="flex flex-col items-center gap-3 bg-white px-8 py-6 rounded-xl shadow-xl">
          {spinner}
          {text && (
            <span className={cn('text-gray-600 font-medium', textSizeClasses[size])}>
              {text}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (text) {
    return (
      <div className="flex items-center gap-2">
        {spinner}
        <span className={cn('text-gray-600', textSizeClasses[size])}>{text}</span>
      </div>
    );
  }

  return spinner;
}

export default Loading;
