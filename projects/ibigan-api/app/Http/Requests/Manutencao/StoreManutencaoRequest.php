<?php

declare(strict_types=1);

namespace App\Http\Requests\Manutencao;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreManutencaoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'responsabilidade' => ['required', 'string', Rule::in(['fortes', 'equipamento'])],
            'motivo' => ['required', 'string', 'max:500'],
            'responsavel_manutencao' => ['required', 'string', 'max:150'],
            'observacoes_tecnicas' => ['nullable', 'string', 'max:1000'],
            'data_entrada' => ['required', 'date', 'before_or_equal:today'],
            'foto' => ['nullable', 'image', 'max:5120'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'responsabilidade.required' => 'Informe quem é responsável pela manutenção.',
            'responsabilidade.in' => 'Responsabilidade deve ser "fortes" ou "equipamento".',
            'motivo.required' => 'Informe o motivo da manutenção.',
            'responsavel_manutencao.required' => 'Informe o responsável pela manutenção.',
            'data_entrada.before_or_equal' => 'A data de entrada não pode ser no futuro.',
        ];
    }
}
