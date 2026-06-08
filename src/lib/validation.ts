import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(6, '密码至少6位'),
});

export const patientSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  gender: z.enum(['男', '女']),
  birthDate: z.string().min(1, '出生日期不能为空'),
  idCard: z.string().regex(/^\d{17}[\dXx]$/, '身份证号格式不正确'),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
  address: z.string().optional(),
  bloodType: z.enum(['A', 'B', 'AB', 'O']).optional(),
  height: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
  diseaseTypeId: z.number().int().positive(),
});

export const healthRecordSchema = z.object({
  patientId: z.number().int().positive(),
  recordDate: z.string().min(1, '记录日期不能为空'),
  systolic: z.number().min(1).max(300).optional(),
  diastolic: z.number().min(1).max(200).optional(),
  heartRate: z.number().int().min(1).max(300).optional(),
  fastingGlucose: z.number().min(0.1).max(50).optional(),
  postprandialGlucose: z.number().min(0.1).max(60).optional(),
  cholesterol: z.number().min(0.1).max(30).optional(),
  triglycerides: z.number().min(0.1).max(30).optional(),
  weight: z.number().min(0.1).max(800).optional(),
  note: z.string().optional(),
});

export const followupPlanSchema = z.object({
  patientId: z.number().int().positive(),
  planDate: z.string().min(1, '计划日期不能为空'),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY']).optional(),
  notes: z.string().optional(),
});

export const followupRecordSchema = z.object({
  patientId: z.number().int().positive(),
  planId: z.number().int().positive().optional(),
  visitDate: z.string().min(1, '就诊日期不能为空'),
  chiefComplaint: z.string().optional(),
  examination: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  medication: z.string().optional(),
  advice: z.string().optional(),
  nextVisitDate: z.string().optional(),
});

export const alertSchema = z.object({
  patientId: z.number().int().positive(),
  recordId: z.number().int().positive().optional(),
  alertType: z.string().min(1),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  message: z.string().min(1),
  indicator: z.string().optional(),
  value: z.number().optional(),
});

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };

export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    const errors: Record<string, string[]> = {};
    result.error.issues.forEach((issue) => {
      const key = issue.path.join('.') || 'root';
      if (!errors[key]) {
        errors[key] = [];
      }
      errors[key].push(issue.message);
    });
    return { success: false, errors };
  }
}
