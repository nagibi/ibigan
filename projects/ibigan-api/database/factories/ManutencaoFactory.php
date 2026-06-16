<?php

declare(strict_types=1);

namespace Database\Factories;

use Database\Factories\Concerns\PicsumImage;
use App\Models\Equipamento;
use App\Models\Manutencao;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Manutencao> */
class ManutencaoFactory extends Factory
{
    protected $model = Manutencao::class;

    public function definition(): array
    {
        return [
            'equipamento_id' => Equipamento::factory(),
            'origem' => 'estoque',
            'emprestimo_id' => null,
            'responsabilidade' => 'equipamento',
            'motivo' => fake()->sentence(),
            'responsavel_manutencao' => fake()->company(),
            'observacoes_tecnicas' => null,
            'foto_path' => PicsumImage::url(),
            'valor_mensal_snapshot' => 1500,
            'desconto_medicao' => true,
            'data_entrada' => now()->subDays(3)->toDateString(),
            'data_saida' => null,
            'registrado_por' => User::factory(),
        ];
    }

    public function finalizada(): static
    {
        return $this->state([
            'data_saida' => now()->toDateString(),
        ]);
    }
}
