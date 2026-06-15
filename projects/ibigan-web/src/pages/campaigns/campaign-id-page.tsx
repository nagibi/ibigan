import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CampaignDetailPage } from '@/pages/campaigns/campaign-detail-page';
import { CampaignFormPage } from '@/pages/campaigns/campaign-form-page';
import { FormPageSkeleton } from '@/components/grid/form-page-skeleton';
import { PageBody } from '@/components/common/page-body';
import { isCampaignEditable } from '@/lib/campaign-badges';
import { campaignsService } from '@/services/campaigns.service';

export function CampaignIdPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignsService.show(Number(id)),
    enabled: Boolean(id),
  });

  const campaign = data?.data.result;

  if (isLoading) {
    return (
      <PageBody>
        <FormPageSkeleton panels={[{ titleWidth: 'w-48', fields: 4 }]} />
      </PageBody>
    );
  }

  if (isError || !campaign) {
    return <CampaignDetailPage />;
  }

  if (isCampaignEditable(campaign)) {
    return <CampaignFormPage key={`campaign-form-${campaign.id}`} />;
  }

  return <CampaignDetailPage key={`campaign-detail-${campaign.id}`} />;
}
