# Diretrizes Complementares

> Complementa DIRETRIZES.md.
> Cobre: Services, Repositories, Versionamento de API, CRUD Base,
> WebSockets/Reverb, Frontend React + Angular, e padrão de mensagens.

---

## 1. Services — quando usar e como

### 1.1 Diferença entre Service e Action

| | Action | Service |
|---|---|---|
| Responsabilidade | Uma operação específica | Lógica reutilizável entre múltiplas Actions |
| Exemplo | `CreateUserAction` | `PasswordHashService`, `MediaUploadService` |
| Estado | Stateless, sem propriedades mutáveis | Pode ter estado mínimo (ex: config injetada) |
| Escopo | Domínio único | Pode cruzar domínios |

**Regra prática:** se a mesma lógica aparece em duas Actions diferentes, extrai para um Service.

### 1.2 Padrão de Service

```php
// app/Services/MediaUploadService.php
final class MediaUploadService
{
    public function __construct(
        private readonly string $disk = 'tenants',
    ) {}

    public function uploadAvatar(HasMedia $model, UploadedFile $file): Media
    {
        return $model
            ->addMedia($file)
            ->toMediaCollection('avatar');
    }

    public function deleteCollection(HasMedia $model, string $collection): void
    {
        $model->clearMediaCollection($collection);
    }
}
```

### 1.3 Serviços externos — sempre com Interface

Qualquer integração externa (pagamento, SMS, WhatsApp, e-mail transacional)
deve ter interface. Facilita mock em testes e troca de provider sem mudar
código de negócio.

```php
// app/Services/Contracts/WhatsAppServiceInterface.php
interface WhatsAppServiceInterface
{
    public function send(string $to, string $message): bool;
    public function sendTemplate(string $to, string $template, array $vars): bool;
}

// app/Services/MetaWhatsAppService.php  (implementação atual — Meta Cloud API)
final class MetaWhatsAppService implements WhatsAppServiceInterface
{
    public function __construct(
        private readonly HttpClient $http,
        private readonly string $token,
        private readonly string $phoneId,
    ) {}

    public function send(string $to, string $message): bool
    {
        // ...
    }
}

// Binding no AppServiceProvider
$this->app->bind(WhatsAppServiceInterface::class, MetaWhatsAppService::class);
```

---

## 2. Repositories — guia completo

### 2.1 Base Repository (evita repetição em todo CRUD)

```php
// app/Repositories/Eloquent/BaseRepository.php
abstract class BaseRepository
{
    public function __construct(
        protected readonly Model $model,
    ) {}

    public function findById(int|string $id): ?Model
    {
        return $this->model->newQuery()->find($id);
    }

    public function findOrFail(int|string $id): Model
    {
        return $this->model->newQuery()->findOrFail($id);
    }

    public function paginate(int $perPage = 15, array $filters = []): LengthAwarePaginator
    {
        return $this->applyFilters($this->model->newQuery(), $filters)
                    ->latest()
                    ->paginate($perPage);
    }

    public function create(array $data): Model
    {
        return $this->model->newQuery()->create($data);
    }

    public function update(Model $model, array $data): Model
    {
        $model->update($data);
        return $model->refresh();
    }

    public function delete(Model $model): void
    {
        $model->delete();
    }

    public function restore(Model $model): void
    {
        $model->restore(); // requer SoftDeletes
    }

    /** Sobrescrever no repositório concreto para aplicar filtros específicos */
    protected function applyFilters(Builder $query, array $filters): Builder
    {
        return $query;
    }
}
```

### 2.2 Repositório concreto com filtros

```php
// app/Repositories/Eloquent/EloquentUserRepository.php
final class EloquentUserRepository extends BaseRepository implements UserRepositoryInterface
{
    public function __construct()
    {
        parent::__construct(new User());
    }

    protected function applyFilters(Builder $query, array $filters): Builder
    {
        return $query
            ->when(
                isset($filters['search']),
                fn($q) => $q->where(function ($q) use ($filters) {
                    $q->where('name', 'like', "%{$filters['search']}%")
                      ->orWhere('email', 'like', "%{$filters['search']}%");
                })
            )
            ->when(
                isset($filters['status']),
                fn($q) => $q->where('status', $filters['status'])
            )
            ->when(
                isset($filters['role']),
                fn($q) => $q->role($filters['role']) // scope do Spatie Permission
            );
    }

    public function findByEmail(string $email): ?User
    {
        return $this->model->newQuery()
                           ->where('email', $email)
                           ->first();
    }
}
```

