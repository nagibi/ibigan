<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** @var list<string> */
    private array $slugsWithOperator = [
        'dashboard',
        'gestao',
        'campanhas',
        'templates-mensagem',
        'relatorios-grupo',
        'templates-relatorio',
        'minhas-execucoes',
        'conta',
        'notificacoes',
        'meu-perfil',
    ];

    public function up(): void
    {
        foreach ($this->slugsWithOperator as $slug) {
            $menu = DB::table('menus')->where('slug', $slug)->first();

            if ($menu === null) {
                continue;
            }

            $roles = json_decode($menu->roles ?? '[]', true);

            if (! is_array($roles) || in_array('operator', $roles, true)) {
                continue;
            }

            $roles[] = 'operator';

            DB::table('menus')
                ->where('id', $menu->id)
                ->update(['roles' => json_encode(array_values($roles))]);
        }
    }

    public function down(): void
    {
        foreach ($this->slugsWithOperator as $slug) {
            $menu = DB::table('menus')->where('slug', $slug)->first();

            if ($menu === null) {
                continue;
            }

            $roles = json_decode($menu->roles ?? '[]', true);

            if (! is_array($roles)) {
                continue;
            }

            $roles = array_values(array_filter(
                $roles,
                static fn (string $role): bool => $role !== 'operator',
            ));

            DB::table('menus')
                ->where('id', $menu->id)
                ->update(['roles' => json_encode($roles)]);
        }
    }
};
