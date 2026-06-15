<?php

declare(strict_types=1);

$appUrl = rtrim((string) env('APP_URL', 'http://localhost'), '/');

return [
    'brand_name' => env('EMAIL_BRAND_NAME', 'Ibigan'),
    'accent_color' => env('EMAIL_ACCENT_COLOR', '#f9386a'),
    'logo_url' => env('EMAIL_LOGO_URL', "{$appUrl}/images/email/ibigan-logo.svg"),
    'background_image_url' => env('EMAIL_BG_URL', "{$appUrl}/images/email/bg-email.png"),
    'content_width' => 680,
];
