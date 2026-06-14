<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Central;

use App\Data\CentralProfileData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Central\UpdateCentralProfilePasswordRequest;
use App\Http\Requests\Central\UpdateCentralProfileRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

final class CentralProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        /** @var \App\Models\Central\CentralUser $user */
        $user = $request->user();
        $user->load('media');

        return response()->json([
            'status' => 1,
            'message' => 'MSG000067',
            'result' => CentralProfileData::fromModel($user),
        ]);
    }

    public function update(UpdateCentralProfileRequest $request): JsonResponse
    {
        /** @var \App\Models\Central\CentralUser $user */
        $user = $request->user();
        $user->update($request->validated());

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => CentralProfileData::fromModel($user->fresh()->load('media')),
        ]);
    }

    public function updatePassword(UpdateCentralProfilePasswordRequest $request): JsonResponse
    {
        /** @var \App\Models\Central\CentralUser $user */
        $user = $request->user();
        $user->update([
            'password' => Hash::make($request->validated('password')),
        ]);

        $user->tokens()->where('id', '!=', $user->currentAccessToken()->id)->delete();

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => null,
        ]);
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'max:2048'],
        ]);

        /** @var \App\Models\Central\CentralUser $user */
        $user = $request->user();
        $user->addMediaFromRequest('avatar')
            ->toMediaCollection('avatar');

        return response()->json([
            'status' => 1,
            'message' => 'MSG000425',
            'result' => CentralProfileData::fromModel($user->refresh()->load('media')),
        ]);
    }

    public function deleteAvatar(Request $request): JsonResponse
    {
        $request->user()->clearMediaCollection('avatar');

        return response()->json([
            'status' => 1,
            'message' => 'MSG000426',
            'result' => null,
        ]);
    }
}
