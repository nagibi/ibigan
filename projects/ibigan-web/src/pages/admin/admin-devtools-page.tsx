import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Clock, ExternalLink, Gauge, ScrollText, Telescope } from 'lucide-react';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { PageBody } from '@/components/common/page-body';
import { buildDevToolsHref } from '@/lib/dev-tools-link';
import { DEV_TOOLS_URLS } from '@/lib/dev-tools-urls';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type DevToolItem = {
  id: string;
  titleKey: string;
  descriptionKey: string;
  url: string;
  icon: typeof Gauge;
};

export function AdminDevToolsPage() {
  const { t } = useTranslation();

  usePageToolbar({
    title: t('admin.devtools.title'),
    description: t('admin.devtools.description'),
  });

  const tools = useMemo<DevToolItem[]>(() => {
    const items: DevToolItem[] = [
      {
        id: 'horizon',
        titleKey: 'menu.horizon',
        descriptionKey: 'admin.devtools.horizon_description',
        url: DEV_TOOLS_URLS.horizon,
        icon: Gauge,
      },
      {
        id: 'telescope',
        titleKey: 'menu.telescope',
        descriptionKey: 'admin.devtools.telescope_description',
        url: DEV_TOOLS_URLS.telescope,
        icon: Telescope,
      },
      {
        id: 'clockwork',
        titleKey: 'menu.clockwork',
        descriptionKey: 'admin.devtools.clockwork_description',
        url: DEV_TOOLS_URLS.clockwork,
        icon: Clock,
      },
      {
        id: 'log-viewer',
        titleKey: 'menu.log_viewer',
        descriptionKey: 'admin.devtools.log_viewer_description',
        url: DEV_TOOLS_URLS.logViewer,
        icon: ScrollText,
      },
      {
        id: 'api-docs',
        titleKey: 'menu.api_docs',
        descriptionKey: 'admin.devtools.api_docs_description',
        url: DEV_TOOLS_URLS.apiDocs,
        icon: BookOpen,
      },
    ];

    if (import.meta.env.DEV) {
      items.push(
        {
          id: 'phpmyadmin',
          titleKey: 'menu.phpmyadmin',
          descriptionKey: 'admin.devtools.phpmyadmin_description',
          url: DEV_TOOLS_URLS.phpMyAdmin,
          icon: ExternalLink,
        },
        {
          id: 'mailpit',
          titleKey: 'menu.mailpit',
          descriptionKey: 'admin.devtools.mailpit_description',
          url: DEV_TOOLS_URLS.mailpit,
          icon: ExternalLink,
        },
      );
    }

    return items;
  }, []);

  return (
    <PageBody>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const href = buildDevToolsHref(tool.url);

          return (
            <Card key={tool.id} className="flex flex-col">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <CardTitle>{t(tool.titleKey)}</CardTitle>
                <CardDescription>{t(tool.descriptionKey)}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1" />
              <CardFooter>
                <Button asChild className="w-full">
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t('admin.devtools.open')}
                    <ExternalLink className="ms-2 size-4" />
                  </a>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
      <p className="mt-6 text-sm text-muted-foreground">
        {t('admin.devtools.hint')}
      </p>
    </PageBody>
  );
}
