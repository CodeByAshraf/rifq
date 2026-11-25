import type { CapacitorConfig } from "@capacitor/cli";

/**
 * RIFQ as an Android / iOS app. The web bundle is built by `npm run build:app` into mobile/www.
 * appId is permanent once the app is published on Google Play / the App Store.
 */
const config: CapacitorConfig = {
  appId: "app.rifq.quran",
  appName: "رِفق",
  webDir: "mobile/www",
  android: {
    path: "mobile/android",
    // Never allow plain-http content inside the app.
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    path: "mobile/ios",
    contentInset: "never",
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#0d7870",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: false,
      splashImmersive: false,
    },
    LocalNotifications: {
      smallIcon: "ic_stat_rifq",
      iconColor: "#0d7870",
    },
  },
};

export default config;
