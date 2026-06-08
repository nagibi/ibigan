# Ibigan — Nomenclatura e Setup do Repositório

---

## 1. Identidade do projeto

| Item | Valor |
|---|---|
| **Nome do produto** | Ibigan |
| **GitHub URL** | `github.com/nagibi/ibigan` |
| **Visibilidade** | Privado |
| **Descrição no GitHub** | `Laravel 12 + React 19 SaaS boilerplate — multi-tenant, RBAC, realtime` |

---

## 2. Nomenclatura em cada camada

### Repositório e pastas
```
ibigan/                          ← raiz do monorepo (nome da pasta local)
├── .cursor/rules/               ← diretrizes para o Cursor AI
├── .github/
│   ├── workflows/               ← CI/CD (testes, lint)
│   └── PULL_REQUEST_TEMPLATE.md
├── docker/                      ← configs Docker
├── projects/
│   ├── ibigan-api/              ← Laravel 12 (pasta do backend)
│   └── ibigan-web/              ← React 19 + Metronic 9 (pasta do frontend)
├── docker-compose.yml
├── Makefile
└── README.md
```

### Docker
```yaml
name: ibigan                     # docker compose name

containers:
  ibigan_app                     # PHP-FPM Laravel
  ibigan_nginx                   # Nginx
  ibigan_mysql                   # MySQL 8.4
  ibigan_redis                   # Redis 7
  ibigan_horizon                 # Laravel Horizon
  ibigan_scheduler               # Laravel Scheduler
  ibigan_reverb                  # Laravel Reverb (WebSocket)
  ibigan_vite                    # Vite dev server (React)
  ibigan_mailpit                 # Mailpit
  ibigan_phpmyadmin              # phpMyAdmin
```

### Laravel (ibigan-api)
```
APP_NAME=Ibigan
DB_DATABASE=ibigan_central       ← banco landlord
# bancos tenant: ibigan_tenant_{slug}

# Docker image tag
ibigan-php-fpm:8.4

# Namespace PHP
App\                             ← padrão Laravel (não mudar)
# mas seeders, testes e configs usam "Ibigan" como prefixo nos nomes
```

### React (ibigan-web)
```json
// package.json
{
  "name": "ibigan-web",
  "version": "0.1.0"
}
```
```bash
# Variável de ambiente
VITE_APP_NAME=Ibigan
VITE_API_URL=http://localhost/api
```

### Composer (Laravel)
```json
// composer.json
{
  "name": "ibigan/api",
  "description": "Ibigan SaaS API — Laravel 12"
}
```

### MySQL — bancos
```
ibigan_central        ← landlord (tenants, superusuários, planos)
ibigan_tenant_{slug}  ← ex: ibigan_tenant_acme, ibigan_tenant_gamma
ibigan_testing        ← banco para testes de integração (Feature tests)
```

### Redis — prefixos
```
REDIS_PREFIX=ibigan_           ← config/database.php
# Isola chaves de outros projetos no mesmo Redis
```

### Horizon — filas
```
# config/horizon.php
'name' => 'ibigan',
'prefix' => 'ibigan_horizon',
```

### Seeders — usuário padrão
```
super@ibigan.com   ← superusuário (mantém o atual do projeto)
senha: A12345
```

---

## 3. Estrutura de branches

```
main          ← produção / boilerplate estável (protegida)
develop       ← integração de features
feat/*        ← features novas:    feat/auth-sanctum
fix/*         ← correções:         fix/tenant-switch
chore/*       ← infra/config:      chore/docker-setup
docs/*        ← documentação:      docs/diretrizes-react
```

### Regras de branch
- `main` → só via PR de `develop`, após todos os checkpoints passarem
- Nunca commitar diretamente em `main`
- Nome da branch sempre em inglês, kebab-case
- Cada fase das diretrizes = uma branch `feat/fase-{N}-{descricao}`

---

## 4. Convenção de commits (Conventional Commits)

```
feat:     nova funcionalidade
fix:      correção de bug
chore:    tarefa de infra, deps, config
docs:     documentação
test:     testes
refactor: refatoração sem mudança de comportamento
perf:     melhoria de performance
ci:       mudança em CI/CD

# Exemplos:
feat: add Laravel Sanctum auth adapter for Metronic
feat: implement multi-tenant database switching
fix: clear Permission cache on TenancyInitialized event
chore: update Docker PHP image to 8.4
test: add integration tests for UserController
checkpoint: fase-2 auth sanctum passing all checks
```

---

## 5. Versioning — tags de release

```
v0.1.0   ← boilerplate inicial (Docker + Laravel + React rodando)
v0.2.0   ← auth Sanctum + multi-tenant base
v0.3.0   ← RBAC + ACL frontend
v0.4.0   ← WebSocket + realtime grid
v0.5.0   ← CRUD base completo (backend + frontend)
v1.0.0   ← boilerplate production-ready

# Para projetos de clientes:
# fork de ibigan → renomear → desenvolver sobre a base
```

