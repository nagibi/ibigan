<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Services\PlatformCatalogService;
use Illuminate\Console\Command;

final class SyncPlatformCatalogCommand extends Command
{
    protected $signature = 'tenants:sync-platform-catalog
                            {tenant? : ID do tenant (omitir para sincronizar todos)}
                            {--force : Sobrescreve conteúdo dos itens de plataforma}';

    protected $description = 'Sincroniza templates de mensagem e relatórios padrão da plataforma nos tenants';

    public function handle(PlatformCatalogService $platformCatalogService): int
    {
        $tenantId = $this->argument('tenant');
        $force = (bool) $this->option('force');

        $tenants = $tenantId
            ? Tenant::query()->where('id', $tenantId)->get()
            : Tenant::query()->cursor();

        $processed = 0;

        foreach ($tenants as $tenant) {
            $counts = $tenant->run(fn (): array => $platformCatalogService->sync(force: $force));

            $this->line(sprintf(
                '[%s] templates: %d | relatórios: %d',
                $tenant->id,
                $counts['message_templates'],
                $counts['report_templates'],
            ));

            $processed++;
        }

        if ($processed === 0) {
            $this->warn('Nenhum tenant encontrado.');

            return self::FAILURE;
        }

        $this->info("Catálogo sincronizado em {$processed} tenant(s).");

        return self::SUCCESS;
    }
}
