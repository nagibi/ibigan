<?php

declare(strict_types=1);

namespace App\Exports;

use App\Jobs\Concerns\TenantAwareJob;
use App\Models\Organization;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

final class OrganizationsExport implements FromQuery, ShouldQueue, WithHeadings, WithMapping
{
    use Exportable;
    use TenantAwareJob;

    public function query(): Builder
    {
        return Organization::query();
    }

    public function headings(): array
    {
        return ['Id', 'Nome', 'Slug', 'CNPJ', 'Status', 'Descrição', 'Criado em'];
    }

    /**
     * @param  Organization  $organization
     */
    public function map($organization): array
    {
        return [
            $organization->id,
            $organization->name,
            $organization->slug,
            $organization->cnpj,
            $organization->status->value,
            $organization->description,
            $organization->created_at->format('d/m/Y H:i'),
        ];
    }
}
