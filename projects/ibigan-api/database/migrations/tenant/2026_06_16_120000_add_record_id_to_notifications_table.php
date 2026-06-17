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
        Schema::table('notifications', function (Blueprint $table): void {
            $table->unsignedBigInteger('record_id')->nullable()->unique();
        });

        $notificationIds = DB::table('notifications')
            ->orderBy('created_at')
            ->orderBy('id')
            ->pluck('id');

        foreach ($notificationIds as $index => $notificationId) {
            DB::table('notifications')
                ->where('id', $notificationId)
                ->update(['record_id' => $index + 1]);
        }
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table): void {
            $table->dropUnique(['record_id']);
            $table->dropColumn('record_id');
        });
    }
};
