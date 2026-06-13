<?php

declare(strict_types=1);

$appUrl = rtrim((string) config('app.url'), '/');

return [
    'api_docs_url' => env('DEV_TOOLS_API_DOCS_URL', "{$appUrl}/docs/api"),
    'horizon_url' => env('DEV_TOOLS_HORIZON_URL', "{$appUrl}/horizon"),
    'phpmyadmin_url' => env('DEV_TOOLS_PHPMYADMIN_URL', 'http://localhost:8080'),
    'mailpit_url' => env('DEV_TOOLS_MAILPIT_URL', 'http://localhost:8025'),
];
