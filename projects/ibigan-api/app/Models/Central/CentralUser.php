<?php

declare(strict_types=1);

namespace App\Models\Central;

use App\Enums\TwoFactorMethod;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Stancl\Tenancy\Database\Concerns\CentralConnection;

final class CentralUser extends Authenticatable implements HasMedia
{
    use CentralConnection;
    use HasApiTokens;
    use InteractsWithMedia;
    use Notifiable;

    protected $table = 'central_users';

    protected $fillable = [
        'name',
        'email',
        'cpf',
        'password',
        'phone',
        'birth_date',
        'gender',
        'bio',
        'is_super_admin',
        'is_active',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_confirmed_at',
        'two_factor_method',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'is_super_admin' => 'boolean',
            'is_active' => 'boolean',
            'two_factor_confirmed_at' => 'datetime',
            'two_factor_method' => TwoFactorMethod::class,
            'birth_date' => 'date',
        ];
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('avatar')
            ->singleFile()
            ->useDisk('public')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);
    }

    public function avatarUrl(): ?string
    {
        $media = $this->getFirstMedia('avatar');

        if ($media === null) {
            return null;
        }

        $url = $media->getUrl();
        $version = $media->updated_at?->getTimestamp() ?? $media->id;

        return str_contains($url, '?')
            ? $url.'&v='.$version
            : $url.'?v='.$version;
    }

    public function tenantUsers(): HasMany
    {
        return $this->hasMany(TenantUser::class, 'user_id');
    }
}
