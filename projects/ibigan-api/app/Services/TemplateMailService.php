<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\MessageTemplate;

final class TemplateMailService
{
    /**
     * @param  array<string, string>  $data
     */
    public function resolve(MessageTemplate $template, array $data): array
    {
        $subject = $this->replaceTags($template->subject, $data);
        $body = $this->replaceTags($template->body, $data);

        return compact('subject', 'body');
    }

    /**
     * @param  array<string, string>  $data
     */
    public function replace(string $content, array $data): string
    {
        return $this->replaceTags($content, $data);
    }

    /**
     * @param  array<string, string>  $data
     */
    private function replaceTags(string $content, array $data): string
    {
        foreach ($data as $tag => $value) {
            $content = str_replace('{{'.$tag.'}}', $value, $content);
            $content = preg_replace(
                '/\{\{\s*'.preg_quote((string) $tag, '/').'\s*\}\}/',
                $value,
                $content,
            ) ?? $content;
        }

        return $content;
    }
}
