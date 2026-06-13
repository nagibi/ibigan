export const MENU_NAV_LINK_ACTIVE_CLASS =
  'relative max-w-full overflow-hidden rounded-lg bg-primary/10 font-semibold text-primary before:absolute before:inset-y-1 before:start-0 before:w-0.5 before:rounded-full before:bg-primary [&_[data-slot=accordion-menu-icon]]:!opacity-100';

export const MENU_NAV_GROUP_SELECTED_CLASS =
  'relative max-w-full overflow-hidden rounded-lg data-[selected=true]:bg-primary/10 data-[selected=true]:font-semibold data-[selected=true]:text-primary data-[selected=true]:[&_[data-slot=accordion-menu-icon]]:!opacity-100 data-[selected=true]:before:absolute data-[selected=true]:before:inset-y-1 data-[selected=true]:before:start-0 data-[selected=true]:before:w-0.5 data-[selected=true]:before:rounded-full data-[selected=true]:before:bg-primary';

/** Grupo com filho ativo — barra inferior, sem bloco de fundo (menu horizontal). */
export const MENU_HORIZONTAL_GROUP_ACTIVE_CLASS =
  'font-semibold text-primary shadow-[inset_0_-2px_0_0_hsl(var(--primary))]';

/** Item folha ativo no topo (menu horizontal). */
export const MENU_HORIZONTAL_LEAF_ACTIVE_CLASS =
  'bg-primary/10 font-semibold text-primary';

/** Item ativo dentro do dropdown (menu horizontal). */
export const MENU_HORIZONTAL_DROPDOWN_ACTIVE_CLASS =
  'relative bg-primary/10 font-medium text-primary before:absolute before:inset-y-1 before:start-0 before:w-0.5 before:rounded-full before:bg-primary';
