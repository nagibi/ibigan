<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class ReportExecution extends Model
{
    protected $fillable = [
        'report_template_id',
        'executed_by',
        'parameters',
        'rows_count',
        'duration_ms',
        'status',
        'error_message',
        'executed_at',
        'result_path',
        'result_rows_count',
        'result_expires_at',
        'progress_message',
    ];

    protected $casts = [
        'parameters' => 'array',
        'executed_at' => 'datetime',
        'result_expires_at' => 'datetime',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(ReportTemplate::class, 'report_template_id');
    }

    public function executor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'executed_by');
    }
}
