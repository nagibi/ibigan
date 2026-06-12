import { useTranslation } from 'react-i18next';
import { generalSettings } from '@/config/general.config';
import { Container } from '@/components/common/container';

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <Container>
        <div className="flex flex-col items-center justify-center gap-3 py-5 md:flex-row md:justify-between">
          <div className="order-2 flex gap-2 text-sm font-normal md:order-1">
            <span className="text-muted-foreground">
              {t('footer.copyright', { year: currentYear, app: generalSettings.appName })}
            </span>
          </div>
          <nav className="order-1 flex gap-4 text-sm font-normal text-muted-foreground md:order-2">
            <a
              href={generalSettings.siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary"
            >
              {generalSettings.appName}
            </a>
            <a
              href={generalSettings.docsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary"
            >
              {t('footer.docs')}
            </a>
            <a
              href={`mailto:${generalSettings.supportEmail}`}
              className="hover:text-primary"
            >
              {t('footer.support')}
            </a>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
