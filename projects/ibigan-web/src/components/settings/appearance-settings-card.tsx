import { useCallback, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Check, LoaderCircle } from 'lucide-react';
import { useSettings } from '@/providers/settings-provider';
import { cn } from '@/lib/utils';
import { FormPanel } from '@/components/grid/form-panel';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch, SwitchIndicator, SwitchWrapper } from '@/components/ui/switch';
import { toast } from 'sonner';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'dark', label: 'Escuro' },
  { value: 'light', label: 'Claro' },
  { value: 'system', label: 'Sistema' },
];

function ThemeModePreview({ mode }: { mode: ThemeMode }) {
  const sidebarClass =
    mode === 'dark'
      ? 'bg-zinc-800'
      : mode === 'light'
        ? 'bg-zinc-100'
        : 'bg-gradient-to-b from-zinc-100 from-0% via-zinc-100 via-50% to-zinc-800 to-50%';

  const headerClass =
    mode === 'dark'
      ? 'bg-zinc-700'
      : mode === 'light'
        ? 'bg-zinc-200'
        : 'bg-gradient-to-r from-zinc-200 from-0% via-zinc-200 via-50% to-zinc-700 to-50%';

  const contentClass =
    mode === 'dark'
      ? 'bg-zinc-700'
      : mode === 'light'
        ? 'bg-zinc-100'
        : 'bg-gradient-to-br from-zinc-100 from-0% via-zinc-100 via-45% to-zinc-700 to-55%';

  const accentClass =
    mode === 'dark'
      ? 'bg-emerald-500'
      : mode === 'light'
        ? 'bg-blue-500'
        : 'bg-gradient-to-r from-blue-500 from-0% to-emerald-500 to-100%';

  return (
    <div
      className={cn(
        'relative h-28 w-full overflow-hidden rounded-md border border-border/60',
        mode === 'dark' && 'bg-zinc-900',
        mode === 'light' && 'bg-white',
        mode === 'system' &&
          'bg-gradient-to-br from-white from-0% via-white via-48% to-zinc-900 to-52%',
      )}
    >
      {mode === 'system' && (
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent from-45% via-zinc-400/20 via-50% to-transparent to-55%"
          aria-hidden
        />
      )}
      <div className={cn('absolute bottom-0 left-0 top-0 w-[28%] border-e border-border/40', sidebarClass)}>
        <div className="mx-1.5 mt-2 h-1.5 w-3/4 rounded-sm bg-current opacity-20" />
        <div className="mx-1.5 mt-1.5 h-1 w-1/2 rounded-sm bg-current opacity-15" />
        <div className="mx-1.5 mt-1.5 h-1 w-2/3 rounded-sm bg-current opacity-15" />
        <div className="mx-1.5 mt-1.5 h-1 w-1/2 rounded-sm bg-current opacity-15" />
      </div>
      <div className={cn('absolute left-[28%] right-0 top-0 h-4 border-b border-border/40', headerClass)} />
      <div className="absolute left-[32%] right-2 top-6 space-y-1.5">
        <div className={cn('h-6 rounded-sm', contentClass)} />
        <div className="flex gap-1">
          <div className={cn('h-4 flex-1 rounded-sm', contentClass)} />
          <div className={cn('h-4 flex-1 rounded-sm', contentClass)} />
        </div>
        <div className={cn('h-1.5 w-1/3 rounded-full', accentClass)} />
      </div>
    </div>
  );
}

export function useAppearanceSettings() {
  const { settings, storeOption } = useSettings();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draftTheme, setDraftTheme] = useState<ThemeMode>('system');
  const [draftSidebarTransparent, setDraftSidebarTransparent] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setDraftTheme((theme as ThemeMode) ?? 'system');
    setDraftSidebarTransparent(settings.layouts.demo1.sidebarTransparent ?? false);
  }, [mounted, theme, settings.layouts.demo1.sidebarTransparent]);

  const hasChanges =
    mounted &&
    (draftTheme !== ((theme as ThemeMode) ?? 'system') ||
      draftSidebarTransparent !== (settings.layouts.demo1.sidebarTransparent ?? false));

  const discard = useCallback(() => {
    setDraftTheme((theme as ThemeMode) ?? 'system');
    setDraftSidebarTransparent(settings.layouts.demo1.sidebarTransparent ?? false);
  }, [settings.layouts.demo1.sidebarTransparent, theme]);

  const save = useCallback(async () => {
    if (!hasChanges) return;
    setIsSaving(true);
    try {
      setTheme(draftTheme);
      storeOption(
        'layouts.demo1.sidebarTheme',
        draftTheme === 'dark' ||
          (draftTheme === 'system' && resolvedTheme === 'dark')
          ? 'dark'
          : 'light',
      );
      storeOption('layouts.demo1.sidebarTransparent', draftSidebarTransparent);
      toast.success('Aparência salva com sucesso.');
    } finally {
      setIsSaving(false);
    }
  }, [
    draftSidebarTransparent,
    draftTheme,
    hasChanges,
    resolvedTheme,
    setTheme,
    storeOption,
  ]);

  return {
    mounted,
    isSaving,
    hasChanges,
    draftTheme,
    setDraftTheme,
    draftSidebarTransparent,
    setDraftSidebarTransparent,
    save,
    discard,
  };
}

export type AppearanceSettingsState = ReturnType<typeof useAppearanceSettings>;

export function AppearanceSettingsPanel({ state }: { state: AppearanceSettingsState }) {
  if (!state.mounted) {
    return (
      <FormPanel title="Tema">
        <div className="flex justify-center py-8">
          <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
        </div>
      </FormPanel>
    );
  }

  return (
    <FormPanel
      title="Tema"
      description="Selecione ou personalize o tema da interface."
    >
      <div className="space-y-8">
        <div className="space-y-4">
          <Label className="text-sm font-medium">Modo do tema</Label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {THEME_OPTIONS.map((option) => {
              const isSelected = state.draftTheme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => state.setDraftTheme(option.value)}
                  className="group flex flex-col gap-2 text-left outline-none"
                >
                  <div
                    className={cn(
                      'relative overflow-hidden rounded-lg p-1 transition-all',
                      isSelected
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                        : 'ring-1 ring-border hover:ring-primary/50',
                    )}
                  >
                    <ThemeModePreview mode={option.value} />
                    {isSelected && (
                      <span className="absolute bottom-2 left-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-center text-sm font-medium',
                      isSelected ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Sidebar transparente</Label>
            <p className="max-w-xl text-sm text-muted-foreground">
              Ative para uma sidebar com fundo translúcido ou desative para um fundo sólido.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <SwitchWrapper permanent>
              <SwitchIndicator state="on" className="text-[10px] font-medium">
                Visível
              </SwitchIndicator>
              <SwitchIndicator state="off" className="text-[10px] font-medium">
                Sólido
              </SwitchIndicator>
              <Switch
                size="sm"
                checked={state.draftSidebarTransparent}
                onCheckedChange={state.setDraftSidebarTransparent}
              />
            </SwitchWrapper>
          </div>
        </div>
      </div>
    </FormPanel>
  );
}

/** @deprecated Use AppearanceSettingsPanel with useAppearanceSettings */
export function AppearanceSettingsCard() {
  const appearance = useAppearanceSettings();
  return <AppearanceSettingsPanel state={appearance} />;
}
