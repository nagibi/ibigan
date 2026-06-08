<?php

declare(strict_types=1);

namespace App\Enums;

enum InviteStatus: string
{
    case Pending = 'pending';
    case Accepted = 'accepted';
    case Expired = 'expired';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pendente',
            self::Accepted => 'Aceito',
            self::Expired => 'Expirado',
        };
    }
}
