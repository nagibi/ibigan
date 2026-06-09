<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Actions\User\CreateUserAction;
use App\Actions\User\UpdateUserAction;
use App\Data\UserData;
use App\Enums\WebhookEvent;
use App\Http\Controllers\Concerns\TogglesModelActive;
use App\Http\Controllers\Controller;
use App\Http\Requests\ToggleActiveRequest;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Jobs\ExportUsersJob;
use App\Models\User;
use App\Notifications\UserCreatedNotification;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Services\WebhookDispatchService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class UserController extends Controller
{
    use TogglesModelActive;

    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
        private readonly CreateUserAction $createUserAction,
        private readonly UpdateUserAction $updateUserAction,
        private readonly WebhookDispatchService $webhookDispatchService,
    ) {}

    /**
     * Listar usuários paginados.
     *
     * Requer permissão `usuario-visualizar`.
     */
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('usuario-visualizar'), Response::HTTP_FORBIDDEN);

        $columnFilters = collect($request->query())
            ->filter(
                fn (mixed $value, string|int $key): bool => is_string($key)
                    && str_starts_with($key, 'filter_')
                    && filled($value)
            )
            ->all();

        $users = $this->userRepository->paginate(
            perPage: $request->integer('per_page', 15),
            filters: [
                ...$request->only(['search', 'status', 'sort', 'direction']),
                ...$columnFilters,
            ],
        );

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => [
                'data' => UserData::collect($users->items()),
                'meta' => [
                    'current_page' => $users->currentPage(),
                    'last_page' => $users->lastPage(),
                    'per_page' => $users->perPage(),
                    'total' => $users->total(),
                ],
            ],
        ]);
    }

    /**
     * Retornar um usuário específico.
     *
     * Requer permissão `usuario-visualizar`.
     */
    public function show(Request $request, int $user): JsonResponse
    {
        abort_unless($request->user()->can('usuario-visualizar'), Response::HTTP_FORBIDDEN);

        $model = $this->userRepository->findOrFail($user)->load(['roles', 'creator', 'updater']);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => UserData::fromModel($model),
        ]);
    }

    /**
     * Criar novo usuário.
     *
     * Requer permissão `usuario-gerenciar`. Dispara notificação e webhook `user.created`.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        abort_unless($request->user()->can('usuario-gerenciar'), Response::HTTP_FORBIDDEN);

        $user = $this->createUserAction->execute($request);

        User::role(['admin', 'super-admin'])->each(
            fn (User $admin) => $admin->notify(new UserCreatedNotification($user))
        );

        $this->webhookDispatchService->dispatch(
            WebhookEvent::UserCreated->value,
            UserData::fromModel($user)->toArray(),
        );

        return response()->json([
            'status' => 1,
            'message' => 'MSG000424',
            'result' => UserData::fromModel($user),
        ], Response::HTTP_CREATED);
    }

    /**
     * Atualizar usuário existente.
     *
     * Requer permissão `usuario-gerenciar`. Dispara webhook `user.updated`.
     */
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        abort_unless($request->user()->can('usuario-gerenciar'), Response::HTTP_FORBIDDEN);

        $updatedUser = $this->updateUserAction->execute($user, $request);

        $this->webhookDispatchService->dispatch(
            WebhookEvent::UserUpdated->value,
            UserData::fromModel($updatedUser)->toArray(),
        );

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => UserData::fromModel($updatedUser),
        ]);
    }

    /**
     * Remover usuário.
     *
     * Requer permissão `usuario-gerenciar`. Dispara webhook `user.deleted`.
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        abort_unless($request->user()->can('usuario-gerenciar'), Response::HTTP_FORBIDDEN);

        $userData = UserData::fromModel($user)->toArray();

        $this->userRepository->delete($user);

        $this->webhookDispatchService->dispatch(
            WebhookEvent::UserDeleted->value,
            $userData,
        );

        return response()->json([
            'status' => 1,
            'message' => 'MSG000426',
            'result' => null,
        ]);
    }

    /**
     * Iniciar exportação de usuários para Excel.
     *
     * Requer permissão `usuario-gerenciar`. A exportação é processada em fila.
     */
    public function export(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('usuario-gerenciar'), Response::HTTP_FORBIDDEN);

        ExportUsersJob::dispatch($request->user()->id);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => [
                'message' => 'Exportação iniciada. Você receberá uma notificação quando estiver pronta.',
            ],
        ]);
    }

    /**
     * Fazer upload do avatar de um usuário.
     *
     * Requer permissão `usuario-gerenciar`. Aceita JPG, PNG ou WebP até 2MB.
     */
    /**
     * Ativar ou inativar usuário.
     *
     * Requer permissão `usuario-gerenciar`.
     */
    public function toggleActive(ToggleActiveRequest $request, User $user): JsonResponse
    {
        return $this->performToggleActive($request, $user);
    }

    protected function toggleActivePermission(): string
    {
        return 'usuario-gerenciar';
    }

    protected function formatToggleActiveResult(Model $model): UserData
    {
        /** @var User $model */
        return UserData::fromModel($model->load(['roles', 'creator', 'updater']));
    }

    /**
     * Fazer upload do avatar de um usuário.
     *
     * Requer permissão `usuario-gerenciar`. Aceita JPG, PNG ou WebP até 2MB.
     */
    public function uploadAvatar(Request $request, int $user): JsonResponse
    {
        abort_unless($request->user()->can('usuario-gerenciar'), Response::HTTP_FORBIDDEN);

        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $model = $this->userRepository->findOrFail($user);

        $model
            ->addMediaFromRequest('avatar')
            ->toMediaCollection('avatar');

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => UserData::fromModel($model->fresh()),
        ]);
    }
}
