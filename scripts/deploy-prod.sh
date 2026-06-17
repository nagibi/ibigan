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

echo "==> Nginx production.conf (${CENTRAL_DOMAIN})"
export CENTRAL_DOMAIN
envsubst '${CENTRAL_DOMAIN}' \
  < "$ROOT_DIR/docker/nginx/conf.d/production.conf.template" \
  > "$ROOT_DIR/docker/nginx/conf.d/production.conf"

echo "==> Permissões Laravel"
chown -R 1000:1000 "$ROOT_DIR/projects/ibigan-api"
chmod -R 775 "$ROOT_DIR/projects/ibigan-api/bootstrap/cache"
chmod -R 775 "$ROOT_DIR/projects/ibigan-api/storage"

echo "==> Composer (produção)"
"${DC[@]}" run --rm app composer install --no-dev --optimize-autoloader --no-interaction

echo "==> Containers"
"${DC[@]}" up -d --build --remove-orphans

echo "==> Aguardando serviços..."
sleep 15

echo "==> Nginx (validar e recarregar config)"
"${DC[@]}" exec -T nginx nginx -t
"${DC[@]}" exec -T nginx nginx -s reload

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
