<?php

declare(strict_types=1);

namespace App\Search;

use Laravel\Scout\Searchable;

trait TenantSearchable
{
    use Searchable;

    /**
     * Nome do índice prefixado pelo tenant atual.
     * Ex.: "acme_users"
     */
    public function searchableAs(): string
    {
        $base = $this->defaultSearchableAs();

        if (tenancy()->initialized) {
            return tenant('id').'_'.$base;
        }

        return 'central_'.$base;
    }

    /**
     * Nome base do índice (sobrescrever por model se quiser).
     */
    protected function defaultSearchableAs(): string
    {
        return $this->getTable();
    }
}
