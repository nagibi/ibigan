<?php

declare(strict_types=1);

namespace App\Http\Requests\Equipamento;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreEquipamentoRequest extends FormRequest
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
        $equipamentoId = $this->route('equipamento')?->id;

        return [
            'patrimonio' => [
                $equipamentoId ? 'sometimes' : 'required',
                'string',
                'max:50',
                Rule::unique('equipamentos', 'patrimonio')->ignore($equipamentoId),
            ],
            'tipo_id' => [
                $equipamentoId ? 'sometimes' : 'required',
                'integer',
                Rule::exists('tipos_equipamento', 'id'),
            ],
            'fornecedor_id' => [
                $equipamentoId ? 'sometimes' : 'required',
                'integer',
                Rule::exists('fornecedores', 'id'),
            ],
            'obra_id' => [
                $equipamentoId ? 'sometimes' : 'required',
                'integer',
                Rule::exists('obras', 'id'),
            ],
            'valor_mensal' => [
                $equipamentoId ? 'sometimes' : 'required',
                'numeric',
                'min:0',
            ],
            'data_entrada' => [
                $equipamentoId ? 'sometimes' : 'required',
                'date',
            ],
            'is_critico' => ['sometimes', 'boolean'],
            'foto' => ['nullable', 'image', 'max:5120'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'patrimonio.unique' => 'Já existe um equipamento com este número de patrimônio.',
            'tipo_id.exists' => 'Tipo de equipamento inválido.',
            'fornecedor_id.exists' => 'Fornecedor inválido.',
            'obra_id.exists' => 'Obra inválida.',
            'valor_mensal.min' => 'O valor mensal não pode ser negativo.',
            'foto.max' => 'A foto não pode ultrapassar 5MB.',
        ];
    }
}
