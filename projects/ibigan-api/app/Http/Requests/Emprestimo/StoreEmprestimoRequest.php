<?php

declare(strict_types=1);

namespace App\Http\Requests\Emprestimo;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreEmprestimoRequest extends FormRequest
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
            'obra_id' => ['required', 'integer', Rule::exists('obras', 'id')],
            'colaborador_nome' => ['required', 'string', 'max:150'],
            'colaborador_matricula' => ['required', 'string', 'max:30'],
            'colaborador_whatsapp' => ['nullable', 'string', 'max:20'],
            'encarregado_nome' => ['required', 'string', 'max:150'],
            'data_retirada' => ['required', 'date', 'before_or_equal:today'],
            'prazo_dias' => ['sometimes', 'integer', 'min:1', 'max:365'],
            'observacoes' => ['nullable', 'string', 'max:1000'],
            'foto_cracha' => ['nullable', 'image', 'max:5120'],
            'foto_equipamento_retirada' => ['nullable', 'image', 'max:5120'],
            'foto_assinatura' => ['nullable', 'image', 'max:5120'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'colaborador_nome.required' => 'Informe o nome do colaborador.',
            'colaborador_matricula.required' => 'Informe a matrícula do colaborador.',
            'encarregado_nome.required' => 'Informe o encarregado/líder responsável.',
            'data_retirada.before_or_equal' => 'A data de retirada não pode ser no futuro.',
        ];
    }
}
