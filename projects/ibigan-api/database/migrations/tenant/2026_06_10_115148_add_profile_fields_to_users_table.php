<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->date('birth_date')->nullable()->after('phone');
            $table->string('gender')->nullable()->after('birth_date'); // male|female|other|prefer_not_to_say
            $table->string('bio')->nullable()->after('gender');
            $table->timestamp('last_login_at')->nullable()->after('bio');
            $table->string('last_login_ip', 45)->nullable()->after('last_login_at');
            $table->string('last_login_device')->nullable()->after('last_login_ip');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'phone', 'birth_date', 'gender', 'bio',
                'last_login_at', 'last_login_ip', 'last_login_device',
            ]);
        });
    }
};
