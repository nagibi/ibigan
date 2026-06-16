<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HistoricoEquipamento extends Model
{
    public const UPDATED_AT = null;

    protected $table = 'historico_equipamentos';

    protected $fillable = [
        'equipamento_id',
        'evento',
        'dados',
        'status_resultante',
        'registrado_por',
        'observacao',
    ];

    protected function casts(): array
    {
        return [
            'dados' => 'array',
            'created_at' => 'datetime',
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
