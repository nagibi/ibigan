<?php

declare(strict_types=1);

namespace App\Actions\Central;

use App\Models\Central\PlatformMessageTemplate;

final class DuplicatePlatformMessageTemplateAction
{
    public function execute(PlatformMessageTemplate $template): PlatformMessageTemplate
    {
        return PlatformMessageTemplate::query()->create([
            'name' => $template->name.' (cópia)',
            'slug' => $this->uniqueSlug($template->slug),
            'subject' => $template->subject,
            'body' => $template->body,
            'merge_tags' => $template->merge_tags,
            'is_active' => false,
        ]);
    }

    private function uniqueSlug(string $base): string
    {
        $slug = $base.'-copia';
        $counter = 2;

        while (PlatformMessageTemplate::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-copia-'.$counter;
            $counter++;
        }

        return $slug;
    }
}
