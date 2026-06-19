#!/usr/bin/env bash
# Diagnóstico rápido de 502/404 — ibigan atrás do Caddy no host.
set -uo pipefail

ENV_FILE="${ENV_FILE:-/opt/ibigan/.env}"
ROOT="${ROOT:-/opt/ibigan}"
STACK="${STACK_NAME:-ibigan}"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a && source "$ENV_FILE" && set +a
fi

HTTP_BIND="${NGINX_HTTP_BIND:-127.0.0.1}"
HTTP_PORT="${NGINX_HTTP_PORT:-18080}"
DOMAIN="${CENTRAL_DOMAIN:-${APP_URL#https://}}"
DOMAIN="${DOMAIN#http://}"
DOMAIN="${DOMAIN%%/*}"

echo "=== Stack: ${STACK} | domínio: ${DOMAIN} | backend: http://${HTTP_BIND}:${HTTP_PORT} ==="
echo

echo "--- SPA no host ---"
SPA_INDEX="${ROOT}/projects/ibigan-web/dist/index.html"
if [[ -f "$SPA_INDEX" ]]; then
  echo "OK: $SPA_INDEX existe ($(du -h "$SPA_INDEX" | awk '{print $1}'))"
else
  echo "ERRO: $SPA_INDEX ausente — causa típica de 404 na raiz"
  echo "      cd ${ROOT}/projects/ibigan-web && npm ci && npm run build"
fi
echo

echo "--- SPA no container nginx ---"
docker exec "${STACK}_nginx" test -f /var/www/spa/index.html 2>/dev/null \
  && echo "OK: /var/www/spa/index.html no container" \
  || echo "ERRO: /var/www/spa/index.html não montado no nginx (rode deploy-prod.sh)"
echo

echo "--- docker ps (nginx) ---"
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep -E "nginx|NAMES" || true
echo

echo "--- curl backend nginx ---"
curl -sS -o /dev/null -w "HTTP %{http_code}\n" -H "Host: ${DOMAIN}" "http://${HTTP_BIND}:${HTTP_PORT}/" || echo "FALHOU (connection refused / nginx down)"
echo

echo "--- logs nginx (últimas 15 linhas) ---"
docker logs "${STACK}_nginx" 2>&1 | tail -15
echo

echo "--- bloco ibigan no Caddyfile ---"
grep -A8 'ibigan.com.br' /etc/caddy/Caddyfile 2>/dev/null || echo "(sem bloco ibigan ou Caddyfile ausente)"
echo

echo "--- curl público ---"
curl -sS -o /dev/null -w "https://${DOMAIN} → HTTP %{http_code}\n" -I "https://${DOMAIN}" || true
echo

echo "=== Correções típicas ==="
echo "404: build do frontend + deploy:"
echo "  cd ${ROOT}/projects/ibigan-web && npm ci && npm run build"
echo "  ${ROOT}/scripts/deploy-prod.sh"
echo "502: Caddy deve usar reverse_proxy http://127.0.0.1:${HTTP_PORT} (ibigan=18080, nagibi=28080)"
echo "     NGINX_HTTP_PORT no ${ENV_FILE} deve coincidir com o Caddyfile"
