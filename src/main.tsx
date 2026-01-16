import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Adicionar classe 'loaded' ao body após carregamento para ativar fallbacks CSS
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('loaded');
});

// Fallback: adicionar após 500ms se DOMContentLoaded já passou
setTimeout(() => {
  document.body.classList.add('loaded');
}, 500);

createRoot(document.getElementById("root")!).render(<App />);
