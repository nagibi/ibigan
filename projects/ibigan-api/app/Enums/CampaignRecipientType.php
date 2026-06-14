<?php

declare(strict_types=1);

namespace App\Enums;

enum CampaignRecipientType: string
{
    case All = 'all';
    case Role = 'role';
    case Permission = 'permission';
    case User = 'user';
    case Users = 'users';
}
