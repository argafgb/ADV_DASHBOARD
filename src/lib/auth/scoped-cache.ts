import "server-only";

import { unstable_cache } from "next/cache";
import { scopeKey } from "./data-scope";
import { getRequestDataScope, runWithDataScope } from "./request-scope";

/** Read the signed scope before entering Next's shared cache. */
export function scopedCache<Args extends unknown[], Result>(
  callback: (...args: Args) => Promise<Result>,
  keyParts?: string[],
  options?: { revalidate?: number | false; tags?: string[] },
): (...args: Args) => Promise<Result> {
  return async (...args: Args): Promise<Result> => {
    const scope = await getRequestDataScope();
    const cached = unstable_cache(
      (...innerArgs: Args) => runWithDataScope(scope, () => callback(...innerArgs)),
      [...(keyParts ?? []), scopeKey(scope)],
      options,
    );
    return cached(...args);
  };
}
