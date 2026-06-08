# Diretrizes — Frontend React + Metronic 9
# IMPLEMENTAÇÃO INCREMENTAL — validar cada etapa antes de avançar

---

## REGRA FUNDAMENTAL

**Nunca implementar mais de uma seção por vez.**
Cada seção termina com um CHECKPOINT.
Só avançar quando o checkpoint passar.

---

## 0. Estado atual do Metronic 9 React (referência)

Metronic 9.2+ introduziu duas bibliotecas open source:
**ReUI** (para React) e **KtUI** (para HTML/JS), com design system unificado.
ReUI usa Radix UI primitives + Tailwind CSS 4 + shadcn/ui.

Versão atual: **v9.4.6** (março 2026).
Stack: React 19 + Vite 7 + React Router 7 + TanStack Query v5 + TypeScript strict.

**O que o Metronic 9 React já entrega (não reimplementar):**
- Sistema de layouts (14+ demos, escolher um)
- Componentes ReUI (DataGrid, Menu, Accordion, Scrollspy, Stepper, FileUpload)
- Sistema de temas (dark/light via CSS variables Tailwind 4)
- Internacionalização (i18n com react-i18next)
- Auth adapter pattern (trocar Supabase por Laravel Sanctum)
- Roteamento com React Router 7 + protected routes

**O que vamos adicionar/adaptar:**
- Auth adapter para Laravel Sanctum (substituir Supabase)
- Integração com sistema MSG* do backend
- WebSocket via Laravel Echo + Reverb
- Padrões de CRUD integrado com a API Laravel
- Multi-tenant (switch de organização)
- ACL baseada em permissions do Spatie

---

## FASE 1 — Setup e estrutura base
### Checkpoint 1: projeto rodando com layout escolhido

### 1.1 Stack definitiva

```
React 19
TypeScript (strict: true — sem any em nenhuma circunstância)
Vite 7
React Router 7 (file-based routing via Metronic)
TanStack Query v5 (@tanstack/react-query)
Zustand (estado global)
React Hook Form + Zod (formulários)
Axios (HTTP client)
Laravel Echo + pusher-js (WebSocket/Reverb)
ReUI (@keenthemes/reui) — componentes Metronic
Tailwind CSS 4
```

### 1.2 Estrutura de diretórios

```
src/
├── auth/                    # Sistema de auth do Metronic (MANTER estrutura)
│   ├── adapters/
│   │   └── laravel-adapter.ts   # Substitui supabase-adapter.ts
│   ├── context/
│   ├── providers/
│   │   └── laravel-provider.tsx
│   └── require-auth.tsx
│
├── api/                     # Camada HTTP — uma pasta por domínio
│   ├── client.ts            # Axios instance + interceptors
│   ├── users.ts
│   ├── organizations.ts
│   └── types.ts             # Tipos gerados pelo OpenAPI (Scramble)
│
├── components/
│   ├── ui/                  # ReUI + shadcn (NÃO modificar diretamente)
│   ├── common/              # Wrappers e extensões de componentes Metronic
│   │   ├── AppDataGrid/     # Extensão do DataGrid Metronic com defaults do projeto
│   │   ├── AppForm/         # Form base com React Hook Form + Zod
│   │   ├── StatusBadge/     # Badge de status (UserStatus, TenantStatus...)
│   │   ├── ConfirmDialog/   # Dialog de confirmação reutilizável
│   │   └── PageHeader/      # Header padrão de página (breadcrumb + actions)
│   └── features/            # Componentes específicos de domínio
│       ├── users/
│       ├── organizations/
│       └── notifications/
│
├── hooks/                   # Custom hooks
│   ├── useAppQuery.ts       # Wrapper TanStack Query com defaults
│   ├── useAppMutation.ts    # Wrapper mutation com toast automático
│   ├── useEcho.ts           # Laravel Echo / Reverb
│   ├── usePermission.ts     # Verificação ACL (Spatie permissions)
│   └── useTenant.ts         # Tenant ativo + switch
│
├── layouts/                 # Layouts do Metronic (usar os existentes)
│   └── demo1/               # Layout escolhido — NÃO recriar, adaptar
│
├── pages/                   # Páginas organizadas por domínio
│   ├── auth/
│   ├── account/
│   ├── users/
│   ├── organizations/
│   └── reports/
│
├── stores/                  # Zustand stores
│   ├── authStore.ts
│   ├── tenantStore.ts
│   └── notificationStore.ts
│
├── types/                   # Tipos TypeScript do projeto
│   ├── api.ts               # Tipos base de response
│   ├── messages.ts          # Sistema MSG*
│   └── permissions.ts       # Enum de permissions Spatie
│
└── utils/
    ├── messages.ts          # Parser MSG* com variáveis {{valor}}
    └── permissions.ts       # Helpers de ACL
```

