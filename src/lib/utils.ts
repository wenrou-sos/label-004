import type { AlertSeverity, FollowupPlanStatus } from '@/types';

function padZero(num: number): string {
  return num.toString().padStart(2, '0');
}

export function formatDate(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';
  const year = date.getFullYear();
  const month = padZero(date.getMonth() + 1);
  const day = padZero(date.getDate());
  return `${year}-${month}-${day}`;
}

export function formatDateTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';
  const year = date.getFullYear();
  const month = padZero(date.getMonth() + 1);
  const day = padZero(date.getDate());
  const hours = padZero(date.getHours());
  const minutes = padZero(date.getMinutes());
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function formatTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';
  const hours = padZero(date.getHours());
  const minutes = padZero(date.getMinutes());
  return `${hours}:${minutes}`;
}

export function calculateAge(birthDateInput: string | Date): number {
  const birthDate = typeof birthDateInput === 'string' ? new Date(birthDateInput) : birthDateInput;
  if (isNaN(birthDate.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

export function getSeverityStyle(severity: AlertSeverity): { bg: string; text: string; border: string } {
  const styles: Record<AlertSeverity, { bg: string; text: string; border: string }> = {
    LOW: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      border: 'border-yellow-200',
    },
    MEDIUM: {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
    },
    HIGH: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
    },
    CRITICAL: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-300',
    },
  };
  return styles[severity] || styles.LOW;
}

export function getSeverityLabel(severity: AlertSeverity): string {
  const labels: Record<AlertSeverity, string> = {
    LOW: '低',
    MEDIUM: '中',
    HIGH: '高',
    CRITICAL: '紧急',
  };
  return labels[severity] || '未知';
}

export function getStatusStyle(status: FollowupPlanStatus): { bg: string; text: string } {
  const styles: Record<FollowupPlanStatus, { bg: string; text: string }> = {
    PENDING: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
    },
    COMPLETED: {
      bg: 'bg-green-50',
      text: 'text-green-700',
    },
    CANCELLED: {
      bg: 'bg-gray-100',
      text: 'text-gray-600',
    },
  };
  return styles[status] || styles.PENDING;
}

export function getStatusLabel(status: FollowupPlanStatus): string {
  const labels: Record<FollowupPlanStatus, string> = {
    PENDING: '待随访',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
  };
  return labels[status] || '未知';
}

export function getGenderLabel(gender: string): string {
  return gender === '男' ? '男' : gender === '女' ? '女' : '未知';
}

export function getBloodTypeLabel(bloodType: string): string {
  const labels: Record<string, string> = {
    A: 'A型',
    B: 'B型',
    AB: 'AB型',
    O: 'O型',
  };
  return labels[bloodType] || '未知';
}

export function getFrequencyLabel(frequency: string): string {
  const labels: Record<string, string> = {
    DAILY: '每天',
    WEEKLY: '每周',
    BIWEEKLY: '每两周',
    MONTHLY: '每月',
    QUARTERLY: '每季度',
  };
  return labels[frequency] || '自定义';
}

export function formatPhone(phone: string): string {
  if (!phone || phone.length !== 11) return phone;
  return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
}

export function maskIdCard(idCard: string): string {
  if (!idCard || idCard.length < 8) return idCard;
  const start = idCard.slice(0, 4);
  const end = idCard.slice(-4);
  const middle = '*'.repeat(idCard.length - 8);
  return `${start}${middle}${end}`;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function isOverdue(dateInput: string | Date): boolean {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export function isToday(dateInput: string | Date): boolean {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return false;
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export function getRelativeTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) return '刚刚';
  if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
  if (diffInHours < 24) return `${diffInHours}小时前`;
  if (diffInDays < 7) return `${diffInDays}天前`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}周前`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}个月前`;
  return `${Math.floor(diffInDays / 365)}年前`;
}

export function parseDateInput(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return formatDate(date);
}
