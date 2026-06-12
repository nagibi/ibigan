<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('central')->dropIfExists('translations');
    }

    public function down(): void
    {
        // Restaurado apenas em rollback manual se necessário.
    }
};
