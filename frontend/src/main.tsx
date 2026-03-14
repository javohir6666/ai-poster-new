import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import * as Sentry from "@sentry/react";

import App from "./App.tsx";
import "./index.css";
import "./i18n/config";

const dsn = (import.meta as any).env?.VITE_SENTRY_DSN as string | undefined;
if (dsn) {
  Sentry.init({
    dsn,
    environment: ((import.meta as any).env?.MODE as string) || "development",
    tracesSampleRate: 0.1,
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>
);
