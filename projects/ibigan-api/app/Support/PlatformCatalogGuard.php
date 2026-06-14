<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\ValidationException;

final class PlatformCatalogGuard
{
    public static function ensureCanEdit(Model $model): void
    {
        if ((bool) ($model->is_system ?? false)) {
            throw ValidationException::withMessages([
                'catalog' => ['Itens de plataforma só podem ser editados no painel central. Duplique para personalizar.'],
            ]);
        }
    }

    public static function ensureCanDelete(Model $model): void
    {
        if ((bool) ($model->is_system ?? false)) {
            throw ValidationException::withMessages([
                'catalog' => ['Itens de plataforma não podem ser removidos. Duplique para personalizar.'],
            ]);
        }
    }

    public static function ensureCanChangeSlug(Model $model, ?string $newSlug): void
    {
        if (! (bool) ($model->is_system ?? false)) {
            return;
        }

        if ($newSlug !== null && $newSlug !== $model->slug) {
            throw ValidationException::withMessages([
                'slug' => ['O slug de templates de plataforma não pode ser alterado.'],
            ]);
        }
    }

    public static function ensureCanChangePlatformKey(Model $model, ?string $newKey): void
    {
        if (! (bool) ($model->is_system ?? false)) {
            return;
        }

        if ($newKey !== null && $newKey !== $model->platform_key) {
            throw ValidationException::withMessages([
                'platform_key' => ['A chave de plataforma de relatórios do sistema não pode ser alterada.'],
            ]);
        }
    }
}
