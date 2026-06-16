<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Support\Facades\Storage;

final class StorageUrl
{
    public static function equipamentoFoto(?string $path, string $patrimonio): string
    {
        $url = self::public($path);

        if ($url !== null) {
            return $url;
        }

        return 'https://picsum.photos/96/96?random='.((crc32($patrimonio) % 1000) + 1);
    }

    public static function public(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        if (preg_match('#^https://picsum\.photos\?random=(\d+)$#', $path, $matches)) {
            return 'https://picsum.photos/96/96?random='.$matches[1];
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return self::normalizeTenancyAssetUrl($path);
        }

        return Storage::disk('public')->url($path);
    }

    private static function normalizeTenancyAssetUrl(string $url): string
    {
        if (! preg_match('#/tenancy/assets/storage/(.+)$#', $url, $matches)) {
            return $url;
        }

        if (! tenancy()->initialized) {
            return $url;
        }

        $tenantKey = tenant()->getTenantKey();

        return rtrim((string) config('app.url'), '/')
            .'/storage/tenant'.$tenantKey.'/app/public/'.$matches[1];
    }
}
