# Diretrizes do Projeto — SaaS Laravel 12

> Documento de referência para o Cursor AI.
> Toda geração de código deve seguir estas diretrizes rigorosamente.

---

## 1. Stack e versões

| Camada | Tecnologia | Versão |
|---|---|---|
| Runtime | PHP | 8.4 |
| Framework | Laravel | 12.x |
| Banco central | MySQL | 8.4 |
| Cache / Filas | Redis | 7 |
| Autenticação | Laravel Sanctum | latest |
| Multi-tenancy | stancl/tenancy | 3.x (multi-database) |
| RBAC | spatie/laravel-permission | 6.x |
| Logs de atividade | spatie/laravel-activitylog | 4.x |
| Uploads / Mídia | spatie/laravel-medialibrary | 11.x |
| Exportação | maatwebsite/excel | 3.x |
| Documentação API | dedoc/scramble | latest |
| Testes | Pest PHP | 3.x |
| Testes E2E | Laravel Dusk (ou Selenoid) | latest |
| Frontend | React 18 + TypeScript | latest |
| Build | Vite 6 | latest |
| Containerização | Docker + Docker Compose | latest |

---

## 2. Arquitetura geral

### 2.1 Filosofia

- **Thin Controllers** — controllers não contêm lógica de negócio. Apenas recebem request, delegam para Action/Service e retornam Resource.
- **Single Responsibility** — cada classe faz uma coisa. Actions são a unidade de lógica de negócio.
- **DTOs obrigatórios** — dados nunca transitam como arrays associativos entre camadas. Sempre via DTO tipado.
- **Repositórios para queries complexas** — queries simples ficam no model/service; queries reutilizáveis ou complexas vão para repositórios.
- **Interfaces para contratos** — todo repositório e service externo tem uma interface. Facilita mock em testes.

### 2.2 Fluxo de uma requisição

```
Request → FormRequest (validação) → Controller → Action → Service/Repository → Model
                                       ↓
                                  JsonResource → Response
```

### 2.3 Estrutura de diretórios

```
app/
├── Actions/               # Ações de negócio (uma por operação)
│   ├── Tenant/
│   │   ├── CreateTenantAction.php
│   │   └── SwitchTenantAction.php
│   └── User/
│       ├── CreateUserAction.php
│       └── UpdateUserAction.php
│
├── DTOs/                  # Data Transfer Objects (readonly)
│   ├── UserDTO.php
│   ├── TenantDTO.php
│   └── PaginationDTO.php
│
├── Http/
│   ├── Controllers/
│   │   ├── Central/       # Controllers do landlord (superuser)
│   │   └── Tenant/        # Controllers dentro do contexto tenant
│   ├── Requests/          # FormRequests por domínio
│   └── Resources/         # JsonResources e ResourceCollections
│
├── Models/
│   ├── Central/           # Models que vivem no banco central
│   │   ├── Tenant.php
│   │   └── User.php       # Superuser
│   └── Tenant/            # Models que vivem no banco do tenant
│       ├── User.php
│       ├── Organization.php
│       └── ...
│
├── Repositories/
│   ├── Contracts/         # Interfaces
│   │   └── UserRepositoryInterface.php
│   └── Eloquent/          # Implementações
│       └── UserRepository.php
│
├── Services/              # Lógica reutilizável entre Actions
│   ├── AuthService.php
│   └── MediaService.php
│
├── Exports/               # Classes Maatwebsite Excel
│   └── UsersExport.php
│
├── Observers/             # Model observers (activity log, side effects)
├── Policies/              # Autorização por model
├── Events/ + Listeners/
└── Jobs/                  # Jobs com TenantAwareJob quando necessário

database/
├── migrations/            # Migrations do banco central (landlord)
│   └── 2025_01_01_create_tenants_table.php
├── migrations/tenant/     # Migrations dos bancos tenant
│   ├── 2025_01_01_create_users_table.php
│   └── ...
├── factories/
└── seeders/
    ├── DatabaseSeeder.php           # Central seeder
    └── TenantDatabaseSeeder.php     # Tenant seeder

routes/
├── api.php                # Rotas centrais (autenticação, superuser)
└── tenant.php             # Rotas do contexto tenant (stancl registra automaticamente)

tests/
├── Unit/                  # Testes unitários isolados
│   ├── Actions/
│   ├── DTOs/
│   └── Services/
├── Feature/               # Testes de integração de API (HTTP)
│   ├── Central/
│   └── Tenant/
└── Browser/               # Testes de aceitação (Dusk/Selenoid)
    └── Auth/
```

