import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";
import { cache } from "react";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "./jwt-verifier";
import { DENIED_SCOPE, type DataScope } from "./data-scope";

const scopeStorage = new AsyncLocalStorage<DataScope>();

const readScope = cache(async (): Promise<DataScope> => {
  if (
    process.env.NODE_ENV !== "production" &&
    (process.env.SKIP_AUTH === "true" || process.env.DISABLE_AUTH === "true")
  ) {
    return { all: true };
  }
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!token) return DENIED_SCOPE;
  return (await verifyAuthToken(token))?.dataScope ?? DENIED_SCOPE;
});

export async function getRequestDataScope(): Promise<DataScope> {
  return scopeStorage.getStore() ?? readScope();
}

export function runWithDataScope<T>(scope: DataScope, fn: () => Promise<T>): Promise<T> {
  return scopeStorage.run(scope, fn);
}
