/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_DEV_API_DOCS_URL?: string;
  readonly VITE_DEV_HORIZON_URL?: string;
  readonly VITE_DEV_PHPMYADMIN_URL?: string;
  readonly VITE_DEV_MAILPIT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
