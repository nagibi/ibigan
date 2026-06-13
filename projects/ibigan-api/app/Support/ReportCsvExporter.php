<?php

declare(strict_types=1);

namespace App\Support;

final class ReportCsvExporter
{
    /**
     * @param  array<int, array<string, mixed>>  $rows
     * @param  array<int, array{key: string, label: string}>|null  $columns
     */
    public static function toCsv(array $rows, ?array $columns): string
    {
        if ($rows === []) {
            return '';
        }

        $cols = ($columns !== null && $columns !== [])
            ? $columns
            : array_map(
                static fn (string $key): array => ['key' => $key, 'label' => $key],
                array_keys($rows[0]),
            );

        $header = implode(',', array_map(
            static fn (array $column): string => self::escape($column['label']),
            $cols,
        ));

        $lines = array_map(
            static function (array $row) use ($cols): string {
                return implode(',', array_map(
                    static fn (array $column): string => self::escape($row[$column['key']] ?? ''),
                    $cols,
                ));
            },
            $rows,
        );

        return "\xEF\xBB\xBF".$header."\n".implode("\n", $lines);
    }

    public static function sanitizeFileName(string $name): string
    {
        $sanitized = preg_replace('/[^\p{L}\p{N}\-_]+/u', '-', trim($name)) ?? 'relatorio';

        return trim($sanitized, '-') !== '' ? trim($sanitized, '-') : 'relatorio';
    }

    private static function escape(mixed $value): string
    {
        return '"'.str_replace('"', '""', (string) $value).'"';
    }
}
