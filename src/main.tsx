import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import { VaultProvider } from "./store";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <VaultProvider>
        <App />
      </VaultProvider>
    </ErrorBoundary>
  </StrictMode>
);
