# Ibigan — Setup local e deploy produção

Monorepo: `ibigan/` (raiz) com `projects/ibigan-api` (Laravel) e `projects/ibigan-web` (React).

---

## 1. Pré-requisitos

- Docker + Docker Compose v2
- Git
- Make (opcional, recomendado)
- Portas livres: `80`, `5173`, `6379`, `8025`, `8081`, `8082`, `7700`

---

## 2. Clone e estrutura

```bash
git clone git@github.com:nagibi/ibigan.git
cd ibigan
```

---

## 3. Ambiente local — passo a passo

### 3.1 Variáveis Docker (raiz)

```bash
cp .env.example .env
# Ajuste portas se necessário (MYSQL_HOST_PORT, PMA_PORT)
```

### 3.2 Backend Laravel

```bash
cp projects/ibigan-api/.env.example projects/ibigan-api/.env
```

Edite `projects/ibigan-api/.env` se precisar. Valores padrão já apontam para Docker (`mysql`, `redis`, `mailpit`).

Gere a APP_KEY (primeira vez):

```bash
docker compose up -d
docker compose exec app php artisan key:generate
```

### 3.3 Frontend React

```bash
cp projects/ibigan-web/.env.example projects/ibigan-web/.env.local
```

O Vite usa `.env.local` automaticamente. API local: `http://localhost/api`.

### 3.4 Subir stack + setup completo

```bash
make setup-local
```

Ou manualmente:

```bash
docker compose up -d
docker compose exec app composer install
docker compose exec app php artisan migrate
docker compose exec app php artisan db:seed
docker compose exec app php artisan tenants:migrate
docker compose exec app php artisan storage:link
make perm
```

### 3.5 Nginx local (HTTP)

O `docker-compose.yml` usa `docker/nginx/conf.d/local.conf` (HTTP, sem SSL).  
Produção usa `production.conf` via `docker-compose.prod.yml`.

Recarregar após mudanças:

```bash
docker compose up -d nginx
docker compose exec nginx nginx -s reload
```

---

## 4. URLs locais

| Serviço      | URL                          |
|-------------|------------------------------|
| API         | http://localhost/api         |
| Frontend    | http://localhost:5173      |
| Mailpit     | http://localhost:8025        |
| Horizon     | http://localhost/horizon     |
| phpMyAdmin  | http://localhost:8081        |
| Reverb (WS) | ws://localhost:8082/app/…    |

### Credenciais demo

| Contexto        | E-mail                    | Senha      |
|----------------|---------------------------|------------|
| Super admin central | superadmin@ibigan.com | senha123   |
| Admin tenant (demo) | admin@odontomax.com   | A12345     |

Seed completo: `docker compose exec app php artisan db:seed --class=DemoSeeder`

---

## 5. Horizon, Reverb e Scheduler

Containers dedicados no `docker-compose.yml`:

| Container          | Comando                    |
|--------------------|----------------------------|
| `ibigan_horizon`   | `php artisan horizon`      |
| `ibigan_scheduler` | `php artisan schedule:work`|
| `ibigan_reverb`    | `php artisan reverb:start` |

Verificar status:

```bash
docker compose ps horizon scheduler reverb
docker compose logs -f horizon
docker compose logs -f reverb
docker compose logs -f scheduler
```

Reiniciar após mudança de `.env`:

```bash
docker compose restart horizon scheduler reverb
docker compose exec app php artisan optimize:clear
```

---

## 6. Deploy produção (Vultr)

**Servidor:** `216.238.124.52` · **Domínio:** `nagibi.com.br` · **Path:** `/opt/ibigan`

### 6.1 Primeira configuração no servidor

```bash
ssh root@216.238.124.52

apt update && apt install -y docker.io docker-compose-plugin git
mkdir -p /opt/ibigan
cd /opt/ibigan
git clone git@github.com:nagibi/ibigan.git .

cp .env.production.example .env
# Preencher APP_KEY, senhas MySQL, Reverb, Brevo, Sentry

# Certificado SSL (Let's Encrypt) — necessário para nginx default.conf
apt install -y certbot
certbot certonly --standalone -d nagibi.com.br -d www.nagibi.com.br
```

### 6.2 Deploy manual

```bash
cd /opt/ibigan
git pull origin main

# Build frontend (ou use CI que envia dist/ via rsync)
cd projects/ibigan-web
npm ci --force
npm run build
cd ../..

chmod +x scripts/deploy-prod.sh
./scripts/deploy-prod.sh
```

### 6.3 Deploy via GitHub Actions

Push em `main` dispara `.github/workflows/deploy.yml`:

1. Build do frontend com variáveis de produção
2. Rsync para `/opt/ibigan/`
3. Executa `scripts/deploy-prod.sh` no servidor

Secrets necessários no GitHub: `SSH_PRIVATE_KEY`, `SERVER_IP` (`216.238.124.52`).

### 6.4 Compose de produção

Produção usa `docker-compose.prod.yml` (sem Vite, Mailpit, Grafana). Nginx serve:

- `/api` → Laravel
- `/` → SPA em `projects/ibigan-web/dist`
- `/app/` → Reverb (WebSocket via proxy)

---

## 7. Comandos úteis

```bash
make help              # lista comandos
make logs              # logs da stack
make shell             # bash no container app
make artisan CMD="..." # artisan
make migrate           # migrations central
make tenants-migrate   # migrations tenants
make test              # testes PHP
make fresh             # reset DB (CUIDADO)
```

---

## 8. Troubleshooting

**API 502 / redirect HTTPS em local**  
Confirme que o nginx monta `local.conf` (compose dev), não `production.conf`.

**Horizon não processa jobs**  
`docker compose logs horizon` — verifique `QUEUE_CONNECTION=redis` e Redis saudável.

**WebSocket não conecta**  
Confirme `VITE_REVERB_*` no frontend e `REVERB_PUBLIC_*` no Laravel. Local: porta `8082`.

**Migrations tenant falham**  
`docker compose exec app php artisan tenants:migrate`

**Permissões storage**  
`make perm`
