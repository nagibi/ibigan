<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_message_templates', function (Blueprint $table): void {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('subject');
            $table->longText('body');
            $table->json('merge_tags')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('platform_report_templates', function (Blueprint $table): void {
            $table->id();
            $table->string('platform_key')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->longText('query');
            $table->json('parameters')->nullable();
            $table->json('columns')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_report_templates');
        Schema::dropIfExists('platform_message_templates');
    }
};