### 1.3 Variáveis de ambiente

```bash
# .env.local (nunca commitar)
VITE_API_URL=http://localhost/api
VITE_API_VERSION=v1
VITE_REVERB_APP_KEY=saas_key
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8082
VITE_REVERB_SCHEME=http
VITE_APP_NAME="SaaS"
```

---

## CHECKPOINT 1
```
[ ] npm run dev sem erros
[ ] Layout escolhido renderizando
[ ] TypeScript sem erros (tsc --noEmit)
[ ] Variáveis de ambiente carregando
```

---

## FASE 2 — Autenticação com Laravel Sanctum
### Checkpoint 2: login/logout funcionando com a API real

### 2.1 Auth Adapter (substituir Supabase)

O Metronic usa o padrão adapter — basta criar `laravel-adapter.ts`:

```typescript
// src/auth/adapters/laravel-adapter.ts
import client from '@/api/client';
import type { AuthModel, UserModel } from '../lib/models';

export const LaravelAdapter = {
  async login(email: string, password: string): Promise<AuthModel> {
    const { data } = await client.post('/auth/login', { email, password });
    return {
      api_token: data.token,
      refreshToken: undefined, // Sanctum não usa refresh token padrão
    };
  },

  async logout(): Promise<void> {
    await client.post('/auth/logout');
  },

  async getUser(): Promise<UserModel> {
    const { data } = await client.get('/auth/me');
    return data.data;
  },

  async updateProfile(fields: Partial<UserModel>): Promise<UserModel> {
    const { data } = await client.put('/account/profile', fields);
    return data.data;
  },

  async requestPasswordReset(email: string): Promise<void> {
    await client.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string, confirmation: string): Promise<void> {
    await client.post('/auth/reset-password', {
      token,
      password,
      password_confirmation: confirmation,
    });
  },
};
```

### 2.2 Auth Store (Zustand)

```typescript
// src/stores/authStore.ts
interface AuthState {
  token: string | null;
  user: UserModel | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  setUser: (user: UserModel) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setToken: (token) => set({ token, isAuthenticated: true }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'saas-auth',
      // Não persistir dados sensíveis além do token
      partialize: (state) => ({ token: state.token }),
    }
  )
);
```

### 2.3 Tenant Store

```typescript
// src/stores/tenantStore.ts
interface TenantState {
  currentTenant: TenantModel | null;
  availableTenants: TenantModel[];
  setCurrentTenant: (tenant: TenantModel) => void;
  setAvailableTenants: (tenants: TenantModel[]) => void;
  clearTenant: () => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      currentTenant: null,
      availableTenants: [],
      setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
      setAvailableTenants: (tenants) => set({ availableTenants: tenants }),
      clearTenant: () => set({ currentTenant: null }),
    }),
    { name: 'saas-tenant', partialize: (s) => ({ currentTenant: s.currentTenant }) }
  )
);
```

### 2.4 Axios client com interceptors

```typescript
// src/api/client.ts
import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';

const client = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/${import.meta.env.VITE_API_VERSION}`,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  withCredentials: true, // Sanctum SPA cookie
});

// Injeta token
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Injeta tenant ativo como header
  const tenant = useTenantStore.getState().currentTenant;
  if (tenant) config.headers['X-Tenant-ID'] = tenant.id;

  return config;
});

// Trata respostas de erro globalmente
client.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiError>) => {
    const { addNotification } = useNotificationStore.getState();
    const status = error.response?.status;

    if (status === 401) {
      useAuthStore.getState().logout();
      window.location.replace('/auth/signin');
      return Promise.reject(error);
    }

    // Erros 422 são tratados pelo formulário — não mostrar toast
    if (status === 422) return Promise.reject(error);

    if (status === 403) {
      addNotification({ code: 'MSG_FORBIDDEN', type: 'toast',
        severity: 'danger', description: 'Ação não autorizada.' });
    }

    if (status && status >= 500) {
      addNotification({ code: 'MSG_SERVER_ERROR', type: 'toast',
        severity: 'danger', description: 'Erro interno. Tente novamente.' });
    }

    return Promise.reject(error);
  }
);

