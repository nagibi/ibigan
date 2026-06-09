<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\ReportTemplate;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReportTemplateFactory extends Factory
{
    protected $model = ReportTemplate::class;

    public function definition(): array
    {
        return [
            'name' => fake()->sentence(3),
            'description' => fake()->sentence(),
            'query' => 'SELECT id, name, email, created_at FROM users LIMIT 10',
            'parameters' => [],
            'columns' => [
                ['key' => 'id', 'label' => 'ID', 'format' => 'number'],
                ['key' => 'name', 'label' => 'Nome', 'format' => 'text'],
                ['key' => 'email', 'label' => 'Email', 'format' => 'text'],
            ],
            'is_active' => true,
            'created_by' => User::factory(),
        ];
    }
}
