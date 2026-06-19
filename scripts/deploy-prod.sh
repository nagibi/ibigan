#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${ENV_FILE:-/opt/ibigan/.env}"
LARAVEL_ENV="$ROOT_DIR/projects/ibigan-api/.env"
DC=(docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE")

if [[ ! -f "$ENV_FILE" ]]; then
  if [[ -f "$ROOT_DIR/.env.production.example" ]]; then
    echo "==> Criar ${ENV_FILE} a partir de .env.production.example"
    cp "$ROOT_DIR/.env.production.example" "$ENV_FILE"
  else
    echo "Arquivo de ambiente não encontrado: $ENV_FILE" >&2
    exit 1
  fi
fi

if [[ ! -f "$LARAVEL_ENV" ]]; then
  echo "ERRO: $LARAVEL_ENV não encontrado" >&2
  echo "      Crie um arquivo real (não symlink) com APP_KEY, DB_*, Reverb, mail, etc." >&2
  exit 1
fi

if [[ -L "$LARAVEL_ENV" ]]; then
  echo "ERRO: $LARAVEL_ENV é symlink — o volume Docker não resolve links fora de /var/www" >&2
  echo "      rm $LARAVEL_ENV && cp .env.example $LARAVEL_ENV && preencha APP_KEY e credenciais" >&2
  exit 1
fi

require_env() {
  local file="$1"
  local key="$2"
  local value
  value="$(grep -E "^${key}=" "$file" | tail -n1 | cut -d= -f2- | tr -d '\r' || true)"
  if [[ -z "$value" ]]; then
    echo "ERRO: defina ${key} em ${file}" >&2
    echo "      Modelo: ${ROOT_DIR}/.env.production.example (Docker) ou projects/ibigan-api/.env.production.example (Laravel)" >&2
    echo "      No servidor: nano ${ENV_FILE}  e  nano ${LARAVEL_ENV}" >&2
    exit 1
  fi
}

env_value() {
  grep -E "^${2}=" "$1" | tail -n1 | cut -d= -f2- | tr -d '\r' | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//" || true
}

set_env_var() {
  local file="$1"
  local key="$2"
  local value="$3"

  if grep -qE "^${key}=" "$file"; then
    grep -vE "^${key}=" "$file" > "${file}.tmp"
    mv "${file}.tmp" "$file"
  fi

  printf '%s=%s\n' "$key" "$value" >> "$file"
}

ensure_docker_env_from_laravel() {
  local docker_file="$1"
  local laravel_file="$2"

  local db_user db_pass db_name app_url central
  db_user="$(env_value "$laravel_file" DB_USERNAME)"
  db_pass="$(env_value "$laravel_file" DB_PASSWORD)"
  db_name="$(env_value "$laravel_file" DB_DATABASE)"
  app_url="$(env_value "$laravel_file" APP_URL)"
  central="$(env_value "$laravel_file" CENTRAL_DOMAIN)"

  if [[ -z "$(env_value "$docker_file" MYSQL_USER)" && -n "$db_user" ]]; then
    echo "==> MYSQL_USER ausente em ${docker_file} — usando DB_USERNAME do Laravel"
    set_env_var "$docker_file" MYSQL_USER "$db_user"
  fi

  if [[ -z "$(env_value "$docker_file" MYSQL_PASSWORD)" && -n "$db_pass" ]]; then
    echo "==> MYSQL_PASSWORD ausente em ${docker_file} — usando DB_PASSWORD do Laravel"
    set_env_var "$docker_file" MYSQL_PASSWORD "$db_pass"
  fi

  if [[ -z "$(env_value "$docker_file" MYSQL_DATABASE)" && -n "$db_name" ]]; then
    echo "==> MYSQL_DATABASE ausente em ${docker_file} — usando DB_DATABASE do Laravel"
    set_env_var "$docker_file" MYSQL_DATABASE "$db_name"
  fi

  if [[ -z "$(env_value "$docker_file" CENTRAL_DOMAIN)" ]]; then
    if [[ -n "$central" ]]; then
      echo "==> CENTRAL_DOMAIN ausente em ${docker_file} — usando valor do Laravel"
      set_env_var "$docker_file" CENTRAL_DOMAIN "$central"
    elif [[ -n "$app_url" ]]; then
      central="${app_url#https://}"
      central="${central#http://}"
      central="${central%%/*}"
      echo "==> CENTRAL_DOMAIN ausente em ${docker_file} — derivado de APP_URL (${central})"
      set_env_var "$docker_file" CENTRAL_DOMAIN "$central"
    fi
  fi

  local mysql_pass root_pass
  mysql_pass="$(env_value "$docker_file" MYSQL_PASSWORD)"
  root_pass="$(env_value "$docker_file" MYSQL_ROOT_PASSWORD)"

  if [[ -z "$root_pass" ]]; then
    if [[ -n "$mysql_pass" ]]; then
      echo "==> MYSQL_ROOT_PASSWORD ausente — usando MYSQL_PASSWORD (defina senhas distintas se preferir)"
      set_env_var "$docker_file" MYSQL_ROOT_PASSWORD "$mysql_pass"
    elif [[ -n "$db_pass" ]]; then
      echo "==> MYSQL_ROOT_PASSWORD ausente — usando DB_PASSWORD do Laravel"
      set_env_var "$docker_file" MYSQL_ROOT_PASSWORD "$db_pass"
      if [[ -z "$(env_value "$docker_file" MYSQL_PASSWORD)" ]]; then
        set_env_var "$docker_file" MYSQL_PASSWORD "$db_pass"
      fi
    fi
  fi
}

echo "==> Sincronizar .env Docker a partir do Laravel (se necessário)"
ensure_docker_env_from_laravel "$ENV_FILE" "$LARAVEL_ENV"

echo "==> Validar .env raiz (Docker)"
for key in MYSQL_ROOT_PASSWORD MYSQL_PASSWORD MYSQL_USER MYSQL_DATABASE CENTRAL_DOMAIN; do
  require_env "$ENV_FILE" "$key"
done

echo "==> Validar .env Laravel"
for key in APP_KEY DB_PASSWORD DB_USERNAME DB_DATABASE; do
  require_env "$LARAVEL_ENV" "$key"
done

db_password="$(env_value "$LARAVEL_ENV" DB_PASSWORD)"
mysql_password="$(env_value "$ENV_FILE" MYSQL_PASSWORD)"
if [[ "$db_password" != "$mysql_password" ]]; then
  echo "ERRO: DB_PASSWORD ($LARAVEL_ENV) deve ser igual a MYSQL_PASSWORD ($ENV_FILE)" >&2
  exit 1
fi

db_username="$(env_value "$LARAVEL_ENV" DB_USERNAME)"
mysql_user="$(env_value "$ENV_FILE" MYSQL_USER)"
if [[ "$db_username" != "$mysql_user" ]]; then
  echo "ERRO: DB_USERNAME ($LARAVEL_ENV) deve ser igual a MYSQL_USER ($ENV_FILE)" >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$ENV_FILE"
set +a

CENTRAL_DOMAIN="${CENTRAL_DOMAIN#https://}"
CENTRAL_DOMAIN="${CENTRAL_DOMAIN#http://}"
CENTRAL_DOMAIN="${CENTRAL_DOMAIN%%/*}"

if [[ -z "$CENTRAL_DOMAIN" ]]; then
  echo "Defina CENTRAL_DOMAIN no $ENV_FILE" >&2
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
