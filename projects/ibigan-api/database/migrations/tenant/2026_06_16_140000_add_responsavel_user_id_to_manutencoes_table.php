<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('manutencoes', function (Blueprint $table) {
            $table->foreignId('responsavel_user_id')
                ->nullable()
                ->after('motivo')
                ->constrained('users')
                ->nullOnDelete();

            $table->string('responsavel_manutencao')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('manutencoes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('responsavel_user_id');
            $table->string('responsavel_manutencao')->nullable(false)->change();
        });
    }
};
