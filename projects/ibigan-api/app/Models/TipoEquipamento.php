<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TipoEquipamento extends Model
{
    use HasFactory;
    protected $table = 'tipos_equipamento';

    protected $fillable = [
        'grupo_id',
        'nome',
        'is_ativo',
    ];

    protected function casts(): array
    {
        return [
            'is_ativo' => 'boolean',
        ];
    }

    public function grupo(): BelongsTo
    {
        return $this->belongsTo(GrupoEquipamento::class, 'grupo_id');
    }

    public function equipamentos(): HasMany
    {
        return $this->hasMany(Equipamento::class, 'tipo_id');
    }
}
