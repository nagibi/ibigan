<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grupos_equipamento', function (Blueprint $table) {
            $table->id();
            $table->string('nome')->unique();
            $table->timestamps();
        });

        Schema::create('tipos_equipamento', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grupo_id')->constrained('grupos_equipamento');
            $table->string('nome');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tipos_equipamento');
        Schema::dropIfExists('grupos_equipamento');
    }
};
