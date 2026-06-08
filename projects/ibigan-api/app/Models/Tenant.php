<?php

declare(strict_types=1);

namespace App\Models;

use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;
use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;

class Tenant extends BaseTenant implements HasMedia, TenantWithDatabase
{
    use HasDatabase;
    use HasDomains;
    use InteractsWithMedia;

    public static function getCustomColumns(): array
    {
        return ['id', 'slug', 'name', 'timezone', 'locale'];
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('logo')->singleFile();
    }
}
