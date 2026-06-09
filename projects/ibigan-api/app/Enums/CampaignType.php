<?php

declare(strict_types=1);

namespace App\Enums;

enum CampaignType: string
{
    case Manual = 'manual';
    case Automated = 'automated';
    case Transactional = 'transactional';
}
