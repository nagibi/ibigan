<?php

declare(strict_types=1);

namespace App\Data;

use App\Models\Invite;
use Spatie\LaravelData\Data;

final class InviteData extends Data
{
    public function __construct(
        public int $id,
        public string $email,
        public string $role,
        public string $status,
        public int $invited_by,
        public ?string $invited_by_name,
        public string $expires_at,
        public ?string $accepted_at,
        public string $created_at,
    ) {}

    public static function fromModel(Invite $invite): self
    {
        return new self(
            id: $invite->id,
            email: $invite->email,
            role: $invite->role,
            status: $invite->status->value,
            invited_by: $invite->invited_by,
            invited_by_name: $invite->invitedBy?->name,
            expires_at: $invite->expires_at->toIso8601String(),
            accepted_at: $invite->accepted_at?->toIso8601String(),
            created_at: $invite->created_at->toIso8601String(),
        );
    }
}
