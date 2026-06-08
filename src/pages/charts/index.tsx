import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { MainLayout } from '@/components/Layout/MainLayout';
import ProtectedRoute from '@/components/Layout/ProtectedRoute';
import { Card } from '@/components/UI/Card';
import { Select, type SelectOption } from '@/components/UI/Select';
import { Button } from '@/components/UI/Button';
import { DatePicker } from '@/components/UI/DatePicker';
import { Table, type TableColumn } from '@/components/UI/Table';
import { Loading } from '@/components/UI/Loading';
import Alert from '@/components/UI/Alert';
import { getPatients, getHealthRecords } from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import {
  BLOOD_PRESSURE_RANGES,
  GLUCOSE_RANGES,
  HEART_RATE_RANGE,
  CHOLESTEROL_RANGE,
  TRIGLYCERIDES_RANGE,
} from '@/lib/healthUtils';
import type { Patient, HealthRecord } from '@/types';

type IndicatorType =
  | 'bloodPressure'
  | 'fastingGlucose'
  | 'postprandialGlucose'
  | 'heartRate'
  | 'cholesterol'
  | 'triglycerides'
  | 'weight';

type TimeRangeType = '7d' | '30d' | '90d' | '180d' | 'custom';

interface ChartDataPoint {
  date: string;
  systolic?: number | null;
  diastolic?: number | null;
  fastingGlucose?: number | null;
  postprandialGlucose?: number | null;
  heartRate?: number | null;
  cholesterol?: number | null;
  triglycerides?: number | null;
  weight?: number | null;
}

const INDICATOR_OPTIONS: SelectOption[] = [
  { value: 'bloodPressure', label: '血压' },
  { value: 'fastingGlucose', label: '空腹血糖' },
  { value: 'postprandialGlucose', label: '餐后血糖' },
  { value: 'heartRate', label: '心率' },
  { value: 'cholesterol', label: '胆固醇' },
  { value: 'triglycerides', label: '甘油三酯' },
  { value: 'weight', label: '体重' },
];

const TIME_RANGE_OPTIONS: SelectOption[] = [
  { value: '7d', label: '最近7天' },
  { value: '30d', label: '最近30天' },
  { value: '90d', label: '最近90天' },
  { value: '180d', label: '最近180天' },
  { value: 'custom', label: '自定义' },
];

const LINE_COLORS: Record<string, string> = {
  systolic: '#ef4444',
  diastolic: '#f97316',
  fastingGlucose: '#3b82f6',
  postprandialGlucose: '#8b5cf6',
  heartRate: '#10b981',
  cholesterol: '#06b6d4',
  triglycerides: '#f59e0b',
  weight: '#ec4899',
};

const LINE_LABELS: Record<string, string> = {
  systolic: '收缩压',
  diastolic: '舒张压',
  fastingGlucose: '空腹血糖',
  postprandialGlucose: '餐后血糖',
  heartRate: '心率',
  cholesterol: '胆固醇',
  triglycerides: '甘油三酯',
  weight: '体重',
};

const WEIGHT_RANGE = { min: 0, max: 300 };

function getDateRange(range: TimeRangeType, customStart?: string, customEnd?: string): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();

  switch (range) {
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    case '90d':
      start.setDate(end.getDate() - 90);
      break;
    case '180d':
      start.setDate(end.getDate() - 180);
      break;
    case 'custom':
      return {
        startDate: customStart || formatDate(start),
        endDate: customEnd || formatDate(end),
      };
  }

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  };
}

