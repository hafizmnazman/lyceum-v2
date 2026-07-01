import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import * as store from "./app/store.ts";
import "./index.css";

// A small test seam: lets the headless smoke and screenshot tooling inspect store
// state and drive it directly. Harmless in a no-backend demo.
(window as unknown as { __lyceum?: unknown }).__lyceum = store;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
