<?php

declare(strict_types=1);

return [
    'central_hosts' => array_values(array_filter([
        '127.0.0.1',
        'localhost',
        env('CENTRAL_DOMAIN'),
    ])),

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
