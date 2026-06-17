#!/usr/bin/env bash
# Diagnóstico rápido de 502 — ibigan atrás do Caddy no host.
set -uo pipefail

ENV_FILE="${ENV_FILE:-/opt/ibigan/.env}"
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

echo "=== Correção típica de 502 ==="
echo "1. Caddy deve usar: reverse_proxy http://127.0.0.1:${HTTP_PORT}  (NÃO https://...18443)"
echo "2. nginx precisa config HTTP (deploy com NGINX_HTTP_BIND=127.0.0.1)"
echo "3. systemctl reload caddy && docker restart ${STACK}_nginx"
