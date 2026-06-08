import { prisma } from './prisma';

export interface NormalRange {
  min: number;
  max: number;
}

export const BLOOD_PRESSURE_RANGES = {
  systolic: { min: 90, max: 140 },
  diastolic: { min: 60, max: 90 },
};

export const GLUCOSE_RANGES = {
  fastingGlucose: { min: 3.9, max: 6.1 },
  postprandialGlucose: { min: 0, max: 7.8 },
};

export const HEART_RATE_RANGE: NormalRange = { min: 60, max: 100 };

export const CHOLESTEROL_RANGE: NormalRange = { min: 2.8, max: 5.2 };

export const TRIGLYCERIDES_RANGE: NormalRange = { min: 0.45, max: 1.7 };

export function checkAbnormal(
  value: number | undefined | null,
  range: NormalRange,
  indicator: string
): { isAbnormal: boolean; severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; message?: string } {
  if (value === undefined || value === null) {
    return { isAbnormal: false };
  }

  const rangeSize = range.max - range.min;
  const deviation = value > range.max
    ? (value - range.max) / rangeSize
    : value < range.min
    ? (range.min - value) / rangeSize
    : 0;

  if (deviation === 0) {
    return { isAbnormal: false };
  }

  let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  const direction = value > range.max ? '偏高' : '偏低';

  if (deviation < 0.1) {
    severity = 'LOW';
  } else if (deviation < 0.3) {
    severity = 'MEDIUM';
  } else if (deviation < 0.5) {
    severity = 'HIGH';
  } else {
    severity = 'CRITICAL';
  }

  return {
    isAbnormal: true,
    severity,
    message: `${indicator}${direction}：${value}（正常范围：${range.min}-${range.max}）`,
  };
}

export function checkAllIndicators(record: {
  systolic?: number | null;
  diastolic?: number | null;
  heartRate?: number | null;
  fastingGlucose?: number | null;
  postprandialGlucose?: number | null;
  cholesterol?: number | null;
  triglycerides?: number | null;
}) {
  const indicators = [
    { name: '收缩压', value: record.systolic, range: BLOOD_PRESSURE_RANGES.systolic, key: 'systolic' },
    { name: '舒张压', value: record.diastolic, range: BLOOD_PRESSURE_RANGES.diastolic, key: 'diastolic' },
    { name: '心率', value: record.heartRate, range: HEART_RATE_RANGE, key: 'heartRate' },
    { name: '空腹血糖', value: record.fastingGlucose, range: GLUCOSE_RANGES.fastingGlucose, key: 'fastingGlucose' },
    { name: '餐后血糖', value: record.postprandialGlucose, range: GLUCOSE_RANGES.postprandialGlucose, key: 'postprandialGlucose' },
    { name: '总胆固醇', value: record.cholesterol, range: CHOLESTEROL_RANGE, key: 'cholesterol' },
    { name: '甘油三酯', value: record.triglycerides, range: TRIGLYCERIDES_RANGE, key: 'triglycerides' },
  ];

  const abnormalities = indicators
    .map((i) => ({
      key: i.key,
      name: i.name,
      value: i.value,
      ...checkAbnormal(i.value, i.range, i.name),
    }))
    .filter((r) => r.isAbnormal);

  return abnormalities;
}

export async function createAlertsForHealthRecord(
  recordId: number,
  patientId: number,
  record: {
    systolic?: number | null;
    diastolic?: number | null;
    heartRate?: number | null;
    fastingGlucose?: number | null;
    postprandialGlucose?: number | null;
    cholesterol?: number | null;
    triglycerides?: number | null;
  }
) {
  const abnormalities = checkAllIndicators(record);

  for (const ab of abnormalities) {
    await prisma.alert.create({
      data: {
        patientId,
        recordId,
        alertType: 'HEALTH_ABNORMAL',
        severity: ab.severity!,
        message: ab.message!,
        indicator: ab.key,
        value: ab.value,
      },
    });
  }

  return abnormalities;
}

export function getSeverityOrder(severity: string): number {
  const order: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };
  return order[severity] ?? 99;
}
