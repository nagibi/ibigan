<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (! Schema::hasColumn('users', 'is_super_admin')) {
                    $table->boolean('is_super_admin')->default(false)->after('status');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'is_super_admin')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('is_super_admin');
            });
        }
    }
};
