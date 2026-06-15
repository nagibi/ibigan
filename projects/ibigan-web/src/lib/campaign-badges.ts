import type { GridBadgeTone } from '@/components/grid/grid-badge';
import type { Campaign, CampaignDelivery } from '@/services/campaigns.service';

export const campaignStatusBadgeTone: Record<Campaign['status'], GridBadgeTone> = {
  draft: 'muted',
  scheduled: 'info',
  sending: 'warning',
  sent: 'success',
  cancelled: 'destructive',
};

export const channelBadgeTone: Record<string, GridBadgeTone> = {
  email: 'info',
  notification: 'primary',
  app: 'primary',
  whatsapp: 'success',
  push: 'warning',
  sms: 'secondary',
};

export const deliveryStatusBadgeTone: Record<CampaignDelivery['status'], GridBadgeTone> = {
  queued: 'muted',
  sent: 'info',
  delivered: 'primary',
  failed: 'destructive',
  opened: 'success',
  clicked: 'warning',
};

export function channelBadgeToneFor(channel: string): GridBadgeTone {
  return channelBadgeTone[channel] ?? 'secondary';
}

export function isCampaignEditable(campaign: Campaign): boolean {
  return campaign.status === 'draft';
}

export function isCampaignDeletable(campaign: Campaign): boolean {
  return campaign.status === 'draft' || campaign.status === 'cancelled';
}
