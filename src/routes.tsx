// Every screen of the app, by path (hash routing).
import type { ReactElement } from "react";
import { Adhkar } from "@/components/screens/Adhkar";
import { AdultDashboard } from "@/components/screens/AdultDashboard";
import { AppSettings } from "@/components/screens/AppSettings";
import { Certificates } from "@/components/screens/Certificates";
import { Challenges } from "@/components/screens/Challenges";
import { Fajr } from "@/components/screens/Fajr";
import { FajrWake } from "@/components/screens/FajrWake";
import { DeleteAccount } from "@/components/screens/DeleteAccountInfo";
import { Family } from "@/components/screens/Family";
import { Games } from "@/components/screens/Games";
import { JourneyMap } from "@/components/screens/JourneyMap";
import { KidsDashboard } from "@/components/screens/KidsDashboard";
import { Landing } from "@/components/screens/Landing";
import { Login } from "@/components/screens/Login";
import { Magdy } from "@/components/screens/Magdy";
import { Memorize } from "@/components/screens/Memorize";
import { More } from "@/components/screens/More";
import { Privacy } from "@/components/screens/Privacy";
import { QuranReader } from "@/components/screens/QuranReader";
import { Recite } from "@/components/screens/Recite";
import { Revision } from "@/components/screens/Revision";
import { Sources } from "@/components/screens/Sources";
import { Stories } from "@/components/screens/Stories";
import { Tajweed } from "@/components/screens/Tajweed";
import { Welcome } from "@/components/screens/Welcome";

export const ROUTES: Record<string, () => ReactElement> = {
  "/": Landing,
  "/kids": KidsDashboard,
  "/journey": JourneyMap,
  "/quran": QuranReader,
  "/memorize": Memorize,
  "/tajweed": Tajweed,
  "/play": Games,
  "/stories": Stories,
  "/revision": Revision,
  "/adult": AdultDashboard,
  "/family": Family,
  "/login": Login,
  "/welcome": Welcome,
  "/certificates": Certificates,
  "/adhkar": Adhkar,
  "/recite": Recite,
  "/challenges": Challenges,
  "/magdy": Magdy,
  "/app": AppSettings,
  "/more": More,
  "/sources": Sources,
  "/privacy": Privacy,
  "/delete-account": DeleteAccount,
  "/fajr": Fajr,
  "/fajr-wake": FajrWake,
};
