<?php

declare(strict_types=1);

namespace App\Enums;

enum WebhookEvent: string
{
    case UserCreated = 'user.created';
    case UserUpdated = 'user.updated';
    case UserDeleted = 'user.deleted';
    case OrganizationCreated = 'organization.created';
    case OrganizationUpdated = 'organization.updated';
    case OrganizationDeleted = 'organization.deleted';
    case InviteAccepted = 'invite.accepted';
}