### 2.3 Regras

- `BaseRepository` cobre o CRUD padrão — repositórios concretos só adicionam o que é específico.
- `applyFilters()` recebe os `validated()` do FormRequest diretamente — sem transformação no controller.
- Nunca usar `User::where(...)` fora do repositório — sempre `$this->users->paginate(filters: $request->validated())`.
- Repositórios **não lançam exceções de negócio** — apenas deixam o Eloquent lançar `ModelNotFoundException` quando apropriado.

---

## 3. Versionamento de API

### 3.1 Estratégia — URL path versioning

```
/api/v1/users        ← versão estável atual
/api/v2/users        ← nova versão (breaking changes)
/api/v1/users        ← continua funcionando durante período de deprecação
```

### 3.2 Estrutura de rotas

```php
// routes/api.php
Route::prefix('v1')->name('v1.')->group(base_path('routes/api/v1.php'));
Route::prefix('v2')->name('v2.')->group(base_path('routes/api/v2.php'));

// routes/api/v1.php
Route::middleware(['auth:sanctum', InitializeTenancyByRequestData::class])->group(function () {
    Route::apiResource('users',         V1\UserController::class);
    Route::apiResource('organizations', V1\OrganizationController::class);
});

// routes/api/v2.php  (breaking change: users agora retorna estrutura diferente)
Route::middleware(['auth:sanctum', InitializeTenancyByRequestData::class])->group(function () {
    Route::apiResource('users', V2\UserController::class);
});
```

### 3.3 Estrutura de controllers por versão

```
app/Http/Controllers/
├── Central/
│   └── V1/
│       ├── TenantController.php
│       └── SuperUserController.php
└── Tenant/
    ├── V1/
    │   ├── UserController.php
    │   └── OrganizationController.php
    └── V2/
        └── UserController.php   ← só existem os controllers que mudaram
```

### 3.4 Resources por versão

```
app/Http/Resources/
├── V1/
│   └── UserResource.php
└── V2/
    └── UserResource.php         ← estrutura de resposta diferente
```

### 3.5 Regras de versionamento

- **V1 nunca muda em breaking changes** — adicionar campos é ok; remover ou renomear é breaking change → vai para V2.
- Header `Deprecation` nas rotas V1 que vão ser descontinuadas:
  ```php
  response()->withHeaders(['Deprecation' => 'true', 'Sunset' => '2026-01-01']);
  ```
- `FormRequest` e `Actions` são compartilhados entre versões quando a lógica é a mesma.
  Só `Controller` e `Resource` variam entre versões.
- Documentar no Scramble qual versão cada endpoint pertence.

---

## 4. CRUD Base — eliminar repetição

### 4.1 Trait de controller CRUD padrão

Para modelos simples (sem lógica especial), o controller usa o trait:

```php
// app/Http/Controllers/Concerns/HasCrudOperations.php
trait HasCrudOperations
{
    // Cada controller define estes via propriedades ou métodos abstratos:
    // - $repositoryClass   (ex: UserRepositoryInterface)
    // - $resourceClass     (ex: UserResource)
    // - $storeRequestClass (ex: StoreUserRequest)
    // - $updateRequestClass

    public function index(Request $request): JsonResponse
    {
        $items = $this->repository->paginate(
            perPage: $request->integer('per_page', 15),
            filters: $request->only($this->allowedFilters ?? []),
        );

        return $this->resourceClass::collection($items)->response();
    }

    public function show(int $id): JsonResponse
    {
        $item = $this->repository->findOrFail($id);
        $this->authorize('view', $item);

        return $this->resourceClass::make($item)->response();
    }

    public function destroy(int $id): Response
    {
        $item = $this->repository->findOrFail($id);
        $this->authorize('delete', $item);
        $this->repository->delete($item);

        return response()->noContent();
    }
}
```