export default client;
```

---

## CHECKPOINT 2
```
[ ] Login com email/senha retorna token da API Laravel
[ ] Token armazenado no Zustand persist
[ ] Header Authorization enviado nas requests
[ ] 401 → redirect para /auth/signin
[ ] Logout limpa store e redireciona
[ ] Tela de login usando componentes Metronic (não recriar do zero)
```

---

## FASE 3 — Sistema de mensagens MSG*
### Checkpoint 3: toasts e alerts funcionando com os códigos do backend

### 3.1 Tipos

```typescript
// src/types/messages.ts
export type MessageSeverity = 'success' | 'danger' | 'warning' | 'primary' | 'info' | 'purple';
export type MessageType = 'text' | 'toast' | 'alert';

export interface AppMessage {
  code: string;
  type: MessageType;
  severity?: MessageSeverity;
  description: string;
  variables?: Record<string, string>; // para {{valor}}
}
```

### 3.2 Parser de mensagens

```typescript
// src/utils/messages.ts

// Substitui {{chave}} pela variável correspondente
export function parseMessageVars(text: string, vars?: Record<string, string>): string {
  if (!vars) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

// Mapeia severity do backend para variante de componente Metronic
export function severityToVariant(severity: MessageSeverity): string {
  const map: Record<MessageSeverity, string> = {
    success: 'success',
    danger: 'destructive',
    warning: 'warning',
    primary: 'default',
    info: 'info',
    purple: 'secondary',
  };
  return map[severity] ?? 'default';
}
```

### 3.3 Notification Store

```typescript
// src/stores/notificationStore.ts
interface Notification extends AppMessage {
  id: string;
  readAt?: Date;
  createdAt: Date;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (msg: AppMessage) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (msg) => {
    const notification: Notification = {
      ...msg,
      id: crypto.randomUUID(),
      description: parseMessageVars(msg.description, msg.variables),
      createdAt: new Date(),
    };
    set((s) => ({
      notifications: [notification, ...s.notifications],
      unreadCount: s.unreadCount + 1,
    }));

    // Toasts disparam automaticamente via evento
    if (msg.type === 'toast') {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: notification }));
    }
  },

  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, readAt: new Date() } : n
      ),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, readAt: new Date() })),
      unreadCount: 0,
    })),

  dismiss: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
}));
```

### 3.4 Toast listener global (montar no App.tsx)

```typescript
// src/components/common/AppToastListener.tsx
import { useEffect } from 'react';
import { toast } from '@/components/ui/sonner'; // ReUI usa Sonner
import type { Notification } from '@/stores/notificationStore';

export function AppToastListener() {
  useEffect(() => {
    const handler = (e: CustomEvent<Notification>) => {
      const { description, severity } = e.detail;
      const fn = severity === 'danger' ? toast.error
               : severity === 'success' ? toast.success
               : severity === 'warning' ? toast.warning
               : toast;
      fn(description);
    };

    window.addEventListener('app:toast', handler as EventListener);
    return () => window.removeEventListener('app:toast', handler as EventListener);
  }, []);

  return null;
}
```

---

## CHECKPOINT 3
```
[ ] addNotification({ code: 'MSG000408', type: 'toast', severity: 'danger', description: 'Teste' })
    → toast vermelho aparece
[ ] addNotification com type: 'alert' → não dispara toast
[ ] Variáveis {{valor}} são substituídas corretamente
[ ] Contador de não lidas incrementa
[ ] markAllRead zera contador
```

---

## FASE 4 — WebSocket (Reverb + Laravel Echo)
### Checkpoint 4: eventos chegando em tempo real

### 4.1 Configuração do Echo

```typescript
// src/utils/echo.ts
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import client from '@/api/client';

window.Pusher = Pusher;

export const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST,
  wsPort: Number(import.meta.env.VITE_REVERB_PORT),
  wssPort: Number(import.meta.env.VITE_REVERB_PORT),
  forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
  enabledTransports: ['ws', 'wss'],
  // Authorizer usa o client Axios (já tem token + tenant header)
  authorizer: (channel: { name: string }) => ({
    authorize: (socketId: string, callback: (err: unknown, data: unknown) => void) => {
      client
        .post('/broadcasting/auth', { socket_id: socketId, channel_name: channel.name })
        .then((r) => callback(null, r.data))
        .catch((e) => callback(e, null));
    },
  }),
});
```

### 4.2 Hook de notificações do usuário

```typescript
// src/hooks/useEcho.ts
import { useEffect } from 'react';
import { echo } from '@/utils/echo';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import type { AppMessage } from '@/types/messages';

