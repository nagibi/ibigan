<?php

declare(strict_types=1);

namespace App\Enums;

enum MessageTemplateChannel: string
{
    case Email = 'email';
    case Sms = 'sms';
    case Whatsapp = 'whatsapp';

    public function label(): string
    {
        return match ($this) {
            self::Email => 'E-mail',
            self::Sms => 'SMS',
            self::Whatsapp => 'WhatsApp',
        };
    }
}
