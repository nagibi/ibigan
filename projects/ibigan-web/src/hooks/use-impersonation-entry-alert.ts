import { useLayoutEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';

type ImpersonationLocationState = {
  impersonationAlert?: string;
};

/** Exibe alerta de entrada na empresa após navigate (evita flash no layout central). */
export function useImpersonationEntryAlert() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showSuccess } = useApiToolbarAlert();

  useLayoutEffect(() => {
    const message = (location.state as ImpersonationLocationState | null)?.impersonationAlert;
    if (!message) return;

    showSuccess(message);
    navigate(
      { pathname: location.pathname, search: location.search, hash: location.hash },
      { replace: true, state: null },
    );
  }, [location.hash, location.pathname, location.search, location.state, navigate, showSuccess]);
}
