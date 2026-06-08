import { useState, useEffect, useMemo, type ChangeEvent } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import ProtectedRoute from '@/components/Layout/ProtectedRoute';
import Card from '@/components/UI/Card';
import Button from '@/components/UI/Button';
import Badge from '@/components/UI/Badge';
import Modal from '@/components/UI/Modal';
import Select, { type SelectOption } from '@/components/UI/Select';
import DatePicker from '@/components/UI/DatePicker';
import Input from '@/components/UI/Input';
import Loading from '@/components/UI/Loading';
import Alert from '@/components/UI/Alert';
import {
  getFollowupPlans,
  createFollowupPlan,
  updateFollowupPlan,
  deleteFollowupPlan,
  getPatients,
} from '@/lib/api';
import {
  formatDate,
  formatDateTime,
  getStatusStyle,
  getStatusLabel,
  getFrequencyLabel,
  cn,
  isToday,
} from '@/lib/utils';
import type {
  FollowupPlan,
  FollowupPlanCreateInput,
  FollowupPlanStatus,
  FollowupFrequency,
  Patient,
  PatientSimple,
} from '@/types';

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

const frequencyOptions: SelectOption[] = [
  { value: 'DAILY', label: '每天' },
  { value: 'WEEKLY', label: '每周' },
  { value: 'BIWEEKLY', label: '每两周' },
  { value: 'MONTHLY', label: '每月' },
  { value: 'QUARTERLY', label: '每季度' },
];

