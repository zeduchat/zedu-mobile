/**
 * React Native's default TS libs expose a minimal URLSearchParams type
 * without mutating methods. Augment so `.set()` / `.append()` type-check.
 */
declare global {
  interface URLSearchParams {
    set(name: string, value: string): void;
    append(name: string, value: string): void;
    delete(name: string): void;
  }
}

export {};
