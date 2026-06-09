<?php

declare(strict_types=1);

namespace App\Enums;

enum DeliveryChannel: string
{
    case Email = 'email';
    case Notification = 'notification';
    case Sms = 'sms';
    case Whatsapp = 'whatsapp';
}
