<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('tenant_translations');
        Schema::dropIfExists('translations');
    }

    public function down(): void
    {
        Schema::create('tenant_translations', function ($table): void {
            $table->id();
            $table->string('key');
            $table->string('locale', 5);
            $table->text('value');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['key', 'locale']);
            $table->index(['locale', 'is_active']);
        });
    }
};
