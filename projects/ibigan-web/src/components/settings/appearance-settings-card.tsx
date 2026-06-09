import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Monitor, Moon, PanelLeft, PanelTop, Sun } from 'lucide-react';
import { I18N_LANGUAGES } from '@/i18n/config';
import { useLanguage } from '@/providers/i18n-provider';
import { useSettings } from '@/providers/settings-provider';
import { type MenuMode } from '@/config/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export function AppearanceSettingsCard() {
  const { settings, storeOption } = useSettings();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { currenLanguage, changeLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const menuMode = settings.layouts.demo1.menuMode;
  const currentTheme = mounted ? (theme ?? 'system') : 'system';

  function handleMenuModeChange(value: MenuMode) {
    storeOption('layouts.demo1.menuMode', value);
    toast.success(value === 'horizontal' ? 'Menu horizontal ativado.' : 'Menu vertical ativado.');
  }

  function handleThemeChange(value: string) {
    setTheme(value);
    storeOption(
      'layouts.demo1.sidebarTheme',
      value === 'dark' || (value === 'system' && resolvedTheme === 'dark') ? 'dark' : 'light',
    );
    toast.success('Tema atualizado.');
  }

  function handleLanguageChange(code: string) {
    const language = I18N_LANGUAGES.find((lang) => lang.code === code);
    if (!language) return;
    changeLanguage(language);
    toast.success(`Idioma alterado para ${language.label}.`);
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Aparência e interface</CardTitle>
        <CardDescription>
          Personalize o layout do menu, tema e idioma da interface.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <PanelLeft className="size-4 text-muted-foreground" />
            Estilo do menu
          </Label>
          <Select value={menuMode} onValueChange={(v) => handleMenuModeChange(v as MenuMode)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o estilo do menu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sidebar">
                <span className="flex items-center gap-2">
                  <PanelLeft className="size-4" /> Vertical (sidebar)
                </span>
              </SelectItem>
              <SelectItem value="horizontal">
                <span className="flex items-center gap-2">
                  <PanelTop className="size-4" /> Horizontal (topo)
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Moon className="size-4 text-muted-foreground" />
            Tema
          </Label>
          <Select value={currentTheme} onValueChange={handleThemeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tema" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">
                <span className="flex items-center gap-2">
                  <Sun className="size-4" /> Claro
                </span>
              </SelectItem>
              <SelectItem value="dark">
                <span className="flex items-center gap-2">
                  <Moon className="size-4" /> Escuro
                </span>
              </SelectItem>
              <SelectItem value="system">
                <span className="flex items-center gap-2">
                  <Monitor className="size-4" /> Sistema
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Idioma</Label>
          <Select value={currenLanguage.code} onValueChange={handleLanguageChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o idioma" />
            </SelectTrigger>
            <SelectContent>
              {I18N_LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span className="flex items-center gap-2">
                    <img src={lang.flag} alt="" className="size-4 rounded-full" />
                    {lang.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
