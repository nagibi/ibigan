<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\CampaignStatus;
use App\Enums\DeliveryChannel;
use App\Enums\DeliveryStatus;
use App\Enums\InviteStatus;
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
use App\Support\SystemMessageTemplates;
use Carbon\Carbon;
use Database\Seeders\Concerns\SeedsPlatformTenantSuperAdmins;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoSeeder extends Seeder
{
    use SeedsPlatformTenantSuperAdmins;

    /** Tenant padrão ao listar organizações para os super-admins da plataforma. */
    private const PLATFORM_DEFAULT_TENANT_ID = 'techsolutions';

    /** @var list<array<string, mixed>> */
    private array $tenants = [
        [
            'id'                 => 'techsolutions',
            'slug'               => 'techsolutions',
            'name'               => 'Tech Solutions Ltda',
            'cnpj'               => '12345678000195',
            'timezone'           => 'America/Sao_Paulo',
            'locale'             => 'pt_BR',
            'is_active'          => true,
            'created_months_ago' => 8,
            'docs'               => 112,
        ],
        [
            'id'                 => 'medigroup',
            'slug'               => 'medigroup',
            'name'               => 'MediGroup Saúde S.A.',
            'cnpj'               => '98765432000111',
            'timezone'           => 'America/Sao_Paulo',
            'locale'             => 'pt_BR',
            'is_active'          => true,
            'created_months_ago' => 0,
            'docs'               => 87,
        ],
        [
            'id'                 => 'healthplus',
            'slug'               => 'healthplus',
            'name'               => 'HealthPlus Clínicas',
            'cnpj'               => '22334455000166',
            'timezone'           => 'America/Sao_Paulo',
            'locale'             => 'pt_BR',
            'is_active'          => true,
            'created_months_ago' => 0,
            'docs'               => 112,
        ],
        [
            'id'                 => 'eduplay',
            'slug'               => 'eduplay',
            'name'               => 'EduPlay Educação Digital',
            'cnpj'               => '11223344000155',
            'timezone'           => 'America/Recife',
            'locale'             => 'pt_BR',
            'is_active'          => true,
            'created_months_ago' => 5,
            'docs'               => 54,
        ],
        [
            'id'                 => 'financeplus',
            'slug'               => 'financeplus',
            'name'               => 'Finance Plus Consultoria',
            'cnpj'               => '55667788000122',
            'timezone'           => 'America/Sao_Paulo',
            'locale'             => 'pt_BR',
            'is_active'          => false,
            'created_months_ago' => 3,
            'docs'               => 61,
        ],
        [
            'id'                 => 'logismart',
            'slug'               => 'logismart',
            'name'               => 'LogiSmart Transportes',
            'cnpj'               => '33445566000177',
            'timezone'           => 'America/Manaus',
            'locale'             => 'pt_BR',
            'is_active'          => true,
            'created_months_ago' => 1,
            'docs'               => 27,
        ],
        [
            'id'                 => 'odontomax',
            'slug'               => 'odontomax',
            'name'               => 'OdontoMax Odontologia',
            'cnpj'               => '44556677000188',
            'timezone'           => 'America/Sao_Paulo',
            'locale'             => 'pt_BR',
            'is_active'          => true,
            'created_months_ago' => 2,
            'docs'               => 27,
        ],
    ];

    private array $users = [
        ['name' => 'Ana Paula Silva',      'email' => 'ana.paula@{tenant}.com',   'cpf' => '12345678901', 'role' => 'admin',    'gender' => 'female'],
        ['name' => 'Carlos Eduardo Lima',  'email' => 'carlos.lima@{tenant}.com', 'cpf' => '23456789012', 'role' => 'manager',  'gender' => 'male'],
        ['name' => 'Fernanda Costa',       'email' => 'fernanda@{tenant}.com',    'cpf' => '34567890123', 'role' => 'operator', 'gender' => 'female'],
        ['name' => 'Rafael Oliveira',      'email' => 'rafael@{tenant}.com',      'cpf' => '45678901234', 'role' => 'operator', 'gender' => 'male'],
        ['name' => 'Juliana Martins',      'email' => 'juliana@{tenant}.com',     'cpf' => '56789012345', 'role' => 'viewer',   'gender' => 'female'],
        ['name' => 'Bruno Souza',          'email' => 'bruno@{tenant}.com',       'cpf' => '67890123456', 'role' => 'viewer',   'gender' => 'male'],
        ['name' => 'Camila Ferreira',      'email' => 'camila@{tenant}.com',      'cpf' => '78901234567', 'role' => 'operator', 'gender' => 'female'],
        ['name' => 'Diego Almeida',        'email' => 'diego@{tenant}.com',       'cpf' => '89012345678', 'role' => 'viewer',   'gender' => 'male'],
        ['name' => 'Larissa Rodrigues',    'email' => 'larissa@{tenant}.com',     'cpf' => '90123456789', 'role' => 'manager',  'gender' => 'female'],
        ['name' => 'Thiago Nascimento',    'email' => 'thiago@{tenant}.com',      'cpf' => '01234567890', 'role' => 'operator', 'gender' => 'male'],
    ];

    private array $centralSuperAdmins = [
        ['name' => 'Nagibi Emanuel', 'email' => 'nagibi@gmail.com'],
        ['name' => 'Hemily Monteiro', 'email' => 'hemily.monteiro01@gmail.com'],
        ['name' => 'Jean Schletz',   'email' => 'jeanschletz@gmail.com'],
        ['name' => 'Breno Silva',    'email' => 'breno.silva@ibigan.com'],
        ['name' => 'Raphael Acunha da Silva', 'email' => 'raphaelacunhadasilva@gmail.com'],
        ['name' => 'Ibigan', 'email' => 'ibigan@gmail.com'],
    ];

    /** Volumes mensais de entregas (últimos 6 meses) por tenant. */
    private array $monthlyDeliveryVolumes = [14, 19, 24, 31, 36, 42];

    public function run(): void
    {
        $this->call(PlatformCatalogSeeder::class);
        $this->seedCentralSuperAdmins();

        foreach ($this->tenants as $tenantIndex => $tenantData) {
            $this->command->info("Criando tenant: {$tenantData['name']}");

            $tenant = Tenant::updateOrCreate(
                ['id' => $tenantData['id']],
                [
                    'slug'      => $tenantData['slug'],
                    'name'      => $tenantData['name'],
                    'cnpj'      => $tenantData['cnpj'],
                    'timezone'  => $tenantData['timezone'],
                    'locale'    => $tenantData['locale'],
                    'is_active' => $tenantData['is_active'] ?? true,
                ]
            );

            $monthsAgo = (int) ($tenantData['created_months_ago'] ?? 0);
            $tenant->created_at = now()->subMonths($monthsAgo)->subDays($tenantIndex * 3);
            $tenant->updated_at = now();
            $tenant->saveQuietly();

            $tenant->domains()->updateOrCreate(
                ['domain' => "{$tenant->slug}.localhost"],
            );

            $tenant->run(function () use ($tenantData, $tenantIndex): void {
                $this->call(RolePermissionSeeder::class);
                $this->call(MenuSeeder::class);

                $superAdmin = User::firstOrCreate(
                    ['email' => 'admin@'.$tenantData['id'].'.com'],
                    [
                        'name'           => 'Administrador',
                        'cpf'            => '39053344705',
                        'phone'          => '11999999999',
                        'birth_date'     => '1985-01-01',
                        'gender'         => 'prefer_not_to_say',
                        'password'       => Hash::make('A12345'),
                        'status'         => 'active',
                        'is_super_admin' => true,
                    ]
                );
                $superAdmin->syncRoles(['super-admin']);

                $platformAdmins = $this->seedPlatformTenantSuperAdmins(
                    $tenantData['id'],
                    self::PLATFORM_DEFAULT_TENANT_ID,
                );

                $tenantUsers = [$superAdmin, ...$platformAdmins];

                foreach ($this->users as $index => $userData) {
                    $email = str_replace('{tenant}', $tenantData['id'], $userData['email']);
                    $cpf = str_pad((string) (intval($userData['cpf']) + $index * 111 + $tenantIndex * 1000), 11, '0', STR_PAD_LEFT);

                    $user = User::firstOrCreate(
                        ['email' => $email],
                        [
                            'name'           => $userData['name'],
                            'cpf'            => $cpf,
                            'phone'          => '119'.rand(10000000, 99999999),
                            'birth_date'     => '199'.rand(0, 9).'-'.str_pad((string) rand(1, 12), 2, '0', STR_PAD_LEFT).'-'.str_pad((string) rand(1, 28), 2, '0', STR_PAD_LEFT),
                            'gender'         => $userData['gender'],
                            'password'       => Hash::make('A12345'),
                            'status'         => 'active',
                            'is_super_admin' => false,
                        ]
                    );
                    $user->syncRoles([$userData['role']]);
                    $tenantUsers[] = $user;
                }

                $this->backdateUserTimestamps($tenantUsers, $tenantIndex);
                $this->seedMessageTemplates();
                $this->seedWebhooks($tenantData['id']);
                $this->seedReportTemplates($superAdmin);
                $this->seedCampaigns($superAdmin, $tenantIndex);
                $this->seedCampaignDeliveries($superAdmin, $tenantUsers, $tenantIndex);
                $this->seedWebhookDeliveries();
                $this->seedUserApprovals($tenantUsers, $superAdmin);
                $this->seedInvites($superAdmin);
                $this->seedDocs((int) ($tenantData['docs'] ?? 20));
                $this->seedReportExecutions($superAdmin);
                $this->seedUserPreferences($tenantUsers);
                $this->seedNotificationPreferences($tenantUsers);
                $this->seedCustomizeMenus();
                $this->seedRecentActivity($superAdmin);
                $this->call(EquipamentoSeeder::class);

                $this->command->info("  ✓ Tenant {$tenantData['id']} populado com sucesso");
            });
        }

        $this->seedAcmePlatformAdminsIfPresent();
    }

    private function seedAcmePlatformAdminsIfPresent(): void
    {
        $acme = Tenant::query()->find('acme');

        if ($acme === null) {
            return;
        }

        $this->command->info('Vinculando super-admins da plataforma ao tenant Acme...');

        $acme->run(function () use ($acme): void {
            $this->call(RolePermissionSeeder::class);
            $this->seedPlatformTenantSuperAdmins($acme->id, self::PLATFORM_DEFAULT_TENANT_ID);
        });
    }

    private function seedCentralSuperAdmins(): void
    {
        foreach ($this->centralSuperAdmins as $admin) {
            DB::table('central_users')->updateOrInsert(
                ['email' => $admin['email']],
                [
                    'name'           => $admin['name'],
                    'password'       => Hash::make('A12345'),
                    'is_super_admin' => 1,
                    'is_active'      => 1,
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ]
            );
            $this->command->info("Super admin central criado: {$admin['email']}");
        }

        CentralUser::query()->each(function (CentralUser $user): void {
            $existing = DB::connection('central')
                ->table('personal_access_tokens')
                ->where('tokenable_type', CentralUser::class)
                ->where('tokenable_id', $user->id)
                ->count();

            if ($existing >= 3) {
                return;
            }

            for ($i = $existing; $i < 3 + ($user->id % 5); $i++) {
                DB::connection('central')->table('personal_access_tokens')->insert([
                    'tokenable_type' => CentralUser::class,
                    'tokenable_id'   => $user->id,
                    'name'           => 'demo-token-'.$i,
                    'token'          => hash('sha256', Str::uuid()->toString()),
                    'abilities'      => '["*"]',
                    'last_used_at'   => now()->subDays($i * 2),
                    'created_at'     => now()->subDays($i * 5),
                    'updated_at'     => now(),
                ]);
            }
        });
    }

    /** @param  list<User>  $users */
    private function backdateUserTimestamps(array $users, int $tenantIndex): void
    {
        foreach ($users as $index => $user) {
            if ($user->created_at->greaterThan(now()->subDays(14))) {
                $monthsAgo = ($index + $tenantIndex) % 6;
                $user->created_at = now()->subMonths($monthsAgo)->subDays($index * 4 + $tenantIndex);
                $user->saveQuietly();
            }
        }
    }

    private function seedMessageTemplates(): void
    {
        SystemMessageTemplates::seed();

        $templates = [
            [
                'name'       => 'Boas-vindas',
                'slug'       => 'boas-vindas',
                'subject'    => 'Bem-vindo(a) ao sistema!',
                'body'       => '<h1>Olá, {{name}}!</h1><p>Seja bem-vindo(a) ao nosso sistema.</p>',
                'merge_tags' => ['{{name}}'],
            ],
            [
                'name'       => 'Convite de usuário',
                'slug'       => 'convite-de-usuario',
                'subject'    => 'Você foi convidado(a)!',
                'body'       => '<p>{{inviter}} convidou você. <a href="{{link}}">Aceitar convite</a></p>',
                'merge_tags' => ['{{inviter}}', '{{link}}'],
            ],
            [
                'name'       => 'Redefinição de senha',
                'slug'       => 'redefinicao-de-senha',
                'subject'    => 'Redefinição de senha solicitada',
                'body'       => '<p>Olá, {{name}}! <a href="{{link}}">Redefinir senha</a></p>',
                'merge_tags' => ['{{name}}', '{{link}}'],
            ],
            [
                'name'       => 'Notificação de acesso',
                'slug'       => 'notificacao-de-acesso',
                'subject'    => 'Novo acesso detectado',
                'body'       => '<p>Olá, {{name}}! Acesso em {{date}} às {{time}}.</p>',
                'merge_tags' => ['{{name}}', '{{date}}', '{{time}}'],
            ],
            [
                'name'       => 'Alerta WhatsApp',
                'slug'       => 'alerta-whatsapp',
                'subject'    => 'Mensagem via WhatsApp',
                'body'       => '<p>Olá, {{name}}! Mensagem importante via WhatsApp.</p>',
                'merge_tags' => ['{{name}}'],
            ],
            [
                'name'       => 'Push de campanha',
                'slug'       => 'push-de-campanha',
                'subject'    => 'Nova campanha disponível',
                'body'       => '<p>{{name}}, confira a nova campanha {{campaign}}.</p>',
                'merge_tags' => ['{{name}}', '{{campaign}}'],
            ],
            [
                'name'       => 'Relatório semanal',
                'slug'       => 'relatorio-semanal',
                'subject'    => 'Seu relatório semanal está pronto',
                'body'       => '<p>Olá, {{name}}! Relatório de {{period}} disponível.</p>',
                'merge_tags' => ['{{name}}', '{{period}}'],
            ],
            [
                'name'       => 'Convite para colaboração',
                'slug'       => 'convite-para-colaboracao',
                'subject'    => 'Você foi convidado(a)!',
                'body'       => '<h2>Convite especial</h2><p>{{inviter}} convidou você.</p>',
                'merge_tags' => ['{{inviter}}', '{{link}}'],
            ],
        ];

        foreach ($templates as $template) {
            MessageTemplate::updateOrCreate(['slug' => $template['slug']], $template);
        }
    }

    private function seedWebhooks(string $tenantId): void
    {
        $webhooks = [
            [
                'description' => 'Notificação de novo usuário',
                'url'         => "https://hooks.example.com/{$tenantId}/new-user",
                'events'      => ['user.created', 'user.updated', 'user.approved'],
                'is_active'   => true,
                'secret'      => Str::random(32),
            ],
            [
                'description' => 'Alerta de campanha',
                'url'         => "https://hooks.example.com/{$tenantId}/campaign",
                'events'      => ['campaign.sent', 'campaign.completed'],
                'is_active'   => true,
                'secret'      => Str::random(32),
            ],
            [
                'description' => 'Eventos de tenant',
                'url'         => "https://hooks.example.com/{$tenantId}/tenant",
                'events'      => ['tenant.created', 'tenant.updated'],
                'is_active'   => true,
                'secret'      => Str::random(32),
            ],
            [
                'description' => 'Integração ERP',
                'url'         => "https://erp.example.com/webhook/{$tenantId}",
                'events'      => ['user.created'],
                'is_active'   => false,
                'secret'      => Str::random(32),
            ],
            [
                'description' => 'Slack notifications',
                'url'         => "https://hooks.slack.com/services/{$tenantId}",
                'events'      => ['report.completed', 'webhook.failed'],
                'is_active'   => true,
                'secret'      => Str::random(32),
            ],
            [
                'description' => 'Webhook legado (inativo)',
                'url'         => "https://legacy.example.com/{$tenantId}",
                'events'      => ['user.created'],
                'is_active'   => false,
                'secret'      => Str::random(32),
            ],
        ];

        foreach ($webhooks as $webhook) {
            Webhook::updateOrCreate(['url' => $webhook['url']], $webhook);
        }
    }

    private function seedReportTemplates(User $createdBy): void
    {
        app(\App\Services\PlatformCatalogService::class)->sync($createdBy->id, force: true);

        ReportTemplate::updateOrCreate(
            ['name' => 'Docs por categoria'],
            [
                'description' => 'Documentação ativa no tenant',
                'query' => 'SELECT title, is_active FROM docs WHERE (:active = \'all\' OR is_active = :active) ORDER BY created_at DESC LIMIT :limit',
                'parameters' => [
                    ['name' => 'active', 'type' => 'select', 'label' => 'Ativo', 'required' => true, 'options' => ['all', '1', '0']],
                    ['name' => 'limit', 'type' => 'number', 'label' => 'Limite', 'required' => true],
                ],
                'columns' => [
                    ['key' => 'title', 'label' => 'Título', 'format' => 'text'],
                    ['key' => 'is_active', 'label' => 'Ativo', 'format' => 'text'],
                ],
                'is_active' => true,
                'is_system' => false,
                'created_by' => $createdBy->id,
            ],
        );
    }

    private function seedCampaigns(User $createdBy, int $tenantIndex): void
    {
        $templates = MessageTemplate::query()->pluck('id', 'slug');

        $campaigns = [
            [
                'name'        => 'Campanha de Boas-vindas',
                'description' => 'Enviada automaticamente para novos usuários',
                'template_id' => $templates['boas-vindas'] ?? null,
                'channels'    => ['email'],
                'status'      => CampaignStatus::Sent,
                'type'        => 'automated',
                'created_by'  => $createdBy->id,
                'started_at'  => now()->subMonths(5)->startOfMonth()->addDays(2),
                'finished_at' => now()->subMonths(5)->startOfMonth()->addDays(5),
            ],
            [
                'name'        => 'Convite via WhatsApp',
                'description' => 'Convites enviados por WhatsApp',
                'template_id' => $templates['convite-de-usuario'] ?? null,
                'channels'    => ['whatsapp'],
                'status'      => CampaignStatus::Sent,
                'type'        => 'manual',
                'created_by'  => $createdBy->id,
                'started_at'  => now()->subMonths(3)->startOfMonth()->addDays(1),
                'finished_at' => now()->subMonths(3)->startOfMonth()->addDays(4),
            ],
            [
                'name'        => 'Push de engajamento',
                'description' => 'Notificações push para usuários ativos',
                'template_id' => $templates['push-de-campanha'] ?? null,
                'channels'    => ['push'],
                'status'      => CampaignStatus::Sent,
                'type'        => 'manual',
                'created_by'  => $createdBy->id,
                'started_at'  => now()->subMonths(1)->startOfMonth()->addDays(3),
                'finished_at' => now()->subMonths(1)->startOfMonth()->addDays(6),
            ],
            [
                'name'        => 'Promoção de Aniversário',
                'description' => 'Campanha especial para aniversariantes',
                'channels'    => ['email', 'notification'],
                'status'      => CampaignStatus::Draft,
                'type'        => 'manual',
                'created_by'  => $createdBy->id,
            ],
            [
                'name'        => 'Reengajamento Q2 2026',
                'description' => 'Campanha para reengajar usuários inativos',
                'template_id' => $templates['relatorio-semanal'] ?? null,
                'channels'    => ['email'],
                'status'      => CampaignStatus::Sent,
                'type'        => 'manual',
                'created_by'  => $createdBy->id,
                'started_at'  => now()->subMonths(2)->startOfMonth()->addDays(5),
                'finished_at' => now()->subMonths(2)->startOfMonth()->addDays(8),
            ],
            [
                'name'        => 'Newsletter Mensal',
                'description' => 'Newsletter enviada todo primeiro dia do mês',
                'template_id' => $templates['relatorio-semanal'] ?? null,
                'channels'    => ['email'],
                'status'      => CampaignStatus::Scheduled,
                'type'        => 'automated',
                'created_by'  => $createdBy->id,
                'scheduled_at' => now()->addMonth()->startOfMonth(),
            ],
            [
                'name'        => 'SMS de verificação',
                'description' => 'Códigos de verificação por SMS',
                'template_id' => $templates['notificacao-de-acesso'] ?? null,
                'channels'    => ['sms'],
                'status'      => CampaignStatus::Sent,
                'type'        => 'automated',
                'created_by'  => $createdBy->id,
                'started_at'  => now()->subDays(20),
                'finished_at' => now()->subDays(18),
            ],
        ];

        foreach ($campaigns as $index => $campaign) {
            $record = Campaign::updateOrCreate(['name' => $campaign['name']], $campaign);
            if ($record->created_at->greaterThan(now()->subDays(7))) {
                $record->created_at = now()->subMonths(5 - ($index % 6))->subDays($tenantIndex + $index);
                $record->saveQuietly();
            }
        }
    }

    /** @param  list<User>  $users */
    private function seedCampaignDeliveries(User $admin, array $users, int $tenantIndex): void
    {
        if (CampaignDelivery::query()->count() >= 60) {
            return;
        }

        $campaigns = Campaign::query()->where('status', CampaignStatus::Sent)->get();
        if ($campaigns->isEmpty()) {
            return;
        }

        $channels = [
            DeliveryChannel::Email,
            DeliveryChannel::Whatsapp,
            DeliveryChannel::Notification,
            DeliveryChannel::Sms,
        ];

        $statusWeights = [
            DeliveryStatus::Delivered->value => 55,
            DeliveryStatus::Sent->value      => 20,
            DeliveryStatus::Opened->value    => 10,
            DeliveryStatus::Failed->value    => 10,
            DeliveryStatus::Queued->value    => 5,
        ];

        foreach ($this->monthlyDeliveryVolumes as $monthOffset => $baseVolume) {
            $volume = $baseVolume + ($tenantIndex * 2) + ($monthOffset % 3);
            $monthStart = now()->subMonths(5 - $monthOffset)->startOfMonth();
            $monthEnd = $monthStart->copy()->endOfMonth();

            for ($i = 0; $i < $volume; $i++) {
                $campaign = $campaigns->random();
                $user = $users[array_rand($users)];
                $status = $this->weightedRandom($statusWeights);
                $createdAt = Carbon::createFromTimestamp(
                    rand($monthStart->timestamp, min($monthEnd->timestamp, now()->timestamp))
                );

                $delivery = CampaignDelivery::create([
                    'campaign_id'     => $campaign->id,
                    'user_id'         => $user->id,
                    'channel'         => $channels[array_rand($channels)],
                    'status'          => $status,
                    'recipient_email' => $user->email,
                    'queued_at'       => $createdAt,
                    'sent_at'         => in_array($status, ['sent', 'delivered', 'opened', 'clicked'], true)
                        ? $createdAt->copy()->addMinutes(rand(1, 30))
                        : null,
                    'opened_at'       => in_array($status, ['opened', 'clicked'], true)
                        ? $createdAt->copy()->addHours(rand(1, 48))
                        : null,
                ]);

                $delivery->created_at = $createdAt;
                $delivery->updated_at = $createdAt;
                $delivery->saveQuietly();
            }
        }

        foreach ($campaigns as $campaign) {
            $campaign->update(['stats' => $campaign->deliveryStats()]);
        }
    }

    private function seedWebhookDeliveries(): void
    {
        if (WebhookDelivery::query()->count() >= 40) {
            return;
        }

        $webhooks = Webhook::query()->get();
        if ($webhooks->isEmpty()) {
            return;
        }

        $events = [
            'tenant.created',
            'user.created',
            'user.approved',
            'user.updated',
            'campaign.sent',
            'campaign.completed',
            'report.completed',
            'webhook.failed',
        ];

        // Entregas recentes (últimas horas) para o dashboard
        for ($i = 0; $i < 8; $i++) {
            $webhook = $webhooks->random();
            $isSuccess = $i % 4 !== 3;
            $createdAt = now()->subMinutes(rand(2, 180));

            $delivery = WebhookDelivery::create([
                'webhook_id'      => $webhook->id,
                'event'           => $events[array_rand($events)],
                'payload'         => ['demo' => true, 'index' => $i],
                'response_status' => $isSuccess ? 200 : 500,
                'response_body'   => $isSuccess ? '{"ok":true}' : '{"error":"timeout"}',
                'status'          => $isSuccess ? 'success' : 'failed',
                'attempts'        => $isSuccess ? 1 : rand(2, 4),
                'delivered_at'    => $createdAt,
            ]);
            $delivery->created_at = $createdAt;
            $delivery->updated_at = $createdAt;
            $delivery->saveQuietly();
        }

        // Histórico distribuído nos últimos 12 meses
        for ($i = 0; $i < 35; $i++) {
            $webhook = $webhooks->random();
            $isSuccess = rand(1, 100) <= 82;
            $createdAt = now()->subDays(rand(1, 330))->subHours(rand(0, 23));

            $delivery = WebhookDelivery::create([
                'webhook_id'      => $webhook->id,
                'event'           => $events[array_rand($events)],
                'payload'         => ['demo' => true, 'batch' => $i],
                'response_status' => $isSuccess ? 200 : rand(400, 503),
                'response_body'   => $isSuccess ? '{"ok":true}' : '{"error":"failed"}',
                'status'          => $isSuccess ? 'success' : 'failed',
                'attempts'        => $isSuccess ? 1 : rand(1, 3),
                'delivered_at'    => $createdAt,
            ]);
            $delivery->created_at = $createdAt;
            $delivery->updated_at = $createdAt;
            $delivery->saveQuietly();
        }
    }

    /** @param  list<User>  $users */
    private function seedUserApprovals(array $users, User $reviewer): void
    {
        foreach ($users as $index => $user) {
            if ($user->hasRole('super-admin')) {
                continue;
            }

            $status = match ($index % 7) {
                0, 1 => 'pending',
                2    => 'rejected',
                default => 'approved',
            };

            UserApproval::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'status'           => $status,
                    'reviewed_by'      => $status !== 'pending' ? $reviewer->id : null,
                    'rejection_reason' => $status === 'rejected' ? 'Documentação incompleta' : null,
                    'reviewed_at'      => $status !== 'pending' ? now()->subDays(rand(1, 60)) : null,
                    'created_at'       => $user->created_at,
                    'updated_at'       => now(),
                ]
            );
        }
    }

    private function seedInvites(User $invitedBy): void
    {
        if (Invite::query()->count() >= 10) {
            return;
        }

        $invites = [
            ['email' => 'novo.colaborador@example.com', 'status' => InviteStatus::Accepted, 'days' => -14],
            ['email' => 'maria.convite@example.com', 'status' => InviteStatus::Accepted, 'days' => -30],
            ['email' => 'joao.externo@example.com', 'status' => InviteStatus::Accepted, 'days' => -45],
            ['email' => 'pendente1@example.com', 'status' => InviteStatus::Pending, 'days' => 5],
            ['email' => 'pendente2@example.com', 'status' => InviteStatus::Pending, 'days' => 3],
            ['email' => 'aguardando@example.com', 'status' => InviteStatus::Pending, 'days' => 7],
            ['email' => 'expirado1@example.com', 'status' => InviteStatus::Expired, 'days' => -3],
            ['email' => 'expirado2@example.com', 'status' => InviteStatus::Expired, 'days' => -10],
        ];

        foreach ($invites as $invite) {
            Invite::updateOrCreate(
                ['email' => $invite['email']],
                [
                    'role'        => 'viewer',
                    'token'       => Str::uuid()->toString(),
                    'status'      => $invite['status'],
                    'invited_by'  => $invitedBy->id,
                    'expires_at'  => now()->addDays($invite['days']),
                    'accepted_at' => $invite['status'] === InviteStatus::Accepted ? now()->subDays(abs($invite['days'])) : null,
                ]
            );
        }
    }

    private function seedDocs(int $targetCount): void
    {
        $existing = Doc::query()->count();
        if ($existing >= $targetCount) {
            return;
        }

        $categories = [
            'Introdução', 'API', 'Autenticação', 'Campanhas', 'Webhooks',
            'Relatórios', 'Usuários', 'Permissões', 'Integrações', 'FAQ',
            'Guia rápido', 'Troubleshooting', 'Segurança', 'Notificações',
        ];

        for ($i = $existing; $i < $targetCount; $i++) {
            $category = $categories[$i % count($categories)];
            $slug = Str::slug("doc-{$category}-{$i}");

            Doc::updateOrCreate(
                ['slug' => $slug],
                [
                    'title'     => "{$category} — Documento ".($i + 1),
                    'body'      => "<h1>{$category}</h1><p>Conteúdo de demonstração para o dashboard.</p>",
                    'is_active' => $i % 9 !== 0,
                ]
            );
        }

        // Espalha created_at nos últimos meses
        Doc::query()->orderBy('id')->each(function (Doc $doc, int $index): void {
            if ($doc->created_at->greaterThan(now()->subDays(7))) {
                $doc->created_at = now()->subMonths($index % 6)->subDays($index * 2);
                $doc->saveQuietly();
            }
        });
    }

    private function seedReportExecutions(User $executor): void
    {
        if (ReportExecution::query()->count() >= 20) {
            return;
        }

        $templates = ReportTemplate::query()->get();
        $statuses = ['completed', 'completed', 'completed', 'running', 'failed', 'queued'];

        foreach ($templates as $templateIndex => $template) {
            $executionCount = [34, 12, 8, 21, 5][$templateIndex % 5];

            for ($i = 0; $i < min($executionCount, 8); $i++) {
                $status = $statuses[($templateIndex + $i) % count($statuses)];
                $executedAt = now()->subDays(rand(1, 90))->subHours($i * 3);

                $execution = ReportExecution::create([
                    'report_template_id' => $template->id,
                    'executed_by'        => $executor->id,
                    'parameters'         => ['status' => 'active', 'limit' => 50],
                    'rows_count'         => rand(10, 500),
                    'status'             => $status,
                    'result_rows_count'  => $status === 'completed' ? rand(10, 500) : 0,
                    'result_path'        => $status === 'completed' ? "reports/demo-{$template->id}-{$i}.csv" : null,
                    'result_expires_at'  => $status === 'completed' ? now()->addDays(7) : null,
                    'duration_ms'        => rand(200, 8000),
                    'error_message'      => $status === 'failed' ? 'Timeout ao executar query' : null,
                    'progress_message'   => $status === 'running' ? 'Processando registros...' : null,
                    'executed_at'        => $executedAt,
                ]);

                $execution->created_at = $executedAt;
                $execution->updated_at = $executedAt;
                $execution->saveQuietly();
            }
        }
    }

    /** @param  list<User>  $users */
    private function seedUserPreferences(array $users): void
    {
        $keys = [
            'theme'           => ['light', 'dark', 'system'],
            'language'        => ['pt_BR', 'en_US'],
            'dashboard.layout' => ['compact', 'default'],
            'timezone'        => ['America/Sao_Paulo', 'America/Manaus'],
        ];

        foreach ($users as $userIndex => $user) {
            foreach ($keys as $key => $values) {
                UserPreference::updateOrCreate(
                    ['user_id' => $user->id, 'key' => $key],
                    ['value' => $values[$userIndex % count($values)]]
                );
            }
        }
    }

    /** @param  list<User>  $users */
    private function seedNotificationPreferences(array $users): void
    {
        $events = ['report.completed', 'campaign.sent', 'invite.accepted', 'user.created'];
        $channels = ['email', 'app', 'whatsapp', 'push', 'sms'];

        foreach ($users as $userIndex => $user) {
            foreach ($events as $eventIndex => $event) {
                foreach ($channels as $channelIndex => $channel) {
                    $enabled = (($userIndex + $eventIndex + $channelIndex) % 3) !== 0;

                    UserNotificationPreference::updateOrCreate(
                        [
                            'user_id' => $user->id,
                            'event'   => $event,
                            'channel' => $channel,
                        ],
                        ['enabled' => $enabled]
                    );
                }
            }
        }
    }

    private function seedCustomizeMenus(): void
    {
        $menus = Menu::query()->orderBy('id')->limit(5)->get();

        foreach ($menus as $index => $menu) {
            if ($menu->updated_at->equalTo($menu->created_at)) {
                $menu->updated_at = $menu->created_at->copy()->addDays($index + 3);
                $menu->saveQuietly();
            }
        }
    }

    private function seedRecentActivity(User $actor): void
    {
        if (DB::table('activity_log')->count() >= 15) {
            return;
        }

        $subjects = [
            [Campaign::class, 'Campanha enviada'],
            [MessageTemplate::class, 'Template atualizado'],
            [Webhook::class, 'Webhook configurado'],
            [ReportTemplate::class, 'Relatório executado'],
            [User::class, 'Usuário aprovado'],
            [Doc::class, 'Documento publicado'],
        ];

        for ($i = 0; $i < 12; $i++) {
            [$modelClass, $description] = $subjects[$i % count($subjects)];
            $subject = $modelClass::query()->inRandomOrder()->first();

            if ($subject === null) {
                continue;
            }

            activity()
                ->causedBy($actor)
                ->performedOn($subject)
                ->event($i % 2 === 0 ? 'created' : 'updated')
                ->log($description);
        }
    }

    /** @param  array<string, int>  $weights */
    private function weightedRandom(array $weights): string
    {
        $total = array_sum($weights);
        $random = rand(1, max(1, $total));
        $cumulative = 0;

        foreach ($weights as $value => $weight) {
            $cumulative += $weight;
            if ($random <= $cumulative) {
                return $value;
            }
        }

        return array_key_first($weights);
    }
}