---

## 3. Multi-tenancy (stancl/tenancy)

### 3.1 Modelo

- **Multi-database**: cada tenant tem seu próprio banco `tenant_{slug}`.
- Banco central (`saas_central`): armazena `tenants`, `domains`, superusuários.
- Banco tenant: armazena users, roles, permissions, media, activity_log e todos os models de negócio.

### 3.2 Identificação do tenant

- Por subdomínio: `acme.app.com` → middleware `InitializeTenancyBySubdomain`.
- Por sessão (superusuário): `tenancy()->initialize($tenant)` após seleção no painel central.

### 3.3 Superusuário

- Existe **apenas no banco central**.
- Pode acessar qualquer tenant via switch sem novo login.
- Tem guard próprio: `central` (Sanctum com banco central).
- Ao entrar em um tenant, a sessão armazena `current_tenant_id`.

### 3.4 Regras obrigatórias

```php
// TenancyServiceProvider.php — sempre limpar cache do Permission ao trocar tenant
Event::listen(TenancyInitialized::class, fn() =>
    app(PermissionRegistrar::class)->forgetCachedPermissions()
);

// Jobs que rodam em fila DENTRO de contexto tenant
class MinhaExportacaoJob implements ShouldQueue {
    use TenantAwareJob; // OBRIGATÓRIO — sem isso roda no banco central
}
```

### 3.5 Migrations

- Migrations do central: `database/migrations/`
- Migrations do tenant: `database/migrations/tenant/`
- **Nunca misturar**. O tenancy executa cada pasta no contexto correto.

---

## 4. DTOs

### 4.1 Padrão obrigatório

```php
// Sempre readonly, sempre com factory estático
readonly class UserDTO
{
    public function __construct(
        public string $name,
        public string $email,
        public string $password,
        public ?string $phone = null,
    ) {}

    public static function fromRequest(UserRequest $request): self
    {
        return new self(
            name: $request->validated('name'),
            email: $request->validated('email'),
            password: $request->validated('password'),
            phone: $request->validated('phone'),
        );
    }

    public static function fromModel(User $user): self
    {
        return new self(
            name: $user->name,
            email: $user->email,
            password: '', // nunca expor hash
            phone: $user->phone,
        );
    }
}
```

### 4.2 Regras

- DTOs são `readonly` — imutáveis após criação.
- Sempre têm factory `fromRequest()` e/ou `fromModel()`.
- Nunca contêm lógica de negócio.
- Nunca acessam banco de dados.
- Podem ter `toArray()` para serialização quando necessário.

---

## 5. Actions

### 5.1 Padrão

```php
final class CreateUserAction
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
        private readonly HashServiceInterface $hashService,
    ) {}

    public function execute(UserDTO $dto): User
    {
        return $this->userRepository->create([
            'name'     => $dto->name,
            'email'    => $dto->email,
            'password' => $this->hashService->make($dto->password),
        ]);
    }
}
```

### 5.2 Regras

- Uma Action = uma operação de negócio.
- Nomeadas com verbo no infinitivo: `CreateUserAction`, `SuspendTenantAction`.
- Recebem DTO, retornam Model ou DTO.
- São `final` — não são extendidas.
- Injetam dependências via construtor (sem `app()` ou facades dentro da Action).

---

## 6. Controllers

### 6.1 Padrão

```php
final class UserController extends Controller
{
    public function __construct(
        private readonly CreateUserAction $createUser,
        private readonly UserRepositoryInterface $users,
    ) {}

    public function store(UserRequest $request): UserResource
    {
        $dto  = UserDTO::fromRequest($request);
        $user = $this->createUser->execute($dto);

        return UserResource::make($user);
    }

    public function index(IndexRequest $request): UserCollection
    {
        $users = $this->users->paginate(
            perPage: $request->integer('per_page', 15),
        );

        return UserCollection::make($users);
    }
}
```

### 6.2 Regras