### 4.2 Base FormRequest — validações comuns

```php
// app/Http/Requests/BaseFormRequest.php
abstract class BaseFormRequest extends FormRequest
{
    // Regras reutilizáveis entre requests
    protected function nameRules(): array
    {
        return ['required', 'string', 'min:2', 'max:255'];
    }

    protected function emailRules(bool $unique = true, ?int $ignoreId = null): array
    {
        $rules = ['required', 'email:rfc,dns', 'max:255'];

        if ($unique) {
            $rule = Rule::unique('users', 'email');
            if ($ignoreId) $rule = $rule->ignore($ignoreId);
            $rules[] = $rule;
        }

        return $rules;
    }

    protected function passwordRules(bool $confirmed = true): array
    {
        return array_filter([
            'required',
            'string',
            Password::min(8)->letters()->numbers(),
            $confirmed ? 'confirmed' : null,
        ]);
    }

    protected function phoneRules(): array
    {
        return ['nullable', 'string', 'regex:/^\+?[1-9]\d{7,14}$/'];
    }

    protected function imageRules(int $maxKb = 2048): array
    {
        return ['nullable', 'image', 'mimes:jpg,jpeg,png,gif,svg,webp', "max:{$maxKb}"];
    }
}
```

### 4.3 Testes base reutilizáveis (Pest shared tests)

```php
// tests/Feature/Concerns/HasCrudApiTests.php
// Pest permite compartilhar grupos de testes com dataset ou trait

// tests/Pest.php  — registrar helper global
function assertCrudEndpoints(string $baseUrl, array $payload, Closure $factory): void
{
    // index
    test("GET {$baseUrl} retorna lista paginada", function () use ($baseUrl, $factory) {
        $factory(3);
        $this->actingAs(adminUser(), 'tenant')
             ->getJson($baseUrl)
             ->assertOk()
             ->assertJsonStructure(['data', 'meta']);
    });

    // store
    test("POST {$baseUrl} cria registro", function () use ($baseUrl, $payload) {
        $this->actingAs(adminUser(), 'tenant')
             ->postJson($baseUrl, $payload)
             ->assertCreated()
             ->assertJsonStructure(['data' => array_keys($payload)]);
    });

    // show
    test("GET {$baseUrl}/{id} retorna registro", function () use ($baseUrl, $factory) {
        $item = $factory(1)->first();
        $this->actingAs(adminUser(), 'tenant')
             ->getJson("{$baseUrl}/{$item->id}")
             ->assertOk();
    });

    // update
    test("PUT {$baseUrl}/{id} atualiza registro", function () use ($baseUrl, $payload, $factory) {
        $item = $factory(1)->first();
        $this->actingAs(adminUser(), 'tenant')
             ->putJson("{$baseUrl}/{$item->id}", $payload)
             ->assertOk();
    });

    // destroy
    test("DELETE {$baseUrl}/{id} remove registro", function () use ($baseUrl, $factory) {
        $item = $factory(1)->first();
        $this->actingAs(adminUser(), 'tenant')
             ->deleteJson("{$baseUrl}/{$item->id}")
             ->assertNoContent();
    });
}
```

---

## 5. WebSockets / Tempo Real (Laravel Reverb)

### 5.1 Arquitetura

```
Frontend (React/Angular)
    ↕ WebSocket (Laravel Echo)
Laravel Reverb (container saas_reverb)
    ↕ Redis Pub/Sub
Laravel Backend (eventos disparados nas Actions)
```

### 5.2 Canais disponíveis

| Canal | Tipo | Uso |
|---|---|---|
| `tenant.{tenantId}` | Presence | Broadcast para todos os usuários do tenant |
| `user.{userId}` | Private | Notificações individuais |
| `organization.{orgId}` | Private | Updates de uma organização específica |

### 5.3 Padrão de evento

