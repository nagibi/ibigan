<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('report_executions', function (Blueprint $table) {
            // Remover colunas antigas
            $table->dropColumn(['duration_ms', 'error_message']);

            // Adicionar novas colunas
            $table->string('status')->default('queued')->change(); // queued|running|completed|failed
            $table->string('result_path')->nullable()->after('status');
            $table->unsignedInteger('result_rows_count')->default(0)->after('result_path');
            $table->timestamp('result_expires_at')->nullable()->after('result_rows_count');
            $table->string('progress_message')->nullable()->after('result_expires_at');
            $table->unsignedInteger('duration_ms')->default(0)->after('progress_message');
            $table->text('error_message')->nullable()->after('duration_ms');
        });
    }

    public function down(): void
    {
        Schema::table('report_executions', function (Blueprint $table) {
            $table->dropColumn([
                'result_path',
                'result_rows_count',
                'result_expires_at',
                'progress_message',
            ]);
        });
    }
};
