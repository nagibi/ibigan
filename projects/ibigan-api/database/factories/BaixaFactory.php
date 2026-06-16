<?php

declare(strict_types=1);

namespace Database\Factories;

use Database\Factories\Concerns\PicsumImage;
use App\Models\Baixa;
use App\Models\Equipamento;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Baixa> */
class BaixaFactory extends Factory
{
    protected $model = Baixa::class;

    public function definition(): array
    {
        return [
            'equipamento_id' => Equipamento::factory(),
            'tipo' => 'devolucao',
            'data_baixa' => now()->toDateString(),
            'motivo' => null,
            'foto_path' => PicsumImage::url(),
            'responsavel_perda' => null,
            'valor_reposicao' => null,
            'registrado_por' => User::factory(),
            'observacoes' => null,
        ];
    }

    public function perda(): static
    {
        return $this->state([
            'tipo' => 'perda',
            'motivo' => fake()->sentence(),
            'responsavel_perda' => fake()->name(),
            'valor_reposicao' => fake()->randomFloat(2, 1000, 10000),
        ]);
    }
}
