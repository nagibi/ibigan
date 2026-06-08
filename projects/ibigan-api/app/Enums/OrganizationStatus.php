<?php

declare(strict_types=1);

namespace App\Enums;

enum OrganizationStatus: string
{
    case Active = 'active';
    case Inactive = 'inactive';
    case Suspended = 'suspended';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Ativo',
            self::Inactive => 'Inativo',
            self::Suspended => 'Suspenso',
        };
    }
}
