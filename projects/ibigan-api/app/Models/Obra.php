<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Obra extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'codigo',
        'nome',
        'endereco',
        'responsavel',
        'responsavel_user_id',
        'is_ativa',
    ];

    protected function casts(): array
    {
        return [
            'is_ativa' => 'boolean',
        ];
    }

    public function equipamentos(): HasMany
    {
        return $this->hasMany(Equipamento::class);
    }

    public function responsavelUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responsavel_user_id');
    }

    public function emprestimos(): HasMany
    {
        return $this->hasMany(Emprestimo::class);
    }
}
