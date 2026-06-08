<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Menu;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class MenuFactory extends Factory
{
    protected $model = Menu::class;

    public function definition(): array
    {
        $title = fake()->unique()->words(2, true);

        return [
            'title' => ucfirst($title),
            'slug' => Str::slug($title),
            'icon' => fake()->randomElement(['Home', 'Users', 'Settings', 'Bell']),
            'path' => '/'.Str::slug($title),
            'target' => '_self',
            'parent_id' => null,
            'order' => fake()->numberBetween(0, 10),
            'is_active' => true,
            'requires_auth' => true,
            'roles' => ['admin', 'viewer'],
        ];
    }
}