// Escuta canal privado do usuário logado
export function useUserNotifications() {
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    if (!user?.id) return;

    const channel = echo.private(`user.${user.id}`);
    channel.listen('.notification.new', (payload: AppMessage) => {
      addNotification(payload);
    });

    return () => { echo.leave(`user.${user.id}`); };
  }, [user?.id]);
}

// Escuta canal do tenant (ex: grid updates)
export function useTenantChannel(tenantId: string | undefined, eventName: string, callback: (data: unknown) => void) {
  useEffect(() => {
    if (!tenantId) return;

    const channel = echo.private(`tenant.${tenantId}`);
    channel.listen(`.${eventName}`, callback);

    return () => { echo.leave(`tenant.${tenantId}`); };
  }, [tenantId, eventName]);
}
```

### 4.3 Hook de grid realtime (padrão do projeto atual)

```typescript
// src/hooks/useRealtimeGrid.ts
// Equivalente ao useDataGridRealtime que já existe no projeto
export function useRealtimeGrid(
  gridChannel: string, // ex: 'users', 'organizations'
  onUpdate: () => void
) {
  const { currentTenant } = useTenantStore();

  useTenantChannel(currentTenant?.id, `grid.${gridChannel}.updated`, onUpdate);
}
```

---

## CHECKPOINT 4
```
[ ] Echo conecta ao Reverb sem erros no console
[ ] Canal privado user.{id} autorizado (200 no /broadcasting/auth)
[ ] Disparar evento no Laravel → toast aparece no React em <1s
[ ] Deslogar → leave dos canais (sem memory leak)
```

---

## FASE 5 — Padrão de CRUD com DataGrid Metronic
### Checkpoint 5: grid de usuários com paginação, filtros e realtime

### 5.1 Hooks de query padronizados

```typescript
// src/hooks/useAppQuery.ts
// Wrapper com defaults do projeto
export function useAppQuery<T>(
  queryKey: unknown[],
  queryFn: () => Promise<T>,
  options?: UseQueryOptions<T>
) {
  return useQuery({
    queryKey,
    queryFn,
    staleTime: 1000 * 30,      // 30s — não refetch desnecessário
    retry: 1,
    ...options,
  });
}

// src/hooks/useAppMutation.ts
// Wrapper com toast automático baseado no response MSG*
export function useAppMutation<TData, TVariables>(
  mutationFn: (vars: TVariables) => Promise<{ data: TData; message?: string; description?: string }>,
  options?: {
    onSuccess?: (data: TData) => void;
    invalidates?: unknown[][];   // queryKeys para invalidar
    successMessage?: AppMessage;
  }
) {
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationStore();

  return useMutation({
    mutationFn,
    onSuccess: (response) => {
      // Invalida queries relacionadas
      options?.invalidates?.forEach((key) =>
        queryClient.invalidateQueries({ queryKey: key })
      );

      // Toast de sucesso (usa MSG* do response ou o fornecido)
      const msg = options?.successMessage ?? {
        code: response.message ?? 'MSG000067',
        type: 'toast' as const,
        severity: 'success' as const,
        description: response.description ?? 'Operação efetuada com sucesso!',
      };
      addNotification(msg);

      options?.onSuccess?.(response.data);
    },
  });
}
```

### 5.2 Camada de API por domínio

```typescript
// src/api/users.ts
export const userKeys = {
  all:    ()              => ['users'] as const,
  list:   (f: UserFilters) => ['users', 'list', f] as const,
  detail: (id: number)    => ['users', id] as const,
};

export const userApi = {
  list: (filters: UserFilters) =>
    client.get<PaginatedResponse<User>>('/users', { params: filters }).then(r => r.data),

  findById: (id: number) =>
    client.get<SingleResponse<User>>(`/users/${id}`).then(r => r.data),

  create: (dto: CreateUserDTO) =>
    client.post<SingleResponse<User>>('/users', dto).then(r => r.data),

  update: (id: number, dto: UpdateUserDTO) =>
    client.put<SingleResponse<User>>(`/users/${id}`, dto).then(r => r.data),

  remove: (id: number) =>
    client.delete(`/users/${id}`),

  activate: (id: number) =>
    client.patch<SingleResponse<User>>(`/users/${id}/activate`).then(r => r.data),

  deactivate: (id: number) =>
    client.patch<SingleResponse<User>>(`/users/${id}/deactivate`).then(r => r.data),
};

