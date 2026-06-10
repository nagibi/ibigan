<?php

declare(strict_types=1);

namespace App\Actions\Organization;

use App\Enums\OrganizationStatus;
use App\Http\Requests\Organization\StoreOrganizationRequest;
use App\Models\Organization;
use App\Repositories\Contracts\OrganizationRepositoryInterface;

final class CreateOrganizationAction
{
    public function __construct(
        private readonly OrganizationRepositoryInterface $organizationRepository,
    ) {}

    public function execute(StoreOrganizationRequest $request): Organization
    {
        return $this->organizationRepository->create([
            'name' => $request->validated('name'),
            'slug' => $request->validated('slug'),
            'cnpj' => $request->validated('cnpj'),
            'status' => $request->validated('status', OrganizationStatus::Active->value),
            'description' => $request->validated('description'),
        ]);
    }
}
