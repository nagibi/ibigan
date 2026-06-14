<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>{{ $config->get('ui.title') ?? config('app.name').' API' }}</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.18.3/swagger-ui.css">
    <style>
        html {
            box-sizing: border-box;
            overflow-y: scroll;
        }

        *,
        *::before,
        *::after {
            box-sizing: inherit;
        }

        body {
            margin: 0;
            background: #fafafa;
        }

        .swagger-ui .topbar {
            display: none;
        }

        .swagger-ui .info {
            margin: 24px 0;
        }

        .swagger-ui .info .title {
            font-size: 2rem;
            font-weight: 700;
        }

        .swagger-ui .info .description p {
            line-height: 1.6;
        }

        .swagger-ui .scheme-container {
            box-shadow: none;
            padding: 16px 0;
            background: transparent;
        }

        .swagger-ui .opblock-tag {
            font-size: 1.15rem;
            border-bottom: 1px solid rgba(59, 65, 81, 0.12);
        }

        .swagger-ui .opblock {
            border-radius: 6px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }
    </style>
</head>
<body>
<div id="swagger-ui"></div>

<script src="https://unpkg.com/swagger-ui-dist@5.18.3/swagger-ui-bundle.js" crossorigin></script>
<script src="https://unpkg.com/swagger-ui-dist@5.18.3/swagger-ui-standalone-preset.js" crossorigin></script>
<script>
    const CSRF_TOKEN_COOKIE_KEY = 'XSRF-TOKEN';
    const CSRF_TOKEN_HEADER_KEY = 'X-XSRF-TOKEN';

    const getCookieValue = (key) => {
        const cookie = document.cookie.split(';').find((item) => item.trim().startsWith(key));

        return cookie?.split('=')[1];
    };

    const rendererOptions = @json($config->renderer()->all());

    window.onload = () => {
        window.ui = SwaggerUIBundle({
            spec: @json($spec),
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset,
            ],
            plugins: [
                SwaggerUIBundle.plugins.DownloadUrl,
            ],
            layout: 'StandaloneLayout',
            persistAuthorization: rendererOptions.persistAuthorization ?? true,
            docExpansion: rendererOptions.docExpansion ?? 'list',
            defaultModelsExpandDepth: rendererOptions.defaultModelsExpandDepth ?? 1,
            defaultModelExpandDepth: rendererOptions.defaultModelExpandDepth ?? 1,
            displayRequestDuration: rendererOptions.displayRequestDuration ?? true,
            filter: rendererOptions.filter ?? true,
            tryItOutEnabled: rendererOptions.tryItOutEnabled ?? true,
            syntaxHighlight: {
                activate: true,
                theme: 'agate',
            },
            requestInterceptor: (request) => {
                const csrfToken = getCookieValue(CSRF_TOKEN_COOKIE_KEY);

                if (csrfToken) {
                    request.headers[CSRF_TOKEN_HEADER_KEY] = decodeURIComponent(csrfToken);
                }

                return request;
            },
        });
    };
</script>
</body>
</html>
