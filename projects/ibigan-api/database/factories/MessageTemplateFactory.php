<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\MessageTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;

class MessageTemplateFactory extends Factory
{
    protected $model = MessageTemplate::class;

    public function definition(): array
    {
        return [
            'name' => fake()->words(3, true),
            'slug' => fake()->unique()->slug(3),
            'subject' => fake()->sentence(),
            'body' => fake()->paragraphs(2, true),
            'merge_tags' => ['{{nome}}', '{{empresa}}'],
            'is_active' => true,
        ];
    }
}
