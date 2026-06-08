import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  type?: AlertType;
  title?: string;
  message: string;
  icon?: ReactNode;
  closable?: boolean;
  onClose?: () => void;
}

const alertStyles: Record<AlertType, { bg: string; border: string; text: string; iconBg: string; iconColor: string }> = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
};

const defaultIcons: Record<AlertType, ReactNode> = {
  success: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export default function Alert({
  type = 'info',
  title,
  message,
  icon,
  closable = false,
  onClose,
  className,
  ...props
}: AlertProps) {
  const styles = alertStyles[type];
  const displayIcon = icon ?? defaultIcons[type];

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border',
        styles.bg,
        styles.border,
        className
      )}
      {...props}
    >
      <div className={cn('flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center', styles.iconBg, styles.iconColor)}>
        {displayIcon}
      </div>
      <div className="flex-1 min-w-0">
        {title && <p className={cn('text-sm font-semibold mb-0.5', styles.text)}>{title}</p>}
        <p className={cn('text-sm', styles.text)}>{message}</p>
      </div>
      {closable && (
        <button
          type="button"
          onClick={onClose}
          className={cn('flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors', styles.text)}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
