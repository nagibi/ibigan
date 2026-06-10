<?php

declare(strict_types=1);

namespace App\Exports;

use App\Jobs\Concerns\TenantAwareJob;
use App\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

final class UsersExport implements FromQuery, ShouldQueue, WithHeadings, WithMapping
{
    use Exportable;
    use TenantAwareJob;

    public function query(): Builder
    {
        return User::query()->with('roles');
    }

    public function headings(): array
    {
        return ['Id', 'Nome', 'Email', 'CPF', 'Telefone', 'Status', 'Roles', 'Criado em'];
    }

    /**
     * @param  User  $user
     */
    public function map($user): array
    {
        return [
            $user->id,
            $user->name,
            $user->email,
            $user->cpf,
            $user->phone,
            $user->status,
            $user->roles->pluck('name')->implode(', '),
            $user->created_at->format('d/m/Y H:i'),
        ];
    }
}
