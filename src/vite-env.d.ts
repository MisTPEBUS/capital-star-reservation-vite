/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_LINE_OA_BASIC_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
