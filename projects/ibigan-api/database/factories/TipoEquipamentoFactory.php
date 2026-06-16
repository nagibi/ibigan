<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\GrupoEquipamento;
use App\Models\TipoEquipamento;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<TipoEquipamento> */
class TipoEquipamentoFactory extends Factory
{
    protected $model = TipoEquipamento::class;

    public function definition(): array
    {
        return [
            'grupo_id' => GrupoEquipamento::factory(),
            'nome' => fake()->words(3, true),
            'is_ativo' => true,
        ];
    }
}
