import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global error handlers to prevent app crashes
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  // Prevent the error from crashing the app
  event.preventDefault();
});

window.addEventListener("error", (event) => {
  // Auto-recover from chunk load failures
  if (
    event.message?.includes("Failed to fetch dynamically imported module") ||
    event.message?.includes("Loading chunk") ||
    event.message?.includes("Importing a module script failed") ||
    event.message?.includes("error loading dynamically imported module")
  ) {
    const reloadKey = "global_chunk_reload";
    const lastReload = sessionStorage.getItem(reloadKey);
    const now = Date.now();
    if (!lastReload || now - Number(lastReload) > 30000) {
      sessionStorage.setItem(reloadKey, String(now));
      window.location.reload();
      return;
    }
  }
});

// Hide the initial loader and show the React content
document.body.classList.add("loaded");

createRoot(document.getElementById("root")!).render(<App />);
