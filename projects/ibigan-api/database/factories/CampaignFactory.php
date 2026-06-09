<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\CampaignStatus;
use App\Enums\CampaignType;
use App\Models\Campaign;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CampaignFactory extends Factory
{
    protected $model = Campaign::class;

    public function definition(): array
    {
        return [
            'name'        => fake()->sentence(3),
            'description' => fake()->sentence(),
            'channels'    => ['email', 'notification'],
            'status'      => CampaignStatus::Draft,
            'type'        => CampaignType::Manual,
            'created_by'  => User::factory(),
        ];
    }

    public function sent(): static
    {
        return $this->state([
            'status'      => CampaignStatus::Sent,
            'started_at'  => now()->subHour(),
            'finished_at' => now(),
        ]);
    }

    public function scheduled(): static
    {
        return $this->state([
            'status'       => CampaignStatus::Scheduled,
            'scheduled_at' => now()->addDay(),
        ]);
    }
}
