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
            $table->string('cpf', 11)->nullable()->unique()->after('email');
            $table->string('phone', 11)->nullable()->after('cpf');
            $table->date('birth_date')->nullable()->after('phone');
            $table->string('gender', 32)->nullable()->after('birth_date');
            $table->text('bio')->nullable()->after('gender');
        });
    }

    public function down(): void
    {
        Schema::connection('central')->table('central_users', function (Blueprint $table) {
            $table->dropColumn(['cpf', 'phone', 'birth_date', 'gender', 'bio']);
        });
    }
};
