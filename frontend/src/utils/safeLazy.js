import { lazy } from 'react';

/**
 * safeLazy — Wraps React.lazy() to handle dynamic import 404 / chunk load errors automatically.
 * When a new build is deployed to Vercel/PaaS, old chunk filenames change.
 * If the user's browser requests an old chunk, this wrapper catches the 404 and reloads the page once
 * so the browser fetches the latest HTML and bundle manifest.
 */
export function safeLazy(importFn) {
  return lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      const errorMessage = error?.message || String(error);
      const isChunkError =
        error?.name === 'ChunkLoadError' ||
        /Failed to fetch dynamically imported module/i.test(errorMessage) ||
        /Importing a module script failed/i.test(errorMessage) ||
        /Loading chunk/i.test(errorMessage);

      if (isChunkError) {
        const reloadKey = `chunk_reload_${window.location.pathname}`;
        const hasReloaded = sessionStorage.getItem(reloadKey);

        if (!hasReloaded) {
          sessionStorage.setItem(reloadKey, 'true');
          window.location.reload();
          return new Promise(() => {}); // Suspend while reloading
        }
      }
      throw error;
    }
  });
}

export default safeLazy;
