import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  User,
  Patient,
  PatientCreateInput,
  PatientQueryParams,
  DiseaseType,
  HealthRecord,
  HealthRecordCreateInput,
  HealthRecordQueryParams,
  FollowupPlan,
  FollowupPlanCreateInput,
  FollowupPlanQueryParams,
  FollowupRecord,
  FollowupRecordCreateInput,
  FollowupRecordQueryParams,
  Alert,
  AlertQueryParams,
  AlertBatchUpdateInput,
  DashboardStats,
} from '@/types';

const TOKEN_KEY = 'token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

async function fetchWithAuth<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, headers, ...rest } = options;

  const queryString = params
    ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : '';

  const token = getToken();

  const response = await fetch(`${url}${queryString}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    credentials: 'include',
  });

  const data = (await response.json()) as ApiResponse<T>;

  if (!response.ok) {
    if (response.status === 401) {
      removeToken();
    }
    const errorMessage =
      typeof data.error === 'string'
        ? data.error
        : Array.isArray(data.error)
        ? (data.error as any).join(', ')
        : '请求失败';
    throw new Error(errorMessage);
  }

  if (!data.success) {
    const errorMessage =
      typeof data.error === 'string'
        ? data.error
        : data.error && typeof data.error === 'object'
        ? Object.values(data.error as Record<string, string[]>).flat().join(', ')
        : '请求失败';
    throw new Error(errorMessage);
  }

  return data.data as T;
}

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const result = await fetchWithAuth<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  if (result.token) {
    setToken(result.token);
  }
  return result;
}

export async function logout(): Promise<{ message: string }> {
  const result = await fetchWithAuth<{ message: string }>('/api/auth/logout', {
    method: 'POST',
  });
  removeToken();
  return result;
}

export async function getMe(): Promise<User> {
  return fetchWithAuth<User>('/api/auth/me');
}

export async function getPatients(params?: PatientQueryParams): Promise<Patient[]> {
  return fetchWithAuth<Patient[]>('/api/patients', {
    method: 'GET',
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

export async function getPatient(id: number): Promise<Patient> {
  return fetchWithAuth<Patient>(`/api/patients/${id}`);
}

export async function createPatient(data: PatientCreateInput): Promise<Patient> {
  return fetchWithAuth<Patient>('/api/patients', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePatient(
  id: number,
  data: Partial<PatientCreateInput>
): Promise<Patient> {
  return fetchWithAuth<Patient>(`/api/patients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deletePatient(id: number): Promise<{ message: string }> {
  return fetchWithAuth<{ message: string }>(`/api/patients/${id}`, {
    method: 'DELETE',
  });
}

export async function getDiseaseTypes(): Promise<DiseaseType[]> {
  return fetchWithAuth<DiseaseType[]>('/api/disease-types');
}

export async function getHealthRecords(
  params?: HealthRecordQueryParams
): Promise<HealthRecord[]> {
  return fetchWithAuth<HealthRecord[]>('/api/health-records', {
    method: 'GET',
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

export async function getHealthRecord(id: number): Promise<HealthRecord> {
  return fetchWithAuth<HealthRecord>(`/api/health-records/${id}`);
}

export async function createHealthRecord(
  data: HealthRecordCreateInput
): Promise<HealthRecord & { abnormalities: any[] }> {
  return fetchWithAuth<HealthRecord & { abnormalities: any[] }>('/api/health-records', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getFollowupPlans(
  params?: FollowupPlanQueryParams
): Promise<FollowupPlan[]> {
  return fetchWithAuth<FollowupPlan[]>('/api/followup-plans', {
    method: 'GET',
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

export async function getFollowupPlan(id: number): Promise<FollowupPlan> {
  return fetchWithAuth<FollowupPlan>(`/api/followup-plans/${id}`);
}

export async function createFollowupPlan(
  data: FollowupPlanCreateInput
): Promise<FollowupPlan> {
  return fetchWithAuth<FollowupPlan>('/api/followup-plans', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateFollowupPlan(
  id: number,
  data: Partial<FollowupPlanCreateInput>
): Promise<FollowupPlan> {
  return fetchWithAuth<FollowupPlan>(`/api/followup-plans/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteFollowupPlan(id: number): Promise<{ message: string }> {
  return fetchWithAuth<{ message: string }>(`/api/followup-plans/${id}`, {
    method: 'DELETE',
  });
}

export async function getFollowupRecords(
  params?: FollowupRecordQueryParams
): Promise<FollowupRecord[]> {
  return fetchWithAuth<FollowupRecord[]>('/api/followup-records', {
    method: 'GET',
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

export async function getFollowupRecord(id: number): Promise<FollowupRecord> {
  return fetchWithAuth<FollowupRecord>(`/api/followup-records/${id}`);
}

export async function createFollowupRecord(
  data: FollowupRecordCreateInput
): Promise<FollowupRecord> {
  return fetchWithAuth<FollowupRecord>('/api/followup-records', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getAlerts(params?: AlertQueryParams): Promise<Alert[]> {
  return fetchWithAuth<Alert[]>('/api/alerts', {
    method: 'GET',
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

export async function getAlert(id: number): Promise<Alert> {
  return fetchWithAuth<Alert>(`/api/alerts/${id}`);
}

export async function markAlertRead(ids: number[]): Promise<{ message: string }> {
  return fetchWithAuth<{ message: string }>('/api/alerts', {
    method: 'PUT',
    body: JSON.stringify({ ids, isRead: true } as AlertBatchUpdateInput),
  });
}

export async function markAlertResolved(ids: number[]): Promise<{ message: string }> {
  return fetchWithAuth<{ message: string }>('/api/alerts', {
    method: 'PUT',
    body: JSON.stringify({ ids, resolved: true } as AlertBatchUpdateInput),
  });
}

export async function updateAlert(
  id: number,
  data: { isRead?: boolean; resolved?: boolean }
): Promise<Alert> {
  return fetchWithAuth<Alert>(`/api/alerts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteAlert(id: number): Promise<{ message: string }> {
  return fetchWithAuth<{ message: string }>(`/api/alerts/${id}`, {
    method: 'DELETE',
  });
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return fetchWithAuth<DashboardStats>('/api/dashboard/stats');
}

export const api = {
  getToken,
  setToken,
  removeToken,
  login,
  logout,
  getMe,
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
  getDiseaseTypes,
  getHealthRecords,
  getHealthRecord,
  createHealthRecord,
  getFollowupPlans,
  getFollowupPlan,
  createFollowupPlan,
  updateFollowupPlan,
  deleteFollowupPlan,
  getFollowupRecords,
  getFollowupRecord,
  createFollowupRecord,
  getAlerts,
  getAlert,
  markAlertRead,
  markAlertResolved,
  updateAlert,
  deleteAlert,
  getDashboardStats,
};
