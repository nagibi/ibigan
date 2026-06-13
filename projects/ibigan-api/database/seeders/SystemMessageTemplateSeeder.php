<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Support\SystemMessageTemplates;
use Illuminate\Database\Seeder;

final class SystemMessageTemplateSeeder extends Seeder
{
    public function run(): void
    {
        SystemMessageTemplates::seed();
    }
}
