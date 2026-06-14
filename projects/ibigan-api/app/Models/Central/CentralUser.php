<?php

declare(strict_types=1);

namespace App\Models\Central;

use App\Enums\TwoFactorMethod;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Stancl\Tenancy\Database\Concerns\CentralConnection;

final class CentralUser extends Authenticatable
{
    use CentralConnection;
    use HasApiTokens;
    use Notifiable;

    protected $table = 'central_users';

    protected $fillable = [
        'name',
        'email',
        'password',
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
        ];
    }

    public function tenantUsers(): HasMany
    {
        return $this->hasMany(TenantUser::class, 'user_id');
    }
}
