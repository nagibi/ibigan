<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('emprestimos', function (Blueprint $table) {
            $table->id();

            $table->foreignId('equipamento_id')->constrained('equipamentos');
            $table->foreignId('obra_id')->constrained('obras');

            $table->string('colaborador_nome');
            $table->string('colaborador_matricula');
            $table->string('colaborador_whatsapp', 20)->nullable();

            $table->string('encarregado_nome');

            $table->date('data_retirada');
            $table->date('data_devolucao')->nullable();
            $table->integer('prazo_dias')->default(15);

            $table->string('foto_cracha_path')->nullable();
            $table->string('foto_equipamento_retirada_path')->nullable();
            $table->string('foto_assinatura_path')->nullable();

            $table->string('foto_equipamento_devolucao_path')->nullable();

            $table->foreignId('autorizado_por')->nullable()->constrained('users');

            $table->text('observacoes')->nullable();

            $table->timestamps();

            $table->index('equipamento_id');
            $table->index('data_devolucao');
            $table->index('obra_id');
        });

        Schema::create('emprestimo_renovacoes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('emprestimo_id')->constrained('emprestimos')->cascadeOnDelete();
            $table->date('data_renovacao');
            $table->integer('prazo_adicional_dias')->default(15);
            $table->foreignId('autorizado_por')->nullable()->constrained('users');
            $table->text('observacao')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('emprestimo_renovacoes');
        Schema::dropIfExists('emprestimos');
    }
};
