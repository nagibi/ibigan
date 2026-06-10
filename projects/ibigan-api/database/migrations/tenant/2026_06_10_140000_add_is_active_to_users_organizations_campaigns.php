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
        if (! Schema::hasColumn('users', 'is_active')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->boolean('is_active')->default(true)->after('status');
            });

            DB::table('users')
                ->where('status', 'inactive')
                ->update(['is_active' => false]);
        }

        if (! Schema::hasColumn('campaigns', 'is_active')) {
            Schema::table('campaigns', function (Blueprint $table): void {
                $table->boolean('is_active')->default(true)->after('status');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'is_active')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->dropColumn('is_active');
            });
        }

        if (Schema::hasColumn('campaigns', 'is_active')) {
            Schema::table('campaigns', function (Blueprint $table): void {
                $table->dropColumn('is_active');
            });
        }
    }
};
