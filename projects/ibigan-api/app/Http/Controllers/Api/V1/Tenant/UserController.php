<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Actions\User\CreateUserAction;
use App\Actions\User\UpdateUserAction;
use App\Data\UserData;
use App\Enums\WebhookEvent;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Models\User;
use App\Notifications\UserCreatedNotification;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Services\WebhookDispatchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class UserController extends Controller
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
        private readonly CreateUserAction $createUserAction,
        private readonly UpdateUserAction $updateUserAction,
        private readonly WebhookDispatchService $webhookDispatchService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('usuario-visualizar'), Response::HTTP_FORBIDDEN);

        $users = $this->userRepository->paginate(
            perPage: $request->integer('per_page', 15),
            filters: $request->only(['search', 'status']),
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

    public function show(Request $request, int $user): JsonResponse
    {
        abort_unless($request->user()->can('usuario-visualizar'), Response::HTTP_FORBIDDEN);

        $model = $this->userRepository->findOrFail($user);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => UserData::fromModel($model),
        ]);
    }

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
}
