import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, ExternalLink, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  SYSTEM_GUIDE_SECTIONS,
  guideItems,
  guideText,
  type GuideLocale,
} from '@/content/system-guide-content';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useLanguage } from '@/providers/i18n-provider';
import { PageBody } from '@/components/common/page-body';
import {
  GuideBlockList,
  GuideBlockText,
  GuideBlockTitle,
  GuideSectionCard,
} from '@/components/docs/guide-section-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DEV_TOOLS_URLS } from '@/lib/dev-tools-urls';
import { cn } from '@/lib/utils';

export function SystemDocsPage() {
  const { t } = useTranslation();
  const { currenLanguage } = useLanguage();
  const locale = (currenLanguage.code === 'en' ? 'en' : 'pt') as GuideLocale;
  const [activeSection, setActiveSection] = useState(SYSTEM_GUIDE_SECTIONS[0]?.id ?? 'intro');

  usePageToolbar({
    title: t('docs.page.title'),
    description: t('docs.page.description'),
  });

  const navItems = useMemo(
    () => SYSTEM_GUIDE_SECTIONS.map((section) => ({
      id: section.id,
      label: guideText(section.title, locale),
    })),
    [locale],
  );

  useEffect(() => {
    const elements = SYSTEM_GUIDE_SECTIONS
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => element instanceof HTMLElement);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target.id) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: '-20% 0px -55% 0px', threshold: [0, 0.25, 0.5, 1] },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return (
    <PageBody className="gap-6">
      <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-primary/5 via-background to-background">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <BookOpen className="size-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
                {t('docs.hero.title')}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
                {t('docs.hero.subtitle')}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={DEV_TOOLS_URLS.apiDocs} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
                {t('docs.hero.api_link')}
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="p-2">
            <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    'shrink-0 rounded-md px-3 py-2 text-sm transition-colors lg:shrink',
                    activeSection === item.id
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </Card>

          <Card className="mt-4 hidden p-4 lg:block">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Moon className="size-4 text-primary" />
              {t('docs.sidebar.tip_title')}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {t('docs.sidebar.tip_text')}
            </p>
            <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
              <Link to="/profile">{t('docs.sidebar.profile_link')}</Link>
            </Button>
          </Card>
        </aside>

        <div className="flex min-w-0 flex-col gap-5">
          {SYSTEM_GUIDE_SECTIONS.map((section) => (
            <GuideSectionCard
              key={section.id}
              id={section.id}
              icon={section.icon}
              title={guideText(section.title, locale)}
              summary={guideText(section.summary, locale)}
            >
              {section.blocks.map((block, index) => (
                <div key={`${section.id}-${index}`} className="space-y-2">
                  {block.title ? (
                    <GuideBlockTitle>{guideText(block.title, locale)}</GuideBlockTitle>
                  ) : null}
                  {block.text ? (
                    <GuideBlockText>{guideText(block.text, locale)}</GuideBlockText>
                  ) : null}
                  {block.items ? (
                    <GuideBlockList items={guideItems(block.items, locale)} />
                  ) : null}
                </div>
              ))}
            </GuideSectionCard>
          ))}
        </div>
      </div>
    </PageBody>
  );
}
