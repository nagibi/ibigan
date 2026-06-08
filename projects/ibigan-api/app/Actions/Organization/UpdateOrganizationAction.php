<?php

declare(strict_types=1);

namespace App\Actions\Organization;

use App\Http\Requests\Organization\UpdateOrganizationRequest;
use App\Models\Organization;
use App\Repositories\Contracts\OrganizationRepositoryInterface;

final class UpdateOrganizationAction
{
    public function __construct(
        private readonly OrganizationRepositoryInterface $organizationRepository,
    ) {}

    public function execute(Organization $organization, UpdateOrganizationRequest $request): Organization
    {
        return $this->organizationRepository->update($organization, $request->validated());
    }
}
