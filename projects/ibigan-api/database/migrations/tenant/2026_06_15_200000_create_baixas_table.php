<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('baixas', function (Blueprint $table) {
            $table->id();

            $table->foreignId('equipamento_id')->constrained('equipamentos');

            $table->enum('tipo', ['devolucao', 'perda']);

            $table->date('data_baixa');
            $table->text('motivo')->nullable();
            $table->string('foto_path')->nullable();

            $table->string('responsavel_perda')->nullable();
            $table->decimal('valor_reposicao', 10, 2)->nullable();

            $table->foreignId('registrado_por')->nullable()->constrained('users');

            $table->text('observacoes')->nullable();
            $table->timestamps();

            $table->index('equipamento_id');
            $table->index('tipo');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('baixas');
    }
};
