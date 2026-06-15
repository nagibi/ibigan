import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';
import {
  I18N_CONFIG_KEY,
  I18N_DEFAULT_LANGUAGE,
  I18N_LANGUAGES,
  resolveLanguage,
} from '@/i18n/config';
import '@/i18n/i18next';
import i18n from '@/i18n/i18next';
import { I18nProviderProps, type Language } from '@/i18n/types';
import { loadTenantTranslationOverrides } from '@/lib/load-translations';
import { DirectionProvider as RadixDirectionProvider } from '@radix-ui/react-direction';
import { IntlProvider } from 'react-intl';
import { getData, setData } from '@/lib/storage';
import '@formatjs/intl-relativetimeformat/polyfill.js';
import '@formatjs/intl-relativetimeformat/locale-data/en.js';
import '@formatjs/intl-relativetimeformat/locale-data/pt.js';

const getInitialLanguage = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const langParam = urlParams.get('lang');

  if (langParam) {
    const matchedLanguage = resolveLanguage({ code: langParam as Language['code'] });
    if (matchedLanguage.code === langParam) {
      setData(I18N_CONFIG_KEY, matchedLanguage);
      return matchedLanguage;
    }
  }

  const storedLanguage = getData(I18N_CONFIG_KEY) as Language | undefined;
  if (storedLanguage?.code) {
    return resolveLanguage(storedLanguage);
  }

  return I18N_DEFAULT_LANGUAGE;
};

const initialProps: I18nProviderProps = {
  currenLanguage: getInitialLanguage(),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  changeLanguage: (_: Language) => {},
  isRTL: () => false,
  reloadTranslations: async () => {},
};

const TranslationsContext = createContext<I18nProviderProps>(initialProps);
const useLanguage = () => useContext(TranslationsContext);

const I18nProvider = ({ children }: PropsWithChildren) => {
  const [currenLanguage, setCurrenLanguage] = useState(
    initialProps.currenLanguage,
  );

  const reloadTranslations = useCallback(async () => {
    const locale = currenLanguage.code;
    await i18n.changeLanguage(locale);

    const tenantId = localStorage.getItem('ibigan_tenant_id');
    if (tenantId) {
      await loadTenantTranslationOverrides(locale, tenantId);
    }
  }, [currenLanguage.code]);

  const changeLanguage = (language: Language) => {
    const resolvedLanguage = resolveLanguage(language);
    setData(I18N_CONFIG_KEY, resolvedLanguage);
    setCurrenLanguage(resolvedLanguage);
  };

  const isRTL = () => currenLanguage.direction === 'rtl';

  useEffect(() => {
    document.documentElement.setAttribute('dir', currenLanguage.direction);
    document.documentElement.setAttribute('lang', currenLanguage.code);
    void reloadTranslations();
  }, [currenLanguage, reloadTranslations]);

  return (
    <TranslationsContext.Provider
      value={{
        isRTL,
        currenLanguage,
        changeLanguage,
        reloadTranslations,
      }}
    >
      <IntlProvider
        messages={currenLanguage.messages}
        locale={currenLanguage.code}
        defaultLocale={getInitialLanguage().code}
      >
        <RadixDirectionProvider dir={currenLanguage.direction}>
          {children}
        </RadixDirectionProvider>
      </IntlProvider>
    </TranslationsContext.Provider>
  );
};

export { I18nProvider, useLanguage };
