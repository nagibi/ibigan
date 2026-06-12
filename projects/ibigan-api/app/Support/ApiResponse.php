<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Http\JsonResponse;

final class ApiResponse
{
    /**
     * @param  array<string, mixed>  $params
     */
    public static function success(
        mixed $result = null,
        string $messageCode = 'common.success',
        array $params = [],
        ?string $severity = null,
        int $httpStatus = 200,
    ): JsonResponse {
        $payload = [
            'success' => true,
            'message_code' => $messageCode,
            'params' => $params,
            'result' => $result,
            'status' => 1,
            'message' => $messageCode,
        ];

        if ($severity !== null) {
            $payload['severity'] = $severity;
        }

        return response()->json($payload, $httpStatus);
    }

    /**
     * @param  array<string, mixed>  $params
     * @param  list<array<string, mixed>>  $errors
     */
    public static function error(
        string $messageCode,
        array $params = [],
        array $errors = [],
        int $httpStatus = 400,
        ?string $severity = 'error',
    ): JsonResponse {
        $payload = [
            'success' => false,
            'message_code' => $messageCode,
            'params' => $params,
            'errors' => $errors,
            'status' => 0,
            'message' => $messageCode,
        ];

        if ($severity !== null) {
            $payload['severity'] = $severity;
        }

        return response()->json($payload, $httpStatus);
    }
}
