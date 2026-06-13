<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('menus')
            ->where('slug', 'templates-relatorio')
            ->update([
                'title' => 'Modelos de Relatório',
                'translation_key' => 'menu.report_templates',
            ]);
    }

    public function down(): void
    {
        DB::table('menus')
            ->where('slug', 'templates-relatorio')
            ->update([
                'title' => 'Relatórios',
                'translation_key' => 'menu.report_templates',
            ]);
    }
};