```php
// app/Events/Tenant/UserStatusUpdated.php
final class UserStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly User $user,
        public readonly UserStatus $newStatus,
    ) {}

    // Canal privado do tenant — apenas usuários autenticados do tenant recebem
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("tenant." . tenant('id')),
        ];
    }

    // Payload enviado ao frontend — nunca expor dados sensíveis
    public function broadcastWith(): array
    {
        return [
            'user_id'    => $this->user->id,
            'user_name'  => $this->user->name,
            'new_status' => $this->newStatus->value,
            'updated_at' => now()->toIso8601String(),
        ];
    }

    // Nome do evento no frontend: 'user.status.updated'
    public function broadcastAs(): string
    {
        return 'user.status.updated';
    }
}
```

### 5.4 Disparar evento dentro de Action

```php
// Sempre disparar DEPOIS da operação persistida com sucesso
final class UpdateUserStatusAction
{
    public function execute(User $user, UserStatus $status): User
    {
        $user = $this->repository->update($user, ['status' => $status]);

        // Evento vai para Reverb via Redis — não bloqueia a response
        event(new UserStatusUpdated($user, $status));

        return $user;
    }
}
```

### 5.5 Autorização de canais

```php
// routes/channels.php
Broadcast::channel('tenant.{tenantId}', function (User $user, string $tenantId) {
    // Usuário só pode ouvir o canal do seu próprio tenant
    return tenant('id') === $tenantId;
});

Broadcast::channel('user.{userId}', function (User $user, int $userId) {
    return $user->id === $userId;
});
```

### 5.6 Notificações em tempo real (padrão de mensagens)

O sistema de mensagens existente (`MSG000408` danger, `MSG000409` warning etc.)
deve ser mapeado para eventos de broadcast:

```php
// app/Events/Tenant/NewNotificationEvent.php
final class NewNotificationEvent implements ShouldBroadcast
{
    public function __construct(
        public readonly string $messageCode,  // ex: "MSG000408"
        public readonly string $type,         // "toast" | "alert" | "text"
        public readonly string $severity,     // "danger" | "warning" | "success"
        public readonly string $description,
        public readonly ?array $variables = null, // substitui {{valor}} nos templates
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel("user." . auth()->id())];
    }

    public function broadcastWith(): array
    {
        $message = $this->description;

        // Substitui variáveis do template: {{valor}} → valor real
        if ($this->variables) {
            foreach ($this->variables as $key => $value) {
                $message = str_replace("{{$key}}", $value, $message);
            }
        }

        return [
            'code'        => $this->messageCode,
            'type'        => $this->type,
            'severity'    => $this->severity,
            'description' => $message,
        ];
    }

    public function broadcastAs(): string
    {
        return 'notification.new';
    }
}

// Uso numa Action:
event(new NewNotificationEvent(
    messageCode: 'MSG000408',
    type: 'toast',
    severity: 'danger',
    description: 'Novo alerta!',
));
```

---

## 6. Frontend — React (SPA principal)

### 6.1 Stack

```
React 18 + TypeScript (strict)
Vite 6
TanStack Query v5    ← fetch, cache, loading states
TanStack Router      ← type-safe routing (alternativa ao React Router)
Zustand              ← estado global leve (auth, tenant ativo, notificações)
React Hook Form + Zod ← formulários + validação
Axios                ← HTTP client com interceptors
Laravel Echo         ← WebSocket (Reverb)
shadcn/ui            ← componentes base (já no projeto Metronic/shadcn)
Tailwind CSS
```

### 6.2 Estrutura de diretórios

