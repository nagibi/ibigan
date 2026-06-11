import api from '@/lib/axios';
import type { SearchGroup } from '@/hooks/use-global-search';

export const searchService = {
  search: (q: string) =>
    api
      .get<{ status: number; result: SearchGroup }>('/v1/search', { params: { q } })
      .then((response) => response.data.result),
};
