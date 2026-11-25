// Applies RIFQ's native settings to the Android and iOS projects. Safe to run any number of
// times (each change is skipped if already present). Run after `npx cap add android|ios`:
//
//   npm run app:configure
//
// Android: microphone (for «سمّع لنفسك»), notification and approximate-location permissions,
//          notification icon, Fajr alarm sound.
// iOS: Arabic as the development language, usage texts (microphone, camera, location),
//      export-compliance flag, the Privacy Manifest Apple requires, Fajr alarm sound.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const changed = [];
const patch = (file, fn) => {
  const p = path.join(root, file);
  if (!existsSync(p)) return console.warn(`skip (missing): ${file}`);
  const before = readFileSync(p, "utf8");
  const after = fn(before);
  if (after !== before) {
    writeFileSync(p, after);
    changed.push(file);
  }
};
const copyBinary = (from, file) => {
  const src = readFileSync(path.join(root, from));
  const p = path.join(root, file);
  if (existsSync(p) && readFileSync(p).equals(src)) return;
  mkdirSync(path.dirname(p), { recursive: true });
  writeFileSync(p, src);
  changed.push(file);
};
const write = (file, content) => {
  const p = path.join(root, file);
  mkdirSync(path.dirname(p), { recursive: true });
  if (existsSync(p) && readFileSync(p, "utf8") === content) return;
  writeFileSync(p, content);
  changed.push(file);
};

// ---------------------------------------------------------------- Android
const PERMS = [
  "android.permission.RECORD_AUDIO", // «سمّع لنفسك»: recording stays on the device
  "android.permission.MODIFY_AUDIO_SETTINGS", // required by WebView audio capture
  "android.permission.POST_NOTIFICATIONS", // daily reminder + Fajr alarm (Android 13+ asks the user)
  // Fajr alarm: "use my location" once, approximate only; the position never leaves the device.
  // (SCHEDULE_EXACT_ALARM comes from the local-notifications plugin; CAMERA is deliberately NOT
  // declared, so the sink photo uses the system camera app without a camera permission.)
  "android.permission.ACCESS_COARSE_LOCATION",
];
patch("mobile/android/app/src/main/AndroidManifest.xml", (s) => {
  for (const perm of PERMS)
    if (!s.includes(`"${perm}"`)) s = s.replace("</manifest>", `    <uses-permission android:name="${perm}" />\n</manifest>`);
  return s;
});

// Monochrome notification icon (Android requires a white silhouette): open book + star.
write(
  "mobile/android/app/src/main/res/drawable/ic_stat_rifq.xml",
  `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp" android:height="24dp" android:viewportWidth="64" android:viewportHeight="64">
    <path android:fillColor="#FFFFFFFF" android:pathData="M14,38 Q23,33 32,38 Q41,33 50,38 L50,24 Q41,19 32,24 Q23,19 14,24 Z"/>
    <path android:fillColor="#FFFFFFFF" android:pathData="M32,6 L34.6,12.4 L41.4,13 L36.2,17.4 L37.8,24 L32,20.4 L26.2,24 L27.8,17.4 L22.6,13 L29.4,12.4 Z"/>
    <path android:fillColor="#FFFFFFFF" android:pathData="M13,44.5 Q32,54 51,44.5 L50,42 Q32,50 14,42 Z"/>
</vector>
`,
);

// Fajr alarm sound (rendered by scripts/fajr-sound.mjs). Android reads it from res/raw.
const SOUND = "mobile/assets/fajr_alarm.wav";
copyBinary(SOUND, "mobile/android/app/src/main/res/raw/fajr_alarm.wav");

