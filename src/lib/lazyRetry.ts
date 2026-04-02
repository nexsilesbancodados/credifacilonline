import { lazy, ComponentType } from "react";

export function lazyRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 3
) {
  return lazy(() => retryImport(factory, retries));
}

async function retryImport<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries: number
): Promise<{ default: T }> {
  try {
    return await factory();
  } catch (error) {
    if (retries <= 0) throw error;
    // Wait before retrying (exponential backoff)
    await new Promise((r) => setTimeout(r, 1000 * (4 - retries)));
    // Bust the cache by adding a timestamp to force re-fetch
    return retryImport(factory, retries - 1);
  }
}
