import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { theme as antdTheme } from 'antd';
import enUS from 'antd/locale/en_US';
import ptBR from 'antd/locale/pt_BR';
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/pt-br';

export function getAntdLocale(language: string) {
  const base = language.split('-')[0]?.toLowerCase() ?? 'pt';
  return base === 'en' ? enUS : ptBR;
}

export function getAntdDateFormat(language: string) {
  const base = language.split('-')[0]?.toLowerCase() ?? 'pt';
  return base === 'en' ? 'MM/DD/YYYY' : 'DD/MM/YYYY';
}

export function getAntdDateFormatMask(language: string) {
  return {
    format: getAntdDateFormat(language),
    type: 'mask' as const,
  };
}

export function syncDayjsLocale(language: string) {
  const base = language.split('-')[0]?.toLowerCase() ?? 'pt';
  dayjs.locale(base === 'en' ? 'en' : 'pt-br');
}

export function useGridAntdConfig() {
  const { i18n } = useTranslation();
  const { resolvedTheme } = useTheme();

  return useMemo(() => {
    syncDayjsLocale(i18n.language);

    return {
      locale: getAntdLocale(i18n.language),
      dateFormat: getAntdDateFormat(i18n.language),
      dateFormatMask: getAntdDateFormatMask(i18n.language),
      theme: {
        algorithm: resolvedTheme === 'dark'
          ? antdTheme.darkAlgorithm
          : antdTheme.defaultAlgorithm,
        token: {
          fontSize: 12,
          controlHeight: 32,
          borderRadius: 6,
          colorBorder: 'var(--input)',
          colorBgContainer: 'var(--background)',
          colorText: 'var(--foreground)',
          colorTextPlaceholder: 'color-mix(in oklab, var(--muted-foreground) 80%, transparent)',
        },
        components: {
          DatePicker: {
            controlHeight: 32,
            fontSize: 12,
          },
        },
      },
    };
  }, [i18n.language, resolvedTheme]);
}
