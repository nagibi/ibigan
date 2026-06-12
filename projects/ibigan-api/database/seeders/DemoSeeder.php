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

    public function run(): void
    {
        // Super admin central
        DB::table('central_users')->updateOrInsert(
            ['email' => 'nagibi@gmail.com'],
            [
                'name'           => 'Nagibi Emanuel',
                'password'       => Hash::make('A12345'),
                'is_super_admin' => 1,
                'is_active'      => 1,
                'created_at'     => now(),
                'updated_at'     => now(),
            ]
        );
        $this->command->info('Super admin central criado: nagibi@gmail.com');

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
                $this->seedReportTemplates();

                // Campaigns
                $this->seedCampaigns($tenantData['id']);

                $this->command->info("  ✓ Tenant {$tenantData['id']} populado com sucesso");
            });
        }
    }

    private function seedMessageTemplates(): void
    {
        $templates = [
            [
                'name'    => 'Boas-vindas',
                'subject' => 'Bem-vindo(a) ao sistema!',
                'body'    => '<h1>Olá, {{name}}!</h1><p>Seja bem-vindo(a) ao nosso sistema. Estamos felizes em tê-lo(a) conosco.</p>',
                'type'    => 'email',
            ],
            [
                'name'    => 'Redefinição de senha',
                'subject' => 'Redefinição de senha solicitada',
                'body'    => '<p>Olá, {{name}}!</p><p>Você solicitou a redefinição de sua senha. Clique no link abaixo:</p><p><a href="{{link}}">Redefinir senha</a></p>',
                'type'    => 'email',
            ],
            [
                'name'    => 'Notificação de acesso',
                'subject' => 'Novo acesso detectado',
                'body'    => '<p>Olá, {{name}}!</p><p>Um novo acesso foi detectado em sua conta em {{date}} às {{time}}.</p>',
                'type'    => 'email',
            ],
            [
                'name'    => 'Convite para colaboração',
                'subject' => 'Você foi convidado(a)!',
                'body'    => '<h2>Convite especial</h2><p>{{inviter}} convidou você para colaborar. Acesse: <a href="{{link}}">Aceitar convite</a></p>',
                'type'    => 'email',
            ],
            [
                'name'    => 'Relatório semanal',
                'subject' => 'Seu relatório semanal está pronto',
                'body'    => '<p>Olá, {{name}}!</p><p>Seu relatório semanal de {{period}} está disponível para download.</p>',
                'type'    => 'email',
            ],
        ];

        foreach ($templates as $template) {
            MessageTemplate::firstOrCreate(
                ['name' => $template['name']],
                $template
            );
        }
    }

    private function seedWebhooks(string $tenantId): void
    {
        $webhooks = [
            [
                'name'       => 'Notificação de novo usuário',
                'url'        => 'https://hooks.example.com/' . $tenantId . '/new-user',
                'events'     => ['user.created', 'user.updated'],
                'is_active'  => true,
                'secret'     => Str::random(32),
            ],
            [
                'name'       => 'Alerta de campanha',
                'url'        => 'https://hooks.example.com/' . $tenantId . '/campaign',
                'events'     => ['campaign.started', 'campaign.finished'],
                'is_active'  => true,
                'secret'     => Str::random(32),
            ],
            [
                'name'       => 'Integração ERP',
                'url'        => 'https://erp.example.com/webhook/' . $tenantId,
                'events'     => ['user.created', 'campaign.finished'],
                'is_active'  => false,
                'secret'     => Str::random(32),
            ],
        ];

        foreach ($webhooks as $webhook) {
            Webhook::firstOrCreate(
                ['name' => $webhook['name']],
                $webhook
            );
        }
    }

    private function seedReportTemplates(): void
    {
        $reports = [
            [
                'name'        => 'Usuários ativos por mês',
                'description' => 'Lista todos os usuários ativos agrupados por mês de cadastro',
                'query'       => 'SELECT DATE_FORMAT(created_at, "%Y-%m") as mes, COUNT(*) as total FROM users WHERE status = "active" GROUP BY mes ORDER BY mes DESC',
                'is_active'   => true,
            ],
            [
                'name'        => 'Campanhas por status',
                'description' => 'Resumo das campanhas agrupadas por status',
                'query'       => 'SELECT status, COUNT(*) as total FROM campaigns GROUP BY status',
                'is_active'   => true,
            ],
            [
                'name'        => 'Entregas de campanha',
                'description' => 'Total de entregas por campanha',
                'query'       => 'SELECT c.name, COUNT(cd.id) as entregas FROM campaigns c LEFT JOIN campaign_deliveries cd ON cd.campaign_id = c.id GROUP BY c.id, c.name ORDER BY entregas DESC',
                'is_active'   => true,
            ],
        ];

        foreach ($reports as $report) {
            ReportTemplate::firstOrCreate(
                ['name' => $report['name']],
                $report
            );
        }
    }

    private function seedCampaigns(string $tenantId): void
    {
        $campaigns = [
            [
                'name'        => 'Campanha de Boas-vindas',
                'description' => 'Enviada automaticamente para novos usuários',
                'status'      => 'active',
                'type'        => 'email',
            ],
            [
                'name'        => 'Promoção de Aniversário',
                'description' => 'Campanha especial para usuários aniversariantes',
                'status'      => 'draft',
                'type'        => 'email',
            ],
            [
                'name'        => 'Reengajamento Q2 2026',
                'description' => 'Campanha para reengajar usuários inativos',
                'status'      => 'finished',
                'type'        => 'email',
            ],
            [
                'name'        => 'Newsletter Mensal',
                'description' => 'Newsletter enviada todo primeiro dia do mês',
                'status'      => 'active',
                'type'        => 'email',
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
