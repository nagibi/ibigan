<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equipamento_fotos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equipamento_id')->constrained('equipamentos')->cascadeOnDelete();
            $table->string('path');
            $table->unsignedSmallInteger('ordem')->default(0);
            $table->timestamps();

            $table->index(['equipamento_id', 'ordem']);
        });

        if (! Schema::hasTable('equipamentos')) {
            return;
        }

        $equipamentos = DB::table('equipamentos')
            ->whereNotNull('foto_path')
            ->where('foto_path', '!=', '')
            ->get(['id', 'foto_path']);

        foreach ($equipamentos as $equipamento) {
            DB::table('equipamento_fotos')->insert([
                'equipamento_id' => $equipamento->id,
                'path' => $equipamento->foto_path,
                'ordem' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('equipamento_fotos');
    }
};
