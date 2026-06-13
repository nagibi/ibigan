<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Notifications\Messages\MailMessage;

final class PlainTextMailMessageBuilder
{
    public static function build(
        string $subject,
        string $body,
        ?string $actionLabel = null,
        ?string $actionUrl = null,
    ): MailMessage {
        $parts = self::bodyParts($body);

        $mail = (new MailMessage)
            ->subject($subject)
            ->greeting($parts[0] ?? '');

        $outroStart = count($parts) - 1;

        if ($actionLabel !== null && $actionUrl !== null && $outroStart > 1) {
            for ($index = 1; $index < $outroStart; $index++) {
                $mail->line($parts[$index]);
            }

            return $mail
                ->action($actionLabel, $actionUrl)
                ->line($parts[$outroStart] ?? '');
        }

        foreach (array_slice($parts, 1) as $line) {
            $mail->line($line);
        }

        if ($actionLabel !== null && $actionUrl !== null) {
            $mail->action($actionLabel, $actionUrl);
        }

        return $mail;
    }

    /**
     * @return list<string>
     */
    private static function bodyParts(string $body): array
    {
        $parts = preg_split("/\R(?:\s*\R)+/", trim($body)) ?: [];

        return array_values(array_filter(
            array_map(static fn (string $part): string => trim($part), $parts),
            static fn (string $part): bool => $part !== '',
        ));
    }
}
