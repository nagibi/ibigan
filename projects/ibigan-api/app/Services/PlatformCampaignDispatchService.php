<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\CampaignStatus;
use App\Models\Campaign;
use App\Models\MessageTemplate;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Validation\ValidationException;

final class PlatformCampaignDispatchService
{
    public function __construct(
        private readonly CampaignService $campaignService,
    ) {}

    /**
     * @param  list<string>  $tenantIds
     * @param  array<string, mixed>  $payload
     * @return array{dispatched: list<array<string, mixed>>, skipped: list<array<string, string>>}
     */
    public function dispatch(array $tenantIds, array $payload): array
    {
        $dispatched = [];
        $skipped = [];

        foreach ($tenantIds as $tenantId) {
            /** @var Tenant|null $tenant */
            $tenant = Tenant::query()->find($tenantId);

            if ($tenant === null) {
                $skipped[] = ['tenant_id' => $tenantId, 'reason' => 'Empresa não encontrada.'];

                continue;
            }

            if (! $tenant->is_active) {
                $skipped[] = ['tenant_id' => $tenantId, 'reason' => 'Empresa inativa.'];

                continue;
            }

            try {
                $dispatched[] = $tenant->run(fn (): array => $this->createAndDispatchInTenant($payload));
            } catch (ValidationException $exception) {
                $skipped[] = [
                    'tenant_id' => $tenantId,
                    'reason' => collect($exception->errors())->flatten()->first() ?? 'Falha ao criar campanha.',
                ];
            } catch (\Throwable $exception) {
                $skipped[] = [
                    'tenant_id' => $tenantId,
                    'reason' => $exception->getMessage(),
                ];
            }
        }

        if (tenancy()->initialized) {
            tenancy()->end();
        }

        if ($dispatched === [] && $skipped !== []) {
            throw ValidationException::withMessages([
                'tenant_ids' => ['Nenhuma campanha foi criada. Verifique as empresas selecionadas.'],
            ]);
        }

        return [
            'dispatched' => $dispatched,
            'skipped' => $skipped,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{tenant_id: string, campaign_id: int, status: string}
     */
    private function createAndDispatchInTenant(array $payload): array
    {
        $templateId = $this->resolveTemplateId($payload);
        $usesTemplate = Arr::get($payload, 'template_slug') !== null || Arr::get($payload, 'template_id') !== null;

        if ($usesTemplate && $templateId === null) {
            throw ValidationException::withMessages([
                'template_slug' => ['Template não encontrado ou inativo nesta empresa.'],
            ]);
        }

        if (! $usesTemplate && blank($payload['subject'] ?? null)) {
            throw ValidationException::withMessages([
                'subject' => ['Informe o conteúdo ou selecione um template.'],
            ]);
        }

        $creatorId = User::query()
            ->role(['admin'])
            ->orderBy('id')
            ->value('id') ?? User::query()->orderBy('id')->value('id');

        if ($creatorId === null) {
            throw ValidationException::withMessages([
                'tenant' => ['Nenhum usuário disponível na empresa.'],
            ]);
        }

        $scheduledAt = $payload['scheduled_at'] ?? null;

        $campaign = Campaign::query()->create([
            'name' => $payload['name'],
            'description' => $payload['description'] ?? null,
            'template_id' => $templateId,
            'subject' => $usesTemplate ? null : ($payload['subject'] ?? null),
            'body' => $usesTemplate ? null : ($payload['body'] ?? null),
            'merge_data' => $payload['merge_data'] ?? null,
            'channels' => $payload['channels'],
            'status' => $scheduledAt ? CampaignStatus::Scheduled : CampaignStatus::Draft,
            'scheduled_at' => $scheduledAt,
            'created_by' => $creatorId,
        ]);

        foreach ($payload['recipients'] as $recipient) {
            $campaign->recipients()->create([
                'type' => $recipient['type'],
                'value' => $recipient['value'] ?? null,
            ]);
        }

        if (! $scheduledAt) {
            $this->campaignService->dispatch($campaign);
        }

        $campaign->refresh();

        return [
            'tenant_id' => (string) tenant()->id,
            'campaign_id' => $campaign->id,
            'status' => $campaign->status->value,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function resolveTemplateId(array $payload): ?int
    {
        if (filled($payload['template_slug'] ?? null)) {
            return MessageTemplate::query()
                ->where('slug', $payload['template_slug'])
                ->where('is_active', true)
                ->value('id');
        }

        if (filled($payload['template_id'] ?? null)) {
            return MessageTemplate::query()
                ->whereKey($payload['template_id'])
                ->where('is_active', true)
                ->value('id');
        }

        return null;
    }
}
