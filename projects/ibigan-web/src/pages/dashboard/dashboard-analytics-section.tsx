import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { DashboardStats } from '@/services/dashboard.service';

const COLORS = {
  blue: '#378ADD',
  green: '#1D9E75',
  amber: '#EF9F27',
  red: '#E24B4A',
  gray: '#888780',
  purple: '#534AB7',
};

const PIE_PALETTE = [COLORS.blue, COLORS.green, COLORS.amber, COLORS.purple, COLORS.red, COLORS.gray];

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-popover border-border rounded-md border px-2.5 py-2 text-xs shadow-md">
      {label && <p className="text-muted-foreground mb-1 font-medium">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-medium">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function ChartBox({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0 w-full max-w-full overflow-hidden', className)}>
      {children}
    </div>
  );
}

const CHART_MARGIN = { top: 4, right: 4, left: -8, bottom: 0 };
const LEGEND_STYLE = { fontSize: 10, width: '100%', left: 0 };

function AnalyticsCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('min-w-0 max-w-full overflow-hidden', className)}>
      <CardHeader className="min-h-0 shrink-0 flex-col items-start gap-1 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <h3 className="min-w-0 text-sm font-semibold">{title}</h3>
        {subtitle ? (
          <span className="text-muted-foreground max-w-full truncate text-[10px] sm:max-w-[55%] sm:text-right sm:text-[11px]">
            {subtitle}
          </span>
        ) : null}
      </CardHeader>
      <CardContent className="grow-0 max-w-full p-0 px-3 py-3 sm:px-5 sm:py-4">{children}</CardContent>
    </Card>
  );
}

function pieData(items: { name: string; value: number }[]) {
  return items.filter((d) => d.value > 0);
}

