/// <reference types="vite/client" />

// Provide a minimal typing for import.meta.env so vite.config.ts and the app
// can access VITE_API_BASE_URL without TypeScript or linter errors.
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
