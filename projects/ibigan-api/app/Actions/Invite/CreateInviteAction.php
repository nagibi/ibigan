<?php

declare(strict_types=1);

namespace App\Actions\Invite;

use App\Enums\InviteStatus;
use App\Http\Requests\Invite\StoreInviteRequest;
use App\Jobs\SendInviteEmailJob;
use App\Models\Invite;
use App\Models\User;
use App\Repositories\Contracts\InviteRepositoryInterface;
use Illuminate\Support\Str;

final class CreateInviteAction
{
    public function __construct(
        private readonly InviteRepositoryInterface $inviteRepository,
    ) {}

    public function execute(StoreInviteRequest $request, User $invitedBy): Invite
    {
        $invite = $this->inviteRepository->create([
            'email' => $request->validated('email'),
            'role' => $request->validated('role'),
            'token' => (string) Str::uuid(),
            'status' => InviteStatus::Pending,
            'invited_by' => $invitedBy->id,
            'expires_at' => now()->addDays(7),
        ]);

        SendInviteEmailJob::dispatch($invite->id);

        return $invite->load('invitedBy');
    }
}
