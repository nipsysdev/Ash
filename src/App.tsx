import "./App.css";
import { LsdThemeStyles } from "@nipsysdev/lsd-react/theme";
import { PortalProvider } from "@nipsysdev/lsd-react/client/PortalProvider";
import WelcomeView from "./views/WelcomeView.tsx";

export default function App() {
  return (
    <>
      <LsdThemeStyles />
      <PortalProvider>
        <WelcomeView />
      </PortalProvider>
    </>
  );
}
