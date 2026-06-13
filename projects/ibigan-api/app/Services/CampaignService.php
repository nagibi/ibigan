<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\CampaignRecipientType;
use App\Enums\CampaignStatus;
use App\Enums\DeliveryChannel;
use App\Enums\DeliveryStatus;
use App\Jobs\ProcessCampaignJob;
use App\Jobs\SendCampaignDeliveryJob;
use App\Mail\TemplateMailable;
use App\Models\Campaign;
use App\Models\CampaignDelivery;
use App\Models\User;
use App\Notifications\TemplateNotification;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Mail;
use Throwable;

final class CampaignService
{
    public function __construct(
        private readonly TemplateMailService $templateMailService,
    ) {}

    public function dispatch(Campaign $campaign): void
    {
        ProcessCampaignJob::dispatch($campaign->id);
    }

    public function process(Campaign $campaign): void
    {
        $campaign->update([
            'status' => CampaignStatus::Sending,
            'started_at' => now(),
        ]);

        $users = $this->resolveRecipients($campaign);
        $channels = $campaign->channels ?? ['email'];
        $queued = 0;

        foreach ($users as $user) {
            foreach ($channels as $channel) {
                $delivery = CampaignDelivery::query()->create([
                    'campaign_id' => $campaign->id,
                    'user_id' => $user->id,
                    'channel' => $channel,
                    'status' => DeliveryStatus::Queued,
                    'recipient_email' => $user->email,
                    'queued_at' => now(),
                ]);

                SendCampaignDeliveryJob::dispatch($delivery->id);
                $queued++;
            }
        }

        $campaign->update([
            'stats' => array_merge($campaign->stats ?? [], [
                'total_recipients' => $users->count(),
                'total_queued' => $queued,
            ]),
        ]);

        if ($queued === 0) {
            $this->finalizeCampaign($campaign);
        }
    }

    public function sendDelivery(CampaignDelivery $delivery): void
    {
        $delivery->loadMissing(['campaign.template', 'user']);
        $campaign = $delivery->campaign;
        $user = $delivery->user;

        if (! $user || ! $campaign) {
            $delivery->update([
                'status' => DeliveryStatus::Failed,
                'error_message' => 'Destinatário ou campanha não encontrados.',
            ]);

            $this->updateCampaignProgress($campaign);

            return;
        }

        try {
            $content = $this->resolveContent($campaign, $user);

            match ($delivery->channel) {
                DeliveryChannel::Email => Mail::to($delivery->recipient_email)->send(
                    new TemplateMailable($content['subject'], $content['body']),
                ),
                DeliveryChannel::Notification => $user->notify(new TemplateNotification(
                    subject: $content['subject'],
                    body: $content['body'],
                    slug: $campaign->template?->slug ?? 'campaign-'.$campaign->id,
                )),
                DeliveryChannel::Sms, DeliveryChannel::Whatsapp => throw new \RuntimeException('Canal ainda não implementado.'),
            };

            $delivery->update([
                'status' => DeliveryStatus::Sent,
                'sent_at' => now(),
                'error_message' => null,
            ]);
        } catch (Throwable $exception) {
            $delivery->update([
                'status' => DeliveryStatus::Failed,
                'error_message' => $exception->getMessage(),
            ]);
        }

        $this->updateCampaignProgress($campaign);
    }

    /**
     * @return Collection<int, User>
     */
    public function resolveRecipients(Campaign $campaign): Collection
    {
        $campaign->loadMissing('recipients');

        if ($campaign->recipients->isEmpty()) {
            return User::query()->get();
        }

        $users = collect();

        foreach ($campaign->recipients as $recipient) {
            $users = $users->merge(match ($recipient->type) {
                CampaignRecipientType::All => User::query()->get(),
                CampaignRecipientType::Role => User::role($recipient->value)->get(),
                CampaignRecipientType::Permission => User::permission($recipient->value)->get(),
                CampaignRecipientType::User => User::query()
                    ->where('id', $recipient->value)
                    ->get(),
            });
        }

        return $users->unique('id')->values();
    }

    /**
     * @return array{subject: string, body: string}
     */
    public function resolveContent(Campaign $campaign, User $user): array
    {
        $template = $campaign->template;

        if ($template === null) {
            throw new \RuntimeException('Campanha sem template de mensagem cadastrado.');
        }

        $mergeData = array_merge(
            $campaign->merge_data ?? [],
            [
                'nome' => $user->name,
                'name' => $user->name,
                'email' => $user->email,
            ],
        );

        return $this->templateMailService->resolve($template, $mergeData);
    }

    private function updateCampaignProgress(?Campaign $campaign): void
    {
        if (! $campaign) {
            return;
        }

        $pending = $campaign->deliveries()
            ->where('status', DeliveryStatus::Queued)
            ->count();

        if ($pending > 0) {
            return;
        }

        $this->finalizeCampaign($campaign);
    }

    private function finalizeCampaign(Campaign $campaign): void
    {
        $sent = $campaign->deliveries()->where('status', DeliveryStatus::Sent)->count();
        $failed = $campaign->deliveries()->where('status', DeliveryStatus::Failed)->count();

        $campaign->update([
            'status' => CampaignStatus::Sent,
            'finished_at' => now(),
            'stats' => array_merge($campaign->stats ?? [], [
                'sent' => $sent,
                'failed' => $failed,
            ]),
        ]);
    }
}