- Controllers são `final`.
- **Nunca** contêm lógica de negócio ou queries diretas.
- Sempre retornam `JsonResource` — nunca array ou `response()->json()` direto.
- Validação sempre em `FormRequest` separado — nunca `$request->validate()` no controller.
- Máximo 5 métodos por controller (index, show, store, update, destroy).

---

## 7. Repositórios

### 7.1 Interface

```php
interface UserRepositoryInterface
{
    public function findById(int $id): ?User;
    public function findByEmail(string $email): ?User;
    public function paginate(int $perPage = 15): LengthAwarePaginator;
    public function create(array $data): User;
    public function update(User $user, array $data): User;
    public function delete(User $user): void;
}
```

### 7.2 Implementação

```php
final class EloquentUserRepository implements UserRepositoryInterface
{
    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return User::query()
            ->with(['roles'])
            ->latest()
            ->paginate($perPage);
    }

    // ... demais métodos
}
```

### 7.3 Binding no ServiceProvider

```php
$this->app->bind(UserRepositoryInterface::class, EloquentUserRepository::class);
```

### 7.4 Regras

- Repositórios usam apenas Eloquent/Query Builder — sem lógica de negócio.
- Toda query reutilizada em mais de um lugar vai para o repositório.
- Queries únicas e simples podem ficar no Service ou Action diretamente.

---

## 8. API Resources

### 8.1 Padrão

```php
final class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'email'      => $this->email,
            'roles'      => $this->whenLoaded('roles', fn() =>
                                RoleResource::collection($this->roles)
                            ),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
```

### 8.2 Regras

- Sempre usar `whenLoaded()` para relacionamentos — nunca eager loading forçado no resource.
- Datas sempre em ISO 8601 (`toIso8601String()`).
- Nunca expor campos sensíveis (`password`, `remember_token`).
- Collections usam `ResourceCollection` separado quando precisam de metadados extras.
- O Scramble infere o schema OpenAPI a partir dos type hints do resource — manter tipos explícitos.

---

## 9. Documentação API (Scramble)

- **Nenhuma anotação manual** (`@OA\*`). O Scramble gera tudo automaticamente.
- Para que o Scramble infira corretamente, todos os controllers devem:
  - Ter type hints nos parâmetros.
  - Retornar `JsonResource` ou `ResourceCollection` tipados.
  - Usar `FormRequest` tipado (Scramble lê as `rules()` para o request body).
- Rota da documentação: `GET /docs/api`.
- Excluir rotas internas com `Scramble::ignoreDefaultRoutes()` quando necessário.

---

## 10. Autenticação (Sanctum)

### 10.1 Dois guards

```php
// config/auth.php
'guards' => [
    'central' => [          // superusuário — banco central
        'driver'   => 'sanctum',
        'provider' => 'central_users',
    ],
    'tenant' => [           // usuário do tenant
        'driver'   => 'sanctum',
        'provider' => 'tenant_users',
    ],
],
```

### 10.2 Fluxo

1. Superusuário faz login → token Sanctum no banco central.
2. Seleciona tenant → `tenancy()->initialize($tenant)` → sessão salva `current_tenant_id`.
3. Usuário comum faz login → token Sanctum no banco do tenant ativo.

### 10.3 Regras

- Tokens sempre com `abilities` (escopos): `['tenant:read', 'tenant:write']`.
- Token de superusuário tem ability `['*']` apenas para rotas centrais.
- Expiração padrão: 24h para API, 30d para "lembrar".
- Refresh: revogar token antigo e emitir novo no mesmo request.

---

## 11. RBAC (Spatie Permission)

### 11.1 Roles padrão por tenant

```
super_admin   — acesso total ao tenant (atribuído pelo superusuário)
admin         — gestão de usuários e configurações
manager       — operações de negócio
viewer        — somente leitura
```

### 11.2 Regras

- Roles e permissions são **criadas via seeder** por tenant — nunca hardcoded no código.
- Verificação via `$user->can('permission')` ou middleware `can:permission`.
- **Nunca** checar `hasRole()` diretamente no controller — usar Policies.
- Cache de permissions é limpo no evento `TenancyInitialized` (obrigatório).

### 11.3 Policies

```php
// Toda autorização de resource vai em Policy — nunca inline no controller
class UserPolicy
{
    public function update(User $authUser, User $targetUser): bool
    {
        return $authUser->can('users.update');
    }
}
```

---

## 12. Testes

### 12.1 Framework

