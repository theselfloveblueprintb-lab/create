// Storage abstraction: every consumer in the app talks to this interface,
// never to localStorage or a specific backend directly. That means the
// swap from local-only storage to Supabase (or any DB) later touches only
// the adapter implementation below — not components, hooks, or API routes.

export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
}
