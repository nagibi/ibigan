<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Validation\ValidationException;

final class TenantSecurityService
{
    /**
     * Verifica se o email pode se registrar/entrar neste tenant.
     */
    public function validateEmailAccess(Tenant $tenant, string $email): void
    {
        // Verificar domínios permitidos
        $allowedDomains = $tenant->allowed_email_domains;
        if (! empty($allowedDomains)) {
            $emailDomain = '@'.substr(strrchr($email, '@'), 1);
            $allowed = collect($allowedDomains)->contains(
                fn (string $domain) => str_ends_with($email, ltrim($domain, '@'))
            );
            if (! $allowed) {
                throw ValidationException::withMessages([
                    'email' => "E-mails do domínio {$emailDomain} não são permitidos nesta organização.",
                ]);
            }
        }
    }

    /**
     * Verifica se o tenant aceita novos registros.
     */
    public function validateRegistrationMode(Tenant $tenant): void
    {
        match ($tenant->registration_mode) {
            'closed' => throw ValidationException::withMessages([
                'email' => 'Esta organização não está aceitando novos cadastros.',
            ]),
            'invite_only' => throw ValidationException::withMessages([
                'email' => 'Esta organização aceita apenas usuários convidados.',
            ]),
            default => null, // 'open' — permite
        };
    }

    /**
     * Verifica se o usuário precisa de aprovação admin.
     */
    public function requiresAdminApproval(Tenant $tenant): bool
    {
        return $tenant->require_admin_approval;
    }

    /**
     * Verifica se 2FA é obrigatório e o usuário não tem.
     */
    public function requires2FA(Tenant $tenant, mixed $user): bool
    {
        if (! $tenant->require_2fa) {
            return false;
        }

        return ! $user->two_factor_confirmed_at;
    }
}
