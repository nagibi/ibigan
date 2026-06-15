<?php

declare(strict_types=1);

use App\Models\Menu;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Menu::query()
            ->whereIn('slug', ['idiomas', 'traducoes'])
            ->update(['is_active' => false]);
    }

    public function down(): void
    {
        Menu::query()
            ->whereIn('slug', ['idiomas', 'traducoes'])
            ->update(['is_active' => true]);
    }
};
