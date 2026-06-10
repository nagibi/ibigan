<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\User;
use App\Support\BrazilianDocuments;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'cpf' => $this->fakeCpf(),
            'phone' => fake()->numerify('11#########'),
            'birth_date' => fake()->dateTimeBetween('-60 years', '-18 years')->format('Y-m-d'),
            'gender' => fake()->randomElement(['male', 'female', 'other', 'prefer_not_to_say']),
            'bio' => fake()->optional()->sentence(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    private function fakeCpf(): string
    {
        do {
            $digits = '';
            for ($index = 0; $index < 9; $index++) {
                $digits .= (string) fake()->numberBetween(0, 9);
            }

            $sum = 0;
            for ($index = 0; $index < 9; $index++) {
                $sum += (int) $digits[$index] * (10 - $index);
            }

            $firstDigit = $sum % 11 < 2 ? 0 : 11 - ($sum % 11);
            $digits .= (string) $firstDigit;

            $sum = 0;
            for ($index = 0; $index < 10; $index++) {
                $sum += (int) $digits[$index] * (11 - $index);
            }

            $secondDigit = $sum % 11 < 2 ? 0 : 11 - ($sum % 11);
            $cpf = $digits.(string) $secondDigit;
        } while (! BrazilianDocuments::isValidCpf($cpf));

        return $cpf;
    }
}
