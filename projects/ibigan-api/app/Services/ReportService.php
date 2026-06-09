<?php

declare(strict_types=1);

namespace App\Services;

use App\Jobs\ProcessReportJob;
use App\Models\ReportExecution;
use App\Models\ReportTemplate;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class ReportService
{
    private const FORBIDDEN_KEYWORDS = [
        'INSERT',
        'UPDATE',
        'DELETE',
        'DROP',
        'TRUNCATE',
        'ALTER',
        'CREATE',
        'GRANT',
        'REVOKE',
        'EXEC',
    ];

    public function executeRaw(ReportTemplate $template, array $params): array
    {
        $this->validateQuery($template->query);
        $query = $this->bindParameters($template->query, $params);
        $results = DB::connection('tenant')->select($query);

        return array_map(fn ($row) => (array) $row, $results);
    }

    public function execute(ReportTemplate $template, array $params, User $user): ReportExecution
    {
        $this->validateQuery($template->query);
        $this->validateParameters($template, $params);

        $execution = ReportExecution::create([
            'report_template_id' => $template->id,
            'executed_by' => $user->id,
            'parameters' => $params,
            'status' => 'queued',
            'progress_message' => 'Na fila...',
            'executed_at' => now(),
        ]);

        ProcessReportJob::dispatch($execution->id);

        return $execution;
    }

    private function validateQuery(string $query): void
    {
        $upper = strtoupper(trim($query));

        if (! str_starts_with($upper, 'SELECT')) {
            throw ValidationException::withMessages([
                'query' => 'Apenas queries SELECT são permitidas.',
            ]);
        }

        foreach (self::FORBIDDEN_KEYWORDS as $keyword) {
            if (preg_match('/\b'.$keyword.'\b/', $upper)) {
                throw ValidationException::withMessages([
                    'query' => "Keyword proibida detectada: {$keyword}",
                ]);
            }
        }
    }

    private function validateParameters(ReportTemplate $template, array $params): void
    {
        foreach ($template->parameters ?? [] as $param) {
            if (($param['required'] ?? false) && empty($params[$param['name']])) {
                throw ValidationException::withMessages([
                    $param['name'] => "O parâmetro '{$param['label']}' é obrigatório.",
                ]);
            }
        }
    }

    private function bindParameters(string $query, array $params): string
    {
        foreach ($params as $key => $value) {
            $escaped = DB::connection('tenant')->getPdo()->quote((string) $value);
            $query = str_replace(':'.$key, $escaped, $query);
        }

        return $query;
    }
}
