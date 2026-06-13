<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Tenant;

use App\Data\MenuData;
use App\Http\Controllers\Concerns\TogglesModelActive;
use App\Http\Controllers\Controller;
use App\Http\Requests\Menu\StoreMenuRequest;
use App\Http\Requests\Menu\UpdateMenuRequest;
use App\Http\Requests\ToggleActiveRequest;
use App\Models\Menu;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

final class MenuController extends Controller
{
    use TogglesModelActive;

    /**
     * Menu de navegação para o usuário autenticado (somente itens ativos).
     */
    public function navigation(Request $request): JsonResponse
    {
        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => $this->buildMenuTreeForUser($request, activeOnly: true),
        ]);
    }

    /**
     * Listar menus em árvore hierárquica (gestão — inclui inativos).
     */
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('menu-visualizar'), Response::HTTP_FORBIDDEN);

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => $this->buildMenuTreeForUser($request),
        ]);
    }

    /**
     * @return list<MenuData>
     */
    private function buildMenuTreeForUser(Request $request, bool $activeOnly = false): array
    {
        $userRoles = $request->user()->getRoleNames()->all();

        $query = Menu::query()->orderBy('order');

        if ($activeOnly) {
            $query->where('is_active', true);
        }

        $visibleMenus = MenuData::visibleForUserRoles($query->get(), $userRoles);

        return MenuData::pruneEmptyGroups(MenuData::treeFromCollection($visibleMenus));
    }

    /**
     * Retornar um item de menu específico.
     */
    public function show(Request $request, Menu $menu): JsonResponse
    {
        abort_unless($request->user()->can('menu-visualizar'), Response::HTTP_FORBIDDEN);

        $menu->load('children');

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => MenuData::fromModel($menu),
        ]);
    }

    /**
     * Criar item de menu.
     */
    public function store(StoreMenuRequest $request): JsonResponse
    {
        abort_unless($request->user()->can('menu-gerenciar'), Response::HTTP_FORBIDDEN);

        $menu = Menu::query()->create($request->validated());

        return response()->json([
            'status' => 1,
            'message' => 'MSG000424',
            'result' => MenuData::fromModel($menu),
        ], Response::HTTP_CREATED);
    }

    /**
     * Atualizar item de menu.
     */
    public function update(UpdateMenuRequest $request, Menu $menu): JsonResponse
    {
        abort_unless($request->user()->can('menu-gerenciar'), Response::HTTP_FORBIDDEN);

        $menu->update($request->validated());

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => MenuData::fromModel($menu->fresh()),
        ]);
    }

    /**
     * Remover item de menu.
     */
    public function destroy(Request $request, Menu $menu): JsonResponse
    {
        abort_unless($request->user()->can('menu-gerenciar'), Response::HTTP_FORBIDDEN);

        $menu->delete();

        return response()->json([
            'status' => 1,
            'message' => 'MSG000426',
            'result' => null,
        ]);
    }

    /**
     * Ativar ou inativar item de menu.
     *
     * Requer permissão `menu-gerenciar`.
     */
    public function toggleActive(ToggleActiveRequest $request, Menu $menu): JsonResponse
    {
        return $this->performToggleActive($request, $menu);
    }

    protected function toggleActivePermission(): string
    {
        return 'menu-gerenciar';
    }

    protected function formatToggleActiveResult(Model $model): MenuData
    {
        /** @var Menu $model */
        return MenuData::fromModel($model);
    }

    /**
     * Reordenar menus (ordem e hierarquia).
     *
     * Payload: `{ items: [{ id, order, parent_id? }] }`
     */
    public function reorder(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('menu-gerenciar'), Response::HTTP_FORBIDDEN);

        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['required', 'integer', Rule::exists('menus', 'id')],
            'items.*.order' => ['required', 'integer', 'min:0'],
            'items.*.parent_id' => ['nullable', 'integer', Rule::exists('menus', 'id')],
        ]);

        foreach ($validated['items'] as $item) {
            Menu::query()
                ->whereKey($item['id'])
                ->update([
                    'order' => $item['order'],
                    'parent_id' => $item['parent_id'] ?? null,
                ]);
        }

        $menus = Menu::query()->orderBy('order')->get();

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => MenuData::treeFromCollection($menus),
        ]);
    }
}
