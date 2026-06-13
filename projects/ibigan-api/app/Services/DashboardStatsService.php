<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Campaign;
use App\Models\CampaignDelivery;
use App\Models\Central\CentralUser;
use App\Models\Doc;
use App\Models\Invite;
use App\Models\Menu;
use App\Models\MessageTemplate;
use App\Models\ReportExecution;
use App\Models\ReportTemplate;
use App\Models\Tenant;
use App\Models\User;
use App\Models\UserApproval;
use App\Models\UserNotificationPreference;
use App\Models\UserPreference;
use App\Models\Webhook;
use App\Models\WebhookDelivery;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\Models\Activity;

final class DashboardStatsService
{
    private Carbon $dateFrom;

    private Carbon $dateTo;

    /**
     * @return array<string, mixed>
     */
    public function forTenant(
        bool $includeCentralUsers = false,
        bool $includeAllTenants = false,
        ?Carbon $dateFrom = null,
        ?Carbon $dateTo = null,
    ): array {
        $this->dateFrom = ($dateFrom ?? now()->subMonths(5)->startOfMonth())->copy()->startOfDay();
        $this->dateTo = ($dateTo ?? now())->copy()->endOfDay();

        if ($this->dateFrom->gt($this->dateTo)) {
            [$this->dateFrom, $this->dateTo] = [$this->dateTo->copy()->startOfDay(), $this->dateFrom->copy()->endOfDay()];
        }

        $tenant = tenant();
        $tenantName = $tenant?->name ?? 'Tenant';
        $tenantCreatedAt = $tenant?->created_at;
        $tenantRows = $this->tenantsTable($includeAllTenants);

        $activeTenants = $includeAllTenants
            ? Tenant::query()->where('is_active', true)->count()
            : (($tenant?->is_active ?? true) ? 1 : 0);

        $inactiveTenants = $includeAllTenants
            ? Tenant::query()->where('is_active', false)->count()
            : (($tenant?->is_active ?? true) ? 0 : 1);

        return [
            'period' => [
                'from' => $this->dateFrom->toDateString(),
                'to' => $this->dateTo->toDateString(),
            ],
            'tenants' => [
                'total' => $includeAllTenants ? Tenant::query()->count() : 1,
                'active' => $activeTenants,
                'trial' => 0,
                'inactive' => $inactiveTenants,
                'new_this_month' => $includeAllTenants
                    ? Tenant::query()->whereBetween('created_at', [$this->dateFrom, $this->dateTo])->count()
                    : ($tenantCreatedAt?->between($this->dateFrom, $this->dateTo) ? 1 : 0),
                'by_plan' => $this->tenantsByPlan($includeAllTenants, $tenantRows),
                'by_status' => [
                    ['status' => 'active', 'count' => $activeTenants],
                    ['status' => 'trial', 'count' => 0],
                    ['status' => 'inactive', 'count' => $inactiveTenants],
                ],
                'rows' => $tenantRows,
            ],
            'users' => $this->userStats(),
            'user_approvals' => [
                'pending' => UserApproval::query()->where('status', 'pending')->count(),
            ],
            'campaigns' => $this->campaignStats(),
            'webhooks' => $this->webhookStats(),
            'message_templates' => $this->messageTemplateStats(),
            'invites' => $this->inviteStats(),
            'docs' => $this->docStats($tenantName, $tenantRows),
            'reports' => $this->reportStats(),
            'report_templates' => $this->reportTemplateItems(),
            'menus' => $this->menuStats(),
            'notification_preferences' => $this->notificationPreferenceStats(),
            'user_preferences' => $this->userPreferenceStats(),
            'central_users' => $includeCentralUsers ? $this->centralUserStats() : [],
            'recent_activity' => $this->recentActivity(),
        ];
    }

    /**
     * @return list<array{id: string, name: string, initials: string, status: string, plan: string, users: int, tenant_users: int}>
     */
    private function tenantsTable(bool $includeAllTenants): array
    {
        if (! $includeAllTenants) {
            $tenant = tenant();

            if ($tenant === null) {
                return [];
            }

            $users = User::query()->count();

            return [[
                'id' => (string) $tenant->id,
                'name' => (string) $tenant->name,
                'initials' => $this->initials((string) $tenant->name),
                'status' => $tenant->is_active ? 'active' : 'inactive',
                'plan' => 'Padrão',
                'users' => $users,
                'tenant_users' => $users,
            ]];
        }

        return Tenant::query()
            ->orderBy('name')
            ->limit(8)
            ->get()
            ->map(function (Tenant $tenant): array {
                $users = $tenant->run(fn (): int => User::query()->count());

                return [
                    'id' => (string) $tenant->id,
                    'name' => (string) $tenant->name,
                    'initials' => $this->initials((string) $tenant->name),
                    'status' => $tenant->is_active ? 'active' : 'inactive',
                    'plan' => 'Padrão',
                    'users' => $users,
                    'tenant_users' => $users,
                ];
            })
            ->all();
    }

