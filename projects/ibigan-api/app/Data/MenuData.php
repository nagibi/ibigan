<?php

declare(strict_types=1);

namespace App\Data;

use App\Models\Menu;
use Illuminate\Support\Collection;
use Spatie\LaravelData\Data;

final class MenuData extends Data
{
    /**
     * @param  array<int, string>|null  $roles
     * @param  array<int, self>  $children
     */
    public function __construct(
        public int $id,
        public string $title,
        public string $slug,
        public ?string $icon,
        public ?string $badge,
        public ?string $path,
        public string $target,
        public ?int $parent_id,
        public int $order,
        public bool $is_active,
        public bool $requires_auth,
        public ?array $roles,
        public array $children,
        public string $created_at,
        public string $updated_at,
    ) {}

    public static function fromModel(Menu $menu, ?array $children = null): self
    {
        if ($children === null) {
            $children = $menu->relationLoaded('children')
                ? $menu->children->map(fn (Menu $child): self => self::fromModel($child))->all()
                : [];
        }

        return new self(
            id: $menu->id,
            title: $menu->title,
            slug: $menu->slug,
            icon: $menu->icon,
            badge: $menu->badge,
            path: $menu->path,
            target: $menu->target,
            parent_id: $menu->parent_id,
            order: $menu->order,
            is_active: $menu->is_active,
            requires_auth: $menu->requires_auth,
            roles: $menu->roles,
            children: $children,
            created_at: $menu->created_at->toIso8601String(),
            updated_at: $menu->updated_at->toIso8601String(),
        );
    }

    /**
     * @param  Collection<int, Menu>  $menus
     * @return list<self>
     */
    public static function treeFromCollection(Collection $menus, ?int $parentId = null): array
    {
        return $menus
            ->where('parent_id', $parentId)
            ->sortBy('order')
            ->values()
            ->map(function (Menu $menu) use ($menus): self {
                return self::fromModel(
                    $menu,
                    self::treeFromCollection($menus, $menu->id),
                );
            })
            ->all();
    }

    /**
     * @param  array<int, string>  $userRoles
     */
    public static function visibleForUserRoles(Collection $menus, array $userRoles): Collection
    {
        return $menus->filter(
            fn (Menu $menu): bool => self::isVisibleForRoles($menu->roles, $userRoles),
        );
    }

    /**
     * @param  array<int, string>|null  $menuRoles
     * @param  array<int, string>  $userRoles
     */
    public static function isVisibleForRoles(?array $menuRoles, array $userRoles): bool
    {
        if (in_array('super-admin', $userRoles, true)) {
            return true;
        }

        if ($menuRoles === null || $menuRoles === []) {
            return true;
        }

        return count(array_intersect($menuRoles, $userRoles)) > 0;
    }

    /**
     * Remove grupos vazios (sem path e sem filhos visíveis).
     *
     * @param  list<self>  $tree
     * @return list<self>
     */
    public static function pruneEmptyGroups(array $tree): array
    {
        $pruned = [];

        foreach ($tree as $item) {
            $children = self::pruneEmptyGroups($item->children);

            if ($item->path === null && $children === []) {
                continue;
            }

            $pruned[] = new self(
                id: $item->id,
                title: $item->title,
                slug: $item->slug,
                icon: $item->icon,
                badge: $item->badge,
                path: $item->path,
                target: $item->target,
                parent_id: $item->parent_id,
                order: $item->order,
                is_active: $item->is_active,
                requires_auth: $item->requires_auth,
                roles: $item->roles,
                children: $children,
                created_at: $item->created_at,
                updated_at: $item->updated_at,
            );
        }

        return $pruned;
    }
}
