<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('user_approvals') || Schema::getConnection()->getDriverName() !== 'mysql') {
            return;
        }

        if (! Schema::hasColumn('user_approvals', 'rejection_reason')) {
            Schema::table('user_approvals', function (Blueprint $table): void {
                $table->text('rejection_reason')->nullable()->after('reviewed_by');
            });
        }

        if (Schema::hasColumn('user_approvals', 'notes')) {
            Schema::table('user_approvals', function (Blueprint $table): void {
                $table->dropColumn('notes');
            });
        }

        $connection = Schema::getConnection();
        $compositeIndex = $connection->select("SHOW INDEX FROM user_approvals WHERE Key_name = 'user_approvals_user_id_status_index'");

        if ($compositeIndex === []) {
            Schema::table('user_approvals', function (Blueprint $table): void {
                $table->index(['user_id', 'status']);
            });
        }

        $uniqueIndex = $connection->select("SHOW INDEX FROM user_approvals WHERE Key_name = 'user_approvals_user_id_unique'");

        if ($uniqueIndex !== []) {
            Schema::table('user_approvals', function (Blueprint $table): void {
                $table->dropUnique(['user_id']);
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('user_approvals') || Schema::getConnection()->getDriverName() !== 'mysql') {
            return;
        }

        Schema::table('user_approvals', function (Blueprint $table): void {
            $table->dropIndex(['user_id', 'status']);
            $table->unique('user_id');
        });

        if (Schema::hasColumn('user_approvals', 'rejection_reason')) {
            Schema::table('user_approvals', function (Blueprint $table): void {
                $table->text('notes')->nullable();
                $table->dropColumn('rejection_reason');
            });
        }
    }
};
