<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('central')->create('translations', function (Blueprint $table) {
            $table->id();
            $table->string('key');
            $table->string('locale', 5);
            $table->text('value');
            $table->string('type')->default('text');
            $table->string('severity')->nullable();
            $table->string('module')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['key', 'locale']);
            $table->index(['locale', 'module', 'type', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::connection('central')->dropIfExists('translations');
    }
};
