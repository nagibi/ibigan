<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Organization;
use App\Support\BrazilianDocuments;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Organization>
 */
class OrganizationFactory extends Factory
{
    protected $model = Organization::class;

    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'slug' => fake()->unique()->slug(3),
            'cnpj' => $this->fakeCnpj(),
            'status' => 'active',
        ];
    }

    private function fakeCnpj(): string
    {
        do {
            $digits = '';
            for ($index = 0; $index < 8; $index++) {
                $digits .= (string) fake()->numberBetween(0, 9);
            }

            $digits .= '0001';

            $weightsFirst = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
            $sum = 0;
            for ($index = 0; $index < 12; $index++) {
                $sum += (int) $digits[$index] * $weightsFirst[$index];
            }

            $remainder = $sum % 11;
            $firstDigit = $remainder < 2 ? 0 : 11 - $remainder;
            $digits .= (string) $firstDigit;

            $weightsSecond = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
            $sum = 0;
            for ($index = 0; $index < 13; $index++) {
                $sum += (int) $digits[$index] * $weightsSecond[$index];
            }

            $remainder = $sum % 11;
            $secondDigit = $remainder < 2 ? 0 : 11 - $remainder;
            $cnpj = $digits.(string) $secondDigit;
        } while (! BrazilianDocuments::isValidCnpj($cnpj));

        return $cnpj;
    }
}
