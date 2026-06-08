export type UserRole = 'DOCTOR' | 'ADMIN';

export interface User {
  id: number;
  username: string;
  realName: string;
  title?: string | null;
  phone?: string | null;
  email?: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type Gender = '男' | '女';

export type BloodType = 'A' | 'B' | 'AB' | 'O';

export interface DiseaseType {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  normalRange?: Record<string, { min: number; max: number }> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: number;
  realName: string;
}

export interface DiseaseTypeSimple {
  id: number;
  name: string;
  code: string;
}

export interface Patient {
  id: number;
  name: string;
  gender: Gender;
  birthDate: string;
  idCard: string;
  phone: string;
  address?: string | null;
  bloodType?: BloodType | null;
  height?: number | null;
  weight?: number | null;
  allergies?: string | null;
  medicalHistory?: string | null;
  doctorId: number;
  diseaseTypeId: number;
  createdAt: string;
  updatedAt: string;
  doctor?: Doctor;
  diseaseType?: DiseaseTypeSimple;
}

export type FollowupPlanStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export type FollowupFrequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY';

export interface PatientSimple {
  id: number;
  name: string;
  phone?: string;
}

export interface FollowupPlan {
  id: number;
  patientId: number;
  doctorId: number;
  planDate: string;
  status: FollowupPlanStatus;
  frequency?: FollowupFrequency | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: PatientSimple;
}

export interface HealthRecord {
  id: number;
  patientId: number;
  recordDate: string;
  systolic?: number | null;
  diastolic?: number | null;
  heartRate?: number | null;
  fastingGlucose?: number | null;
  postprandialGlucose?: number | null;
  cholesterol?: number | null;
  triglycerides?: number | null;
  weight?: number | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: { id: number; name: string };
  alerts?: Alert[];
}

export interface FollowupPlanSimple {
  id: number;
  planDate: string;
}

export interface FollowupRecord {
  id: number;
  patientId: number;
  doctorId: number;
  planId?: number | null;
  visitDate: string;
  chiefComplaint?: string | null;
  examination?: string | null;
  diagnosis?: string | null;
  treatment?: string | null;
  medication?: string | null;
  advice?: string | null;
  nextVisitDate?: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: PatientSimple;
  plan?: FollowupPlanSimple;
}

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AlertType = 'HEALTH_ABNORMAL' | 'FOLLOWUP_DUE' | string;

export interface HealthRecordSimple {
  id: number;
  recordDate: string;
}

export interface Alert {
  id: number;
  patientId: number;
  recordId?: number | null;
  alertType: AlertType;
  severity: AlertSeverity;
  message: string;
  indicator?: string | null;
  value?: number | null;
  isRead: boolean;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
  patient?: PatientSimple;
  healthRecord?: HealthRecordSimple;
}

export interface DashboardStats {
  totalPatients: number;
  todayFollowups: number;
  unresolvedAlerts: number;
  pendingPlans: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string | Record<string, string[]>;
}

export interface PatientCreateInput {
  name: string;
  gender: Gender;
  birthDate: string;
  idCard: string;
  phone: string;
  address?: string;
  bloodType?: BloodType;
  height?: number;
  weight?: number;
  allergies?: string;
  medicalHistory?: string;
  diseaseTypeId: number;
}

export interface PatientUpdateInput extends Partial<PatientCreateInput> {
  id: number;
}

export interface PatientQueryParams {
  name?: string;
  diseaseTypeId?: number;
  lastFollowupFrom?: string;
  lastFollowupTo?: string;
}

export interface HealthRecordCreateInput {
  patientId: number;
  recordDate: string;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  fastingGlucose?: number;
  postprandialGlucose?: number;
  cholesterol?: number;
  triglycerides?: number;
  weight?: number;
  note?: string;
}

export interface HealthRecordQueryParams {
  patientId?: number;
  startDate?: string;
  endDate?: string;
}

export interface FollowupPlanCreateInput {
  patientId: number;
  planDate: string;
  status?: FollowupPlanStatus;
  frequency?: FollowupFrequency;
  notes?: string;
}

export interface FollowupPlanQueryParams {
  patientId?: number;
  startDate?: string;
  endDate?: string;
  status?: FollowupPlanStatus;
}

export interface FollowupRecordCreateInput {
  patientId: number;
  planId?: number;
  visitDate: string;
  chiefComplaint?: string;
  examination?: string;
  diagnosis?: string;
  treatment?: string;
  medication?: string;
  advice?: string;
  nextVisitDate?: string;
}

export interface FollowupRecordQueryParams {
  patientId?: number;
  startDate?: string;
  endDate?: string;
}

export interface AlertQueryParams {
  resolved?: boolean;
  patientId?: number;
}

export interface AlertBatchUpdateInput {
  ids: number[];
  isRead?: boolean;
  resolved?: boolean;
}

export interface AbnormalityResult {
  key: string;
  name: string;
  value?: number | null;
  isAbnormal: boolean;
  severity?: AlertSeverity;
  message?: string;
}