// Hooks prontos para usar nas páginas
export function useUsers(filters: UserFilters) {
  return useAppQuery(userKeys.list(filters), () => userApi.list(filters));
}

export function useCreateUser() {
  return useAppMutation(userApi.create, {
    invalidates: [userKeys.all()],
    successMessage: { code: 'MSG000067', type: 'toast', severity: 'success',
      description: 'Usuário criado com sucesso!' },
  });
}

export function useUpdateUser(id: number) {
  return useAppMutation((dto: UpdateUserDTO) => userApi.update(id, dto), {
    invalidates: [userKeys.all(), userKeys.detail(id)],
  });
}

export function useDeleteUser() {
  return useAppMutation((id: number) => userApi.remove(id), {
    invalidates: [userKeys.all()],
    successMessage: { code: 'MSG000067', type: 'toast', severity: 'success',
      description: 'Usuário removido com sucesso!' },
  });
}
```

### 5.3 Página de listagem padrão

```typescript
// src/pages/users/UsersPage.tsx
export function UsersPage() {
  const [filters, setFilters] = useState<UserFilters>({ page: 1, per_page: 15 });
  const { data, isLoading, refetch } = useUsers(filters);
  const { mutate: deleteUser } = useDeleteUser();

  // Grid atualiza automaticamente via WebSocket
  useRealtimeGrid('users', refetch);

  return (
    <div>
      <PageHeader
        title="Usuários"
        actions={<CreateUserButton />}
      />

      <AppDataGrid
        data={data?.data ?? []}
        meta={data?.meta}
        loading={isLoading}
        columns={userColumns}
        filters={filters}
        onFilterChange={setFilters}
        onDelete={(user) => deleteUser(user.id)}
      />
    </div>
  );
}
```

---

## CHECKPOINT 5
```
[ ] Grid de usuários carrega dados da API real
[ ] Paginação funciona (next/prev page)
[ ] Filtro de busca funciona com debounce
[ ] Criar usuário → grid atualiza (via refetch ou WebSocket)
[ ] Deletar usuário → confirmação → grid atualiza
[ ] Loading state aparece durante fetch
[ ] Estado vazio (nenhum resultado) renderiza corretamente
```

---

## FASE 6 — ACL (Spatie Permissions no frontend)
### Checkpoint 6: rotas e UI protegidas por permissão

### 6.1 Tipos de permissão

```typescript
// src/types/permissions.ts
// Espelha as permissões do Spatie — manter sincronizado com o backend
export const PERMISSIONS = {
  USERS: {
    VIEW:   'usuario-visualizar',
    MANAGE: 'usuario-gerenciar',
  },
  ORGANIZATIONS: {
    VIEW:   'empresa-visualizar',
    MANAGE: 'empresa-gerenciar',
  },
  REPORTS: {
    VIEW:   'relatorio-visualizar',
    MANAGE: 'relatorio-gerenciar',
  },
  MENUS: {
    VIEW:   'menu-visualizar',
    MANAGE: 'menu-gerenciar',
  },
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS][keyof typeof PERMISSIONS[keyof typeof PERMISSIONS]];
```

### 6.2 Hook de permissão

```typescript
// src/hooks/usePermission.ts
export function usePermission() {
  const { user } = useAuthStore();

  const can = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    if (user.isSuperUser) return true; // bypass total para super admin
    return user.permissions?.includes(permission) ?? false;
  }, [user]);

  const canAny = useCallback((...permissions: Permission[]): boolean =>
    permissions.some(can), [can]);

  const canAll = useCallback((...permissions: Permission[]): boolean =>
    permissions.every(can), [can]);

  return { can, canAny, canAll };
}
```

### 6.3 Componente de guarda

```typescript
// src/components/common/Can.tsx
interface CanProps {
  permission: Permission;
  fallback?: ReactNode;
  children: ReactNode;
}

export function Can({ permission, fallback = null, children }: CanProps) {
  const { can } = usePermission();
  return can(permission) ? <>{children}</> : <>{fallback}</>;
}

