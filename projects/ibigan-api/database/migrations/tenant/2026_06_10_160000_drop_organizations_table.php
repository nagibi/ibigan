<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('organizations');
    }

    public function down(): void
    {
        // Intencionalmente vazio — o model Organization foi removido.
    }
};