```
src/
├── api/                    # Camada de acesso à API
│   ├── client.ts           # Axios instance + interceptors
│   ├── users.ts            # endpoints de users
│   └── organizations.ts
│
├── components/
│   ├── ui/                 # Componentes shadcn/ui (não modificar diretamente)
│   ├── common/             # Componentes reutilizáveis do projeto
│   │   ├── DataTable/
│   │   ├── BaseForm/
│   │   └── StatusBadge/
│   └── features/           # Componentes de domínio
│       ├── users/
│       └── organizations/
│
├── hooks/                  # Custom hooks
│   ├── useAuth.ts
│   ├── useTenant.ts
│   └── useEcho.ts          # Hook para subscribe em canais Reverb
│
├── pages/                  # Páginas (um arquivo por rota)
├── stores/                 # Zustand stores
│   ├── authStore.ts
│   ├── tenantStore.ts
│   └── notificationStore.ts
│
├── types/                  # TypeScript types/interfaces
│   ├── api.ts              # Tipos dos responses da API
│   ├── user.ts
│   └── messages.ts         # Tipos do sistema de mensagens (MSG*)
│
└── utils/
    ├── messages.ts         # Parser do sistema de mensagens MSG*
    └── echo.ts             # Configuração do Laravel Echo
```

### 6.3 Cliente HTTP com interceptors

```typescript
// src/api/client.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';

const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { 'Accept': 'application/json' },
});

// Request — injeta token Sanctum
client.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Response — trata erros globalmente
client.interceptors.response.use(
    (response) => response,
    (error) => {
        const { addNotification } = useNotificationStore.getState();
        const status = error.response?.status;

        if (status === 401) {
            useAuthStore.getState().logout();
            window.location.href = '/login';
        }

        if (status === 403) {
            addNotification({ code: 'MSG000403', type: 'toast', severity: 'danger',
                description: 'Acesso não autorizado.' });
        }

        if (status === 422) {
            // Erros de validação — tratados nos forms individualmente
            return Promise.reject(error);
        }

        if (status >= 500) {
            addNotification({ code: 'MSG_SERVER_ERROR', type: 'toast', severity: 'danger',
                description: 'Erro interno. Tente novamente.' });
        }

        return Promise.reject(error);
    }
);

export default client;
```

### 6.4 Hook para WebSocket (Reverb)

```typescript
// src/hooks/useEcho.ts
import { useEffect } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuthStore } from '@/stores/authStore';

// Configuração global — instanciar uma vez
export const echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT,
    wssPort: import.meta.env.VITE_REVERB_PORT,
    forceTLS: false,
    enabledTransports: ['ws', 'wss'],
    authorizer: (channel: { name: string }) => ({
        authorize: (socketId: string, callback: Function) => {
            client.post('/broadcasting/auth', {
                socket_id: socketId,
                channel_name: channel.name,
            }).then(r => callback(null, r.data))
              .catch(e => callback(e));
        },
    }),
});

// Hook para subscribe em notificações do usuário atual
export function useUserNotifications() {
    const { user } = useAuthStore();
    const { addNotification } = useNotificationStore();

    useEffect(() => {
        if (!user) return;

        const channel = echo.private(`user.${user.id}`);

        channel.listen('.notification.new', (payload: ApiNotification) => {
            addNotification(payload);
        });

        return () => {
            echo.leave(`user.${user.id}`);
        };
    }, [user?.id]);
}
```

### 6.5 Sistema de mensagens MSG* no frontend

```typescript
// src/types/messages.ts
export type MessageSeverity = 'success' | 'danger' | 'warning' | 'primary' | 'purple';
export type MessageType = 'text' | 'toast' | 'alert';

export interface AppMessage {
    code: string;
    type: MessageType;
    severity?: MessageSeverity;
    description: string;
}

// src/utils/messages.ts
// Substitui variáveis {{valor}} nas mensagens template
export function parseMessage(message: AppMessage, variables?: Record<string, string>): AppMessage {
    if (!variables) return message;

    return {
        ...message,
        description: message.description.replace(
            /\{\{(\w+)\}\}/g,
            (_, key) => variables[key] ?? `{{${key}}}`
        ),
    };
}

// src/stores/notificationStore.ts
interface NotificationStore {
    notifications: AppMessage[];
    addNotification: (msg: AppMessage, variables?: Record<string, string>) => void;
    markAllRead: () => void;
    dismiss: (code: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
    notifications: [],
    addNotification: (msg, variables) =>
        set(state => ({
            notifications: [parseMessage(msg, variables), ...state.notifications],
        })),
    markAllRead: () => set({ notifications: [] }),
    dismiss: (code) =>
        set(state => ({
            notifications: state.notifications.filter(n => n.code !== code),
        })),
}));
```

