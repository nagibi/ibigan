import api from '@/lib/axios';

export interface DashboardTenantRow {
  id: string;
  name: string;
  initials: string;
  status: 'active' | 'inactive' | 'trial';
  plan: string;
  users: number;
  tenant_users: number;
}

export interface DashboardDateRange {
  date_from: string;
  date_to: string;
}

export interface DashboardPeriod {
  from: string;
  to: string;
}

export interface DashboardStats {
  period?: DashboardPeriod;
  tenants: {
    total: number;
    active: number;
    trial: number;
    inactive: number;
    new_this_month: number;
    by_plan: { plan: string; count: number }[];
    by_status?: { status: string; count: number }[];
    rows: DashboardTenantRow[];
  };
  users: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    new_this_month: number;
    growth: { month: string; total: number; approved: number; pending: number }[];
  };
  user_approvals: { pending: number };
  campaigns: {
    total: number;
    new_this_month: number;
    monthly: { month: string; sent: number; delivered: number; failed: number }[];
  };
  webhooks: {
    total: number;
    active: number;
    inactive: number;
    deliveries: { event: string; success: number; failed: number; pending: number }[];
    timeline: { hour: string; fired: number; failed: number }[];
    recent_deliveries: { event: string; status: 'success' | 'fail'; created_at: string }[];
  };
  message_templates: {
    total: number;
    by_channel: { channel: string; count: number }[];
    items: { name: string; channel: string; usage: number }[];
  };
  invites: {
    total: number;
    accepted: number;
    pending: number;
    expired: number;
  };
  docs: {
    total: number;
    new_this_month: number;
    by_tenant: { tenant: string; count: number }[];
  };
  reports: {
    total: number;
    running: number;
    done: number;
    failed: number;
  };
  report_templates: { name: string; status: string; executions: number }[];
  menus: { total: number; active: number; customized: number };
  notification_preferences: {
    email_pct: number;
    whatsapp_pct: number;
    push_pct: number;
    inapp_pct: number;
    sms_pct: number;
  };
  user_preferences: {
    total: number;
    notifications_enabled: number;
    notifications_disabled: number;
    email_pct: number;
    whatsapp_pct: number;
  };
  central_users: { id: number; name: string; email: string; logins: number }[];
  recent_activity: { id: number; description: string; entity: string; created_at: string }[];
}

export const dashboardService = {
  stats: (params?: DashboardDateRange) =>
    api.get<{ status: number; result: DashboardStats }>('/v1/dashboard/stats', { params }),
};
