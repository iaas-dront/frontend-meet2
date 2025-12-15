
// src/main.tsx

import ReactDOM from "react-dom/client";
import AppRoutes from "./routes/index";
import "./styles/_global.sass";
import { AuthProvider } from "./components/AuthProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  // ❌ <React.StrictMode> — QUITADO PARA EVITAR DOBLE MONTAJE
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
);
