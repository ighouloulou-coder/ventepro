import { useEffect } from 'react';

/**
 * Hook qui re-charge les données quand Firebase met à jour le localStorage
 * via le syncManager (événement 'data-sync')
 */
export function useSyncReload(reloadFn: () => void, collectionName?: string) {
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!collectionName || detail?.collection === collectionName) {
        reloadFn();
      }
    };

    window.addEventListener('data-sync', handler);
    return () => window.removeEventListener('data-sync', handler);
  }, [reloadFn, collectionName]);
}
