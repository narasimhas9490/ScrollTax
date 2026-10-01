# Publishing ScrollTax on Google Play

## 1. Fill the placeholders (required)
- `legal/PRIVACY_POLICY.md` and `legal/TERMS.md`: replace `[DEVELOPER NAME]`, `[CONTACT EMAIL]`, `[CITY]`.
- Run `npm run legal` after any edit (regenerates `src/legal.generated.ts`, the text shown in the app).
- Host both documents at a public URL (GitHub Pages is fine). Play Console needs a **Privacy Policy URL**; it must match the in-app text.
- Have a lawyer glance at the Terms (governing law, liability wording).

## 2. Sign a release build
```
keytool -genkeypair -v -storetype PKCS12 -keystore scrolltax-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```
Create `android/keystore.properties` (git-ignored) with `storeFile=../../scrolltax-upload.jks`, `storePassword=`, `keyAlias=upload`, `keyPassword=`. Back up the `.jks` and passwords somewhere safe.
Then: `cd android && ./gradlew bundleRelease` -> `app/build/outputs/bundle/release/app-release.aab`. Enrol in Play App Signing when asked. Bump `versionCode` in `android/app/build.gradle` for every upload.

## 3. Play Console answers
**Data safety**: collects no data, shares no data (nothing leaves the device; the app has no INTERNET permission). Data is not encrypted in transit because it is never transmitted. Users can delete data in-app (Settings).

**Permissions declaration: AccessibilityService** (the part most likely to be reviewed)
- Do **not** claim it is an accessibility tool (`isAccessibilityTool` is not set).
- Core functionality: "Detects when a short video (Instagram Reels, YouTube Shorts, Facebook Reels, Snapchat Spotlight, X video feed) changes so the app can count and time scrolling for digital wellbeing."
- Data: reads on-screen username/title only to tell reels apart; held in memory, not stored or transmitted.
- The service is restricted by `packageNames` to the five apps; it performs no actions, no gestures, no screen recording.
- In-app prominent disclosure + explicit "I agree" is shown before the system settings screen opens (see `Onboarding.tsx`).
- Record a short screen video (30-60 s): open app -> disclosure -> Agree -> enable service -> swipe reels -> counter updates.

**SYSTEM_ALERT_WINDOW** justification: "Draws a small non-interactive counter on top of the supported apps; this is the core feature."

**Other forms**: Content rating questionnaire (no user-generated content, no ads); Target audience 13+ (not a children's app); Ads: No; App category: Health & Fitness or Tools.

## 4. Store listing rules
- Name: `ScrollTax` (do not put "Instagram", "YouTube" etc. in the app name or icon).
- Description may say "works with Instagram Reels, YouTube Shorts..." but add: "Not affiliated with or endorsed by Instagram, Meta, YouTube, Google, Snapchat or X."
- Do not promise health outcomes ("cures addiction"). Say "helps you notice and reduce scrolling".
- Screenshots must show the real app.

## 5. Before the first release
- New personal developer accounts must run a **closed test with at least 12 testers for 14 days** before production access.
- Test on a real phone with Instagram/YouTube installed; app UI ids change, so re-check `Platforms.kt` after their updates.