- **Pest PHP 3** — framework principal. Não usar PHPUnit puro.
- Arquivos de teste em `tests/Unit`, `tests/Feature`, `tests/Browser`.
- Nomenclatura: `it('cria um usuário com dados válidos')` — sempre em **português**, descritivo e focado na funcionalidade de negócio.

### 12.2 Testes unitários (`tests/Unit`)

O que testar: Actions, DTOs, Services, helpers, value objects.

```php
// tests/Unit/Actions/CreateUserActionTest.php
it('creates a user from valid DTO', function () {
    $repo = Mockery::mock(UserRepositoryInterface::class);
    $repo->shouldReceive('create')->once()->andReturn(User::factory()->make());

    $action = new CreateUserAction($repo);
    $dto    = new UserDTO(name: 'João', email: 'joao@test.com', password: '12345678');

    $result = $action->execute($dto);

    expect($result)->toBeInstanceOf(User::class);
});
```

### 12.3 Testes de integração/feature de API (`tests/Feature`)

O que testar: endpoints HTTP completos, autenticação, permissões, respostas JSON.

```php
// tests/Feature/Tenant/UserTest.php
uses(RefreshDatabase::class);

beforeEach(function () {
    // Inicializa um tenant de teste
    $this->tenant = Tenant::factory()->create();
    tenancy()->initialize($this->tenant);

    $this->user = User::factory()->create();
    $this->user->assignRole('admin');
});

afterEach(function () {
    tenancy()->end();
});

it('returns paginated users for admin', function () {
    User::factory()->count(5)->create();

    $this->actingAs($this->user, 'tenant')
        ->getJson('/api/users')
        ->assertOk()
        ->assertJsonStructure([
            'data' => [['id', 'name', 'email']],
            'meta' => ['total', 'per_page', 'current_page'],
        ]);
});

it('denies access for viewers', function () {
    $viewer = User::factory()->create();
    $viewer->assignRole('viewer');

    $this->actingAs($viewer, 'tenant')
        ->postJson('/api/users', [])
        ->assertForbidden();
});
```

### 12.4 Testes de aceitação E2E (`tests/Browser`)

- **Laravel Dusk** para ambiente local.
- **Selenoid** em Docker para CI/CD (headless, paralelizável).
- Testar apenas fluxos críticos de negócio: login, onboarding de tenant, operação principal.

```php
// tests/Browser/Auth/LoginTest.php
it('super admin can login and switch tenant', function () {
    $this->browse(function (Browser $browser) {
        $browser->visit('/login')
                ->type('email', 'admin@saas.com')
                ->type('password', 'password')
                ->press('Entrar')
                ->assertPathIs('/select-organization')
                ->clickLink('Acme Corp')
                ->assertPathIs('/dashboard');
    });
});
```

### 12.5 Regras gerais de teste

- Todo endpoint de API tem ao menos um teste de integração.
- Toda Action tem ao menos um teste unitário.
- Factories para todos os models — nunca criar dados manualmente no teste.
- Usar `RefreshDatabase` em Feature tests, `WithoutMiddleware` apenas quando explicitamente necessário.
- Testes de permissão: sempre testar acesso autorizado E negado.
- Rodar em paralelo: `php artisan test --parallel`.
- Banco de testes: SQLite in-memory para unitários, MySQL para feature (banco `saas_testing`).

---

## 13. Exportações (Maatwebsite Excel)

```php
// Toda exportação usa Queue + TenantAwareJob
final class UsersExport implements FromQuery, WithHeadings, ShouldQueue
{
    use TenantAwareJob;

    public function query(): Builder
    {
        return User::query()->with('roles');
    }

    public function headings(): array
    {
        return ['ID', 'Nome', 'Email', 'Roles', 'Criado em'];
    }
}

// No controller — dispara em background
public function export(): JsonResponse
{
    (new UsersExport())->queue("exports/users_" . now()->timestamp . ".xlsx");

    return response()->json(['message' => 'Exportação em andamento.']);
}
```

---

## 14. Media Library (Spatie)

```php
// Models que têm upload implementam HasMedia
class Organization extends Model implements HasMedia
{
    use InteractsWithMedia;

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('logo')
             ->singleFile()
             ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);

        $this->addMediaCollection('documents');
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumb')
             ->width(200)
             ->height(200)
             ->format('webp');
    }
}
```