// Uso:
// <Can permission={PERMISSIONS.USERS.MANAGE}>
//   <Button>Criar usuário</Button>
// </Can>
```

### 6.4 Rota protegida por permissão

```typescript
// src/auth/require-permission.tsx
export function RequirePermission({ permission }: { permission: Permission }) {
  const { can } = usePermission();
  if (!can(permission)) return <Navigate to="/403" replace />;
  return <Outlet />;
}

// Nas rotas:
// <Route element={<RequirePermission permission={PERMISSIONS.USERS.VIEW} />}>
//   <Route path="/users" element={<UsersPage />} />
// </Route>
```

---

## CHECKPOINT 6
```
[ ] Usuário sem permissão não vê botão de criar/editar/deletar
[ ] Rota /users sem permissão usuario-visualizar → redirect /403
[ ] Super admin vê tudo independente de permissão
[ ] Permissões carregam do /auth/me junto com o user
```

---

## FASE 7 — Multi-tenant (switch de organização)
### Checkpoint 7: superusuário pode trocar de organização

### 7.1 Fluxo de switch

```typescript
// src/hooks/useTenant.ts
export function useTenant() {
  const { currentTenant, availableTenants, setCurrentTenant } = useTenantStore();
  const queryClient = useQueryClient();

  const switchTenant = useCallback(async (tenant: TenantModel) => {
    // 1. Limpa todo cache de queries do tenant anterior
    queryClient.clear();

    // 2. Atualiza store
    setCurrentTenant(tenant);

    // 3. Reconecta Echo no novo tenant
    echo.leave(`tenant.${currentTenant?.id}`);

    // 4. Redireciona para dashboard do novo tenant
    window.location.replace('/dashboard');
  }, [currentTenant, queryClient]);

  return { currentTenant, availableTenants, switchTenant };
}
```

### 7.2 Seletor de organização (no header do Metronic)

```typescript
// src/components/common/TenantSwitcher.tsx
// Plugar no slot de user menu do layout Metronic escolhido
export function TenantSwitcher() {
  const { currentTenant, availableTenants, switchTenant } = useTenant();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div>{currentTenant?.name ?? 'Selecionar organização'}</div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {availableTenants.map((tenant) => (
          <DropdownMenuItem
            key={tenant.id}
            onClick={() => switchTenant(tenant)}
            className={tenant.id === currentTenant?.id ? 'font-medium' : ''}
          >
            {tenant.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## CHECKPOINT 7
```
[ ] Após login, /auth/me retorna organizations disponíveis
[ ] TenantSwitcher aparece no header para superusuário
[ ] Trocar tenant → limpa cache → header mostra novo tenant
[ ] Requests subsequentes enviam X-Tenant-ID correto
[ ] Permissões recarregam para o novo contexto de tenant
```

---

## Regras gerais — aplicar em todas as fases

### O que NUNCA fazer
- `any` em TypeScript — se não souber o tipo, usar `unknown` e narrowing
- `response()->json()` cru no backend → sempre `JsonResource`; no frontend → sempre tipar o response
- Modificar componentes ReUI/shadcn diretamente — sempre criar wrapper em `components/common/`
- Lógica de negócio em componente de página — extrair para hook ou util
- `useEffect` para derivar estado — usar `useMemo` ou `useDerivedState`
- `localStorage` para armazenar dados sensíveis além do token
- Fetch sem loading/error/empty state
- Queries sem `queryKey` estável (causar refetch infinito)

### Nomenclatura
| Tipo | Convenção | Exemplo |
|---|---|---|
| Hook | `use{Domínio}{Ação}` | `useUsers`, `useCreateUser` |
| Store | `use{Domínio}Store` | `useAuthStore`, `useTenantStore` |
| API module | `{domínio}Api` | `userApi`, `orgApi` |
| Query keys | `{domínio}Keys` | `userKeys.list(filters)` |
| Componente | PascalCase | `UserForm`, `StatusBadge` |
| Página | `{Domínio}Page` | `UsersPage`, `OrganizationsPage` |
| Permission guard | `Can` ou `RequirePermission` | `<Can permission={...}>` |
| Tipo de API | `{Entidade}DTO` ou gerado | `UserDTO`, `CreateUserDTO` |

### Versionamento — regra obrigatória
```
git commit ANTES de começar cada fase
git commit AO PASSAR cada checkpoint
Mensagem: "feat: [FASE N] descrição" ou "checkpoint: [FASE N] passou"
NUNCA commitar código com TypeScript errors
NUNCA commitar console.log ou debugger
```
