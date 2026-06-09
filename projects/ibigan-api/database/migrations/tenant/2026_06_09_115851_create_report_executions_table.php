<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_executions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_template_id')->constrained()->onDelete('cascade');
            $table->foreignId('executed_by')->constrained('users')->onDelete('cascade');
            $table->json('parameters')->nullable();
            $table->unsignedInteger('rows_count')->default(0);
            $table->unsignedInteger('duration_ms')->default(0);
            $table->string('status')->default('success'); // success|error
            $table->text('error_message')->nullable();
            $table->timestamp('executed_at')->useCurrent();
            $table->timestamps();

            $table->index(['report_template_id', 'executed_at']);
            $table->index('executed_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_executions');
    }
};
