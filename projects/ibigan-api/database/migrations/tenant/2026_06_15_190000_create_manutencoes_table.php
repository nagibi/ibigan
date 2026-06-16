<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('manutencoes', function (Blueprint $table) {
            $table->id();

            $table->foreignId('equipamento_id')->constrained('equipamentos');

            $table->enum('origem', ['estoque', 'emprestimo'])->default('estoque');
            $table->foreignId('emprestimo_id')->nullable()->constrained('emprestimos');

            $table->enum('responsabilidade', ['fortes', 'equipamento']);

            $table->string('motivo');
            $table->string('responsavel_manutencao');
            $table->text('observacoes_tecnicas')->nullable();

            $table->string('foto_path')->nullable();

            $table->decimal('valor_mensal_snapshot', 10, 2)->default(0);
            $table->boolean('desconto_medicao')->default(false);

            $table->date('data_entrada');
            $table->date('data_saida')->nullable();

            $table->foreignId('registrado_por')->nullable()->constrained('users');

            $table->timestamps();

            $table->index('equipamento_id');
            $table->index('data_saida');
            $table->index('responsabilidade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('manutencoes');
    }
};
