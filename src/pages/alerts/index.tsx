import { useState, useEffect, useMemo, type ChangeEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { MainLayout } from '@/components/Layout/MainLayout';
import ProtectedRoute from '@/components/Layout/ProtectedRoute';
import Card from '@/components/UI/Card';
import Button from '@/components/UI/Button';
import Badge from '@/components/UI/Badge';
import Modal from '@/components/UI/Modal';
import Select, { type SelectOption } from '@/components/UI/Select';
import Loading from '@/components/UI/Loading';
import Alert from '@/components/UI/Alert';
import {
  getAlerts,
  markAlertRead,
  markAlertResolved,
} from '@/lib/api';
import {
  formatDateTime,
  getSeverityStyle,
  getSeverityLabel,
  cn,
} from '@/lib/utils';
import type {
  Alert as AlertType,
  AlertSeverity,
  PatientSimple,
} from '@/types';

const severityOptions: SelectOption[] = [
  { value: '', label: '全部严重程度' },
  { value: 'CRITICAL', label: '紧急' },
  { value: 'HIGH', label: '高' },
  { value: 'MEDIUM', label: '中' },
  { value: 'LOW', label: '低' },
];

const statusOptions: SelectOption[] = [
  { value: '', label: '全部状态' },
  { value: 'unresolved', label: '未解决' },
  { value: 'resolved', label: '已解决' },
];

const severityOrder: Record<AlertSeverity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

function getSeverityCardBg(severity: AlertSeverity): string {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-red-50 border-red-200';
    case 'HIGH':
      return 'bg-orange-50 border-orange-200';
    case 'MEDIUM':
      return 'bg-yellow-50 border-yellow-200';
    case 'LOW':
      return 'bg-blue-50 border-blue-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
}

function getSeverityCardText(severity: AlertSeverity): string {
  switch (severity) {
    case 'CRITICAL':
      return 'text-red-700';
    case 'HIGH':
      return 'text-orange-700';
    case 'MEDIUM':
      return 'text-yellow-700';
    case 'LOW':
      return 'text-blue-700';
    default:
      return 'text-gray-700';
  }
}

function getSeverityBadgeVariant(severity: AlertSeverity): 'danger' | 'warning' | 'primary' | 'info' {
  switch (severity) {
    case 'CRITICAL':
      return 'danger';
    case 'HIGH':
      return 'warning';
    case 'MEDIUM':
      return 'primary';
    case 'LOW':
      return 'info';
    default:
      return 'info';
  }
}

function getAlertRowBg(severity: AlertSeverity, isRead: boolean, resolved: boolean): string {
  if (resolved) return 'bg-gray-50';
  const opacity = isRead ? 'bg-opacity-50' : '';
  switch (severity) {
    case 'CRITICAL':
      return cn('bg-red-50', opacity);
    case 'HIGH':
      return cn('bg-orange-50', opacity);
    case 'MEDIUM':
      return cn('bg-yellow-50', opacity);
    case 'LOW':
      return cn('bg-blue-50', opacity);
    default:
      return 'bg-white';
  }
}

function AlertsContent() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterSeverity, setFilterSeverity] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);

  const [detailAlert, setDetailAlert] = useState<AlertType | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAlerts();
      setAlerts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const result: Record<AlertSeverity, number> = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };
    alerts.forEach((alert) => {
      if (!alert.resolved) {
        result[alert.severity]++;
      }
    });
    return result;
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    let result = [...alerts];

    if (filterSeverity) {
      result = result.filter((a) => a.severity === filterSeverity);
    }

    if (filterStatus === 'unresolved') {
      result = result.filter((a) => !a.resolved);
    } else if (filterStatus === 'resolved') {
      result = result.filter((a) => a.resolved);
    }

    result.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [alerts, filterSeverity, filterStatus]);

  const allSelected = useMemo(
    () => filteredAlerts.length > 0 && filteredAlerts.every((a) => selectedIds.has(a.id)),
    [filteredAlerts, selectedIds]
  );

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAlerts.map((a) => a.id)));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleMarkRead = async (ids: number[]) => {
    if (ids.length === 0) return;
    try {
      await markAlertRead(ids);
      setAlerts((prev) =>
        prev.map((a) => (ids.includes(a.id) ? { ...a, isRead: true } : a))
      );
      setAlertMessage({ type: 'success', message: `已标记 ${ids.length} 条提醒为已读` });
      setTimeout(() => setAlertMessage(null), 3000);
    } catch (err) {
      setAlertMessage({ type: 'error', message: err instanceof Error ? err.message : '操作失败' });
      setTimeout(() => setAlertMessage(null), 3000);
    }
  };

  const handleMarkResolved = async (ids: number[]) => {
    if (ids.length === 0) return;
    try {
      await markAlertResolved(ids);
      setAlerts((prev) =>
        prev.map((a) => (ids.includes(a.id) ? { ...a, resolved: true, isRead: true } : a))
      );
      setSelectedIds(new Set());
      setAlertMessage({ type: 'success', message: `已标记 ${ids.length} 条提醒为已解决` });
      setTimeout(() => setAlertMessage(null), 3000);
    } catch (err) {
      setAlertMessage({ type: 'error', message: err instanceof Error ? err.message : '操作失败' });
      setTimeout(() => setAlertMessage(null), 3000);
    }
  };

  const handleBatchMarkRead = async () => {
    if (selectedIds.size === 0) return;
    setBatchLoading(true);
    await handleMarkRead(Array.from(selectedIds));
    setBatchLoading(false);
  };

  const handleBatchMarkResolved = async () => {
    if (selectedIds.size === 0) return;
    setBatchLoading(true);
    await handleMarkResolved(Array.from(selectedIds));
    setBatchLoading(false);
  };

  const getPatientName = (patientId: number, patient?: PatientSimple): string => {
    return patient?.name || `患者#${patientId}`;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loading size="xl" text="加载异常提醒..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-gray-700 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>重新加载</Button>
        </div>
      </div>
    );
  }

  const severities: AlertSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  return (
    <div className="space-y-6">
      {alertMessage && (
        <Alert type={alertMessage.type} message={alertMessage.message} closable onClose={() => setAlertMessage(null)} />
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {severities.map((severity) => (
          <Card
            key={severity}
            className={cn('border', getSeverityCardBg(severity))}
            padding="md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={cn('text-sm font-medium', getSeverityCardText(severity))}>
                  {getSeverityLabel(severity)}
                </p>
                <p className={cn('text-3xl font-bold mt-2', getSeverityCardText(severity))}>
                  {stats[severity]}
                </p>
                <p className="text-xs text-gray-500 mt-1">未解决</p>
              </div>
              <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', getSeverityStyle(severity).bg)}>
                <svg
                  className={cn('w-6 h-6', getSeverityStyle(severity).text)}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card padding="md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
            <div className="w-full sm:w-48">
              <Select
                options={severityOptions}
                value={filterSeverity}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilterSeverity(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-40">
              <Select
                options={statusOptions}
                value={filterStatus}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              已选 {selectedIds.size} 项
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBatchMarkRead}
              disabled={selectedIds.size === 0 || batchLoading}
              isLoading={batchLoading}
            >
              批量标记已读
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={handleBatchMarkResolved}
              disabled={selectedIds.size === 0 || batchLoading}
            >
              批量标记已解决
            </Button>
          </div>
        </div>
      </Card>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  患者
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  指标
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  数值
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  严重程度
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  时间
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <span className="text-sm text-gray-500">暂无提醒数据</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className={cn(
                      getAlertRowBg(alert.severity, alert.isRead, alert.resolved),
                      'transition-colors'
                    )}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(alert.id)}
                        onChange={() => toggleSelect(alert.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/patients/${alert.patientId}`}
                        className={cn(
                          'font-medium hover:text-primary-600',
                          alert.isRead ? 'text-gray-700' : 'text-gray-900'
                        )}
                      >
                        {getPatientName(alert.patientId, alert.patient)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {alert.indicator || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {alert.value !== null && alert.value !== undefined ? alert.value : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getSeverityBadgeVariant(alert.severity)} size="sm">
                        {getSeverityLabel(alert.severity)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {formatDateTime(alert.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {alert.resolved ? (
                          <Badge variant="success" size="sm">已解决</Badge>
                        ) : alert.isRead ? (
                          <Badge variant="gray" size="sm">已读</Badge>
                        ) : (
                          <Badge variant="danger" size="sm">未读</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!alert.isRead && (
                          <button
                            onClick={() => handleMarkRead([alert.id])}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            标记已读
                          </button>
                        )}
                        {!alert.resolved && (
                          <button
                            onClick={() => handleMarkResolved([alert.id])}
                            className="text-green-600 hover:text-green-700 text-sm font-medium"
                          >
                            标记已解决
                          </button>
                        )}
                        <button
                          onClick={() => setDetailAlert(alert)}
                          className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                        >
                          详情
                        </button>
                        <button
                          onClick={() => router.push(`/patients/${alert.patientId}`)}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          患者详情
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={detailAlert !== null}
        onClose={() => setDetailAlert(null)}
        title="提醒详情"
        size="md"
        footer={
          detailAlert && (
            <>
              <Button variant="secondary" onClick={() => setDetailAlert(null)}>
                关闭
              </Button>
              {!detailAlert.resolved && (
                <Button
                  variant="success"
                  onClick={() => {
                    handleMarkResolved([detailAlert.id]);
                    setDetailAlert(null);
                  }}
                >
                  标记已解决
                </Button>
              )}
              <Button onClick={() => router.push(`/patients/${detailAlert.patientId}`)}>
                查看患者详情
              </Button>
            </>
          )
        }
      >
        {detailAlert && (
          <div className="space-y-4">
            <div className={cn('p-4 rounded-lg border', getSeverityStyle(detailAlert.severity).bg, getSeverityStyle(detailAlert.severity).border)}>
              <div className="flex items-center justify-between mb-2">
                <Badge variant={getSeverityBadgeVariant(detailAlert.severity)} size="md">
                  {getSeverityLabel(detailAlert.severity)}
                </Badge>
                <div className="flex items-center gap-2">
                  {detailAlert.resolved ? (
                    <Badge variant="success" size="sm">已解决</Badge>
                  ) : detailAlert.isRead ? (
                    <Badge variant="gray" size="sm">已读</Badge>
                  ) : (
                    <Badge variant="danger" size="sm">未读</Badge>
                  )}
                </div>
              </div>
              <p className={cn('text-base font-medium', getSeverityStyle(detailAlert.severity).text)}>
                {detailAlert.message}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">患者</p>
                <Link
                  href={`/patients/${detailAlert.patientId}`}
                  className="text-base font-medium text-gray-900 hover:text-primary-600"
                >
                  {getPatientName(detailAlert.patientId, detailAlert.patient)}
                </Link>
              </div>
              <div>
                <p className="text-sm text-gray-500">时间</p>
                <p className="text-base font-medium text-gray-900">
                  {formatDateTime(detailAlert.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">指标</p>
                <p className="text-base font-medium text-gray-900">
                  {detailAlert.indicator || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">数值</p>
                <p className="text-base font-medium text-gray-900">
                  {detailAlert.value !== null && detailAlert.value !== undefined ? detailAlert.value : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">提醒类型</p>
                <p className="text-base font-medium text-gray-900">
                  {detailAlert.alertType}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function AlertsPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <AlertsContent />
      </MainLayout>
    </ProtectedRoute>
  );
}
