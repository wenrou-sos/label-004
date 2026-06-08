import { useState, useEffect, useMemo, type ChangeEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { MainLayout } from '@/components/Layout/MainLayout';
import Card from '@/components/UI/Card';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import Select, { type SelectOption } from '@/components/UI/Select';
import Modal from '@/components/UI/Modal';
import DatePicker from '@/components/UI/DatePicker';
import Loading from '@/components/UI/Loading';
import Badge from '@/components/UI/Badge';
import Table, { type TableColumn } from '@/components/UI/Table';
import ProtectedRoute from '@/components/Layout/ProtectedRoute';
import {
  getPatient,
  updatePatient,
  getHealthRecords,
  createHealthRecord,
  getFollowupRecords,
  createFollowupRecord,
  getFollowupPlans,
  createFollowupPlan,
  getDiseaseTypes,
} from '@/lib/api';
import {
  formatDate,
  formatDateTime,
  calculateAge,
  formatPhone,
  maskIdCard,
  getBloodTypeLabel,
  getStatusStyle,
  getStatusLabel,
  getFrequencyLabel,
  cn,
} from '@/lib/utils';
import type {
  Patient,
  DiseaseType,
  HealthRecord,
  HealthRecordCreateInput,
  FollowupRecord,
  FollowupRecordCreateInput,
  FollowupPlan,
  FollowupPlanCreateInput,
  PatientCreateInput,
  Gender,
  BloodType,
  FollowupFrequency,
  FollowupPlanStatus,
} from '@/types';

type TabKey = 'profile' | 'health' | 'followup' | 'plans';

const genderOptions: SelectOption[] = [
  { value: '男', label: '男' },
  { value: '女', label: '女' },
];

const bloodTypeOptions: SelectOption[] = [
  { value: 'A', label: 'A型' },
  { value: 'B', label: 'B型' },
  { value: 'AB', label: 'AB型' },
  { value: 'O', label: 'O型' },
];

const frequencyOptions: SelectOption[] = [
  { value: 'DAILY', label: '每天' },
  { value: 'WEEKLY', label: '每周' },
  { value: 'BIWEEKLY', label: '每两周' },
  { value: 'MONTHLY', label: '每月' },
  { value: 'QUARTERLY', label: '每季度' },
];

const emptyHealthRecord: Omit<HealthRecordCreateInput, 'patientId'> = {
  recordDate: formatDate(new Date()),
  systolic: undefined,
  diastolic: undefined,
  heartRate: undefined,
  fastingGlucose: undefined,
  postprandialGlucose: undefined,
  cholesterol: undefined,
  triglycerides: undefined,
  weight: undefined,
  note: '',
};

const emptyFollowupRecord: Omit<FollowupRecordCreateInput, 'patientId'> = {
  visitDate: formatDate(new Date()),
  chiefComplaint: '',
  examination: '',
  diagnosis: '',
  treatment: '',
  medication: '',
  advice: '',
  nextVisitDate: '',
};

const emptyFollowupPlan: Omit<FollowupPlanCreateInput, 'patientId'> = {
  planDate: formatDate(new Date()),
  status: 'PENDING',
  frequency: undefined,
  notes: '',
};

const tabs: { key: TabKey; label: string }[] = [
  { key: 'profile', label: '基本档案' },
  { key: 'health', label: '健康指标' },
  { key: 'followup', label: '随访记录' },
  { key: 'plans', label: '随访计划' },
];

function PatientDetailContent() {
  const router = useRouter();
  const { id } = router.query;
  const patientId = Number(id);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [diseaseTypes, setDiseaseTypes] = useState<DiseaseType[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [followupRecords, setFollowupRecords] = useState<FollowupRecord[]>([]);
  const [followupPlans, setFollowupPlans] = useState<FollowupPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('profile');

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<Partial<PatientCreateInput>>({});
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [healthForm, setHealthForm] = useState({ ...emptyHealthRecord });
  const [healthErrors, setHealthErrors] = useState<Record<string, string>>({});
  const [healthSubmitting, setHealthSubmitting] = useState(false);

  const [followupModalOpen, setFollowupModalOpen] = useState(false);
  const [followupForm, setFollowupForm] = useState({ ...emptyFollowupRecord });
  const [followupErrors, setFollowupErrors] = useState<Record<string, string>>({});
  const [followupSubmitting, setFollowupSubmitting] = useState(false);

  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planForm, setPlanForm] = useState({ ...emptyFollowupPlan });
  const [planErrors, setPlanErrors] = useState<Record<string, string>>({});
  const [planSubmitting, setPlanSubmitting] = useState(false);

  useEffect(() => {
    if (!patientId || isNaN(patientId)) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [
          fetchedPatient,
          fetchedDiseaseTypes,
          fetchedHealth,
          fetchedFollowups,
          fetchedPlans,
        ] = await Promise.all([
          getPatient(patientId),
          getDiseaseTypes(),
          getHealthRecords({ patientId }),
          getFollowupRecords({ patientId }),
          getFollowupPlans({ patientId }),
        ]);
        setPatient(fetchedPatient);
        setDiseaseTypes(fetchedDiseaseTypes);
        setHealthRecords(
          [...fetchedHealth].sort(
            (a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime()
          )
        );
        setFollowupRecords(
          [...fetchedFollowups].sort(
            (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
          )
        );
        setFollowupPlans(
          [...fetchedPlans].sort(
            (a, b) => new Date(a.planDate).getTime() - new Date(b.planDate).getTime()
          )
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [patientId]);

  const diseaseTypeOptions: SelectOption[] = useMemo(
    () => diseaseTypes.map((dt) => ({ value: dt.id, label: dt.name })),
    [diseaseTypes]
  );

  const startEditProfile = () => {
    if (!patient) return;
    setProfileForm({
      name: patient.name,
      gender: patient.gender,
      birthDate: patient.birthDate,
      idCard: patient.idCard,
      phone: patient.phone,
      address: patient.address || '',
      bloodType: patient.bloodType || undefined,
      height: patient.height || undefined,
      weight: patient.weight || undefined,
      allergies: patient.allergies || '',
      medicalHistory: patient.medicalHistory || '',
      diseaseTypeId: patient.diseaseTypeId,
    });
    setProfileErrors({});
    setEditingProfile(true);
  };

  const validateProfile = (): boolean => {
    const errors: Record<string, string> = {};
    if (!profileForm.name?.trim()) errors.name = '请输入姓名';
    if (!profileForm.gender) errors.gender = '请选择性别';
    if (!profileForm.birthDate) errors.birthDate = '请选择出生日期';
    if (!profileForm.idCard?.trim()) errors.idCard = '请输入身份证号';
    else if (!/^\d{17}[\dXx]$/.test(profileForm.idCard.trim()))
      errors.idCard = '身份证号格式不正确';
    if (!profileForm.phone?.trim()) errors.phone = '请输入手机号';
    else if (!/^1[3-9]\d{9}$/.test(profileForm.phone.trim()))
      errors.phone = '手机号格式不正确';
    if (!profileForm.diseaseTypeId || profileForm.diseaseTypeId === 0)
      errors.diseaseTypeId = '请选择疾病类型';
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async () => {
    if (!validateProfile() || !patient) return;
    setProfileSubmitting(true);
    try {
      const payload: Partial<PatientCreateInput> = {
        ...profileForm,
        address: profileForm.address || undefined,
        bloodType: profileForm.bloodType || undefined,
        height: profileForm.height || undefined,
        weight: profileForm.weight || undefined,
        allergies: profileForm.allergies || undefined,
        medicalHistory: profileForm.medicalHistory || undefined,
      };
      const updated = await updatePatient(patient.id, payload);
      setPatient(updated);
      setEditingProfile(false);
    } catch (err) {
      setProfileErrors({
        submit: err instanceof Error ? err.message : '保存失败',
      });
    } finally {
      setProfileSubmitting(false);
    }
  };

  const openHealthModal = () => {
    setHealthForm({ ...emptyHealthRecord });
    setHealthErrors({});
    setHealthModalOpen(true);
  };

  const validateHealth = (): boolean => {
    const errors: Record<string, string> = {};
    if (!healthForm.recordDate) errors.recordDate = '请选择记录日期';
    setHealthErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleHealthSubmit = async () => {
    if (!validateHealth() || !patient) return;
    setHealthSubmitting(true);
    try {
      const payload: HealthRecordCreateInput = {
        patientId: patient.id,
        recordDate: healthForm.recordDate,
        systolic: healthForm.systolic,
        diastolic: healthForm.diastolic,
        heartRate: healthForm.heartRate,
        fastingGlucose: healthForm.fastingGlucose,
        postprandialGlucose: healthForm.postprandialGlucose,
        cholesterol: healthForm.cholesterol,
        triglycerides: healthForm.triglycerides,
        weight: healthForm.weight,
        note: healthForm.note || undefined,
      };
      const created = await createHealthRecord(payload);
      setHealthRecords((prev) =>
        [created, ...prev].sort(
          (a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime()
        )
      );
      setHealthModalOpen(false);
    } catch (err) {
      setHealthErrors({
        submit: err instanceof Error ? err.message : '保存失败',
      });
    } finally {
      setHealthSubmitting(false);
    }
  };

  const openFollowupModal = () => {
    setFollowupForm({ ...emptyFollowupRecord });
    setFollowupErrors({});
    setFollowupModalOpen(true);
  };

  const validateFollowup = (): boolean => {
    const errors: Record<string, string> = {};
    if (!followupForm.visitDate) errors.visitDate = '请选择随访日期';
    setFollowupErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFollowupSubmit = async () => {
    if (!validateFollowup() || !patient) return;
    setFollowupSubmitting(true);
    try {
      const payload: FollowupRecordCreateInput = {
        patientId: patient.id,
        visitDate: followupForm.visitDate,
        chiefComplaint: followupForm.chiefComplaint || undefined,
        examination: followupForm.examination || undefined,
        diagnosis: followupForm.diagnosis || undefined,
        treatment: followupForm.treatment || undefined,
        medication: followupForm.medication || undefined,
        advice: followupForm.advice || undefined,
        nextVisitDate: followupForm.nextVisitDate || undefined,
      };
      const created = await createFollowupRecord(payload);
      setFollowupRecords((prev) =>
        [created, ...prev].sort(
          (a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime()
        )
      );
      setFollowupModalOpen(false);
    } catch (err) {
      setFollowupErrors({
        submit: err instanceof Error ? err.message : '保存失败',
      });
    } finally {
      setFollowupSubmitting(false);
    }
  };

  const openPlanModal = () => {
    setPlanForm({ ...emptyFollowupPlan });
    setPlanErrors({});
    setPlanModalOpen(true);
  };

  const validatePlan = (): boolean => {
    const errors: Record<string, string> = {};
    if (!planForm.planDate) errors.planDate = '请选择计划日期';
    setPlanErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlanSubmit = async () => {
    if (!validatePlan() || !patient) return;
    setPlanSubmitting(true);
    try {
      const payload: FollowupPlanCreateInput = {
        patientId: patient.id,
        planDate: planForm.planDate,
        status: planForm.status as FollowupPlanStatus,
        frequency: planForm.frequency as FollowupFrequency | undefined,
        notes: planForm.notes || undefined,
      };
      const created = await createFollowupPlan(payload);
      setFollowupPlans((prev) =>
        [...prev, created].sort(
          (a, b) => new Date(a.planDate).getTime() - new Date(b.planDate).getTime()
        )
      );
      setPlanModalOpen(false);
    } catch (err) {
      setPlanErrors({
        submit: err instanceof Error ? err.message : '保存失败',
      });
    } finally {
      setPlanSubmitting(false);
    }
  };

  const healthColumns: TableColumn<HealthRecord>[] = [
    {
      key: 'recordDate',
      title: '记录日期',
      render: (record) => <span className="font-medium">{formatDate(record.recordDate)}</span>,
    },
    {
      key: 'bloodPressure',
      title: '血压 (mmHg)',
      render: (record) => (
        <span>
          {record.systolic && record.diastolic
            ? `${record.systolic}/${record.diastolic}`
            : '-'}
        </span>
      ),
    },
    {
      key: 'heartRate',
      title: '心率 (次/分)',
      render: (record) => <span>{record.heartRate ?? '-'}</span>,
    },
    {
      key: 'fastingGlucose',
      title: '空腹血糖 (mmol/L)',
      render: (record) => <span>{record.fastingGlucose ?? '-'}</span>,
    },
    {
      key: 'postprandialGlucose',
      title: '餐后血糖 (mmol/L)',
      render: (record) => <span>{record.postprandialGlucose ?? '-'}</span>,
    },
    {
      key: 'weight',
      title: '体重 (kg)',
      render: (record) => <span>{record.weight ?? '-'}</span>,
    },
    {
      key: 'note',
      title: '备注',
      render: (record) => <span className="text-gray-500">{record.note || '-'}</span>,
    },
  ];

  const followupColumns: TableColumn<FollowupRecord>[] = [
    {
      key: 'visitDate',
      title: '随访日期',
      render: (record) => <span className="font-medium">{formatDate(record.visitDate)}</span>,
    },
    {
      key: 'chiefComplaint',
      title: '主诉',
      render: (record) => (
        <span className="max-w-xs truncate block" title={record.chiefComplaint || ''}>
          {record.chiefComplaint || '-'}
        </span>
      ),
    },
    {
      key: 'diagnosis',
      title: '诊断',
      render: (record) => (
        <span className="max-w-xs truncate block" title={record.diagnosis || ''}>
          {record.diagnosis || '-'}
        </span>
      ),
    },
    {
      key: 'medication',
      title: '用药',
      render: (record) => (
        <span className="max-w-xs truncate block" title={record.medication || ''}>
          {record.medication || '-'}
        </span>
      ),
    },
    {
      key: 'nextVisitDate',
      title: '下次复诊',
      render: (record) => (
        <span>{record.nextVisitDate ? formatDate(record.nextVisitDate) : '-'}</span>
      ),
    },
  ];

  const planColumns: TableColumn<FollowupPlan>[] = [
    {
      key: 'planDate',
      title: '计划日期',
      render: (plan) => <span className="font-medium">{formatDate(plan.planDate)}</span>,
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
      key: 'frequency',
      title: '随访频率',
      render: (plan) => <span>{plan.frequency ? getFrequencyLabel(plan.frequency) : '-'}</span>,
    },
    {
      key: 'notes',
      title: '备注',
      render: (plan) => (
        <span className="max-w-xs truncate block" title={plan.notes || ''}>
          {plan.notes || '-'}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loading size="xl" text="加载患者详情..." />
      </div>
    );
  }

  if (error || !patient) {
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
          <p className="text-gray-700 mb-4">{error || '患者不存在'}</p>
          <Link href="/patients">
            <Button variant="secondary">返回患者列表</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/patients"
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回患者列表
      </Link>

      <Card padding="md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-primary-700">
                {patient.name.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{patient.name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant="primary" size="sm">
                  {patient.diseaseType?.name || '未分类'}
                </Badge>
                <span className="text-sm text-gray-500">
                  {patient.gender} · {calculateAge(patient.birthDate)}岁
                </span>
              </div>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 sm:ml-8">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">联系电话</p>
              <p className="text-sm font-medium text-gray-900">{formatPhone(patient.phone)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">身份证号</p>
              <p className="text-sm font-medium text-gray-900">{maskIdCard(patient.idCard)}</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-xs text-gray-500 mb-0.5">主治医生</p>
              <p className="text-sm font-medium text-gray-900">
                {patient.doctor?.realName || '-'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card padding="none">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-6 py-3.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">基本信息</h3>
                {!editingProfile ? (
                  <Button variant="outline" size="sm" onClick={startEditProfile}>
                    编辑
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditingProfile(false)}
                      disabled={profileSubmitting}
                    >
                      取消
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleProfileSubmit}
                      isLoading={profileSubmitting}
                    >
                      保存
                    </Button>
                  </div>
                )}
              </div>

              {profileErrors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {profileErrors.submit}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">姓名</p>
                  {editingProfile ? (
                    <Input
                      value={profileForm.name || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setProfileForm({ ...profileForm, name: e.target.value })}
                      error={profileErrors.name}
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{patient.name}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">性别</p>
                  {editingProfile ? (
                    <Select
                      options={genderOptions}
                      value={profileForm.gender || ''}
                      onChange={(value: any) => setProfileForm({ ...profileForm, gender: value as Gender })}
                      error={profileErrors.gender}
                      placeholder="请选择"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{patient.gender}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">出生日期</p>
                  {editingProfile ? (
                    <DatePicker
                      value={profileForm.birthDate || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setProfileForm({ ...profileForm, birthDate: e.target.value })
                      }
                      error={profileErrors.birthDate}
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(patient.birthDate)}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">身份证号</p>
                  {editingProfile ? (
                    <Input
                      value={profileForm.idCard || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setProfileForm({ ...profileForm, idCard: e.target.value })
                      }
                      error={profileErrors.idCard}
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {maskIdCard(patient.idCard)}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">联系电话</p>
                  {editingProfile ? (
                    <Input
                      value={profileForm.phone || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setProfileForm({ ...profileForm, phone: e.target.value })
                      }
                      error={profileErrors.phone}
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {formatPhone(patient.phone)}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">疾病类型</p>
                  {editingProfile ? (
                    <Select
                      options={diseaseTypeOptions}
                      value={profileForm.diseaseTypeId || ''}
                      onChange={(value: any) =>
                        setProfileForm({
                          ...profileForm,
                          diseaseTypeId: Number(value) || 0,
                        })
                      }
                      error={profileErrors.diseaseTypeId}
                      placeholder="请选择"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {patient.diseaseType?.name || '-'}
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <p className="text-sm text-gray-500 mb-1">地址</p>
                  {editingProfile ? (
                    <Input
                      value={profileForm.address || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setProfileForm({ ...profileForm, address: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {patient.address || '-'}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">血型</p>
                  {editingProfile ? (
                    <Select
                      options={bloodTypeOptions}
                      value={profileForm.bloodType || ''}
                      onChange={(value: any) =>
                        setProfileForm({
                          ...profileForm,
                          bloodType: (value as BloodType) || undefined,
                        })
                      }
                      placeholder="请选择"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {patient.bloodType ? getBloodTypeLabel(patient.bloodType) : '-'}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">身高</p>
                  {editingProfile ? (
                    <Input
                      type="number"
                      value={profileForm.height ?? ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setProfileForm({
                          ...profileForm,
                          height: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      helperText="单位：cm"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {patient.height ? `${patient.height} cm` : '-'}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">体重</p>
                  {editingProfile ? (
                    <Input
                      type="number"
                      value={profileForm.weight ?? ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setProfileForm({
                          ...profileForm,
                          weight: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      helperText="单位：kg"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {patient.weight ? `${patient.weight} kg` : '-'}
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <p className="text-sm text-gray-500 mb-1">过敏史</p>
                  {editingProfile ? (
                    <Input
                      value={profileForm.allergies || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setProfileForm({ ...profileForm, allergies: e.target.value })
                      }
                      placeholder="无则留空"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {patient.allergies || '无'}
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <p className="text-sm text-gray-500 mb-1">既往病史</p>
                  {editingProfile ? (
                    <Input
                      value={profileForm.medicalHistory || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setProfileForm({ ...profileForm, medicalHistory: e.target.value })
                      }
                      placeholder="无则留空"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {patient.medicalHistory || '无'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'health' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">健康指标记录</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    共 {healthRecords.length} 条记录
                  </p>
                </div>
                <Button onClick={openHealthModal}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  新增记录
                </Button>
              </div>
              <Table
                columns={healthColumns}
                data={healthRecords}
                rowKey="id"
                emptyText="暂无健康记录"
              />
            </div>
          )}

          {activeTab === 'followup' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">随访记录</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    共 {followupRecords.length} 条记录
                  </p>
                </div>
                <Button onClick={openFollowupModal}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  新增随访
                </Button>
              </div>

              {followupRecords.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <p>暂无随访记录</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {followupRecords.map((record) => (
                    <div
                      key={record.id}
                      className="border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {formatDate(record.visitDate)}
                            </p>
                            {record.plan && (
                              <p className="text-xs text-gray-500">
                                关联计划: {formatDate(record.plan.planDate)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        {record.chiefComplaint && (
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">主诉</p>
                            <p className="text-gray-700">{record.chiefComplaint}</p>
                          </div>
                        )}
                        {record.examination && (
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">检查</p>
                            <p className="text-gray-700">{record.examination}</p>
                          </div>
                        )}
                        {record.diagnosis && (
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">诊断</p>
                            <p className="text-gray-700">{record.diagnosis}</p>
                          </div>
                        )}
                        {record.treatment && (
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">治疗</p>
                            <p className="text-gray-700">{record.treatment}</p>
                          </div>
                        )}
                        {record.medication && (
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">用药</p>
                            <p className="text-gray-700">{record.medication}</p>
                          </div>
                        )}
                        {record.advice && (
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">建议</p>
                            <p className="text-gray-700">{record.advice}</p>
                          </div>
                        )}
                        {record.nextVisitDate && (
                          <div className="sm:col-span-2">
                            <p className="text-xs text-gray-500 mb-0.5">下次复诊日期</p>
                            <p className="text-gray-700 font-medium">
                              {formatDate(record.nextVisitDate)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'plans' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">随访计划</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    共 {followupPlans.length} 条计划
                  </p>
                </div>
                <Button onClick={openPlanModal}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  新增计划
                </Button>
              </div>
              <Table
                columns={planColumns}
                data={followupPlans}
                rowKey="id"
                emptyText="暂无随访计划"
              />
            </div>
          )}
        </div>
      </Card>

      <Modal
        isOpen={healthModalOpen}
        onClose={() => !healthSubmitting && setHealthModalOpen(false)}
        title="新增健康记录"
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setHealthModalOpen(false)}
              disabled={healthSubmitting}
            >
              取消
            </Button>
            <Button onClick={handleHealthSubmit} isLoading={healthSubmitting}>
              保存
            </Button>
          </>
        }
      >
        {healthErrors.submit && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {healthErrors.submit}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DatePicker
            label="记录日期"
            value={healthForm.recordDate}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setHealthForm({ ...healthForm, recordDate: e.target.value })}
            error={healthErrors.recordDate}
          />
          <div />
          <Input
            label="收缩压 (mmHg)"
            type="number"
            value={healthForm.systolic ?? ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setHealthForm({
                ...healthForm,
                systolic: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="如 120"
          />
          <Input
            label="舒张压 (mmHg)"
            type="number"
            value={healthForm.diastolic ?? ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setHealthForm({
                ...healthForm,
                diastolic: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="如 80"
          />
          <Input
            label="心率 (次/分)"
            type="number"
            value={healthForm.heartRate ?? ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setHealthForm({
                ...healthForm,
                heartRate: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="如 75"
          />
          <Input
            label="空腹血糖 (mmol/L)"
            type="number"
            step="0.1"
            value={healthForm.fastingGlucose ?? ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setHealthForm({
                ...healthForm,
                fastingGlucose: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="如 5.6"
          />
          <Input
            label="餐后血糖 (mmol/L)"
            type="number"
            step="0.1"
            value={healthForm.postprandialGlucose ?? ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setHealthForm({
                ...healthForm,
                postprandialGlucose: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="如 7.8"
          />
          <Input
            label="总胆固醇 (mmol/L)"
            type="number"
            step="0.1"
            value={healthForm.cholesterol ?? ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setHealthForm({
                ...healthForm,
                cholesterol: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="如 4.5"
          />
          <Input
            label="甘油三酯 (mmol/L)"
            type="number"
            step="0.1"
            value={healthForm.triglycerides ?? ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setHealthForm({
                ...healthForm,
                triglycerides: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="如 1.7"
          />
          <Input
            label="体重 (kg)"
            type="number"
            step="0.1"
            value={healthForm.weight ?? ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setHealthForm({
                ...healthForm,
                weight: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="如 65.5"
          />
          <div className="sm:col-span-2">
            <Input
              label="备注"
              value={healthForm.note || ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setHealthForm({ ...healthForm, note: e.target.value })}
              placeholder="选填"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={followupModalOpen}
        onClose={() => !followupSubmitting && setFollowupModalOpen(false)}
        title="新增随访记录"
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setFollowupModalOpen(false)}
              disabled={followupSubmitting}
            >
              取消
            </Button>
            <Button onClick={handleFollowupSubmit} isLoading={followupSubmitting}>
              保存
            </Button>
          </>
        }
      >
        {followupErrors.submit && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {followupErrors.submit}
          </div>
        )}
        <div className="grid grid-cols-1 gap-4">
          <DatePicker
            label="随访日期"
            value={followupForm.visitDate}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setFollowupForm({ ...followupForm, visitDate: e.target.value })}
            error={followupErrors.visitDate}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">主诉</label>
            <textarea
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border bg-white text-gray-900 placeholder-gray-400 py-2.5 px-3.5 min-h-[80px]"
              placeholder="患者主诉症状"
              value={followupForm.chiefComplaint}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setFollowupForm({ ...followupForm, chiefComplaint: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">检查</label>
            <textarea
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border bg-white text-gray-900 placeholder-gray-400 py-2.5 px-3.5 min-h-[80px]"
              placeholder="检查结果"
              value={followupForm.examination}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setFollowupForm({ ...followupForm, examination: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">诊断</label>
            <textarea
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border bg-white text-gray-900 placeholder-gray-400 py-2.5 px-3.5 min-h-[80px]"
              placeholder="诊断结论"
              value={followupForm.diagnosis}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setFollowupForm({ ...followupForm, diagnosis: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">治疗方案</label>
            <textarea
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border bg-white text-gray-900 placeholder-gray-400 py-2.5 px-3.5 min-h-[80px]"
              placeholder="治疗方案详情"
              value={followupForm.treatment}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setFollowupForm({ ...followupForm, treatment: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">用药</label>
            <textarea
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border bg-white text-gray-900 placeholder-gray-400 py-2.5 px-3.5 min-h-[80px]"
              placeholder="用药详情"
              value={followupForm.medication}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setFollowupForm({ ...followupForm, medication: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">建议</label>
            <textarea
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border bg-white text-gray-900 placeholder-gray-400 py-2.5 px-3.5 min-h-[80px]"
              placeholder="医嘱建议"
              value={followupForm.advice}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setFollowupForm({ ...followupForm, advice: e.target.value })
              }
            />
          </div>
          <DatePicker
            label="下次复诊日期"
            value={followupForm.nextVisitDate}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setFollowupForm({ ...followupForm, nextVisitDate: e.target.value })
            }
          />
        </div>
      </Modal>

      <Modal
        isOpen={planModalOpen}
        onClose={() => !planSubmitting && setPlanModalOpen(false)}
        title="新增随访计划"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setPlanModalOpen(false)}
              disabled={planSubmitting}
            >
              取消
            </Button>
            <Button onClick={handlePlanSubmit} isLoading={planSubmitting}>
              保存
            </Button>
          </>
        }
      >
        {planErrors.submit && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {planErrors.submit}
          </div>
        )}
        <div className="grid grid-cols-1 gap-4">
          <DatePicker
            label="计划日期"
            value={planForm.planDate}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPlanForm({ ...planForm, planDate: e.target.value })}
            error={planErrors.planDate}
          />
          <Select
            label="随访频率"
            options={frequencyOptions}
            value={planForm.frequency || ''}
            onChange={(value: any) =>
              setPlanForm({
                ...planForm,
                frequency: (value as FollowupFrequency) || undefined,
              })
            }
            placeholder="请选择频率"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">备注</label>
            <textarea
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border bg-white text-gray-900 placeholder-gray-400 py-2.5 px-3.5 min-h-[80px]"
              placeholder="计划备注信息"
              value={planForm.notes}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setPlanForm({ ...planForm, notes: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function PatientDetailPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <PatientDetailContent />
      </MainLayout>
    </ProtectedRoute>
  );
}
