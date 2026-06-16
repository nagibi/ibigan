<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\GrupoEquipamento;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<GrupoEquipamento> */
class GrupoEquipamentoFactory extends Factory
{
    protected $model = GrupoEquipamento::class;

    public function definition(): array
    {
        return [
            'nome' => strtoupper(fake()->unique()->words(2, true)),
        ];
    }
}