    private function initials(string $name): string
    {
        $parts = preg_split('/\s+/', trim($name)) ?: [];
        $initials = '';

        foreach (array_slice($parts, 0, 2) as $part) {
            $initials .= mb_strtoupper(mb_substr($part, 0, 1));
        }

        return $initials !== '' ? $initials : 'TN';
    }

    /**
     * @param  list<array{id: string, name: string, initials: string, status: string, plan: string, users: int, tenant_users: int}>  $tenantRows
     * @return list<array{plan: string, count: int}>
     */
    private function tenantsByPlan(bool $includeAllTenants, array $tenantRows): array
    {
        if (! $includeAllTenants) {
            return [['plan' => 'Padrão', 'count' => 1]];
        }

        $counts = [];

        foreach ($tenantRows as $row) {
            $plan = $row['plan'];
            $counts[$plan] = ($counts[$plan] ?? 0) + 1;
        }

        return array_map(
            static fn (string $plan, int $count): array => ['plan' => $plan, 'count' => $count],
            array_keys($counts),
            array_values($counts),
        );
    }

    /**
     * @return list<Carbon>
     */
    private function monthsInRange(): array
    {
        $months = [];
        $cursor = $this->dateFrom->copy()->startOfMonth();
        $end = $this->dateTo->copy()->endOfMonth();

        while ($cursor->lte($end) && count($months) < 12) {
            $months[] = $cursor->copy();
            $cursor->addMonth();
        }

        return $months;
    }

    /**
     * @return array<string, mixed>
     */
    private function userStats(): array
    {
        return [
            'total' => User::query()->count(),
            'approved' => UserApproval::query()->where('status', 'approved')->count(),
            'pending' => UserApproval::query()->where('status', 'pending')->count(),
            'rejected' => UserApproval::query()->where('status', 'rejected')->count(),
            'new_this_month' => User::query()->whereBetween('created_at', [$this->dateFrom, $this->dateTo])->count(),
            'growth' => $this->monthlyUserGrowth(),
        ];
    }

    /**
     * @return list<array{month: string, total: int, approved: int, pending: int}>
     */
    private function monthlyUserGrowth(): array
    {
        $months = [];

        foreach ($this->monthsInRange() as $date) {
            $rangeEnd = $date->copy()->endOfMonth()->min($this->dateTo);

            $months[] = [
                'month' => $date->locale('pt_BR')->isoFormat('MMM'),
                'total' => User::query()->whereBetween('created_at', [$this->dateFrom, $rangeEnd])->count(),
                'approved' => UserApproval::query()
                    ->where('status', 'approved')
                    ->whereBetween('created_at', [$this->dateFrom, $rangeEnd])
                    ->count(),
                'pending' => UserApproval::query()
                    ->where('status', 'pending')
                    ->whereBetween('created_at', [$this->dateFrom, $rangeEnd])
                    ->count(),
            ];
        }

        return $months;
    }

    /**
     * @return array<string, mixed>
     */
    private function campaignStats(): array
    {
        return [
            'total' => Campaign::query()->count(),
            'new_this_month' => Campaign::query()->whereBetween('created_at', [$this->dateFrom, $this->dateTo])->count(),
            'monthly' => $this->monthlyCampaignDeliveries(),
        ];
    }

    /**
     * @return list<array{month: string, sent: int, delivered: int, failed: int}>
     */
    private function monthlyCampaignDeliveries(): array
    {
        $months = [];

        foreach ($this->monthsInRange() as $date) {
            $start = $date->copy()->startOfMonth()->max($this->dateFrom);
            $end = $date->copy()->endOfMonth()->min($this->dateTo);

            $base = CampaignDelivery::query()->whereBetween('created_at', [$start, $end]);

            $months[] = [
                'month' => $date->locale('pt_BR')->isoFormat('MMM'),
                'sent' => (clone $base)->whereIn('status', ['sent', 'delivered', 'opened', 'clicked', 'queued'])->count(),
                'delivered' => (clone $base)->whereIn('status', ['delivered', 'opened', 'clicked'])->count(),
                'failed' => (clone $base)->where('status', 'failed')->count(),
            ];
        }

        return $months;
    }

