const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

export function resolveApiUrl(value: string) {
  if (/^https?:\/\//.test(value)) return value;
  const apiOrigin = new URL(apiBaseUrl).origin;
  return new URL(value, apiOrigin).toString();
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as {
      message?: string;
      code?: string;
    } | null;
    throw new ApiError(error?.message ?? 'تعذر تنفيذ الطلب', response.status, error?.code);
  }
  return response.status === 204 ? (undefined as T) : (response.json() as Promise<T>);
}

function queryString(values: Record<string, string | number | boolean | undefined>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  const value = params.toString();
  return value ? `?${value}` : '';
}

export async function getHealth(): Promise<{ status: string; database: string }> {
  try {
    return await request<{ status: string; database: string }>('/health');
  } catch {
    throw new Error('تعذر الاتصال بالخادم');
  }
}

export type Owner = { id: string; username: string; mustChangePassword: boolean };

export function getCurrentOwner() {
  return request<{ owner: Owner }>('/auth/me');
}

export function login(username: string, password: string) {
  return request<{ owner: Owner }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function logout() {
  return request<void>('/auth/logout', { method: 'POST' });
}

export function changePassword(currentPassword: string, newPassword: string) {
  return request<void>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export type Pagination = { page: number; limit: number; totalItems: number; totalPages: number };
export type MemberListItem = {
  id: string;
  name: string;
  phone: string;
  photoUrl: string | null;
  isArchived: boolean;
  subscriptionState: 'NONE' | 'SCHEDULED' | 'ACTIVE' | 'EXPIRED';
  subscriptionPlanName: string | null;
  subscriptionEndDate: string | null;
  outstandingBalanceMinor: number;
};
export type MemberDetail = {
  id: string;
  name: string;
  phone: string;
  gender: 'MALE' | 'FEMALE';
  dateOfBirth: string;
  photoUrl: string | null;
  heightCm: number | null;
  weightKg: number | null;
  joinDate: string;
  isArchived: boolean;
  archivedAt: string | null;
  currentSubscription: { planNameSnapshot: string; endDate: string; state: string } | null;
  nextSubscription: { planNameSnapshot: string; startDate: string; endDate: string } | null;
  outstandingBalanceMinor: number;
  createdAt: string;
  updatedAt: string;
};
export type MemberInput = {
  name: string;
  phone: string;
  gender: 'MALE' | 'FEMALE';
  dateOfBirth: string;
  heightCm: number | null;
  weightKg: number | null;
  joinDate: string;
};
export type MemberFilters = {
  search?: string;
  archived?: boolean;
  subscriptionState?: string;
  hasDebt?: boolean;
  page?: number;
  limit?: number;
};

export function getMembers(filters: MemberFilters) {
  return request<{ items: MemberListItem[]; pagination: Pagination }>(
    `/members${queryString(filters)}`,
  );
}
export function getMember(memberId: string) {
  return request<MemberDetail>(`/members/${memberId}`);
}
export function createMember(input: MemberInput) {
  return request<MemberDetail>('/members', { method: 'POST', body: JSON.stringify(input) });
}
export function updateMember(memberId: string, input: MemberInput) {
  return request<MemberDetail>(`/members/${memberId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
export function archiveMember(memberId: string) {
  return request<MemberDetail>(`/members/${memberId}/archive`, { method: 'POST' });
}
export function restoreMember(memberId: string) {
  return request<MemberDetail>(`/members/${memberId}/restore`, { method: 'POST' });
}

export async function uploadMemberPhoto(memberId: string, file: Blob) {
  const body = new FormData();
  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  body.append('file', file, `member-photo.${extension}`);
  const response = await fetch(`${apiBaseUrl}/members/${memberId}/photo`, {
    method: 'POST',
    credentials: 'include',
    body,
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as {
      message?: string;
      code?: string;
    } | null;
    throw new ApiError(error?.message ?? 'تعذر رفع صورة العضو', response.status, error?.code);
  }
  return response.json() as Promise<{ photoUrl: string }>;
}

export type PlanPrice = { durationMonths: 1 | 3 | 6 | 12; priceMinor: number };
export type Plan = {
  id: string;
  name: string;
  isEnabled: boolean;
  prices: PlanPrice[];
  createdAt: string;
  updatedAt: string;
};
export type PlanInput = { name: string; prices: PlanPrice[] };

export function getPlans(filters: { enabled?: boolean; page?: number; limit?: number }) {
  return request<{ items: Plan[]; pagination: Pagination }>(`/plans${queryString(filters)}`);
}
export function createPlan(input: PlanInput) {
  return request<Plan>('/plans', { method: 'POST', body: JSON.stringify(input) });
}
export function updatePlan(planId: string, input: PlanInput) {
  return request<Plan>(`/plans/${planId}`, { method: 'PATCH', body: JSON.stringify(input) });
}
export function enablePlan(planId: string) {
  return request<Plan>(`/plans/${planId}/enable`, { method: 'POST' });
}
export function disablePlan(planId: string) {
  return request<Plan>(`/plans/${planId}/disable`, { method: 'POST' });
}

export type Subscription = {
  id: string;
  memberId: string;
  planId: string;
  planNameSnapshot: string;
  durationMonths: 1 | 3 | 6 | 12;
  listedPriceMinor: number;
  agreedPriceMinor: number;
  startDate: string;
  endDate: string;
  state: 'SCHEDULED' | 'ACTIVE' | 'EXPIRED' | 'VOIDED';
  voidedAt: string | null;
  voidReason: string | null;
  createdAt: string;
  updatedAt: string;
};
export type InitialPaymentInput = { amountMinor: number; paymentDate: string };
export type SubscriptionInput = {
  planId: string;
  durationMonths: 1 | 3 | 6 | 12;
  startDate?: string;
  agreedPriceMinor: number;
  initialPayment?: InitialPaymentInput;
};
export function getSubscriptions(memberId: string) {
  return request<{ items: Subscription[]; pagination: Pagination }>(
    `/members/${memberId}/subscriptions?limit=100`,
  );
}
export function createSubscription(memberId: string, input: SubscriptionInput) {
  return request<{
    subscription: Subscription;
    initialPayment: Payment | null;
    outstandingBalanceMinor: number;
  }>(`/members/${memberId}/subscriptions`, { method: 'POST', body: JSON.stringify(input) });
}
export function renewSubscription(memberId: string, input: Omit<SubscriptionInput, 'startDate'>) {
  return request<{
    subscription: Subscription;
    initialPayment: Payment | null;
    outstandingBalanceMinor: number;
  }>(`/members/${memberId}/subscriptions/renew`, { method: 'POST', body: JSON.stringify(input) });
}
export function voidSubscription(subscriptionId: string, reason: string) {
  return request<Subscription>(`/subscriptions/${subscriptionId}/void`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export type Payment = {
  id: string;
  memberId: string;
  amountMinor: number;
  paymentDate: string;
  paymentMethod: 'CASH';
  receiptNumber: string;
  balanceAfterPaymentMinor: number;
  status: 'VALID' | 'VOIDED';
  voidedAt: string | null;
  voidReason: string | null;
  createdAt: string;
};
export function getPayments(memberId: string) {
  return request<{ items: Payment[]; pagination: Pagination }>(
    `/members/${memberId}/payments?limit=100`,
  );
}
export function createPayment(
  memberId: string,
  input: { amountMinor: number; paymentDate: string },
) {
  return request<Payment>(`/members/${memberId}/payments`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
export function voidPayment(paymentId: string, reason: string) {
  return request<Payment>(`/payments/${paymentId}/void`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export type DashboardSummary = {
  activeMembers: number;
  expiredMemberships: number;
  expiringWithin7Days: number;
  newMembersThisMonth: number;
  revenueTodayMinor: number;
  revenueThisMonthMinor: number;
  totalOutstandingDebtMinor: number;
};
export type DashboardDebtor = {
  memberId: string;
  name: string;
  phone: string;
  isArchived: boolean;
  outstandingBalanceMinor: number;
};
export type DashboardExpiring = {
  memberId: string;
  memberName: string;
  phone: string;
  subscriptionId: string;
  planName: string;
  endDate: string;
  daysRemaining: number;
};
export function getDashboardSummary() {
  return request<DashboardSummary>('/dashboard/summary');
}
export function getDashboardDebtors(limit = 6) {
  return request<{ items: DashboardDebtor[]; pagination: Pagination }>(
    `/dashboard/debtors${queryString({ page: 1, limit, sort: 'balance_desc' })}`,
  );
}
export function getDashboardExpiring(limit = 6) {
  return request<{ items: DashboardExpiring[]; pagination: Pagination }>(
    `/dashboard/expiring${queryString({ page: 1, limit })}`,
  );
}
