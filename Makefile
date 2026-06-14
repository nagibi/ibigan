.PHONY: help up down build restart logs shell artisan composer npm \
        migrate fresh seed tenants-migrate test perm optimize setup setup-local

export USER_ID  := $(shell id -u)
export GROUP_ID := $(shell id -g)

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'

# ── Stack ─────────────────────────────────────────────────────
up: ## Sobe todos os serviços
	docker compose up -d

down: ## Para todos os serviços
	docker compose down

build: ## Reconstrói as imagens
	docker compose build --no-cache

restart: down up ## Reinicia a stack

logs: ## Logs em tempo real
	docker compose logs -f --tail=100

# ── Setup local ───────────────────────────────────────────────
setup-local: ## Setup completo: deps, key, migrate, seed, storage:link
	docker compose up -d
	docker compose exec app composer install --no-interaction
	docker compose exec app php artisan key:generate --force --no-interaction || true
	docker compose exec app php artisan migrate --force
	docker compose exec app php artisan db:seed --force
	docker compose exec app php artisan tenants:migrate
	docker compose exec app php artisan storage:link --force
	docker compose exec app php artisan optimize:clear
	$(MAKE) perm
	@echo ""
	@echo "Setup concluído. Acesse:"
	@echo "  API:        http://localhost/api"
	@echo "  Frontend:   http://localhost:5173"
	@echo "  Mailpit:    http://localhost:8025"
	@echo "  Horizon:    http://localhost/horizon"
	@echo "  phpMyAdmin: http://localhost:8081"

setup: setup-local ## Alias para setup-local

# ── Acesso ────────────────────────────────────────────────────
shell: ## Bash no container app
	docker compose exec app bash

shell-root: ## Bash como root no container app
	docker compose exec --user root app bash

# ── Laravel ───────────────────────────────────────────────────
artisan: ## Ex: make artisan CMD="route:list"
	docker compose exec app php artisan $(CMD)

composer: ## Ex: make composer CMD="require pacote"
	docker compose exec app composer $(CMD)

npm: ## Ex: make npm CMD="install"
	docker compose exec vite npm $(CMD)

# ── Database ──────────────────────────────────────────────────
migrate: ## Migrations banco central
	docker compose exec app php artisan migrate

storage-link: ## Cria symlink public/storage
	docker compose exec app php artisan storage:link --force

fresh: ## Drop + recria tudo (APAGA DADOS)
	docker compose exec app php artisan migrate:fresh --seed

seed: ## Seeders
	docker compose exec app php artisan db:seed

tenants-migrate: ## Migrations em todos os tenants
	docker compose exec app php artisan tenants:migrate

tenants-seed: ## Seeders em todos os tenants
	docker compose exec app php artisan tenants:seed

# ── Utils ─────────────────────────────────────────────────────
perm: ## Corrige permissões de storage
	docker compose exec --user root app chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache
	docker compose exec --user root app chmod -R 775 /var/www/storage /var/www/bootstrap/cache

optimize: ## Limpa e reotimiza caches
	docker compose exec app php artisan optimize:clear
	docker compose exec app php artisan optimize

test: ## Roda testes
	docker compose exec app php artisan test

horizon-pause: ## Pausa o Horizon
	docker compose exec app php artisan horizon:pause

horizon-resume: ## Retoma o Horizon
	docker compose exec app php artisan horizon:continue

lint: ## Verifica estilo do código com Pint
	docker compose exec app ./vendor/bin/pint --test

lint-fix: ## Corrige estilo do código com Pint
	docker compose exec app ./vendor/bin/pint
