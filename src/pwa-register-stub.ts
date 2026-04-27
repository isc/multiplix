// Stub for `virtual:pwa-register` used by preview builds where the PWA
// plugin is disabled (see vite.config.ts). The real module exposes
// registerSW; here it's a no-op so the import compiles and runs harmlessly.
export function registerSW(_options?: unknown): () => Promise<void> {
  return async () => undefined;
}
