// Entry point of the Android / iOS app (Capacitor). Hash routing, everything bundled for
// offline use. Built by scripts/build-app.mjs into mobile/www.
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { FirstVisitIntro } from "@/components/shell/FirstVisitIntro";
import { PageTransition, TapEffects } from "@/components/shell/Fx";
import { ParentalGate } from "@/components/shell/ParentalGate";
import { initNativeShell } from "@/lib/native";
import { setArea } from "@/lib/area";
import { isUnlocked, PARENT_ROUTES } from "@/lib/parental-gate";
import { navigate, usePathname } from "@/lib/router";
import { ROUTES } from "./routes";

function App() {
  const path = usePathname();
  const Screen = ROUTES[path] ?? ROUTES["/"];
  const [, passed] = useState(0);
  const gated = PARENT_ROUTES.has(path) && !isUnlocked();
  setArea(path);
  useEffect(() => {
    void initNativeShell(navigate);
  }, []);
  return (
    <>
      <TapEffects />
      <FirstVisitIntro />
      <PageTransition key={path}>
        {gated ? <ParentalGate onPass={() => passed((n) => n + 1)} /> : <Screen />}
      </PageTransition>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
