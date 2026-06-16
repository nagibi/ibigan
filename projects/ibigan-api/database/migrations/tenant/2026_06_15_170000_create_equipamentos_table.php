<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equipamentos', function (Blueprint $table) {
            $table->id();

            $table->string('patrimonio')->unique();
            $table->foreignId('tipo_id')->constrained('tipos_equipamento');
            $table->foreignId('fornecedor_id')->constrained('fornecedores');
            $table->foreignId('obra_id')->constrained('obras');

            $table->decimal('valor_mensal', 10, 2)->default(0);

            $table->string('foto_path')->nullable();

            $table->boolean('is_critico')->default(false);

            $table->date('data_entrada');

            $table->timestamps();
            $table->softDeletes();

            $table->index('patrimonio');
            $table->index('fornecedor_id');
            $table->index('obra_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipamentos');
    }
};
