<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\InviteStatus;
use App\Models\Invite;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class InviteFactory extends Factory
{
    protected $model = Invite::class;

    public function definition(): array
    {
        return [
            'email' => fake()->unique()->safeEmail(),
            'role' => 'viewer',
            'token' => Str::uuid()->toString(),
            'status' => InviteStatus::Pending,
            'invited_by' => User::factory(),
            'expires_at' => now()->addDays(7),
        ];
    }

    public function expired(): static
    {
        return $this->state(['expires_at' => now()->subDay()]);
    }

    public function accepted(): static
    {
        return $this->state([
            'status' => InviteStatus::Accepted,
            'accepted_at' => now(),
        ]);
    }
}
