<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Alinha ícones e ordem dos itens de operação do EquipControl com o rodapé mobile
 * (Package, Repeat2, Wrench — ver equipcontrol-bottom-nav.tsx).
 */
return new class extends Migration
{
    public function up(): void
    {
        $items = [
            'equipcontrol-estoque' => ['icon' => 'Package', 'order' => 1],
            'equipcontrol-movimentacoes' => ['icon' => 'Repeat2', 'order' => 2],
            'equipcontrol-manutencao' => ['icon' => 'Wrench', 'order' => 3],
        ];

        foreach ($items as $slug => $values) {
            DB::table('menus')
                ->where('slug', $slug)
                ->update($values);
        }
    }

    public function down(): void
    {
        $items = [
            'equipcontrol-estoque' => ['icon' => 'Package', 'order' => 1],
            'equipcontrol-manutencao' => ['icon' => 'Wrench', 'order' => 2],
            'equipcontrol-movimentacoes' => ['icon' => 'ArrowLeftRight', 'order' => 3],
        ];

        foreach ($items as $slug => $values) {
            DB::table('menus')
                ->where('slug', $slug)
                ->update($values);
        }
    }
};
