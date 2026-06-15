<?php

declare(strict_types=1);

$centralHosts = [
    '127.0.0.1',
    'localhost',
    env('CENTRAL_DOMAIN'),
    parse_url((string) env('APP_URL', ''), PHP_URL_HOST) ?: null,
    parse_url((string) env('FRONTEND_URL', ''), PHP_URL_HOST) ?: null,
];

return [
    'central_hosts' => array_values(array_unique(array_filter(
        $centralHosts,
        static fn (mixed $host): bool => is_string($host) && $host !== '',
    ))),

    /**
     * Sufixos de host para resolver tenant por subdomínio em desenvolvimento.
     * Ex.: techsolutions.localhost → slug techsolutions
     */
    'dev_subdomain_suffixes' => array_values(array_filter(explode(',', (string) env(
        'TENANT_DEV_DOMAIN_SUFFIXES',
        'localhost,local,test',
    )))),

  /**
     * Query string usada no host central para selecionar o tenant por slug.
     */
    'query_param' => env('TENANT_CONTEXT_QUERY_PARAM', 'tenant'),
];
