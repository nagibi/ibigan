<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GrupoEquipamento extends Model
{
    use HasFactory;
    protected $table = 'grupos_equipamento';

    protected $fillable = [
        'nome',
    ];

    public function tipos(): HasMany
    {
        return $this->hasMany(TipoEquipamento::class, 'grupo_id');
    }
}