function ChartsContent() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedIndicators, setSelectedIndicators] = useState<IndicatorType[]>(['bloodPressure']);
  const [timeRange, setTimeRange] = useState<TimeRangeType>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await getPatients();
        setPatients(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载患者列表失败');
      } finally {
        setLoadingPatients(false);
      }
    };
    fetchPatients();
  }, []);

  useEffect(() => {
    if (!selectedPatientId) {
      setRecords([]);
      return;
    }

    const { startDate, endDate } = getDateRange(timeRange, customStartDate, customEndDate);

    const fetchRecords = async () => {
      setLoadingRecords(true);
      setError(null);
      try {
        const data = await getHealthRecords({
          patientId: Number(selectedPatientId),
          startDate,
          endDate,
        });
        setRecords(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载健康记录失败');
      } finally {
        setLoadingRecords(false);
      }
    };

    fetchRecords();
  }, [selectedPatientId, timeRange, customStartDate, customEndDate]);

  const chartData = useMemo<ChartDataPoint[]>(() => {
    const sorted = [...records].sort(
      (a, b) => new Date(a.recordDate).getTime() - new Date(b.recordDate).getTime()
    );
    return sorted.map((record) => ({
      date: formatDate(record.recordDate),
      systolic: record.systolic,
      diastolic: record.diastolic,
      fastingGlucose: record.fastingGlucose,
      postprandialGlucose: record.postprandialGlucose,
      heartRate: record.heartRate,
      cholesterol: record.cholesterol,
      triglycerides: record.triglycerides,
      weight: record.weight,
    }));
  }, [records]);

  const activeLines = useMemo(() => {
    const lines: { key: string; label: string; color: string }[] = [];
    selectedIndicators.forEach((indicator) => {
      if (indicator === 'bloodPressure') {
        lines.push({ key: 'systolic', label: LINE_LABELS.systolic, color: LINE_COLORS.systolic });
        lines.push({ key: 'diastolic', label: LINE_LABELS.diastolic, color: LINE_COLORS.diastolic });
      } else {
        lines.push({ key: indicator, label: LINE_LABELS[indicator], color: LINE_COLORS[indicator] });
      }
    });
    return lines;
  }, [selectedIndicators]);

  const referenceLines = useMemo(() => {
    const lines: { y: number; key: string; label?: string; stroke: string; strokeDasharray?: string }[] = [];
    selectedIndicators.forEach((indicator) => {
      if (indicator === 'bloodPressure') {
        lines.push({ y: BLOOD_PRESSURE_RANGES.systolic.min, key: 'systolicMin', stroke: '#ef4444', strokeDasharray: '3 3' });
        lines.push({ y: BLOOD_PRESSURE_RANGES.systolic.max, key: 'systolicMax', stroke: '#ef4444', strokeDasharray: '3 3' });
        lines.push({ y: BLOOD_PRESSURE_RANGES.diastolic.min, key: 'diastolicMin', stroke: '#f97316', strokeDasharray: '3 3' });
        lines.push({ y: BLOOD_PRESSURE_RANGES.diastolic.max, key: 'diastolicMax', stroke: '#f97316', strokeDasharray: '3 3' });
      } else if (indicator === 'fastingGlucose') {
        lines.push({ y: GLUCOSE_RANGES.fastingGlucose.min, key: 'fastingGlucoseMin', stroke: '#3b82f6', strokeDasharray: '3 3' });
        lines.push({ y: GLUCOSE_RANGES.fastingGlucose.max, key: 'fastingGlucoseMax', stroke: '#3b82f6', strokeDasharray: '3 3' });
      } else if (indicator === 'postprandialGlucose') {
        lines.push({ y: GLUCOSE_RANGES.postprandialGlucose.max, key: 'postprandialGlucoseMax', stroke: '#8b5cf6', strokeDasharray: '3 3' });
      } else if (indicator === 'heartRate') {
        lines.push({ y: HEART_RATE_RANGE.min, key: 'heartRateMin', stroke: '#10b981', strokeDasharray: '3 3' });
        lines.push({ y: HEART_RATE_RANGE.max, key: 'heartRateMax', stroke: '#10b981', strokeDasharray: '3 3' });
      } else if (indicator === 'cholesterol') {
        lines.push({ y: CHOLESTEROL_RANGE.min, key: 'cholesterolMin', stroke: '#06b6d4', strokeDasharray: '3 3' });
        lines.push({ y: CHOLESTEROL_RANGE.max, key: 'cholesterolMax', stroke: '#06b6d4', strokeDasharray: '3 3' });
      } else if (indicator === 'triglycerides') {
        lines.push({ y: TRIGLYCERIDES_RANGE.min, key: 'triglyceridesMin', stroke: '#f59e0b', strokeDasharray: '3 3' });
        lines.push({ y: TRIGLYCERIDES_RANGE.max, key: 'triglyceridesMax', stroke: '#f59e0b', strokeDasharray: '3 3' });
      } else if (indicator === 'weight') {
        lines.push({ y: WEIGHT_RANGE.min, key: 'weightMin', stroke: '#ec4899', strokeDasharray: '3 3' });
        lines.push({ y: WEIGHT_RANGE.max, key: 'weightMax', stroke: '#ec4899', strokeDasharray: '3 3' });
      }
    });
    return lines;
  }, [selectedIndicators]);

  const patientOptions: SelectOption[] = patients.map((p) => ({
    value: String(p.id),
    label: `${p.name} (${p.phone})`,
  }));

  const handleIndicatorToggle = (indicator: IndicatorType) => {
    setSelectedIndicators((prev) => {
      if (prev.includes(indicator)) {
        const next = prev.filter((i) => i !== indicator);
        return next.length === 0 ? prev : next;
      }
      return [...prev, indicator];
    });
  };

  const handleSearch = () => {
    if (!selectedPatientId) return;
    const { startDate, endDate } = getDateRange(timeRange, customStartDate, customEndDate);
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
  };

  const tableColumns: TableColumn<HealthRecord>[] = [
    {
      key: 'recordDate',
      title: '记录日期',
      render: (record) => <span className="text-gray-900">{formatDate(record.recordDate)}</span>,
    },
    {
      key: 'systolic',
      title: '收缩压(mmHg)',
      render: (record) => <span className="text-gray-700">{record.systolic ?? '-'}</span>,
    },
    {
      key: 'diastolic',
      title: '舒张压(mmHg)',
      render: (record) => <span className="text-gray-700">{record.diastolic ?? '-'}</span>,
    },
    {
      key: 'fastingGlucose',
      title: '空腹血糖(mmol/L)',
      render: (record) => <span className="text-gray-700">{record.fastingGlucose ?? '-'}</span>,
    },
    {
      key: 'postprandialGlucose',
      title: '餐后血糖(mmol/L)',
      render: (record) => <span className="text-gray-700">{record.postprandialGlucose ?? '-'}</span>,
    },
    {
      key: 'heartRate',
      title: '心率(次/分)',
      render: (record) => <span className="text-gray-700">{record.heartRate ?? '-'}</span>,
    },
    {
      key: 'cholesterol',
      title: '胆固醇(mmol/L)',
      render: (record) => <span className="text-gray-700">{record.cholesterol ?? '-'}</span>,
    },
    {
      key: 'triglycerides',
      title: '甘油三酯(mmol/L)',
      render: (record) => <span className="text-gray-700">{record.triglycerides ?? '-'}</span>,
    },
    {
      key: 'weight',
      title: '体重(kg)',
      render: (record) => <span className="text-gray-700">{record.weight ?? '-'}</span>,
    },
  ];

  if (loadingPatients) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loading size="xl" text="加载中..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert type="error" message={error} closable onClose={() => setError(null)} />
      )}

      <Card title="筛选条件">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            label="选择患者"
            options={patientOptions}
            placeholder="请选择患者"
            value={selectedPatientId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedPatientId(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">指标类型</label>
            <div className="flex flex-wrap gap-2">
              {INDICATOR_OPTIONS.map((option) => {
                const isSelected = selectedIndicators.includes(option.value as IndicatorType);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleIndicatorToggle(option.value as IndicatorType)}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-lg border transition-colors font-medium',
                      isSelected
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Select
            label="时间范围"
            options={TIME_RANGE_OPTIONS}
            value={timeRange}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTimeRange(e.target.value as TimeRangeType)}
          />

          {timeRange === 'custom' && (
            <div className="grid grid-cols-2 gap-2">
              <DatePicker
                label="开始日期"
                value={customStartDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomStartDate(e.target.value)}
              />
              <DatePicker
                label="结束日期"
                value={customEndDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomEndDate(e.target.value)}
              />
            </div>
          )}
        </div>

        {timeRange === 'custom' && (
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSearch} disabled={!selectedPatientId}>
              查询
            </Button>
          </div>
        )}
      </Card>

      {!selectedPatientId ? (
        <Card>
          <div className="py-12 text-center">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <p className="text-gray-500">请先选择一个患者查看指标趋势图</p>
          </div>
        </Card>
      ) : loadingRecords ? (
        <Card>
          <div className="py-12 flex items-center justify-center">
            <Loading size="lg" text="加载数据中..." />
          </div>
        </Card>
      ) : chartData.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p className="text-gray-500">所选时间范围内暂无健康记录数据</p>
          </div>
        </Card>
      ) : (
        <>
          <Card title="指标趋势图" subtitle="虚线表示正常范围上下限">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickLine={{ stroke: '#d1d5db' }}
                    axisLine={{ stroke: '#d1d5db' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickLine={{ stroke: '#d1d5db' }}
                    axisLine={{ stroke: '#d1d5db' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend />
                  {referenceLines.map((line) => (
                    <ReferenceLine
                      key={line.key}
                      y={line.y}
                      stroke={line.stroke}
                      strokeDasharray={line.strokeDasharray}
                      strokeWidth={1}
                    />
                  ))}
                  {activeLines.map((line) => (
                    <Line
                      key={line.key}
                      type="monotone"
                      dataKey={line.key}
                      name={line.label}
                      stroke={line.color}
                      strokeWidth={2}
                      dot={{ r: 4, fill: line.color }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="原始数据" subtitle={`共 ${records.length} 条记录`} padding="none">
            <Table
              columns={tableColumns}
              data={records.sort(
                (a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime()
              )}
              rowKey="id"
              className="border-0 rounded-none"
            />
          </Card>
        </>
      )}
    </div>
  );
}

export default function ChartsPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <ChartsContent />
      </MainLayout>
    </ProtectedRoute>
  );
}
