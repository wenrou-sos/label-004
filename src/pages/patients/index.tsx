import { useState, useEffect, useMemo, type ChangeEvent } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/Layout/MainLayout';
import Card from '@/components/UI/Card';
import Button from '@/components/UI/Button';
import Input from '@/components/UI/Input';
import Select, { type SelectOption } from '@/components/UI/Select';
import Modal from '@/components/UI/Modal';
import DatePicker from '@/components/UI/DatePicker';
import Loading from '@/components/UI/Loading';
import Table, { type TableColumn } from '@/components/UI/Table';
import ProtectedRoute from '@/components/Layout/ProtectedRoute';
import {
  getPatients,
  createPatient,
  updatePatient,
  deletePatient,
  getDiseaseTypes,
  getFollowupRecords,
} from '@/lib/api';
import {
  formatDate,
  formatDateTime,
  calculateAge,
  formatPhone,
  cn,
} from '@/lib/utils';
import type {
  Patient,
  DiseaseType,
  PatientCreateInput,
  Gender,
  BloodType,
  FollowupRecord,
} from '@/types';

type SortOption = 'name_asc' | 'name_desc' | 'age_asc' | 'age_desc' | 'createdAt_desc';

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

const sortOptions: SelectOption[] = [
  { value: 'name_asc', label: '姓名升序' },
  { value: 'name_desc', label: '姓名降序' },
  { value: 'age_asc', label: '年龄升序' },
  { value: 'age_desc', label: '年龄降序' },
  { value: 'createdAt_desc', label: '最新创建' },
];

const emptyForm: PatientCreateInput = {
  name: '',
  gender: '男',
  birthDate: '',
  idCard: '',
  phone: '',
  address: '',
  bloodType: undefined,
  height: undefined,
  weight: undefined,
  allergies: '',
  medicalHistory: '',
  diseaseTypeId: 0,
};