### Regras

- Storage físico: `tenants/{tenant_id}/media/` no disco (prefixo isolado por tenant).
- URLs sempre via `getFirstMediaUrl('collection', 'conversion')` — nunca paths manuais.
- Configurar `TenantAwareUrlGenerator` para gerar URLs corretas no contexto tenant.

---

## 15. Convenções de código

### 15.1 PHP

- `declare(strict_types=1)` em todos os arquivos.
- Tipos explícitos em todos os parâmetros e retornos — sem `mixed` sem justificativa.
- `final` em classes que não são extendidas (Actions, Controllers, Repositories).
- `readonly` em propriedades que não mudam após construção.
- Usar `enum` para status, tipos fixos — nunca strings soltas.

```php
enum UserStatus: string
{
    case Active   = 'active';
    case Inactive = 'inactive';
    case Suspended = 'suspended';
}
```

### 15.2 Nomenclatura

| Tipo | Convenção | Exemplo |
|---|---|---|
| Action | `{Verbo}{Entidade}Action` | `CreateUserAction` |
| DTO | `{Entidade}DTO` | `UserDTO` |
| Resource | `{Entidade}Resource` | `UserResource` |
| Request | `{Verbo}{Entidade}Request` | `StoreUserRequest` |
| Repository Interface | `{Entidade}RepositoryInterface` | `UserRepositoryInterface` |
| Repository Eloquent | `Eloquent{Entidade}Repository` | `EloquentUserRepository` |
| Job tenant-aware | `{Operacao}Job` | `ExportUsersJob` |
| Export | `{Entidade}Export` | `UsersExport` |
| Policy | `{Entidade}Policy` | `UserPolicy` |
| Observer | `{Entidade}Observer` | `UserObserver` |
| Enum | `{Entidade}{Atributo}` | `UserStatus`, `TenantPlan` |

### 15.3 Rotas

```php
// Sempre recursos RESTful com prefixo de versão
Route::prefix('v1')->middleware(['auth:tenant'])->group(function () {
    Route::apiResource('users', UserController::class);
    Route::apiResource('organizations', OrganizationController::class);
});

// Rotas centrais (superuser)
Route::prefix('central/v1')->middleware(['auth:central'])->group(function () {
    Route::apiResource('tenants', TenantController::class);
});
```

### 15.4 Responses padrão

```php
// Sucesso com dados
{ "data": { ... } }                          // 200 / 201

// Lista paginada
{ "data": [...], "meta": { "total": 100 } }  // 200

// Sem conteúdo (delete)
// HTTP 204 — sem body

// Erro de validação
{ "message": "...", "errors": { "campo": ["mensagem"] } }  // 422

// Não autorizado
{ "message": "Unauthenticated." }            // 401

// Proibido
{ "message": "This action is unauthorized." } // 403
```

---

## 16. Ordem de implementação (para o Cursor)

Seguir esta ordem ao implementar features para garantir que as dependências estejam prontas:

```
1. Migration (central ou tenant)
2. Model + Enum de status
3. Factory + Seeder
4. DTO
5. Repository Interface + Implementação Eloquent + binding no Provider
6. Action(s)
7. FormRequest (validação)
8. Controller
9. Resource / Collection
10. Rotas
11. Policy + registrar no AuthServiceProvider
12. Testes unitários (Action)
13. Testes de integração (endpoints)
14. Observer (se precisar de side effects: log, notificação)
```

---

## 17. O que o Cursor NÃO deve fazer

- Usar `$request->all()` — sempre `$request->validated()`.
- Usar `response()->json([...])` no controller — sempre `JsonResource`.
- Colocar queries no controller ou no model (scopes são aceitos no model).
- Usar `array` como tipo quando um DTO resolveria.
- Usar `app()` ou facades dentro de Actions e Services (usar injeção de dependência).
- Criar migrations sem `down()` implementado.
- Usar `User::all()` — sempre paginar ou limitar.
- Misturar migrations centrais com migrations de tenant.
- Omitir `TenantAwareJob` em jobs que acessam dados do tenant.
- Usar `hasRole()` no controller — sempre via Policy ou `can()`.
- Expor stack trace em produção (`APP_DEBUG=false` em prod).
- Usar `dd()` ou `dump()` em código de produção.