const statusOptions: SelectOption[] = [
  { value: 'PENDING', label: '待随访' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' },
];

const emptyForm: FollowupPlanCreateInput = {
  patientId: 0,
  planDate: '',
  status: 'PENDING',
  frequency: undefined,
  notes: '',
};

function ScheduleContent() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [plans, setPlans] = useState<FollowupPlan[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<FollowupPlan | null>(null);
  const [formData, setFormData] = useState<FollowupPlanCreateInput>({ ...emptyForm });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);

        const [fetchedPlans, fetchedPatients] = await Promise.all([
          getFollowupPlans({
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
          }),
          getPatients(),
        ]);
        setPlans(fetchedPlans);
        setPatients(fetchedPatients);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentMonth]);

  const patientOptions: SelectOption[] = useMemo(
    () => patients.map((p) => ({ value: p.id, label: p.name })),
    [patients]
  );

  const getPatientName = (patientId: number, patient?: PatientSimple): string => {
    if (patient?.name) return patient.name;
    const found = patients.find((p) => p.id === patientId);
    return found?.name || '未知';
  };

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: { date: Date; dateStr: string; isCurrentMonth: boolean }[] = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startWeekDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({ date, dateStr: formatDate(date), isCurrentMonth: false });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({ date, dateStr: formatDate(date), isCurrentMonth: true });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, dateStr: formatDate(date), isCurrentMonth: false });
    }

    return days;
  }, [currentMonth]);

  const plansByDate = useMemo(() => {
    const map: Record<string, FollowupPlan[]> = {};
    plans.forEach((plan) => {
      const dateStr = formatDate(plan.planDate);
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(plan);
    });
    return map;
  }, [plans]);

  const selectedDatePlans = useMemo(
    () => plansByDate[selectedDate] || [],
    [plansByDate, selectedDate]
  );

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(formatDate(today));
  };

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData({ ...emptyForm, planDate: selectedDate });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (plan: FollowupPlan) => {
    setEditingPlan(plan);
    setFormData({
      patientId: plan.patientId,
      planDate: formatDate(plan.planDate),
      status: plan.status,
      frequency: plan.frequency || undefined,
      notes: plan.notes || '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.patientId || formData.patientId === 0) {
      errors.patientId = '请选择患者';
    }
    if (!formData.planDate) {
      errors.planDate = '请选择随访日期';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload: FollowupPlanCreateInput = {
        ...formData,
        notes: formData.notes || undefined,
        frequency: formData.frequency || undefined,
      };

      if (editingPlan) {
        const updated = await updateFollowupPlan(editingPlan.id, payload);
        setPlans((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p))
        );
        setAlertMessage({ type: 'success', message: '随访计划更新成功' });
      } else {
        const created = await createFollowupPlan(payload);
        setPlans((prev) => [...prev, created]);
        setAlertMessage({ type: 'success', message: '随访计划创建成功' });
      }
      setModalOpen(false);
      setTimeout(() => setAlertMessage(null), 3000);
    } catch (err) {
      setFormErrors({
        submit: err instanceof Error ? err.message : '提交失败',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkComplete = async (plan: FollowupPlan) => {
    try {
      const updated = await updateFollowupPlan(plan.id, { status: 'COMPLETED' });
      setPlans((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
      setAlertMessage({ type: 'success', message: '已标记为完成' });
      setTimeout(() => setAlertMessage(null), 3000);
    } catch (err) {
      setAlertMessage({ type: 'error', message: err instanceof Error ? err.message : '操作失败' });
      setTimeout(() => setAlertMessage(null), 3000);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      await deleteFollowupPlan(id);
      setPlans((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirmId(null);
      setAlertMessage({ type: 'success', message: '随访计划删除成功' });
      setTimeout(() => setAlertMessage(null), 3000);
    } catch (err) {
      setAlertMessage({ type: 'error', message: err instanceof Error ? err.message : '删除失败' });
      setTimeout(() => setAlertMessage(null), 3000);
    } finally {
      setDeleting(false);
    }
  };

  const getPlanDotColor = (status: FollowupPlanStatus): string => {
    switch (status) {
      case 'PENDING':
        return 'bg-blue-500';
      case 'COMPLETED':
        return 'bg-green-500';
      case 'CANCELLED':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loading size="xl" text="加载随访日程..." />
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

  return (
    <div className="space-y-6">
      {alertMessage && (
        <Alert type={alertMessage.type} message={alertMessage.message} closable onClose={() => setAlertMessage(null)} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={goToPrevMonth}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
                <h2 className="text-xl font-semibold text-gray-900 min-w-[160px] text-center">
                  {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
                </h2>
                <Button variant="secondary" size="sm" onClick={goToNextMonth}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToToday}>
                  今天
                </Button>
                <Button size="sm" onClick={openCreateModal}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  新增计划
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-gray-500 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map(({ date, dateStr, isCurrentMonth }) => {
                const dayPlans = plansByDate[dateStr] || [];
                const isSelected = selectedDate === dateStr;
                const isTodayDate = isToday(date);

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={cn(
                      'min-h-[90px] p-2 rounded-lg border text-left transition-all',
                      isSelected
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                      !isCurrentMonth && 'opacity-40'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          isTodayDate
                            ? 'w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center'
                            : isCurrentMonth
                            ? 'text-gray-900'
                            : 'text-gray-400'
                        )}
                      >
                        {date.getDate()}
                      </span>
                      {dayPlans.length > 0 && (
                        <span className="text-xs text-gray-500">{dayPlans.length}</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayPlans.slice(0, 3).map((plan) => (
                        <div
                          key={plan.id}
                          className={cn(
                            'text-xs px-1.5 py-0.5 rounded truncate',
                            getStatusStyle(plan.status).bg,
                            getStatusStyle(plan.status).text
                          )}
                        >
                          <span className={cn('inline-block w-1.5 h-1.5 rounded-full mr-1', getPlanDotColor(plan.status))} />
                          {getPatientName(plan.patientId, plan.patient)}
                        </div>
                      ))}
                      {dayPlans.length > 3 && (
                        <div className="text-xs text-gray-500 pl-1">
                          +{dayPlans.length - 3} 更多
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-6 mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-gray-600">待随访</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-gray-600">已完成</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-400" />
                <span className="text-sm text-gray-600">已取消</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card
            title={`${selectedDate} 随访计划`}
            header={
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedDate} 随访计划
                </h3>
                <Badge variant="primary" size="sm">
                  {selectedDatePlans.length} 项
                </Badge>
              </div>
            }
          >
            {selectedDatePlans.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg
                  className="w-12 h-12 mx-auto mb-3 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm">当天暂无随访计划</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={openCreateModal}>
                  添加计划
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDatePlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {getPatientName(plan.patientId, plan.patient)}
                          </span>
                          <Badge
                            variant={
                              plan.status === 'COMPLETED'
                                ? 'success'
                                : plan.status === 'CANCELLED'
                                ? 'gray'
                                : 'info'
                            }
                            size="sm"
                          >
                            {getStatusLabel(plan.status)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          计划时间：{formatDateTime(plan.planDate)}
                        </p>
                        {plan.frequency && (
                          <p className="text-sm text-gray-500">
                            随访频率：{getFrequencyLabel(plan.frequency)}
                          </p>
                        )}
                        {plan.notes && (
                          <p className="text-sm text-gray-600 mt-2">{plan.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                      {plan.status === 'PENDING' && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleMarkComplete(plan)}
                        >
                          标记完成
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(plan)}
                      >
                        编辑
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteConfirmId(plan.id)}
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        title={editingPlan ? '编辑随访计划' : '新增随访计划'}
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button onClick={handleSubmit} isLoading={submitting}>
              {editingPlan ? '保存修改' : '创建'}
            </Button>
          </>
        }
      >
        {formErrors.submit && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {formErrors.submit}
          </div>
        )}
        <div className="space-y-4">
          <Select
            label="患者"
            name="patientId"
            options={patientOptions}
            value={formData.patientId || ''}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setFormData({ ...formData, patientId: Number(e.target.value) || 0 })
            }
            error={formErrors.patientId}
            placeholder="请选择患者"
          />
          <DatePicker
            label="随访日期"
            name="planDate"
            value={formData.planDate}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setFormData({ ...formData, planDate: e.target.value })
            }
            error={formErrors.planDate}
          />
          <Select
            label="状态"
            name="status"
            options={statusOptions}
            value={formData.status}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setFormData({ ...formData, status: e.target.value as FollowupPlanStatus })
            }
            placeholder="请选择状态"
          />
          <Select
            label="随访频率"
            name="frequency"
            options={frequencyOptions}
            value={formData.frequency || ''}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setFormData({
                ...formData,
                frequency: (e.target.value as FollowupFrequency) || undefined,
              })
            }
            placeholder="请选择随访频率（可选）"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">备注</label>
            <textarea
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border bg-white text-gray-900 placeholder-gray-400 py-2.5 px-3.5"
              rows={3}
              placeholder="请输入备注信息（可选）"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={deleteConfirmId !== null}
        onClose={() => !deleting && setDeleteConfirmId(null)}
        title="确认删除"
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleteConfirmId(null)}
              disabled={deleting}
            >
              取消
            </Button>
            <Button
              variant="danger"
              onClick={() => deleteConfirmId !== null && handleDelete(deleteConfirmId)}
              isLoading={deleting}
            >
              确认删除
            </Button>
          </>
        }
      >
        <p className="text-gray-700">确定要删除该随访计划吗？此操作不可恢复。</p>
      </Modal>
    </div>
  );
}

export default function SchedulePage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <ScheduleContent />
      </MainLayout>
    </ProtectedRoute>
  );
}