export function DashboardAnalyticsSection({
  stats,
  centralUsers,
}: {
  stats: DashboardStats;
  centralUsers: DashboardStats['central_users'];
}) {
  const { t } = useTranslation();
  const userGrowth = stats.users.growth;

  const userApproval = useMemo(
    () =>
      pieData([
        { name: t('dashboard.status.approved'), value: stats.users.approved },
        { name: t('dashboard.status.pending'), value: stats.users.pending },
        { name: t('dashboard.status.rejected'), value: stats.users.rejected },
      ]),
    [stats.users.approved, stats.users.pending, stats.users.rejected, t],
  );

  const tenantPlan = useMemo(
    () => pieData(stats.tenants.by_plan.map((p) => ({ name: p.plan, value: p.count }))),
    [stats.tenants.by_plan],
  );

  const tenantStatus = useMemo(
    () =>
      pieData(
        (stats.tenants.by_status ?? []).map((s) => ({
          name:
            s.status === 'active'
              ? t('dashboard.status.active')
              : s.status === 'trial'
                ? t('dashboard.status.trial')
                : t('dashboard.status.inactive'),
          value: s.count,
        })),
      ),
    [stats.tenants.by_status, t],
  );

  const docsPie = useMemo(
    () => pieData(stats.docs.by_tenant.map((d) => ({ name: d.tenant, value: d.count }))),
    [stats.docs.by_tenant],
  );

  const invitesPie = useMemo(
    () =>
      pieData([
        { name: t('dashboard.status.accepted'), value: stats.invites.accepted },
        { name: t('dashboard.status.pending'), value: stats.invites.pending },
        { name: t('dashboard.status.expired'), value: stats.invites.expired },
      ]),
    [stats.invites.accepted, stats.invites.expired, stats.invites.pending, t],
  );

  const reportsPie = useMemo(
    () =>
      pieData([
        { name: t('dashboard.status.concluido'), value: stats.reports.done },
        { name: t('dashboard.status.rodando'), value: stats.reports.running },
        { name: t('dashboard.status.falhou'), value: stats.reports.failed },
      ]),
    [stats.reports.done, stats.reports.failed, stats.reports.running, t],
  );

  const notifRadar = useMemo(
    () => [
      { subject: t('dashboard.channel.email'), value: stats.notification_preferences.email_pct },
      { subject: t('dashboard.channel.whatsapp'), value: stats.notification_preferences.whatsapp_pct },
      { subject: t('dashboard.channel.push'), value: stats.notification_preferences.push_pct },
      { subject: t('dashboard.channel.inapp'), value: stats.notification_preferences.inapp_pct },
      { subject: t('dashboard.channel.sms'), value: stats.notification_preferences.sms_pct },
    ],
    [stats.notification_preferences, t],
  );

  const centralPie = useMemo(
    () =>
      pieData(
        centralUsers.map((u) => ({ name: u.name.split(' ')[0] ?? u.name, value: Math.max(1, u.logins) })),
      ),
    [centralUsers],
  );

  const noData = useMemo(() => [{ name: t('dashboard.chart.no_data'), value: 1 }], [t]);
  const defaultPlan = useMemo(() => [{ name: t('dashboard.chart.default_plan'), value: 1 }], [t]);
  const activeOnly = useMemo(() => [{ name: t('dashboard.status.active'), value: 1 }], [t]);
  const noDocs = useMemo(() => [{ name: t('dashboard.chart.no_docs'), value: 1 }], [t]);
  const noInvites = useMemo(() => [{ name: t('dashboard.chart.no_invites'), value: 1 }], [t]);

  const chartHeight = 'h-[200px] sm:h-[220px]';

  return (
    <section className="min-w-0 max-w-full space-y-3">
      <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-widest">
        {t('dashboard.analytics.section')}
      </p>

      <div className="grid min-w-0 max-w-full grid-cols-1 gap-4 lg:grid-cols-2">
        <AnalyticsCard title={t('dashboard.analytics.users_growth.title')} subtitle={t('dashboard.analytics.users_growth.subtitle')}>
          <ChartBox className={chartHeight}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowth} margin={CHART_MARGIN}>
                <defs>
                  <linearGradient id="dashTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={32} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={LEGEND_STYLE} />
                <Area type="monotone" dataKey="total" name={t('dashboard.chart.total_users')} stroke={COLORS.blue} fill="url(#dashTotal)" strokeWidth={2} />
                <Area type="monotone" dataKey="approved" name={t('dashboard.chart.approved')} stroke={COLORS.green} fill="none" strokeWidth={2} strokeDasharray="4 3" />
                <Area type="monotone" dataKey="pending" name={t('dashboard.chart.pending_plural')} stroke={COLORS.amber} fill="none" strokeWidth={2} strokeDasharray="2 3" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartBox>
        </AnalyticsCard>

        <AnalyticsCard title={t('dashboard.analytics.user_approval.title')} subtitle={t('dashboard.analytics.user_approval.subtitle')}>
          <ChartBox className={chartHeight}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userApproval.length ? userApproval : noData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius="48%"
                  outerRadius="72%"
                  paddingAngle={3}
                >
                  {(userApproval.length ? userApproval : noData).map((_, i) => (
                    <Cell key={i} fill={[COLORS.blue, COLORS.amber, COLORS.red][i % 3]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={LEGEND_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>
        </AnalyticsCard>

        <AnalyticsCard title={t('dashboard.analytics.tenants_plan.title')} subtitle={t('dashboard.analytics.tenants_plan.subtitle')}>
          <ChartBox className={chartHeight}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={tenantPlan.length ? tenantPlan : defaultPlan} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="72%" paddingAngle={3}>
                  {(tenantPlan.length ? tenantPlan : defaultPlan).map((_, i) => (
                    <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={LEGEND_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>
        </AnalyticsCard>

        <AnalyticsCard title={t('dashboard.analytics.tenants_status.title')} subtitle={t('dashboard.analytics.tenants_status.subtitle')}>
          <ChartBox className={chartHeight}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={tenantStatus.length ? tenantStatus : activeOnly} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="42%" outerRadius="72%" paddingAngle={3}>
                  {(tenantStatus.length ? tenantStatus : activeOnly).map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.name === t('dashboard.status.active')
                          ? COLORS.green
                          : entry.name === t('dashboard.status.trial')
                            ? COLORS.amber
                            : COLORS.gray
                      }
                    />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={LEGEND_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>
        </AnalyticsCard>

        <AnalyticsCard title={t('dashboard.analytics.campaigns.title')} subtitle={t('dashboard.analytics.campaigns.subtitle')}>
          <ChartBox className={chartHeight}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.campaigns.monthly} barGap={2} margin={CHART_MARGIN}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={32} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={LEGEND_STYLE} />
                <Bar dataKey="sent" name={t('dashboard.chart.sent')} fill={COLORS.blue} radius={[3, 3, 0, 0]} />
                <Bar dataKey="delivered" name={t('dashboard.chart.delivered')} fill={COLORS.green} radius={[3, 3, 0, 0]} />
                <Bar dataKey="failed" name={t('dashboard.chart.failed')} fill={COLORS.red} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </AnalyticsCard>

        <AnalyticsCard title={t('dashboard.analytics.webhooks_status.title')} subtitle={t('dashboard.analytics.webhooks_status.subtitle')}>
          <ChartBox className={chartHeight}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.webhooks.deliveries} layout="vertical" margin={CHART_MARGIN}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="event" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} width={72} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={LEGEND_STYLE} />
                <Bar dataKey="success" name={t('dashboard.status.success')} fill={COLORS.green} stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="failed" name={t('dashboard.status.failed')} fill={COLORS.red} stackId="a" />
                <Bar dataKey="pending" name={t('dashboard.status.pending')} fill={COLORS.amber} stackId="a" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </AnalyticsCard>

        <AnalyticsCard title={t('dashboard.analytics.docs.title')} subtitle={t('dashboard.analytics.docs.subtitle')}>
          <ChartBox className={chartHeight}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={docsPie.length ? docsPie : noDocs} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="72%" paddingAngle={2}>
                  {(docsPie.length ? docsPie : noDocs).map((_, i) => (
                    <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ ...LEGEND_STYLE, fontSize: 9 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>
        </AnalyticsCard>

        <AnalyticsCard title={t('dashboard.analytics.invites.title')} subtitle={t('dashboard.analytics.invites.subtitle')}>
          <ChartBox className={chartHeight}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={invitesPie.length ? invitesPie : noInvites} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="48%" outerRadius="72%" paddingAngle={3}>
                  {(invitesPie.length ? invitesPie : noInvites).map((_, i) => (
                    <Cell key={i} fill={[COLORS.green, COLORS.amber, COLORS.gray][i % 3]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={LEGEND_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>
        </AnalyticsCard>

        <AnalyticsCard title={t('dashboard.analytics.reports.title')} subtitle={t('dashboard.analytics.reports.subtitle')}>
          <ChartBox className={chartHeight}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={reportsPie.length ? reportsPie : noData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="72%" paddingAngle={3}>
                  {(reportsPie.length ? reportsPie : noData).map((_, i) => (
                    <Cell key={i} fill={[COLORS.green, COLORS.amber, COLORS.red][i % 3]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={LEGEND_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>
        </AnalyticsCard>

        <AnalyticsCard title={t('dashboard.analytics.notifications.title')} subtitle={t('dashboard.analytics.notifications.subtitle')}>
          <ChartBox className={chartHeight}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={notifRadar}>
                <PolarGrid stroke="rgba(128,128,128,0.2)" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                <Radar name={t('dashboard.chart.enabled_pct')} dataKey="value" stroke={COLORS.blue} fill={COLORS.blue} fillOpacity={0.12} strokeWidth={2} />
                <Tooltip content={<ChartTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartBox>
        </AnalyticsCard>

        {centralUsers.length > 0 ? (
          <AnalyticsCard title={t('dashboard.analytics.central_users.title')} subtitle={t('dashboard.analytics.central_users.subtitle')}>
            <ChartBox className={chartHeight}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={centralPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="72%" paddingAngle={3}>
                    {centralPie.map((_, i) => (
                      <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={LEGEND_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </ChartBox>
          </AnalyticsCard>
        ) : null}

        <AnalyticsCard title={t('dashboard.analytics.webhooks_timeline.title')} subtitle={t('dashboard.analytics.webhooks_timeline.subtitle')}>
          <ChartBox className={chartHeight}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.webhooks.timeline} margin={CHART_MARGIN}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={32} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={LEGEND_STYLE} />
                <Line type="monotone" dataKey="fired" name={t('dashboard.chart.fired')} stroke={COLORS.blue} strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="failed" name={t('dashboard.chart.failed')} stroke={COLORS.red} strokeWidth={2} dot={{ r: 2 }} strokeDasharray="4 3" />
              </LineChart>
            </ResponsiveContainer>
          </ChartBox>
        </AnalyticsCard>
      </div>
    </section>
  );
}