function PatientsContent() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [diseaseTypes, setDiseaseTypes] = useState<DiseaseType[]>([]);
  const [followupRecords, setFollowupRecords] = useState<FollowupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchName, setSearchName] = useState('');
  const [filterDiseaseTypeId, setFilterDiseaseTypeId] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('createdAt_desc');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState<PatientCreateInput>({ ...emptyForm });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [fetchedPatients, fetchedDiseaseTypes, fetchedRecords] = await Promise.all([
          getPatients(),
          getDiseaseTypes(),
          getFollowupRecords(),
        ]);
        setPatients(fetchedPatients);
        setDiseaseTypes(fetchedDiseaseTypes);
        setFollowupRecords(fetchedRecords);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const diseaseTypeOptions: SelectOption[] = useMemo(
    () => diseaseTypes.map((dt) => ({ value: dt.id, label: dt.name })),
    [diseaseTypes]
  );

  const getLastFollowupTime = (patientId: number): string => {
    const records = followupRecords.filter((r) => r.patientId === patientId);
    if (records.length === 0) return '-';
    const latest = records.reduce((a, b) =>
      new Date(a.visitDate) > new Date(b.visitDate) ? a : b
    );
    return formatDateTime(latest.visitDate);
  };

  const filteredPatients = useMemo(() => {
    let result = [...patients];

    if (searchName.trim()) {
      const keyword = searchName.trim().toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(keyword));
    }

    if (filterDiseaseTypeId) {
      const id = Number(filterDiseaseTypeId);
      result = result.filter((p) => p.diseaseTypeId === id);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name, 'zh-CN');
        case 'name_desc':
          return b.name.localeCompare(a.name, 'zh-CN');
        case 'age_asc':
          return calculateAge(a.birthDate) - calculateAge(b.birthDate);
        case 'age_desc':
          return calculateAge(b.birthDate) - calculateAge(a.birthDate);
        case 'createdAt_desc':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [patients, searchName, filterDiseaseTypeId, sortBy, followupRecords]);

  const openCreateModal = () => {
    setEditingPatient(null);
    setFormData({ ...emptyForm });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
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
    setFormErrors({});
    setModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = '请输入姓名';
    if (!formData.gender) errors.gender = '请选择性别';
    if (!formData.birthDate) errors.birthDate = '请选择出生日期';
    if (!formData.idCard.trim()) errors.idCard = '请输入身份证号';
    else if (!/^\d{17}[\dXx]$/.test(formData.idCard.trim()))
      errors.idCard = '身份证号格式不正确';
    if (!formData.phone.trim()) errors.phone = '请输入手机号';
    else if (!/^1[3-9]\d{9}$/.test(formData.phone.trim()))
      errors.phone = '手机号格式不正确';
    if (!formData.diseaseTypeId || formData.diseaseTypeId === 0)
      errors.diseaseTypeId = '请选择疾病类型';
    if (formData.height !== undefined && (formData.height < 50 || formData.height > 250))
      errors.height = '身高应在50-250cm之间';
    if (formData.weight !== undefined && (formData.weight < 10 || formData.weight > 300))
      errors.weight = '体重应在10-300kg之间';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload: PatientCreateInput = {
        ...formData,
        address: formData.address || undefined,
        bloodType: formData.bloodType || undefined,
        height: formData.height || undefined,
        weight: formData.weight || undefined,
        allergies: formData.allergies || undefined,
        medicalHistory: formData.medicalHistory || undefined,
      };

      if (editingPatient) {
        const updated = await updatePatient(editingPatient.id, payload);
        setPatients((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p))
        );
      } else {
        const created = await createPatient(payload);
        setPatients((prev) => [created, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      setFormErrors({
        submit: err instanceof Error ? err.message : '提交失败',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      await deletePatient(id);
      setPatients((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败');
    } finally {
      setDeleting(false);
    }
  };

  const columns: TableColumn<Patient>[] = [
    {
      key: 'name',
      title: '姓名',
      render: (patient) => (
        <Link
          href={`/patients/${patient.id}`}
          className="font-medium text-gray-900 hover:text-primary-600"
        >
          {patient.name}
        </Link>
      ),
    },
    {
      key: 'gender',
      title: '性别',
      dataIndex: 'gender',
    },
    {
      key: 'age',
      title: '年龄',
      render: (patient) => <span>{calculateAge(patient.birthDate)}岁</span>,
    },
    {
      key: 'diseaseType',
      title: '疾病类型',
      render: (patient) => (
        <span className="text-gray-700">
          {patient.diseaseType?.name || '-'}
        </span>
      ),
    },
    {
      key: 'phone',
      title: '联系电话',
      render: (patient) => <span>{formatPhone(patient.phone)}</span>,
    },
    {
      key: 'lastFollowup',
      title: '上次随访时间',
      render: (patient) => (
        <span className="text-gray-600">{getLastFollowupTime(patient.id)}</span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      align: 'right',
      width: 180,
      render: (patient) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/patients/${patient.id}`}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            查看
          </Link>
          <button
            onClick={() => openEditModal(patient)}
            className="text-gray-600 hover:text-gray-900 text-sm font-medium"
          >
            编辑
          </button>
          <button
            onClick={() => setDeleteConfirmId(patient.id)}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            删除
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loading size="xl" text="加载患者列表..." />
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
      <Card padding="md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <div className="w-full sm:w-64">
              <Input
                placeholder="搜索患者姓名..."
                value={searchName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchName(e.target.value)}
                leftIcon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                }
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                placeholder="全部疾病类型"
                options={diseaseTypeOptions}
                value={filterDiseaseTypeId}
                onChange={(value: any) => setFilterDiseaseTypeId(value)}
              />
            </div>
            <div className="w-full sm:w-40">
              <Select
                options={sortOptions}
                value={sortBy}
                onChange={(value: any) => setSortBy(value as SortOption)}
              />
            </div>
          </div>
          <Button onClick={openCreateModal}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新增患者
          </Button>
        </div>
      </Card>

      <Card padding="none">
        <Table
          columns={columns}
          data={filteredPatients}
          rowKey="id"
          emptyText="暂无患者数据"
          className="border-0 rounded-none"
        />
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => !submitting && setModalOpen(false)}
        title={editingPatient ? '编辑患者' : '新增患者'}
        size="lg"
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
              {editingPatient ? '保存修改' : '创建'}
            </Button>
          </>
        }
      >
        {formErrors.submit && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {formErrors.submit}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="姓名"
            name="name"
            value={formData.name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            placeholder="请输入患者姓名"
          />
          <Select
            label="性别"
            options={genderOptions}
            value={formData.gender}
            onChange={(value: any) => setFormData({ ...formData, gender: value as Gender })}
            error={formErrors.gender}
            placeholder="请选择性别"
          />
          <DatePicker
            label="出生日期"
            name="birthDate"
            value={formData.birthDate}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, birthDate: e.target.value })}
            error={formErrors.birthDate}
          />
          <Select
            label="疾病类型"
            options={diseaseTypeOptions}
            value={formData.diseaseTypeId || ''}
            onChange={(value: any) => setFormData({ ...formData, diseaseTypeId: Number(value) || 0 })}
            error={formErrors.diseaseTypeId}
            placeholder="请选择疾病类型"
          />
          <Input
            label="身份证号"
            name="idCard"
            value={formData.idCard}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, idCard: e.target.value })}
            error={formErrors.idCard}
            placeholder="请输入18位身份证号"
          />
          <Input
            label="手机号"
            name="phone"
            value={formData.phone}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
            error={formErrors.phone}
            placeholder="请输入11位手机号"
          />
          <div className="sm:col-span-2">
            <Input
              label="地址"
              name="address"
              value={formData.address || ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, address: e.target.value })}
              placeholder="请输入详细地址"
            />
          </div>
          <Select
            label="血型"
            options={bloodTypeOptions}
            value={formData.bloodType || ''}
            onChange={(value: any) =>
              setFormData({
                ...formData,
                bloodType: (value as BloodType) || undefined,
              })
            }
            placeholder="请选择血型"
          />
          <Input
            label="身高 (cm)"
            name="height"
            type="number"
            value={formData.height ?? ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setFormData({
                ...formData,
                height: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            error={formErrors.height}
            placeholder="请输入身高"
          />
          <Input
            label="体重 (kg)"
            name="weight"
            type="number"
            value={formData.weight ?? ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setFormData({
                ...formData,
                weight: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            error={formErrors.weight}
            placeholder="请输入体重"
          />
          <div />
          <div className="sm:col-span-2">
            <Input
              label="过敏史"
              name="allergies"
              value={formData.allergies || ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, allergies: e.target.value })}
              placeholder="如有过敏史请填写，无则留空"
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="既往病史"
              name="medicalHistory"
              value={formData.medicalHistory || ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, medicalHistory: e.target.value })
              }
              placeholder="如有既往病史请填写"
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
        <p className="text-gray-700">确定要删除该患者吗？此操作不可恢复。</p>
      </Modal>
    </div>
  );
}

export default function PatientsPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <PatientsContent />
      </MainLayout>
    </ProtectedRoute>
  );
}