    /**
     * @return array<string, mixed>
     */
    private function webhookStats(): array
    {
        $deliveryQuery = WebhookDelivery::query()->whereBetween('created_at', [$this->dateFrom, $this->dateTo]);

        return [
            'total' => Webhook::query()->count(),
            'active' => Webhook::query()->where('is_active', true)->count(),
            'inactive' => Webhook::query()->where('is_active', false)->count(),
            'deliveries' => (clone $deliveryQuery)
                ->select('event')
                ->selectRaw("SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success")
                ->selectRaw("SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed")
                ->selectRaw("SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending")
                ->groupBy('event')
                ->orderByDesc('success')
                ->limit(8)
                ->get()
                ->map(fn ($row): array => [
                    'event' => (string) $row->event,
                    'success' => (int) $row->success,
                    'failed' => (int) $row->failed,
                    'pending' => (int) $row->pending,
                ])
                ->all(),
            'timeline' => $this->webhookTimeline(),
            'recent_deliveries' => WebhookDelivery::query()
                ->whereBetween('created_at', [$this->dateFrom, $this->dateTo])
                ->latest()
                ->limit(6)
                ->get()
                ->map(fn (WebhookDelivery $delivery): array => [
                    'event' => $delivery->event,
                    'status' => in_array($delivery->status, ['success', 'delivered'], true) ? 'success' : 'fail',
                    'created_at' => Carbon::parse($delivery->created_at)->locale('pt_BR')->diffForHumans(),
                ])
                ->all(),
        ];
    }

    /**
     * @return list<array{hour: string, fired: int, failed: int}>
     */
    private function webhookTimeline(): array
    {
        $timeline = [];
        $anchor = $this->dateTo->copy()->min(now())->startOfHour();
        $since = $anchor->copy()->subHours(11);

        if ($since->lt($this->dateFrom)) {
            $since = $this->dateFrom->copy()->startOfHour();
        }

        for ($i = 0; $i < 12; $i++) {
            $hourStart = $since->copy()->addHours($i);
            if ($hourStart->gt($this->dateTo)) {
                break;
            }

            $hourEnd = $hourStart->copy()->endOfHour()->min($this->dateTo);
            $base = WebhookDelivery::query()->whereBetween('created_at', [$hourStart, $hourEnd]);
            $label = $hourStart->isToday() && $hourStart->hour === now()->hour
                ? 'Agora'
                : $hourStart->format('H').'h';

            $timeline[] = [
                'hour' => $label,
                'fired' => (clone $base)->count(),
                'failed' => (clone $base)->where('status', 'failed')->count(),
            ];
        }

        return $timeline;
    }

