<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Support\Facades\Storage;
use JsonException;
use RuntimeException;

final class ReportResultStorage
{
    public function store(int $executionId, array $rows): string
    {
        if (! tenancy()->initialized) {
            throw new RuntimeException('Report results require an initialized tenant context.');
        }

        $path = $this->pathForExecution($executionId);
        $contents = json_encode($rows, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);

        $stored = Storage::disk('local')->put($path, $contents);

        if ($stored === false || ! Storage::disk('local')->exists($path)) {
            throw new RuntimeException("Report result file was not persisted: {$path}");
        }

        return $path;
    }

    public function exists(?string $path): bool
    {
        return $this->load($path) !== null;
    }

    /**
     * @return array<int, array<string, mixed>>|null
     */
    public function load(?string $path): ?array
    {
        if (! is_string($path) || $path === '') {
            return null;
        }

        foreach ($this->relativeCandidates($path) as $candidate) {
            if (! Storage::disk('local')->exists($candidate)) {
                continue;
            }

            $decoded = json_decode(Storage::disk('local')->get($candidate), true);

            if (is_array($decoded)) {
                return $decoded;
            }
        }

        return $this->loadFromAbsoluteCandidates($path);
    }

    public function pathForExecution(int $executionId): string
    {
        return "reports/{$executionId}.json";
    }

    /**
     * @return list<string>
     */
    private function relativeCandidates(string $path): array
    {
        return array_values(array_unique([
            $path,
            "private/{$path}",
        ]));
    }

    /**
     * @return array<int, array<string, mixed>>|null
     */
    private function loadFromAbsoluteCandidates(string $path): ?array
    {
        foreach ($this->absoluteCandidates($path) as $absolutePath) {
            if (! is_readable($absolutePath)) {
                continue;
            }

            try {
                $decoded = json_decode((string) file_get_contents($absolutePath), true, 512, JSON_THROW_ON_ERROR);
            } catch (JsonException) {
                continue;
            }

            if (is_array($decoded)) {
                return $decoded;
            }
        }

        return null;
    }

    /**
     * @return list<string>
     */
    private function absoluteCandidates(string $path): array
    {
        $storageRoot = storage_path();
        $candidates = [
            "{$storageRoot}/app/private/{$path}",
            "{$storageRoot}/app/{$path}",
        ];

        if (tenancy()->initialized) {
            $tenantSegment = config('tenancy.filesystem.suffix_base').tenant()->getTenantKey();

            $candidates[] = "{$storageRoot}/{$tenantSegment}/app/private/{$path}";
            $candidates[] = "{$storageRoot}/{$tenantSegment}/app/{$path}";
        }

        return array_values(array_unique($candidates));
    }
}
