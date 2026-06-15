<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** @var list<string> */
    private array $accountSlugs = [
        'notificacoes',
        'meu-perfil',
        'conta',
    ];

    public function up(): void
    {
        DB::table('menus')
            ->whereIn('slug', $this->accountSlugs)
            ->delete();
    }

    public function down(): void
    {
        // Restaurado apenas via MenuSeeder / seed manual.
    }
};
