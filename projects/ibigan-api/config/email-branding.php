<?php

declare(strict_types=1);

$appUrl = rtrim((string) env('APP_URL', 'http://localhost'), '/');
$frontendUrl = rtrim((string) env('FRONTEND_URL', $appUrl), '/');

return [
    'brand_name' => env('EMAIL_BRAND_NAME', 'Ibigan'),
    'accent_color' => env('EMAIL_ACCENT_COLOR', '#F8285A'),
    'logo_url' => env('EMAIL_LOGO_URL', "{$appUrl}/images/email/metronic-logo.svg"),
    'logo_fallback_url' => env('EMAIL_LOGO_FALLBACK_URL', "{$frontendUrl}/media/app/default-logo.svg"),
    'background_image_url' => env('EMAIL_BG_URL', "{$appUrl}/images/email/bg-email.png"),
    'content_width' => 680,
];
