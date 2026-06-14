import type { ComponentProps } from 'react';
import { Switch } from '@/components/ui/switch';

/** Switch alinhado à altura dos inputs de formulário (h-8.5). */
export function FormSwitchControl(props: ComponentProps<typeof Switch>) {
  return (
    <div className="flex h-8.5 items-center">
      <Switch {...props} />
    </div>
  );
}
