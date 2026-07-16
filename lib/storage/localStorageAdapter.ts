import type { StorageAdapter } from "./storageAdapter";

// Default adapter for v1: everything lives in the browser. Fine for a
// single-user prototype; swap for a SupabaseStorageAdapter (same interface)
// once check-ins need to sync across devices or survive a cleared cache.
export const localStorageAdapter: StorageAdapter = {
  async get<T>(key: string): Promise<T | null> {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  async set<T>(key: string, value: T): Promise<void> {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
  },
};
