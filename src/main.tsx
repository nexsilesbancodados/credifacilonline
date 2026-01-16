import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Adicionar classe 'loaded' imediatamente quando o script executa
// Isso esconde o loader inicial e mostra o conteúdo do React
document.body.classList.add('loaded');

createRoot(document.getElementById("root")!).render(<App />);
