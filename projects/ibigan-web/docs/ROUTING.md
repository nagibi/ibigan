# Convenção de rotas (frontend)

## Opção C — prefixo `/admin` = super-admin do SaaS

O Ibigan separa dois escopos de administração:

| Escopo | Prefixo de rota | Quem acessa | API |
|--------|-----------------|-------------|-----|
| **Tenant** | *(sem prefixo)* | Admin do tenant (`admin`, `super-admin` no contexto do tenant) | `/api/v1/*` com header `X-Tenant-ID` |
| **SaaS** | `/admin/*` | Somente `super-admin` | `/api/central/v1/admin/*` |

Rotas **sem** `/admin` operam no tenant atual. Rotas **com** `/admin` são globais do SaaS e não dependem do tenant selecionado para autorização (o backend valida `super-admin`).

## Exemplos

```
/users              ← tenant (qualquer admin do tenant)
/menus              ← tenant (qualquer admin do tenant)
/admin/tenants      ← somente super-admin (label UI: Empresas)
/admin/billing      ← somente super-admin (futuro)
```

Não é necessário renomear rotas existentes: o prefixo `/admin` já sinaliza o escopo SaaS.

**Nomenclatura:** rotas e API usam `tenants` (modelo técnico/DB). Labels visíveis ao usuário usam **Empresa/Empresas** no frontend.

## Onde isso é aplicado

### Frontend (`ibigan-web`)

- **Rotas:** `src/routing/app-routing-setup.tsx` — rotas sob `/admin/*` ficam dentro de `RequireSuperAdmin`.
- **Menu:** `src/config/menu.config.tsx` — itens com `superAdminOnly: true` só aparecem para `super-admin`.
- **Constantes:** `src/config/routing.ts` — `SUPER_ADMIN_ROLE`, `SAAS_ADMIN_ROUTE_PREFIX`, `isSaasAdminRoute()`.
- **Páginas SaaS:** `src/pages/admin/*` — uma pasta por feature central (ex.: `tenants-page.tsx`, label UI: Empresas).

### Backend (`ibigan-api`)

- **Tenant:** `routes/api.php` → grupo `v1` com `InitializeTenancyByHeader`.
- **SaaS:** `routes/api.php` → grupo `central/v1` → rotas `admin/*` (ex.: `admin/tenants`).
- Controllers em `app/Http/Controllers/Api/V1/Central/` devem chamar `abort_unless($request->user()->hasRole('super-admin'), 403)`.

## Adicionar nova feature SaaS

1. Criar página em `src/pages/admin/<feature>/`.
2. Registrar rota em `app-routing-setup.tsx` **dentro** do grupo `RequireSuperAdmin`.
3. Adicionar item no menu com `superAdminOnly: true` e `path: '/admin/<feature>'`.
4. Criar service apontando para `/central/v1/admin/<feature>`.
5. Implementar controller central com guard `super-admin`.

## Adicionar nova feature de tenant

1. Criar página em `src/pages/<feature>/` (sem pasta `admin`).
2. Registrar rota **fora** do grupo `/admin`.
3. Proteger por permissão Spatie (`usuario-visualizar`, etc.) quando o ACL estiver ativo no frontend.
4. API em `v1/*` com middleware de tenant.

## Role `super-admin`

- No **tenant**, `super-admin` tem acesso total àquele tenant (usuários, menus, configurações).
- No **SaaS**, o mesmo role acessa rotas `/admin/*` e APIs `central/v1/admin/*` (ex.: tenants — label UI: Empresas; billing futuro, etc.).
- Usuários `admin` do tenant **não** veem menu nem rotas `/admin/*`.
