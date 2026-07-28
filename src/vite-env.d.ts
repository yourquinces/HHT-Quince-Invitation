/// <reference types="vite/client" />

// Build-time variables. Anything prefixed VITE_ is PUBLIC — it ships in the
// browser bundle. Never put a secret here. See .env.example.
interface ImportMetaEnv {
  /** Overrides the quince_leads endpoint used by /quince-cruises. */
  readonly VITE_QUINCE_LEADS_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
