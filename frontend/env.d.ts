/// <reference types="vite/client" />

// Minimal typing for import.meta.env for the Vite config and other root-level files
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
