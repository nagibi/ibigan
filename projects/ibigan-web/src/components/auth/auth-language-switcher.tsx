import { Globe } from 'lucide-react';
import { I18N_LANGUAGES } from '@/i18n/config';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/providers/i18n-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type AuthLanguageSwitcherProps = {
  className?: string;
};

export function AuthLanguageSwitcher({ className }: AuthLanguageSwitcherProps) {
  const { currenLanguage, changeLanguage } = useLanguage();

  return (
    <div className={cn('z-10', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 shadow-sm"
            aria-label="Idioma"
          >
            <Globe className="size-4" />
            <img
              src={currenLanguage.flag}
              className="size-4 rounded-full"
              alt={currenLanguage.label}
            />
            <span>{currenLanguage.code.toUpperCase()}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuRadioGroup
            value={currenLanguage.code}
            onValueChange={(code) => {
              const language = I18N_LANGUAGES.find((item) => item.code === code);
              if (language) {
                changeLanguage(language);
              }
            }}
          >
            {I18N_LANGUAGES.map((language) => (
              <DropdownMenuRadioItem
                key={language.code}
                value={language.code}
                className="gap-2"
              >
                <img
                  src={language.flag}
                  className="size-4 rounded-full"
                  alt={language.label}
                />
                <span>{language.label}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
