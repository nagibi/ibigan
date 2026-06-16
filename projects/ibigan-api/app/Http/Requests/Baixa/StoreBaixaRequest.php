<?php

declare(strict_types=1);

namespace App\Http\Requests\Baixa;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreBaixaRequest extends FormRequest
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
            'tipo' => ['required', 'string', Rule::in(['devolucao', 'perda'])],
            'data_baixa' => ['required', 'date', 'before_or_equal:today'],
            'motivo' => ['required_if:tipo,perda', 'nullable', 'string', 'max:500'],
            'foto' => ['nullable', 'image', 'max:5120'],
            'responsavel_perda' => ['required_if:tipo,perda', 'nullable', 'string', 'max:150'],
            'valor_reposicao' => ['nullable', 'numeric', 'min:0'],
            'observacoes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'tipo.in' => 'Tipo deve ser "devolucao" ou "perda".',
            'motivo.required_if' => 'Informe o motivo da perda.',
            'responsavel_perda.required_if' => 'Informe o responsável pela perda.',
        ];
    }
}
