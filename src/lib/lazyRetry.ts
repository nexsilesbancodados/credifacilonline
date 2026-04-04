import { lazy, ComponentType } from "react";

/**
 * Wraps React.lazy with automatic retry + cache-busting for production deploys.
 * When a chunk fails to load (common after a new deploy), it retries with a
 * cache-busting query parameter to force re-fetching the new asset manifest.
 */
export function lazyRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
  retries = 3
) {
  return lazy(() => retryImport(factory, retries));
}

async function retryImport<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
  retries: number
): Promise<{ default: T }> {
  try {
    return await factory();
  } catch (error) {
    if (retries <= 0) {
      // All retries exhausted — check if we should do a full page reload
      // to pick up the new deployment's asset manifest
      const reloadKey = "chunk_reload_v2";
      const lastReload = sessionStorage.getItem(reloadKey);
      const now = Date.now();
      if (!lastReload || now - Number(lastReload) > 30000) {
        sessionStorage.setItem(reloadKey, String(now));
        window.location.reload();
      }
      throw error;
    }

    const delay = 1000 * (4 - retries);
    await new Promise((r) => setTimeout(r, delay));
    return retryImport(factory, retries - 1);
  }
}
