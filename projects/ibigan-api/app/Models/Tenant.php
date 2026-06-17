<?php

declare(strict_types=1);

namespace App\Models;

use App\Models\Central\TenantUser;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;
use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;

class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase;
    use HasDomains;

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public static function getCustomColumns(): array
    {
        return ['id', 'slug', 'name', 'cnpj', 'timezone', 'locale', 'is_active'];
    }

    public function tenantUsers(): HasMany
    {
        return $this->hasMany(TenantUser::class);
    }

    public static function findByIdOrSlug(string $idOrSlug): ?self
    {
        return static::query()
            ->whereKey($idOrSlug)
            ->orWhere('slug', $idOrSlug)
            ->first();
    }

    // Configurações de segurança (armazenadas em data JSON via VirtualColumn)

    public function getRegistrationModeAttribute(): string
    {
        return $this->attributes['registration_mode'] ?? 'invite_only';
    }

    public function setRegistrationModeAttribute(string $value): void
    {
        $this->attributes['registration_mode'] = $value;
    }

    public function getRequireEmailVerificationAttribute(): bool
    {
        return (bool) ($this->attributes['require_email_verification'] ?? false);
    }

    public function setRequireEmailVerificationAttribute(bool $value): void
    {
        $this->attributes['require_email_verification'] = $value;
    }

    public function getRequireAdminApprovalAttribute(): bool
    {
        return (bool) ($this->attributes['require_admin_approval'] ?? false);
    }

    public function setRequireAdminApprovalAttribute(bool $value): void
    {
        $this->attributes['require_admin_approval'] = $value;
    }

    public function getRequire2faAttribute(): bool
    {
        return (bool) ($this->attributes['require_2fa'] ?? false);
    }

    public function setRequire2faAttribute(bool $value): void
    {
        $this->attributes['require_2fa'] = $value;
    }

    /**
     * @return array<int, string>
     */
    public function getAllowedEmailDomainsAttribute(): array
    {
        $domains = $this->attributes['allowed_email_domains'] ?? [];

        return is_array($domains) ? $domains : [];
    }

    /**
     * @param  array<int, string>  $value
     */
    public function setAllowedEmailDomainsAttribute(array $value): void
    {
        $this->attributes['allowed_email_domains'] = $value;
    }
}
