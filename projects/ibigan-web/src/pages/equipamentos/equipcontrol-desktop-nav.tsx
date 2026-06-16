import { useLocation } from 'react-router-dom';
import { EquipcontrolNavItems } from '@/pages/equipamentos/equipcontrol-nav-link';

export function EquipcontrolDesktopNav() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Equipamentos"
      className="hidden min-w-0 border-b border-border pb-3 xl:block"
    >
      <div className="flex min-w-0 gap-1 overflow-x-auto">
        <EquipcontrolNavItems pathname={pathname} variant="desktop" />
      </div>
    </nav>
  );
}
