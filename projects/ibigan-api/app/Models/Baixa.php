<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Baixa extends Model
{
    use HasFactory;

    protected $table = 'baixas';

    protected $fillable = [
        'equipamento_id',
        'tipo',
        'data_baixa',
        'motivo',
        'foto_path',
        'responsavel_perda',
        'valor_reposicao',
        'registrado_por',
        'observacoes',
    ];

    protected function casts(): array
    {
        return [
            'data_baixa' => 'date',
            'valor_reposicao' => 'decimal:2',
        ];
    }

    public function equipamento(): BelongsTo
    {
        return $this->belongsTo(Equipamento::class);
    }

    public function registradoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registrado_por');
    }
}
