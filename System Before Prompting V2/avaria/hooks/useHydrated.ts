"use client";

import { useSyncExternalStore } from "react";

/**
 * Hook to detect when the client has hydrated
 * This prevents hydration mismatches with localStorage-based stores
 */
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
