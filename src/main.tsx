// Entry point of the Android / iOS app (Capacitor). Hash routing, everything bundled for
// offline use. Built by scripts/build-app.mjs into mobile/www.
import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { FirstVisitIntro } from "@/components/shell/FirstVisitIntro";
import { PageTransition, TapEffects } from "@/components/shell/Fx";
import { initNativeShell } from "@/lib/native";
import { navigate, usePathname } from "@/lib/router";
import { ROUTES } from "./routes";

function App() {
  const path = usePathname();
  const Screen = ROUTES[path] ?? ROUTES["/"];
  useEffect(() => {
    void initNativeShell(navigate);
  }, []);
  return (
    <>
      <TapEffects />
      <FirstVisitIntro />
      <PageTransition key={path}>
        <Screen />
      </PageTransition>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
