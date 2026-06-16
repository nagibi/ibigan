<?php

declare(strict_types=1);

namespace Database\Factories;

use Database\Factories\Concerns\PicsumImage;
use App\Models\Equipamento;
use App\Models\Fornecedor;
use App\Models\Obra;
use App\Models\TipoEquipamento;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Equipamento> */
class EquipamentoFactory extends Factory
{
    protected $model = Equipamento::class;

    public function definition(): array
    {
        return [
            'patrimonio' => fake()->unique()->bothify('??-####'),
            'tipo_id' => TipoEquipamento::factory(),
            'fornecedor_id' => Fornecedor::factory(),
            'obra_id' => Obra::factory(),
            'valor_mensal' => fake()->randomFloat(2, 500, 5000),
            'foto_path' => PicsumImage::url(),
            'is_critico' => false,
            'data_entrada' => now()->subDays(30)->toDateString(),
        ];
    }

    public function critico(): static
    {
        return $this->state(['is_critico' => true]);
    }
}
