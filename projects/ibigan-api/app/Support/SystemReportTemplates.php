<?php

declare(strict_types=1);

namespace App\Support;

final class SystemReportTemplates
{
    /**
     * @return list<array<string, mixed>>
     */
    public static function definitions(): array
    {
        return PlatformCatalogDefinitions::reportTemplates();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public static function defaultDefinitions(): array
    {
        return [
            [
                'platform_key' => ReportPlatformKeys::USERS_MONTHLY,
                'name' => 'Relatório mensal de usuários',
                'description' => 'Usuários cadastrados agrupados por mês',
                'query' => 'SELECT DATE_FORMAT(created_at, "%Y-%m") as mes, COUNT(*) as total FROM users WHERE status = :status GROUP BY mes ORDER BY mes DESC',
                'parameters' => [
                    ['name' => 'status', 'type' => 'select', 'label' => 'Status', 'required' => true, 'options' => ['active', 'inactive', 'pending']],
                ],
                'columns' => [
                    ['key' => 'mes', 'label' => 'Mês', 'format' => 'text'],
                    ['key' => 'total', 'label' => 'Total', 'format' => 'number'],
                ],
                'is_active' => true,
            ],
            [
                'platform_key' => ReportPlatformKeys::CAMPAIGNS_BY_STATUS,
                'name' => 'Campanhas por status',
                'description' => 'Resumo das campanhas agrupadas por status',
                'query' => "SELECT status, COUNT(*) as total FROM campaigns WHERE (:status = 'all' OR status = :status) GROUP BY status ORDER BY total DESC",
                'parameters' => [
                    ['name' => 'status', 'type' => 'select', 'label' => 'Status', 'required' => true, 'options' => ['all', 'draft', 'scheduled', 'running', 'completed', 'cancelled', 'failed', 'sent']],
                ],
                'columns' => [
                    ['key' => 'status', 'label' => 'Status', 'format' => 'text'],
                    ['key' => 'total', 'label' => 'Total', 'format' => 'number'],
                ],
                'is_active' => true,
            ],
            [
                'platform_key' => ReportPlatformKeys::WEBHOOK_DELIVERIES,
                'name' => 'Entregas de webhook',
                'description' => 'Entregas de webhook agrupadas por evento',
                'query' => 'SELECT event, COUNT(*) as total FROM webhook_deliveries WHERE status = :status GROUP BY event ORDER BY total DESC LIMIT :limit',
                'parameters' => [
                    ['name' => 'status', 'type' => 'select', 'label' => 'Status', 'required' => true, 'options' => ['failed', 'success', 'pending']],
                    ['name' => 'limit', 'type' => 'number', 'label' => 'Limite', 'required' => true],
                ],
                'columns' => [
                    ['key' => 'event', 'label' => 'Evento', 'format' => 'text'],
                    ['key' => 'total', 'label' => 'Total', 'format' => 'number'],
                ],
                'is_active' => true,
            ],
            [
                'platform_key' => ReportPlatformKeys::USERS_DEMO,
                'name' => 'Relatório demonstrativo de usuários',
                'description' => 'Exemplo com filtros de status, gênero e período',
                'query' => <<<'SQL'
SELECT id, name, email, status, gender, created_at
FROM users
WHERE status = :status
  AND gender = :gender
  AND DATE(created_at) >= :date_from
  AND DATE(created_at) <= :date_to
ORDER BY created_at DESC
LIMIT :limit
SQL,
                'parameters' => [
                    ['name' => 'status', 'type' => 'select', 'label' => 'Status', 'required' => true, 'options' => ['active', 'inactive', 'pending']],
                    ['name' => 'gender', 'type' => 'select', 'label' => 'Gênero', 'required' => true, 'options' => ['male', 'female', 'other']],
                    ['name' => 'date_from', 'type' => 'date', 'label' => 'Cadastro de', 'required' => true],
                    ['name' => 'date_to', 'type' => 'date', 'label' => 'Cadastro até', 'required' => true],
                    ['name' => 'limit', 'type' => 'number', 'label' => 'Limite', 'required' => true],
                ],
                'columns' => [
                    ['key' => 'id', 'label' => 'ID', 'format' => 'number'],
                    ['key' => 'name', 'label' => 'Nome', 'format' => 'text'],
                    ['key' => 'email', 'label' => 'E-mail', 'format' => 'text'],
                    ['key' => 'status', 'label' => 'Status', 'format' => 'text'],
                    ['key' => 'created_at', 'label' => 'Cadastro', 'format' => 'datetime'],
                ],
                'is_active' => true,
            ],
        ];
    }
}
