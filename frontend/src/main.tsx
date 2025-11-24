import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { PresenceProvider } from "./contexts/PresenceContext";
import { CallProvider } from "./contexts/CallContext";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <ThemeProvider>
      <PresenceProvider>
        <CallProvider>
          <App />
        </CallProvider>
      </PresenceProvider>
    </ThemeProvider>
  </AuthProvider>
);
