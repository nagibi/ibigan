<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('historico_equipamentos', function (Blueprint $table) {
            $table->id();

            $table->foreignId('equipamento_id')->constrained('equipamentos');

            $table->enum('evento', [
                'cadastrado',
                'emprestado',
                'devolvido',
                'manutencao_aberta',
                'manutencao_finalizada',
                'renovado',
                'baixado',
                'perda_registrada',
                'editado',
            ]);

            $table->json('dados')->nullable();

            $table->enum('status_resultante', [
                'em_estoque',
                'em_utilizacao',
                'em_manutencao',
                'baixado',
                'perdido',
            ]);

            $table->foreignId('registrado_por')->nullable()->constrained('users');
            $table->text('observacao')->nullable();

            $table->timestamp('created_at')->useCurrent();

            $table->index('equipamento_id');
            $table->index('evento');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('historico_equipamentos');
    }
};