---

## 6. Passo a passo — criar o repositório e estrutura local

```bash
# 1. Criar o repositório no GitHub (via CLI)
gh repo create nagibi/ibigan \
  --private \
  --description "Laravel 12 + React 19 SaaS boilerplate — multi-tenant, RBAC, realtime" \
  --clone

# OU via interface: github.com/new
# Nome: ibigan | Privado | SEM README (vamos criar local)

# 2. Entrar na pasta
cd ibigan

# 3. Criar estrutura base
mkdir -p .cursor/rules
mkdir -p .github/workflows
mkdir -p docker/{php,nginx/conf.d,mysql,vite}
mkdir -p projects/ibigan-api
mkdir -p projects/ibigan-web

# 4. Copiar os arquivos de diretrizes para o Cursor
cp DIRETRIZES.md .cursor/rules/
cp DIRETRIZES_COMPLEMENTARES.md .cursor/rules/
cp DIRETRIZES_REACT_METRONIC.md .cursor/rules/

# 5. Criar .gitignore raiz
cat > .gitignore << 'EOF'
# Env files
.env
.env.local
.env.*.local
projects/ibigan-api/.env
projects/ibigan-web/.env.local

# IDE
.idea/
.vscode/
*.swp

# OS
.DS_Store
Thumbs.db

# Docker
docker/mysql/data/

# Node
node_modules/

# Laravel
projects/ibigan-api/vendor/
projects/ibigan-api/storage/logs/
projects/ibigan-api/.phpunit.cache/
EOF

# 6. Criar README raiz
cat > README.md << 'EOF'
# Ibigan

SaaS boilerplate — Laravel 12 + React 19 + Metronic 9.

## Stack
- PHP 8.4 / Laravel 12
- React 19 / Vite 7 / Metronic 9 (ReUI)
- MySQL 8.4 (multi-database tenancy)
- Redis 7
- stancl/tenancy + spatie/laravel-permission
- Laravel Sanctum + Reverb

## Setup
```bash
cp .env.example .env
make build
make up
make composer CMD="install"
make artisan CMD="key:generate"
make migrate
```

## Documentação
Ver `.cursor/rules/` para diretrizes completas de arquitetura.
EOF

# 7. Primeiro commit
git add .
git commit -m "chore: initial repository structure"
git push -u origin main

# 8. Criar branch develop
git checkout -b develop
git push -u origin develop

# 9. Primeira feature branch (Docker + infra)
git checkout -b feat/fase-1-docker-setup
```

---

## 7. Para cada projeto de cliente

```bash
# Workflow: fork privado do ibigan
gh repo create nagibi/cliente-nome \
  --private \
  --template nagibi/ibigan \
  --clone

cd cliente-nome

# Renomear referências ibigan → cliente
# (busca global no VSCode/Cursor: ibigan → nome-cliente)
# Itens a renomear:
# - docker-compose.yml: name: ibigan → name: cliente
# - container names: ibigan_* → cliente_*
# - DB_DATABASE: ibigan_central → cliente_central
# - REDIS_PREFIX: ibigan_ → cliente_
# - APP_NAME, VITE_APP_NAME
# - composer.json name
# - package.json name

git commit -m "chore: rename ibigan to cliente-nome"
```

---

## 8. .github/workflows — CI básico

```yaml
# .github/workflows/tests.yml
name: Tests

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: '8.4'
          extensions: pdo_mysql, redis, gd, zip, bcmath, pcntl
      - name: Install dependencies
        run: composer install --prefer-dist --no-progress
        working-directory: projects/ibigan-api
      - name: Copy env
        run: cp .env.example .env
        working-directory: projects/ibigan-api
      - name: Generate key
        run: php artisan key:generate
        working-directory: projects/ibigan-api
      - name: Run tests
        run: php artisan test --parallel
        working-directory: projects/ibigan-api

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - name: Install dependencies
        run: npm install --force
        working-directory: projects/ibigan-web
      - name: Type check
        run: npx tsc --noEmit
        working-directory: projects/ibigan-web
      - name: Build
        run: npm run build
        working-directory: projects/ibigan-web
```

---

## 9. Checklist final antes do primeiro push

```
[ ] Repositório criado em github.com/nagibi/ibigan (privado)
[ ] Branch main criada com commit inicial
[ ] Branch develop criada
[ ] .gitignore cobrindo .env, vendor/, node_modules/
[ ] .cursor/rules/ com os 3 arquivos de diretrizes
[ ] docker-compose.yml com name: ibigan e containers ibigan_*
[ ] DB_DATABASE=ibigan_central no .env.example
[ ] README.md com instruções de setup
[ ] Primeira feature branch: feat/fase-1-docker-setup
```
