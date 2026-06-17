#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${ENV_FILE:-/opt/ibigan/.env}"
DC=(docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE")

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Arquivo de ambiente não encontrado: $ENV_FILE" >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

CENTRAL_DOMAIN="${CENTRAL_DOMAIN:-${APP_URL#https://}}"
CENTRAL_DOMAIN="${CENTRAL_DOMAIN#http://}"
CENTRAL_DOMAIN="${CENTRAL_DOMAIN%%/*}"

if [[ -z "$CENTRAL_DOMAIN" ]]; then
  echo "Defina CENTRAL_DOMAIN ou APP_URL no $ENV_FILE" >&2
  exit 1
fi

if ! command -v envsubst >/dev/null 2>&1; then
  echo "Instale gettext-base no servidor (provê envsubst): apt install -y gettext-base" >&2
  exit 1
fi

USE_BEHIND_PROXY=false
if [[ "${NGINX_BEHIND_PROXY:-false}" == "true" || "${NGINX_BEHIND_PROXY:-}" == "1" ]]; then
  USE_BEHIND_PROXY=true
elif [[ "${NGINX_HTTP_BIND:-0.0.0.0}" == "127.0.0.1" ]]; then
  echo "==> NGINX_HTTP_BIND=127.0.0.1 — assumindo Caddy no host (HTTP interno)"
  USE_BEHIND_PROXY=true
fi

if [[ "$USE_BEHIND_PROXY" == "true" ]]; then
  echo "==> Nginx production.conf (behind Caddy, HTTP only)"
  cp "$ROOT_DIR/docker/nginx/conf.d/production.behind-proxy.conf.template" \
    "$ROOT_DIR/docker/nginx/conf.d/production.conf"
else
  echo "==> Nginx production.conf (${CENTRAL_DOMAIN}, TLS no nginx)"
  export CENTRAL_DOMAIN
  envsubst '${CENTRAL_DOMAIN}' \
    < "$ROOT_DIR/docker/nginx/conf.d/production.conf.template" \
    > "$ROOT_DIR/docker/nginx/conf.d/production.conf"
fi

echo "==> Frontend (SPA)"
SPA_DIST="$ROOT_DIR/projects/ibigan-web/dist"
SPA_INDEX="$SPA_DIST/index.html"
if [[ ! -f "$SPA_INDEX" ]]; then
  echo "ERRO: $SPA_INDEX não existe. Rode o build do frontend antes do deploy:" >&2
  echo "  cd projects/ibigan-web && npm ci && npm run build" >&2
  exit 1
fi
chmod -R a+rX "$SPA_DIST"

if ! grep -q 'ibigan-web/dist:/var/www/spa' "$ROOT_DIR/docker-compose.prod.yml"; then
  echo "ERRO: docker-compose.prod.yml sem volume ./projects/ibigan-web/dist:/var/www/spa" >&2
  exit 1
fi

echo "==> Permissões Laravel"
chown -R 1000:1000 "$ROOT_DIR/projects/ibigan-api"
chmod -R 775 "$ROOT_DIR/projects/ibigan-api/bootstrap/cache"
chmod -R 775 "$ROOT_DIR/projects/ibigan-api/storage"

echo "==> Composer (produção)"
"${DC[@]}" run --rm app composer install --no-dev --optimize-autoloader --no-interaction

echo "==> Containers"
"${DC[@]}" up -d --build --remove-orphans

echo "==> Containers"
"${DC[@]}" up -d --build --remove-orphans

echo "==> Nginx (recriar — monta SPA + production.conf)"
"${DC[@]}" up -d --force-recreate nginx

echo "==> Aguardando serviços..."
sleep 5

echo "==> Nginx (validar config)"
"${DC[@]}" exec -T nginx nginx -t

NGINX_TEST_BIND="${NGINX_HTTP_BIND:-127.0.0.1}"
NGINX_TEST_PORT="${NGINX_HTTP_PORT:-80}"
echo "==> Smoke test nginx (http://${NGINX_TEST_BIND}:${NGINX_TEST_PORT})"
if ! "${DC[@]}" exec -T nginx test -f /var/www/spa/index.html; then
  echo "ERRO: /var/www/spa/index.html não existe no container nginx." >&2
  echo "      Volumes montados:" >&2
  docker inspect "$("${DC[@]}" ps -q nginx)" --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}' >&2 || true
  exit 1
fi
if ! curl -sf -o /dev/null -H "Host: ${CENTRAL_DOMAIN}" "http://${NGINX_TEST_BIND}:${NGINX_TEST_PORT}/"; then
  echo "ERRO: nginx não responde em http://${NGINX_TEST_BIND}:${NGINX_TEST_PORT}/" >&2
  "${DC[@]}" logs --tail 30 nginx || true
  exit 1
fi

if [[ "$USE_BEHIND_PROXY" == "true" ]]; then
  echo "==> Lembrete Caddy (/etc/caddy/Caddyfile):"
  echo "    ${CENTRAL_DOMAIN} { reverse_proxy http://127.0.0.1:${NGINX_TEST_PORT} { header_up Host {host}; header_up X-Forwarded-Proto https } }"
  echo "    Depois: systemctl reload caddy"
fi

echo "==> Migrations e caches Laravel"
"${DC[@]}" exec -T app php artisan migrate --force
"${DC[@]}" exec -T app php artisan tenants:migrate --force
"${DC[@]}" exec -T app php artisan storage:link --force || true
"${DC[@]}" exec -T app php artisan optimize:clear
"${DC[@]}" exec -T app php artisan config:cache
"${DC[@]}" exec -T app php artisan route:cache
"${DC[@]}" exec -T app php artisan view:cache

echo "==> Horizon, Scheduler e Reverb"
"${DC[@]}" exec -T app php artisan horizon:terminate || true
"${DC[@]}" restart horizon scheduler reverb

echo "Deploy concluído com sucesso."
