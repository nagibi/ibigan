import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from '@/hooks/use-debounce';

export function useEquipamentoUrlSearch(delay = 400) {
  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = searchParams.get('q')?.trim() ?? '';
  const [search, setSearch] = useState(qParam);
  const debouncedSearch = useDebounce(search.trim(), delay);

  useEffect(() => {
    setSearch(qParam);
  }, [qParam]);

  useEffect(() => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      const current = params.get('q')?.trim() ?? '';

      if (debouncedSearch === current) {
        return prev;
      }

      if (debouncedSearch) {
        params.set('q', debouncedSearch);
      } else {
        params.delete('q');
      }

      return params;
    }, { replace: true });
  }, [debouncedSearch, setSearchParams]);

  return { search, setSearch, debouncedSearch, qParam: debouncedSearch };
}