### 6.6 Padrão de API query com TanStack Query

```typescript
// src/api/users.ts
export const userKeys = {
    all:    ()         => ['users']            as const,
    list:   (f: any)   => ['users', 'list', f] as const,
    detail: (id: number) => ['users', id]      as const,
};

export function useUsers(filters: UserFilters) {
    return useQuery({
        queryKey: userKeys.list(filters),
        queryFn: () => client.get<PaginatedResponse<User>>('/api/v1/users', { params: filters })
                             .then(r => r.data),
    });
}

export function useCreateUser() {
    const queryClient = useQueryClient();
    const { addNotification } = useNotificationStore();

    return useMutation({
        mutationFn: (dto: CreateUserDTO) =>
            client.post<{ data: User }>('/api/v1/users', dto).then(r => r.data.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.all() });
            addNotification({ code: 'MSG000424', type: 'toast',
                severity: 'success', description: 'Registro criado com sucesso!' });
        },
        onError: (error: AxiosError<ValidationError>) => {
            // Erros de validação 422 são tratados pelo form
            if (error.response?.status !== 422) throw error;
        },
    });
}
```

### 6.7 Regras do frontend React

- **Nunca** `any` — TypeScript strict mode obrigatório.
- **Nunca** fetch direto com `fetch()` — sempre via `client` (Axios) para ter interceptors.
- **Nunca** armazenar token em `localStorage` — usar `httpOnly cookie` via Sanctum SPA mode, ou `sessionStorage` como fallback temporário em dev.
- Componentes de UI (`shadcn/ui`) não são modificados diretamente — extender via wrapper.
- Toda lista que pode crescer usa paginação — nunca `useQuery` retornando tudo.
- Loading states, error states e empty states são obrigatórios em toda listagem.
- Formulários: React Hook Form + Zod (schema espelha as regras do FormRequest Laravel).

---

## 7. Frontend — Angular (se mantido em paralelo)

### 7.1 Stack Angular

```
Angular 18+ (standalone components)
TypeScript strict
Angular HttpClient + Interceptors
NgRx Signals (estado reativo, substitui NgRx clássico para apps médios)
Angular Material ou PrimeNG
Socket.io-client ou pusher-js (Laravel Echo)
```

### 7.2 Estrutura

```
src/app/
├── core/
│   ├── interceptors/
│   │   ├── auth.interceptor.ts      # Injeta Bearer token
│   │   └── error.interceptor.ts     # Trata 401/403/500
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── echo.service.ts          # Singleton do Laravel Echo
│   │   └── notification.service.ts  # Sistema MSG*
│   └── guards/
│       └── auth.guard.ts
│
├── features/                        # Módulos de domínio (standalone)
│   ├── users/
│   │   ├── users.routes.ts
│   │   ├── users-list/
│   │   └── user-form/
│   └── organizations/
│
├── shared/
│   ├── components/
│   │   ├── data-table/
│   │   └── status-badge/
│   └── types/
│       └── api.types.ts
```

### 7.3 Serviço base CRUD Angular

```typescript
// src/app/core/services/base-crud.service.ts
export abstract class BaseCrudService<T, CreateDTO, UpdateDTO> {
    protected abstract readonly endpoint: string;

    constructor(protected readonly http: HttpClient) {}

    list(params?: HttpParams): Observable<PaginatedResponse<T>> {
        return this.http.get<PaginatedResponse<T>>(this.endpoint, { params });
    }

    findById(id: number): Observable<SingleResponse<T>> {
        return this.http.get<SingleResponse<T>>(`${this.endpoint}/${id}`);
    }

    create(dto: CreateDTO): Observable<SingleResponse<T>> {
        return this.http.post<SingleResponse<T>>(this.endpoint, dto);
    }

    update(id: number, dto: UpdateDTO): Observable<SingleResponse<T>> {
        return this.http.put<SingleResponse<T>>(`${this.endpoint}/${id}`, dto);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.endpoint}/${id}`);
    }
}