// ---------------------------------------------------------------- iOS
const plistAdd = (s, key, valueXml) => (s.includes(`<key>${key}</key>`) ? s : s.replace(/<dict>/, `<dict>\n\t<key>${key}</key>\n\t${valueXml}`));
patch("mobile/ios/App/App/Info.plist", (s) => {
  s = s.replace(/(<key>CFBundleDevelopmentRegion<\/key>\s*<string>)en(<\/string>)/, "$1ar$2");
  s = plistAdd(s, "CFBundleLocalizations", "<array>\n\t\t<string>ar</string>\n\t</array>");
  s = plistAdd(
    s,
    "NSMicrophoneUsageDescription",
    "<string>يستخدم رِفق الميكروفون فقط عندما تضغط «ابدأ التسجيل» لتسمع تلاوتك، ويبقى التسجيل على جهازك.</string>",
  );
  s = plistAdd(
    s,
    "NSCameraUsageDescription",
    "<string>يستخدم رِفق الكاميرا فقط في تحدّي منبّه الفجر حين تختار تصوير مكان الوضوء، وتُقارَن الصورة على جهازك ولا تُرفع.</string>",
  );
  s = plistAdd(
    s,
    "NSLocationWhenInUseUsageDescription",
    "<string>يستخدم رِفق موقعك التقريبي مرّة واحدة لحساب وقت الفجر في مدينتك، ولا يغادر الموقع جهازك.</string>",
  );
  // HTTPS only, no custom encryption: answers the export-compliance question automatically.
  s = plistAdd(s, "ITSAppUsesNonExemptEncryption", "<false/>");
  return s;
});

// Privacy Manifest. Keep in sync with src/components/screens/Privacy.tsx.
const dataType = (type) => `		<dict>
			<key>NSPrivacyCollectedDataType</key>
			<string>${type}</string>
			<key>NSPrivacyCollectedDataTypeLinked</key>
			<true/>
			<key>NSPrivacyCollectedDataTypeTracking</key>
			<false/>
			<key>NSPrivacyCollectedDataTypePurposes</key>
			<array>
				<string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
			</array>
		</dict>`;
write(
  "mobile/ios/App/App/PrivacyInfo.xcprivacy",
  `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>NSPrivacyTracking</key>
	<false/>
	<key>NSPrivacyTrackingDomains</key>
	<array/>
	<key>NSPrivacyCollectedDataTypes</key>
	<array>
		<!-- Only when a parent creates the optional account (sync between devices). -->
${dataType("NSPrivacyCollectedDataTypeEmailAddress")}
${dataType("NSPrivacyCollectedDataTypeName")}
${dataType("NSPrivacyCollectedDataTypeOtherUserContent")}
	</array>
	<key>NSPrivacyAccessedAPITypes</key>
	<array>
		<dict>
			<key>NSPrivacyAccessedAPIType</key>
			<string>NSPrivacyAccessedAPICategoryUserDefaults</string>
			<key>NSPrivacyAccessedAPITypeReasons</key>
			<array>
				<string>CA92.1</string>
			</array>
		</dict>
		<dict>
			<key>NSPrivacyAccessedAPIType</key>
			<string>NSPrivacyAccessedAPICategoryFileTimestamp</string>
			<key>NSPrivacyAccessedAPITypeReasons</key>
			<array>
				<string>C617.1</string>
			</array>
		</dict>
	</array>
</dict>
</plist>
`,
);

// Register bundle resources in the Xcode project (file reference, App group, Resources phase).
const addResource = (name, fileType, ref, build) =>
  patch("mobile/ios/App/App.xcodeproj/project.pbxproj", (s) => {
    if (s.includes(`/* ${name} */`)) return s;
    s = s.replace(
      "/* End PBXBuildFile section */",
      `\t\t${build} /* ${name} in Resources */ = {isa = PBXBuildFile; fileRef = ${ref} /* ${name} */; };\n/* End PBXBuildFile section */`,
    );
    s = s.replace(
      "/* End PBXFileReference section */",
      `\t\t${ref} /* ${name} */ = {isa = PBXFileReference; lastKnownFileType = ${fileType}; path = ${name}; sourceTree = "<group>"; };\n/* End PBXFileReference section */`,
    );
    // App group: next to Info.plist.
    s = s.replace(/(\t+)(\w{24}) \/\* Info\.plist \*\/,\n/, (m, tabs) => `${m}${tabs}${ref} /* ${name} */,\n`);
    // Resources build phase: next to config.xml.
    s = s.replace(/(\t+)(\w{24}) \/\* config\.xml in Resources \*\/,\n/, (m, tabs) => `${m}${tabs}${build} /* ${name} in Resources */,\n`);
    return s;
  });
addResource("PrivacyInfo.xcprivacy", "text.xml", "A1F0C0DE0000000000000001", "A1F0C0DE0000000000000002");
copyBinary(SOUND, "mobile/ios/App/App/fajr_alarm.wav");
addResource("fajr_alarm.wav", "audio.wav", "A1F0C0DE0000000000000003", "A1F0C0DE0000000000000004");

console.log(changed.length ? `native settings applied:\n  ${changed.join("\n  ")}` : "native settings already up to date");
