import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminTenantsService } from '@/services/admin-tenants.service';
import { PageBody } from '@/components/common/page-body';
import { FormPanel } from '@/components/grid/form-panel';
import { FormFieldGrid, FormFieldGridItem } from '@/components/grid/form-field-grid';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePageToolbar } from '@/hooks/use-page-toolbar';

export function TranslationsTenantPickerPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tenantId, setTenantId] = useState('');

  const { data } = useQuery({
    queryKey: ['admin-tenants-all'],
    queryFn: () => adminTenantsService.list(1, 100),
  });

  const tenants = data?.data.result.data ?? [];

  usePageToolbar({
    title: t('settings.translations.title'),
    description: 'Selecione a empresa para configurar as traduções.',
  });

  return (
    <PageBody>
      <FormPanel title="Empresa">
        <FormFieldGrid>
          <FormFieldGridItem span={2}>
            <div className="space-y-2">
              <Label required>Empresa</Label>
              <Select
                value={tenantId}
                onValueChange={(value) => {
                  setTenantId(value);
                  navigate(`/admin/translations/${value}`);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name} ({tenant.slug})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FormFieldGridItem>
        </FormFieldGrid>
      </FormPanel>
    </PageBody>
  );
}
