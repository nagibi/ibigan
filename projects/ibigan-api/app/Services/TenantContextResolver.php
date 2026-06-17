<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Http\Request;
use Stancl\Tenancy\Database\Models\Domain;

final class TenantContextResolver
{
    public const SOURCE_DOMAIN = 'domain';

    public const SOURCE_SUBDOMAIN = 'subdomain';

    public const SOURCE_QUERY = 'query';

    public const SOURCE_REQUEST = 'request';

  /**
     * @return array{tenant: ?Tenant, source: ?string}
     */
    public function resolveWithSource(Request $request): array
    {
        if ($request->filled('tenant_id')) {
            $tenant = Tenant::query()->find($request->input('tenant_id'));

            return [
                'tenant' => $tenant,
                'source' => $tenant ? self::SOURCE_REQUEST : null,
            ];
        }

        $host = $this->normalizeHost($request);

        $domainRecord = Domain::query()->where('domain', $host)->first();
        if ($domainRecord !== null) {
            $tenant = Tenant::query()->find($domainRecord->tenant_id);

            return [
                'tenant' => $tenant,
                'source' => $tenant ? self::SOURCE_DOMAIN : null,
            ];
        }

        $subdomainTenant = $this->resolveByDevSubdomain($host);
        if ($subdomainTenant !== null) {
            return [
                'tenant' => $subdomainTenant,
                'source' => self::SOURCE_SUBDOMAIN,
            ];
        }

        $queryParam = (string) config('tenant-context.query_param', 'tenant');
        $slug = $request->query($queryParam);
        $hostSlug = $this->resolveSlugFromHostSuffixes($host);

        if (is_string($slug) && $slug !== '') {
            $allowQuery = $this->isCentralHost($host)
                || ($hostSlug !== null && $hostSlug === $slug);

            if ($allowQuery) {
                $tenant = Tenant::query()->where('slug', $slug)->first();

                return [
                    'tenant' => $tenant,
                    'source' => $tenant ? self::SOURCE_QUERY : null,
                ];
            }
        }

        return [
            'tenant' => null,
            'source' => null,
        ];
    }

    public function resolveTenant(Request $request): ?Tenant
    {
        return $this->resolveWithSource($request)['tenant'];
    }

    public function resolveTenantId(Request $request): ?string
    {
        $tenant = $this->resolveTenant($request);

        return $tenant ? (string) $tenant->id : null;
    }

    public function normalizeHost(Request $request): string
    {
        $host = $request->header('X-Forwarded-Host', $request->getHost());

        if (! is_string($host) || $host === '') {
            return '';
        }

        $host = strtolower(trim(explode(',', $host)[0]));
        $host = (string) preg_replace('/:\d+$/', '', $host);

        return $host;
    }

    public function isCentralHost(string $host): bool
    {
        if ($host === '') {
            return true;
        }

        $centralHosts = config('tenant-context.central_hosts', []);

        if (in_array($host, $centralHosts, true)) {
            return true;
        }

        if (str_starts_with($host, 'www.')) {
            return in_array(substr($host, 4), $centralHosts, true);
        }

        return false;
    }

    private function resolveByDevSubdomain(string $host): ?Tenant
    {
        $slug = $this->resolveSlugFromHostSuffixes($host);

        if ($slug === null) {
            return null;
        }

        return Tenant::query()->where('slug', $slug)->first();
    }

    private function resolveSlugFromHostSuffixes(string $host): ?string
    {
        $suffixes = config('tenant-context.dev_subdomain_suffixes', []);

        foreach ($suffixes as $suffix) {
            $suffix = strtolower(trim((string) $suffix));
            if ($suffix === '') {
                continue;
            }

            $needle = '.'.$suffix;
            if (! str_ends_with($host, $needle)) {
                continue;
            }

            $slug = substr($host, 0, -strlen($needle));
            if ($slug === '' || str_contains($slug, '.')) {
                continue;
            }

            return $slug;
        }

        return null;
    }
}
