<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Campaign;
use App\Models\Invite;
use App\Models\Menu;
use App\Models\MessageTemplate;
use App\Models\ReportTemplate;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Webhook;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoSeeder extends Seeder
{
    private array $tenants = [
        [
            'id'       => 'techsolutions',
            'slug'     => 'techsolutions',
            'name'     => 'Tech Solutions Ltda',
            'cnpj'     => '12345678000195',
            'timezone' => 'America/Sao_Paulo',
            'locale'   => 'pt_BR',
        ],
        [
            'id'       => 'medigroup',
            'slug'     => 'medigroup',
            'name'     => 'MediGroup Saúde S.A.',
            'cnpj'     => '98765432000111',
            'timezone' => 'America/Sao_Paulo',
            'locale'   => 'pt_BR',
        ],
        [
            'id'       => 'eduplay',
            'slug'     => 'eduplay',
            'name'     => 'EduPlay Educação Digital',
            'cnpj'     => '11223344000155',
            'timezone' => 'America/Recife',
            'locale'   => 'pt_BR',
        ],
        [
            'id'       => 'financeplus',
            'slug'     => 'financeplus',
            'name'     => 'Finance Plus Consultoria',
            'cnpj'     => '55667788000122',
            'timezone' => 'America/Sao_Paulo',
            'locale'   => 'pt_BR',
        ],
        [
            'id'       => 'logismart',
            'slug'     => 'logismart',
            'name'     => 'LogiSmart Transportes',
            'cnpj'     => '33445566000177',
            'timezone' => 'America/Manaus',
            'locale'   => 'pt_BR',
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
        ['name' => 'Jean Schletz',   'email' => 'jeanschletz@gmail.com'],
    ];

    public function run(): void
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

        foreach ($this->tenants as $tenantData) {
            $this->command->info("Criando tenant: {$tenantData['name']}");

            $tenant = Tenant::updateOrCreate(
                ['id' => $tenantData['id']],
                [
                    'slug'     => $tenantData['slug'],
                    'name'     => $tenantData['name'],
                    'cnpj'     => $tenantData['cnpj'],
                    'timezone' => $tenantData['timezone'],
                    'locale'   => $tenantData['locale'],
                    'is_active' => true,
                ]
            );

            $tenant->run(function () use ($tenantData) {
                // Roles e permissões
                $this->call(RolePermissionSeeder::class);
                $this->call(MenuSeeder::class);

                // Super admin do tenant
                $superAdmin = User::firstOrCreate(
                    ['email' => 'admin@' . $tenantData['id'] . '.com'],
                    [
                        'name'       => 'Administrador',
                        'cpf'        => '39053344705',
                        'phone'      => '11999999999',
                        'birth_date' => '1985-01-01',
                        'gender'     => 'prefer_not_to_say',
                        'password'   => Hash::make('A12345'),
                        'status'     => 'active',
                        'is_super_admin' => true,
                    ]
                );
                $superAdmin->syncRoles(['super-admin']);

                // Usuários adicionais
                foreach ($this->users as $index => $userData) {
                    $email = str_replace('{tenant}', $tenantData['id'], $userData['email']);
                    // CPF único por tenant
                    $cpf = str_pad((string)(intval($userData['cpf']) + $index * 111), 11, '0', STR_PAD_LEFT);

                    $user = User::firstOrCreate(
                        ['email' => $email],
                        [
                            'name'       => $userData['name'],
                            'cpf'        => $cpf,
                            'phone'      => '119' . rand(10000000, 99999999),
                            'birth_date' => '199' . rand(0, 9) . '-' . str_pad((string)rand(1, 12), 2, '0', STR_PAD_LEFT) . '-' . str_pad((string)rand(1, 28), 2, '0', STR_PAD_LEFT),
                            'gender'     => $userData['gender'],
                            'password'   => Hash::make('A12345'),
                            'status'     => 'active',
                            'is_super_admin' => false,
                        ]
                    );
                    $user->syncRoles([$userData['role']]);
                }

                // Message Templates
                $this->seedMessageTemplates();

                // Webhooks
                $this->seedWebhooks($tenantData['id']);

                // Report Templates
                $this->seedReportTemplates($superAdmin);

                // Campaigns
                $this->seedCampaigns($superAdmin);

                $this->command->info("  ✓ Tenant {$tenantData['id']} populado com sucesso");
            });
        }
    }

    private function seedMessageTemplates(): void
    {
        $templates = [
            [
                'name'       => 'Boas-vindas',
                'slug'       => 'boas-vindas',
                'subject'    => 'Bem-vindo(a) ao sistema!',
                'body'       => '<h1>Olá, {{name}}!</h1><p>Seja bem-vindo(a) ao nosso sistema. Estamos felizes em tê-lo(a) conosco.</p>',
                'merge_tags' => ['{{name}}'],
            ],
            [
                'name'       => 'Redefinição de senha',
                'slug'       => 'redefinicao-de-senha',
                'subject'    => 'Redefinição de senha solicitada',
                'body'       => '<p>Olá, {{name}}!</p><p>Você solicitou a redefinição de sua senha. Clique no link abaixo:</p><p><a href="{{link}}">Redefinir senha</a></p>',
                'merge_tags' => ['{{name}}', '{{link}}'],
            ],
            [
                'name'       => 'Notificação de acesso',
                'slug'       => 'notificacao-de-acesso',
                'subject'    => 'Novo acesso detectado',
                'body'       => '<p>Olá, {{name}}!</p><p>Um novo acesso foi detectado em sua conta em {{date}} às {{time}}.</p>',
                'merge_tags' => ['{{name}}', '{{date}}', '{{time}}'],
            ],
            [
                'name'       => 'Convite para colaboração',
                'slug'       => 'convite-para-colaboracao',
                'subject'    => 'Você foi convidado(a)!',
                'body'       => '<h2>Convite especial</h2><p>{{inviter}} convidou você para colaborar. Acesse: <a href="{{link}}">Aceitar convite</a></p>',
                'merge_tags' => ['{{inviter}}', '{{link}}'],
            ],
            [
                'name'       => 'Relatório semanal',
                'slug'       => 'relatorio-semanal',
                'subject'    => 'Seu relatório semanal está pronto',
                'body'       => '<p>Olá, {{name}}!</p><p>Seu relatório semanal de {{period}} está disponível para download.</p>',
                'merge_tags' => ['{{name}}', '{{period}}'],
            ],
        ];

        foreach ($templates as $template) {
            MessageTemplate::firstOrCreate(
                ['slug' => $template['slug']],
                $template
            );
        }
    }

    private function seedWebhooks(string $tenantId): void
    {
        $webhooks = [
            [
                'description' => 'Notificação de novo usuário',
                'url'         => 'https://hooks.example.com/' . $tenantId . '/new-user',
                'events'      => ['user.created', 'user.updated'],
                'is_active'   => true,
                'secret'      => Str::random(32),
            ],
            [
                'description' => 'Alerta de campanha',
                'url'         => 'https://hooks.example.com/' . $tenantId . '/campaign',
                'events'      => ['user.created', 'user.updated'],
                'is_active'   => true,
                'secret'      => Str::random(32),
            ],
            [
                'description' => 'Integração ERP',
                'url'         => 'https://erp.example.com/webhook/' . $tenantId,
                'events'      => ['user.created'],
                'is_active'   => false,
                'secret'      => Str::random(32),
            ],
        ];

        foreach ($webhooks as $webhook) {
            Webhook::firstOrCreate(
                ['url' => $webhook['url']],
                $webhook
            );
        }
    }

    private function seedReportTemplates(User $createdBy): void
    {
        $reports = [
            [
                'name'        => 'Usuários ativos por mês',
                'description' => 'Lista todos os usuários ativos agrupados por mês de cadastro',
                'query'       => 'SELECT DATE_FORMAT(created_at, "%Y-%m") as mes, COUNT(*) as total FROM users WHERE status = "active" GROUP BY mes ORDER BY mes DESC',
                'columns'     => [
                    ['key' => 'mes', 'label' => 'Mês', 'format' => 'text'],
                    ['key' => 'total', 'label' => 'Total', 'format' => 'number'],
                ],
                'is_active'   => true,
                'created_by'  => $createdBy->id,
            ],
            [
                'name'        => 'Campanhas por status',
                'description' => 'Resumo das campanhas agrupadas por status',
                'query'       => 'SELECT status, COUNT(*) as total FROM campaigns GROUP BY status',
                'columns'     => [
                    ['key' => 'status', 'label' => 'Status', 'format' => 'text'],
                    ['key' => 'total', 'label' => 'Total', 'format' => 'number'],
                ],
                'is_active'   => true,
                'created_by'  => $createdBy->id,
            ],
            [
                'name'        => 'Entregas de campanha',
                'description' => 'Total de entregas por campanha',
                'query'       => 'SELECT c.name, COUNT(cd.id) as entregas FROM campaigns c LEFT JOIN campaign_deliveries cd ON cd.campaign_id = c.id GROUP BY c.id, c.name ORDER BY entregas DESC',
                'columns'     => [
                    ['key' => 'name', 'label' => 'Campanha', 'format' => 'text'],
                    ['key' => 'entregas', 'label' => 'Entregas', 'format' => 'number'],
                ],
                'is_active'   => true,
                'created_by'  => $createdBy->id,
            ],
        ];

        foreach ($reports as $report) {
            ReportTemplate::firstOrCreate(
                ['name' => $report['name']],
                $report
            );
        }
    }

    private function seedCampaigns(User $createdBy): void
    {
        $welcomeTemplate = MessageTemplate::query()->where('slug', 'boas-vindas')->first();

        $campaigns = [
            [
                'name'        => 'Campanha de Boas-vindas',
                'description' => 'Enviada automaticamente para novos usuários',
                'template_id' => $welcomeTemplate?->id,
                'channels'    => ['email'],
                'status'      => 'sent',
                'type'        => 'automated',
                'created_by'  => $createdBy->id,
                'started_at'  => now()->subDays(7),
                'finished_at' => now()->subDays(6),
            ],
            [
                'name'        => 'Promoção de Aniversário',
                'description' => 'Campanha especial para usuários aniversariantes',
                'channels'    => ['email', 'notification'],
                'status'      => 'draft',
                'type'        => 'manual',
                'created_by'  => $createdBy->id,
            ],
            [
                'name'        => 'Reengajamento Q2 2026',
                'description' => 'Campanha para reengajar usuários inativos',
                'channels'    => ['email'],
                'status'      => 'sent',
                'type'        => 'manual',
                'created_by'  => $createdBy->id,
                'started_at'  => now()->subMonths(2),
                'finished_at' => now()->subMonths(2)->addDays(3),
            ],
            [
                'name'        => 'Newsletter Mensal',
                'description' => 'Newsletter enviada todo primeiro dia do mês',
                'channels'    => ['email'],
                'status'      => 'scheduled',
                'type'        => 'automated',
                'created_by'  => $createdBy->id,
                'scheduled_at' => now()->addMonth()->startOfMonth(),
            ],
        ];

        foreach ($campaigns as $campaign) {
            Campaign::firstOrCreate(
                ['name' => $campaign['name']],
                $campaign
            );
        }
    }
}