// Uso:
@Injectable({ providedIn: 'root' })
export class UserService extends BaseCrudService<User, CreateUserDTO, UpdateUserDTO> {
    protected readonly endpoint = '/api/v1/users';
}
```

### 7.4 Serviço de Echo (WebSocket) Angular

```typescript
// src/app/core/services/echo.service.ts
@Injectable({ providedIn: 'root' })
export class EchoService implements OnDestroy {
    private echo: Echo;
    private subscriptions = new Map<string, any>();

    constructor(private authService: AuthService) {
        this.echo = new Echo({ /* config igual ao React */ });
    }

    listenUserNotifications(userId: number): Observable<AppMessage> {
        return new Observable(observer => {
            const channel = this.echo.private(`user.${userId}`);
            channel.listen('.notification.new', (payload: AppMessage) => {
                observer.next(payload);
            });
            this.subscriptions.set(`user.${userId}`, channel);
        });
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((_, key) => this.echo.leave(key));
    }
}
```

### 7.5 Regras Angular

- **Standalone components** em tudo — sem NgModules (Angular 18+).
- `NgRx Signals` para estado — não `BehaviorSubject` manualmente.
- Interceptors no array `provideHttpClient(withInterceptors([...]))`.
- Lazy loading obrigatório em todas as rotas de feature.
- `OnPush` change detection em componentes de lista.
- Serviços injetados com `inject()` (Angular 14+ function-based injection).

---

## 8. Regras que valem para ambos os frontends

### 8.1 Tipos compartilhados com o backend

O Scramble gera OpenAPI 3.1. Usar **OpenAPI TypeScript** para gerar os tipos automaticamente:

```bash
# No CI ou como npm script
npx openapi-typescript http://localhost/docs/api/json -o src/types/api-generated.ts
```

Os tipos gerados são a **fonte da verdade** — não escrever interfaces de API manualmente.

### 8.2 Padrão de response da API (TypeScript)

```typescript
// src/types/api.ts
export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    links: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };
}

export interface SingleResponse<T> {
    data: T;
}

export interface ValidationError {
    message: string;
    errors: Record<string, string[]>;
}
```

### 8.3 Variáveis de ambiente

```bash
# .env do frontend (React/Vite)
VITE_API_URL=http://localhost/api
VITE_REVERB_APP_KEY=saas_key
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8082
VITE_REVERB_SCHEME=http

# .env do frontend (Angular)
# environment.ts gerado no build — não commitar secrets
```

---

## 9. Resumo de decisões arquiteturais

| Decisão | Escolha | Motivo |
|---|---|---|
| Lógica de negócio | Actions | SRP, testável isoladamente |
| Lógica reutilizável | Services | DRY entre Actions |
| Acesso a dados | Repositories | Testável via mock, queries centralizadas |
| CRUD repetitivo | BaseRepository + trait Controller | Sem duplicação |
| Validação | FormRequest | Separado do controller, documentado pelo Scramble |
| Transporte de dados | DTO readonly | Tipado, imutável, sem arrays soltos |
| Versão de API | URL path (/v1, /v2) | Explícito, sem ambiguidade, simples de deprecar |
| Auth | Sanctum (cookie SPA + token API) | Padrão atual Laravel, mais seguro que JWT |
| RBAC | Spatie Permission + Policies | 97M downloads, padrão de mercado |
| Tempo real | Reverb + Laravel Echo | Nativo Laravel, sem dependência externa |
| Testes | Pest 3 + Dusk/Selenoid | Expressivo, paralelo, E2E |
| Mensagens | JSON centralizado (MSG*) | Consistência entre backend e frontend |
| Doc API | Scramble | Zero anotação manual, OpenAPI 3.1 |
| Frontend | React (principal) / Angular (legado) | React é o padrão atual do projeto |
| Estado global | Zustand (React) / NgRx Signals (Angular) | Leve, sem boilerplate |
| Queries HTTP | TanStack Query | Cache, loading, retry automático |
