import type { ReactNode } from 'react';
import { ConfigProvider } from 'antd';
import { useGridAntdConfig } from '@/lib/antd-locale';

export function GridAntdConfigProvider({ children }: { children: ReactNode }) {
  const { locale, theme } = useGridAntdConfig();

  return (
    <ConfigProvider locale={locale} theme={theme}>
      {children}
    </ConfigProvider>
  );
}
