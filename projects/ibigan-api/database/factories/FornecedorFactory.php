<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Fornecedor;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Fornecedor> */
class FornecedorFactory extends Factory
{
    protected $model = Fornecedor::class;

    public function definition(): array
    {
        return [
            'nome' => fake()->company(),
            'cnpj' => fake()->numerify('##.###.###/####-##'),
            'telefone' => fake()->numerify('119########'),
            'email' => fake()->companyEmail(),
            'contato_responsavel' => fake()->name(),
            'is_ativo' => true,
        ];
    }
}
