# Convenção de rotas (API)

## Opção C — prefixo `admin/` = super-admin do SaaS

O Ibigan separa dois escopos de administração:

| Escopo | Prefixo de rota (API) | Quem acessa | Header |
|--------|------------------------|-------------|--------|
| **Tenant** | `/api/v1/*` | Admin do tenant (`admin`, `super-admin` no contexto do tenant) | `X-Tenant-ID` obrigatório |
| **SaaS** | `/api/central/v1/admin/*` | Somente `super-admin` | Não usa tenant para autorização |

Rotas em `v1/*` operam no tenant atual. Rotas em `central/v1/admin/*` são globais do SaaS.

## Exemplos

```
GET  /api/v1/users              ← tenant (qualquer admin com permissão)
GET  /api/v1/menus              ← tenant (qualquer admin com permissão)
GET  /api/central/v1/admin/tenants    ← somente super-admin (label UI: Empresas)
GET  /api/central/v1/admin/billing    ← somente super-admin (futuro)
```

Rotas centrais sem `admin/` (ex.: `GET /api/central/v1/tenants`, `POST tenants/switch`) servem qualquer usuário autenticado vinculado ao tenant — não são escopo SaaS.

## Onde isso é aplicado

- **Tenant:** `routes/api.php` → grupo `v1` com middleware `InitializeTenancyByHeader`.
- **SaaS:** `routes/api.php` → grupo `central/v1` → rotas `admin/*`.
- Controllers em `app/Http/Controllers/Api/V1/Central/` para `admin/*` devem chamar `abort_unless($request->user()->hasRole('super-admin'), 403)`.

O frontend espelha a mesma convenção: rotas sem `/admin` são do tenant; rotas com `/admin/*` são exclusivas do super-admin (ver `ibigan-web/docs/ROUTING.md`).

## Menu (tenant DB)

Itens SaaS no `MenuSeeder` usam `roles: ['super-admin']` e `path` começando com `/admin/` (ex.: título Empresas → `/admin/tenants`).

## Adicionar nova feature SaaS

1. Registrar rotas em `central/v1` sob `admin/<feature>`.
2. Criar controller central com guard `super-admin`.
3. No frontend: página em `src/pages/admin/`, rota `/admin/<feature>`, service apontando para `/central/v1/admin/<feature>`.
4. Opcional: item no `MenuSeeder` com `roles: ['super-admin']`.
