<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\WebhookEvent;
use App\Models\Webhook;
use Illuminate\Database\Eloquent\Factories\Factory;

class WebhookFactory extends Factory
{
    protected $model = Webhook::class;

    public function definition(): array
    {
        return [
            'url' => fake()->url(),
            'secret' => fake()->uuid(),
            'events' => [WebhookEvent::UserCreated->value],
            'is_active' => true,
            'description' => fake()->sentence(),
        ];
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }

    /**
     * @param  array<int, string>  $events
     */
    public function withEvents(array $events): static
    {
        return $this->state(['events' => $events]);
    }
}