    /**
     * @return array<string, mixed>
     */
    private function messageTemplateStats(): array
    {
        $byChannel = CampaignDelivery::query()
            ->whereBetween('created_at', [$this->dateFrom, $this->dateTo])
            ->select('channel')
            ->selectRaw('COUNT(*) as count')
            ->groupBy('channel')
            ->get()
            ->map(fn ($row): array => [
                'channel' => $row->channel instanceof \BackedEnum
                    ? $row->channel->value
                    : (string) ($row->channel ?? 'email'),
                'count' => (int) $row->count,
            ])
            ->all();

        if ($byChannel === []) {
            $total = MessageTemplate::query()->count();
            $byChannel = $total > 0 ? [['channel' => 'email', 'count' => $total]] : [];
        }

        return [
            'total' => MessageTemplate::query()->count(),
            'by_channel' => $byChannel,
            'items' => MessageTemplate::query()
                ->orderBy('name')
                ->limit(6)
                ->get()
                ->map(function (MessageTemplate $template): array {
                    $usage = Campaign::query()->where('template_id', $template->id)->count();
                    $campaign = Campaign::query()->where('template_id', $template->id)->first();
                    $channels = is_array($campaign?->channels) ? $campaign->channels : [];
                    $channel = is_string($channels[0] ?? null) ? $channels[0] : 'email';

                    return [
                        'name' => $template->name,
                        'channel' => $channel,
                        'usage' => $usage,
                    ];
                })
                ->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function inviteStats(): array
    {
        $base = Invite::query()->whereBetween('created_at', [$this->dateFrom, $this->dateTo]);

        return [
            'total' => (clone $base)->count(),
            'accepted' => (clone $base)->where('status', 'accepted')->count(),
            'pending' => Invite::query()->where('status', 'pending')->count(),
            'expired' => (clone $base)->where('status', 'expired')->count(),
        ];
    }

    /**
     * @param  list<array{id: string, name: string, initials: string, status: string, plan: string, users: int, tenant_users: int}>  $tenantRows
     * @return array<string, mixed>
     */
    private function docStats(string $tenantName, array $tenantRows): array
    {
        if ($tenantRows === []) {
            $total = Doc::query()->count();

            return [
                'total' => $total,
                'new_this_month' => Doc::query()->whereBetween('created_at', [$this->dateFrom, $this->dateTo])->count(),
                'by_tenant' => [['tenant' => $tenantName, 'count' => $total]],
            ];
        }

        $byTenant = array_map(function (array $row): array {
            if (tenancy()->initialized && tenant()?->id === $row['id']) {
                return ['tenant' => $row['name'], 'count' => Doc::query()->count()];
            }

            $tenant = Tenant::query()->find($row['id']);

            if ($tenant === null) {
                return ['tenant' => $row['name'], 'count' => 0];
            }

            $count = $tenant->run(fn (): int => Doc::query()->count());

            return ['tenant' => $row['name'], 'count' => $count];
        }, $tenantRows);

        return [
            'total' => array_sum(array_column($byTenant, 'count')),
            'new_this_month' => Doc::query()->whereBetween('created_at', [$this->dateFrom, $this->dateTo])->count(),
            'by_tenant' => $byTenant,
        ];
    }

    /**
     * @return list<array{name: string, status: string, executions: int}>
     */
    private function reportTemplateItems(): array
    {
        return ReportTemplate::query()
            ->withCount('executions')
            ->orderByDesc('executions_count')
            ->limit(6)
            ->get()
            ->map(function (ReportTemplate $template): array {
                $latestStatus = ReportExecution::query()
                    ->where('report_template_id', $template->id)
                    ->latest('executed_at')
                    ->value('status');

                $status = match ($latestStatus) {
                    'pending', 'queued', 'running' => 'rodando',
                    'failed' => 'falhou',
                    default => 'concluido',
                };

                return [
                    'name' => $template->name,
                    'status' => $status,
                    'executions' => (int) $template->executions_count,
                ];
            })
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function userPreferenceStats(): array
    {
        $notifEnabled = UserNotificationPreference::query()
            ->where('enabled', true)
            ->distinct('user_id')
            ->count('user_id');

        $notifDisabled = UserNotificationPreference::query()
            ->where('enabled', false)
            ->distinct('user_id')
            ->count('user_id');

        $prefs = $this->notificationPreferenceStats();

        return [
            'total' => UserPreference::query()->distinct('user_id')->count('user_id'),
            'notifications_enabled' => $notifEnabled,
            'notifications_disabled' => $notifDisabled,
            'email_pct' => $prefs['email_pct'],
            'whatsapp_pct' => $prefs['whatsapp_pct'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function reportStats(): array
    {
        $base = ReportExecution::query()->whereBetween('executed_at', [$this->dateFrom, $this->dateTo]);

        return [
            'total' => (clone $base)->count(),
            'running' => (clone $base)->whereIn('status', ['pending', 'queued', 'running'])->count(),
            'done' => (clone $base)->where('status', 'completed')->count(),
            'failed' => (clone $base)->where('status', 'failed')->count(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function menuStats(): array
    {
        $total = Menu::withTrashed()->count();

        return [
            'total' => $total,
            'active' => Menu::query()->where('is_active', true)->count(),
            'customized' => Menu::query()
                ->whereColumn('updated_at', '>', 'created_at')
                ->count(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function notificationPreferenceStats(): array
    {
        $userCount = max(1, User::query()->count());
        $channels = ['email', 'whatsapp', 'push', 'app', 'sms'];
        $stats = [];

        foreach ($channels as $channel) {
            $enabledUsers = UserNotificationPreference::query()
                ->where('channel', $channel)
                ->where('enabled', true)
                ->distinct('user_id')
                ->count('user_id');

            $stats[$channel.'_pct'] = (int) round(($enabledUsers / $userCount) * 100);
        }

        return [
            'email_pct' => $stats['email_pct'],
            'whatsapp_pct' => $stats['whatsapp_pct'],
            'push_pct' => $stats['push_pct'],
            'inapp_pct' => $stats['app_pct'],
            'sms_pct' => $stats['sms_pct'],
        ];
    }

    /**
     * @return list<array{id: int, name: string, email: string, logins: int}>
     */
    private function centralUserStats(): array
    {
        return CentralUser::query()
            ->where('is_super_admin', true)
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(function (CentralUser $user): array {
                $logins = DB::connection('central')
                    ->table('personal_access_tokens')
                    ->where('tokenable_type', CentralUser::class)
                    ->where('tokenable_id', $user->id)
                    ->count();

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'logins' => $logins,
                ];
            })
            ->all();
    }

    /**
     * @return list<array{id: int, description: string, entity: string, created_at: string}>
     */
    private function recentActivity(): array
    {
        return Activity::query()
            ->whereBetween('created_at', [$this->dateFrom, $this->dateTo])
            ->latest()
            ->limit(12)
            ->get()
            ->map(function (Activity $activity): array {
                $entity = class_basename((string) $activity->subject_type);

                return [
                    'id' => $activity->id,
                    'description' => (string) ($activity->description ?? 'Atividade registrada'),
                    'entity' => $entity !== '' ? $entity : 'System',
                    'created_at' => Carbon::parse($activity->created_at)->locale('pt_BR')->diffForHumans(),
                ];
            })
            ->all();
    }
}
