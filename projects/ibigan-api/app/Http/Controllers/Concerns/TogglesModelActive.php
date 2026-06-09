<?php

declare(strict_types=1);

namespace App\Http\Controllers\Concerns;

use App\Actions\ToggleActiveAction;
use App\Http\Requests\ToggleActiveRequest;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

trait TogglesModelActive
{
    abstract protected function toggleActivePermission(): string;

    abstract protected function formatToggleActiveResult(Model $model): mixed;

    protected function performToggleActive(ToggleActiveRequest $request, Model $model): JsonResponse
    {
        abort_unless(
            $request->user()->can($this->toggleActivePermission()),
            Response::HTTP_FORBIDDEN,
        );

        $updated = app(ToggleActiveAction::class)->execute(
            $model,
            $request->boolean('is_active'),
            $request->user()->id,
        );

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => $this->formatToggleActiveResult($updated),
        ]);
    }
}
