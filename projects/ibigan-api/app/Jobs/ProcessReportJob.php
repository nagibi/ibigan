<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Jobs\Concerns\TenantAwareJob;
use App\Models\ReportExecution;
use App\Notifications\ReportCompletedNotification;
use App\Services\NotificationPreferenceService;
use App\Services\ReportService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Storage;

final class ProcessReportJob implements ShouldQueue
{
    use TenantAwareJob;

    public int $timeout = 300;

    public function __construct(
        private readonly int $executionId,
    ) {}

    public function handle(
        ReportService $reportService,
        NotificationPreferenceService $prefService,
    ): void {
        $execution = ReportExecution::with(['template', 'executor'])->findOrFail($this->executionId);
        $template = $execution->template;
        $user = $execution->executor;

        try {
            $execution->update([
                'status' => 'running',
                'progress_message' => 'Executando query...',
            ]);

            $start = microtime(true);
            $results = $reportService->executeRaw($template, $execution->parameters ?? []);
            $duration = (int) ((microtime(true) - $start) * 1000);

            $path = "reports/{$execution->id}.json";
            Storage::disk('local')->put(
                $path,
                json_encode($results, JSON_UNESCAPED_UNICODE),
            );

            $execution->update([
                'status' => 'completed',
                'result_path' => $path,
                'result_rows_count' => count($results),
                'result_expires_at' => now()->addDays(7),
                'duration_ms' => $duration,
                'progress_message' => 'Concluído.',
            ]);

            if ($prefService->isEnabled($user, 'report.completed', 'app')) {
                $user->notify(new ReportCompletedNotification($execution, 'app'));
            }

            if ($prefService->isEnabled($user, 'report.completed', 'email')) {
                $user->notify(new ReportCompletedNotification($execution, 'email'));
            }
        } catch (\Exception $e) {
            $execution->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'progress_message' => 'Erro na execução.',
            ]);
        }
    }
}
