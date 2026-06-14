<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('central')->table('central_users', function (Blueprint $table) {
            $table->string('two_factor_method', 10)->nullable()->after('two_factor_confirmed_at');
        });
    }

    public function down(): void
    {
        Schema::connection('central')->table('central_users', function (Blueprint $table) {
            $table->dropColumn('two_factor_method');
        });
    }
};
