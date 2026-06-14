<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('message_templates', function (Blueprint $table) {
            $table->boolean('is_system')->default(false)->after('is_active');
        });

        Schema::table('report_templates', function (Blueprint $table) {
            $table->string('platform_key')->nullable()->unique()->after('name');
            $table->boolean('is_system')->default(false)->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('report_templates', function (Blueprint $table) {
            $table->dropColumn(['platform_key', 'is_system']);
        });

        Schema::table('message_templates', function (Blueprint $table) {
            $table->dropColumn('is_system');
        });
    }
};
