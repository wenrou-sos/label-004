import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { Badge } from '@/components/UI/Badge';
import { Loading } from '@/components/UI/Loading';
import { Table, type TableColumn } from '@/components/UI/Table';
import ProtectedRoute from '@/components/Layout/ProtectedRoute';
import {
  getDashboardStats,
  getFollowupPlans,
  getAlerts,
  getFollowupRecords,
} from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import {
  formatDate,
  formatDateTime,
  getSeverityStyle,
  getStatusStyle,
  getSeverityLabel,
  getStatusLabel,
  isToday,
  cn,
} from '@/lib/utils';
import type {
  DashboardStats,
  FollowupPlan,
  Alert,
  FollowupRecord,
} from '@/types';

interface DashboardData {
  stats: DashboardStats | null;
  recentRecords: FollowupRecord[];
  upcomingPlans: FollowupPlan[];
  highAlerts: Alert[];
}

function DashboardContent() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({
    stats: null,
    recentRecords: [],
    upcomingPlans: [],
    highAlerts: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const [stats, plans, alerts, records] = await Promise.all([
          getDashboardStats(),
          getFollowupPlans({
            startDate: formatDate(today),
            endDate: formatDate(tomorrow),
            status: 'PENDING',
          }),
          getAlerts({ resolved: false }),
          getFollowupRecords(),
        ]);

        const sortedRecords = [...records]
          .sort(
            (a, b) =>
              new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
          )
          .slice(0, 5);

        const sortedPlans = [...plans].sort(
          (a, b) =>
            new Date(a.planDate).getTime() - new Date(b.planDate).getTime()
        );

        const highSeverityAlerts = alerts
          .filter(
            (alert) => alert.severity === 'HIGH' || alert.severity === 'CRITICAL'
          )
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 5);

        setData({
          stats,
          recentRecords: sortedRecords,
          upcomingPlans: sortedPlans,
          highAlerts: highSeverityAlerts,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loading size="xl" text="加载仪表盘数据..." />
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

  const stats = data.stats!;

  const statCards = [
    {
      title: '患者总数',
      value: stats.totalPatients,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      href: '/patients',
    },
    {
      title: '今日随访',
      value: stats.todayFollowups,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      href: '/schedule',
    },
    {
      title: '待处理计划',
      value: stats.pendingPlans,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      href: '/schedule',
    },
    {
      title: '异常提醒',
      value: stats.unresolvedAlerts,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      href: '/alerts',
    },
  ];

  const recordColumns: TableColumn<FollowupRecord>[] = [
    {
      key: 'patient',
      title: '患者姓名',
      render: (record) => (
        <span className="font-medium text-gray-900">
          {record.patient?.name || '-'}
        </span>
      ),
    },
    {
      key: 'visitDate',
      title: '随访时间',
      render: (record) => (
        <span className="text-gray-600">{formatDateTime(record.visitDate)}</span>
      ),
    },
    {
      key: 'diagnosis',
      title: '诊断',
      render: (record) => (
        <span className="text-gray-600">
          {record.diagnosis || record.chiefComplaint || '-'}
        </span>
      ),
    },
    {
      key: 'nextVisit',
      title: '下次随访',
      render: (record) => (
        <span className="text-gray-600">
          {record.nextVisitDate ? formatDate(record.nextVisitDate) : '-'}
        </span>
      ),
    },
    {
      key: 'action',
      title: '操作',
      align: 'right',
      render: (record) => (
        <Link
          href={`/patients/${record.patientId}`}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          查看详情
        </Link>
      ),
    },
  ];

  const planColumns: TableColumn<FollowupPlan>[] = [
    {
      key: 'patient',
      title: '患者姓名',
      render: (plan) => (
        <span className="font-medium text-gray-900">
          {plan.patient?.name || '-'}
        </span>
      ),
    },
    {
      key: 'planDate',
      title: '计划日期',
      render: (plan) => (
        <div className="flex items-center gap-2">
          <span className="text-gray-600">{formatDate(plan.planDate)}</span>
          {isToday(plan.planDate) && (
            <Badge variant="primary" size="sm">今天</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (plan) => {
        const style = getStatusStyle(plan.status);
        return (
          <Badge className={cn(style.bg, style.text)} size="sm">
            {getStatusLabel(plan.status)}
          </Badge>
        );
      },
    },
    {
      key: 'notes',
      title: '备注',
      render: (plan) => (
        <span className="text-gray-600">{plan.notes || '-'}</span>
      ),
    },
    {
      key: 'action',
      title: '操作',
      align: 'right',
      render: (plan) => (
        <Link
          href={`/schedule/${plan.id}`}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          处理
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            欢迎回来，{user?.realName || '医生'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            今天是 {formatDate(new Date())}，祝您工作顺利
          </p>
        </div>
        <Link href="/schedule">
          <Button variant="primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新建随访
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {card.value}
                  </p>
                </div>
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    card.iconBg,
                    card.iconColor
                  )}
                >
                  {card.icon}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="最近随访记录"
          subtitle="最近5条随访记录"
          header={
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">最近随访记录</h3>
                <p className="text-sm text-gray-500 mt-0.5">最近5条随访记录</p>
              </div>
              <Link href="/schedule">
                <Button variant="outline" size="sm">
                  查看全部
                </Button>
              </Link>
            </div>
          }
          padding="none"
        >
          <Table
            columns={recordColumns}
            data={data.recentRecords}
            rowKey="id"
            emptyText="暂无随访记录"
            className="border-0 rounded-none"
          />
        </Card>

        <Card
          header={
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">待处理随访计划</h3>
                <p className="text-sm text-gray-500 mt-0.5">今日和明日的随访计划</p>
              </div>
              <Link href="/schedule">
                <Button variant="outline" size="sm">
                  查看全部
                </Button>
              </Link>
            </div>
          }
          padding="none"
        >
          <Table
            columns={planColumns}
            data={data.upcomingPlans}
            rowKey="id"
            emptyText="暂无待处理的随访计划"
            className="border-0 rounded-none"
          />
        </Card>
      </div>

      <Card
        header={
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">最近异常提醒</h3>
              <p className="text-sm text-gray-500 mt-0.5">未解决的高严重程度提醒</p>
            </div>
            <Link href="/alerts">
              <Button variant="outline" size="sm">
                查看全部
              </Button>
            </Link>
          </div>
        }
      >
        {data.highAlerts.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <svg
              className="w-12 h-12 text-gray-300 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p>暂无异常提醒</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.highAlerts.map((alert) => {
              const severityStyle = getSeverityStyle(alert.severity);
              return (
                <div
                  key={alert.id}
                  className={cn(
                    'p-4 rounded-lg border flex items-start gap-3',
                    severityStyle.bg,
                    severityStyle.border
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                      alert.severity === 'CRITICAL' ? 'bg-red-200' : 'bg-red-100'
                    )}
                  >
                    <svg
                      className={cn('w-5 h-5', severityStyle.text)}
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">
                        {alert.patient?.name || '未知患者'}
                      </span>
                      <Badge
                        variant={alert.severity === 'CRITICAL' ? 'danger' : 'warning'}
                        size="sm"
                      >
                        {getSeverityLabel(alert.severity)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDateTime(alert.createdAt)}
                      </span>
                    </div>
                    <p className={cn('text-sm mt-1', severityStyle.text)}>
                      {alert.message}
                    </p>
                    {alert.indicator && alert.value !== null && (
                      <p className="text-xs text-gray-500 mt-1">
                        {alert.indicator}: {alert.value}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/alerts/${alert.id}`}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium flex-shrink-0"
                  >
                    处理
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <DashboardContent />
      </MainLayout>
    </ProtectedRoute>
  );
}
