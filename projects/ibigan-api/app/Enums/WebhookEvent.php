<?php

declare(strict_types=1);

namespace App\Enums;

enum WebhookEvent: string
{
    case UserCreated = 'user.created';
    case UserUpdated = 'user.updated';
    case UserDeleted = 'user.deleted';
    case InviteAccepted = 'invite.accepted';
}
