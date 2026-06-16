<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmprestimoRenovacao extends Model
{
    protected $table = 'emprestimo_renovacoes';

    protected $fillable = [
        'emprestimo_id',
        'data_renovacao',
        'prazo_adicional_dias',
        'autorizado_por',
        'observacao',
    ];

    protected function casts(): array
    {
        return [
            'data_renovacao' => 'date',
            'prazo_adicional_dias' => 'integer',
        ];
    }

    public function emprestimo(): BelongsTo
    {
        return $this->belongsTo(Emprestimo::class);
    }

    public function autorizadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'autorizado_por');
    }
}
