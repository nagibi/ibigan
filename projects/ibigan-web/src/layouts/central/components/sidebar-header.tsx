import { Link } from 'react-router-dom';
import { toAbsoluteUrl } from '@/lib/helpers';
import { SidebarCollapseToggle } from '@/layouts/demo1/components/sidebar-collapse-toggle';

export function CentralSidebarHeader() {
  return (
    <div className="sidebar-header relative hidden shrink-0 items-center overflow-visible px-3 lg:flex lg:px-6">
      <Link to="/admin/tenants" className="relative z-0">
        <img
          src={toAbsoluteUrl('/media/app/mini-logo.svg')}
          className="default-logo h-[22px] max-w-none"
          alt="Ibigan"
        />
        <img
          src={toAbsoluteUrl('/media/app/mini-logo.svg')}
          className="small-logo h-[22px] max-w-none"
          alt="Ibigan"
        />
      </Link>
      <SidebarCollapseToggle />
    </div>
  );
}
