<?php

declare(strict_types=1);

namespace Tests;

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    public function createApplication(): Application
    {
        $app = require Application::inferBasePath().'/bootstrap/app.php';

        $app->make(Kernel::class)->bootstrap();

        $sqliteConfig = [
            'driver' => 'sqlite',
            'database' => ':memory:',
            'prefix' => '',
            'foreign_key_constraints' => true,
        ];

        config([
            'database.default' => 'central',
            'database.connections.central' => $sqliteConfig,
            'database.connections.sqlite' => $sqliteConfig,
            'tenancy.database.template_tenant_connection' => 'sqlite',
            'activitylog.enabled' => false,
        ]);

        return $app;
    }
}
