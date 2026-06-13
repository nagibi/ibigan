<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use App\Models\UserPreference;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

final class UserPreferenceService
{
    public const VIEW_MODES = ['table', 'list', 'cards'];

    /** @var list<string> */
    public const VIEW_PREFERENCE_KEYS = [
        'users.view',
        'roles.view',
        'permissions.view',
        'organizations.view',
        'menus.view',
        'reports.view',
        'campaigns.view',
        'message-templates.view',
        'invites.view',
        'webhooks.view',
        'translations.view',
        'reports.executions.view',
        'user-approvals.view',
        'activity-logs.view',
        'notifications.view',
        'central-users.view',
    ];

    public function getForUser(User $user): array
    {
        return UserPreference::query()
            ->where('user_id', $user->id)
            ->get()
            ->mapWithKeys(fn (UserPreference $preference) => [
                $preference->key => $preference->value,
            ])
            ->all();
    }

    /**
     * @param  array<string, string>  $preferences
     */
    public function upsertMany(User $user, array $preferences): array
    {
        foreach ($preferences as $key => $value) {
            $this->validatePreference($key, $value);

            UserPreference::updateOrCreate(
                ['user_id' => $user->id, 'key' => $key],
                ['value' => $value],
            );
        }

        return $this->getForUser($user);
    }

    private function validatePreference(string $key, string $value): void
    {
        if (str_ends_with($key, '.view') && ! in_array($value, self::VIEW_MODES, true)) {
            throw ValidationException::withMessages([
                $key => ['Invalid view mode.'],
            ]);
        }
    }
}
