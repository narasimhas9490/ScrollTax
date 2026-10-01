# ScrollTax release kit

Everything for the Google Play listing lives here. `PUBLISHING.md` in the project root has the
overall process. This folder has the files and the text to paste.

## What to upload

| Play Console field | File |
|---|---|
| App icon | `graphics/icon-512.png` |
| Feature graphic | `graphics/feature-graphic-1024x500.png` |
| Phone screenshots, in order | `screenshots/play-store/1-today.png` ... `8-private.png` |
| Promo video | YouTube link to `video/scrolltax-intro-1080p.mp4` |
| Name, descriptions, release notes | `listing/store-listing.md` |
| Data safety, accessibility declaration, ratings | `listing/play-console-answers.md` |
| Accessibility declaration video | Unlisted YouTube link to `video/accessibility-declaration.mp4` |

Play does not take video files. Upload the videos to YouTube and paste the links. The promo
must be Public or Unlisted with ads off. The declaration video should be Unlisted.

There are two promo videos. `scrolltax-intro-1080p.mp4` is the animated intro with music
(38 s): the question, the counter, the supported apps, four features, privacy, the logo.
`scrolltax-promo-1080p.mp4` is the older, silent cut built from screen recordings. Use the intro.

## How the images were made

- **Dashboard screenshots use imaginary data.** `1-today`, `3-trends`, `4-monthly` and
  `5-every-reel`, and the app section of the promo video, come from a throwaway demo build
  seeded with three months of made-up history (`_src/DemoData.kt`). The UI is the real app.
  The real phone only had one day of data.
- **Feeds are blurred.** `2-live-counter`, `7-all-your-feeds` and the feed part of both videos
  blur everything except the ScrollTax counter. Other people's videos, names and faces should
  not appear in your listing.
- **The intro video is all drawn.** Its feed is plain colour cards and its widget is drawn, so it
  contains no one else's content. The supported apps appear as names only, with no logos, and
  the "not affiliated" line is on screen. The music is synthesized by `_src/intro/make_music.py`,
  so there is nothing to license. The font is Poppins (Open Font License, in `_src/intro/fonts`).
- **The widget shot is real data**, cropped tightly from the home screen.
- **Status bars are cropped** so no personal notification icons ship.
- `screenshots/raw/` and `video/raw/` hold the untouched captures. They contain other people's
  content and `video/raw/permission-flow.mp4` shows your home screen for the first two seconds.
  Do not upload anything from the raw folders.
  They are git-ignored, apart from the demo screenshots and the widget crop that the build
  scripts need. `video/accessibility-declaration.mp4` is git-ignored too, because it shows this
  phone's accessibility settings.

## Still to do before you can publish

1. **Fill the legal placeholders.** `[DEVELOPER NAME]`, `[CONTACT EMAIL]` and `[CITY]` are still
   in `legal/PRIVACY_POLICY.md` and `legal/TERMS.md`, and so in the app. Then run `npm run legal`.
2. **Host the Privacy Policy** at a public URL and put it in the listing.
3. **Create the upload keystore and build the bundle.** No `.aab` is in this folder because the
   app still shows the placeholders and has no upload key. Steps are in `PUBLISHING.md` section 2.
4. **Fix YouTube Shorts counting.** While capturing, five swipes in Shorts added nine to the
   counter. Instagram and X count correctly. Facebook and Snapchat are untested.
5. **Upload the two videos to YouTube.**

## Regenerating

```
pip install pillow imageio-ffmpeg numpy
python release/_src/build_images.py     # icon, feature graphic, 8 screenshots
python release/_src/build_video.py      # screen-recording promo and declaration videos
python release/_src/intro/make_music.py # intro music -> _src/intro/music.wav
node release/_src/intro/render.mjs      # intro video (set FFMPEG to an ffmpeg binary)
```

The intro is one timeline in `_src/intro/intro.html`. Open that file in a browser to preview
it. Text, timings and colours are at the top of its script; keep the times in `make_music.py`
in step if you move a scene.

Captions and layout are at the top of each script. Chrome must be installed; it is used as the
renderer.

### Retaking the dashboard screenshots with demo data

The demo build installs next to the real app as `com.scrolltaxapp.demo`, so real data is safe.

1. Copy `release/_src/DemoData.kt` into `android/app/src/main/java/com/scrolltaxapp/`.
2. In `ReelDb.kt`, change the last line of `get()` to
   `inst ?: ReelDb(ctx.applicationContext).also { inst = it; if (ctx.packageName.endsWith(".demo")) DemoData.seedIfEmpty(it.writableDatabase) }`
3. In `android/app/build.gradle`, add `applicationIdSuffix ".demo"` under `applicationId`.
4. `cd android && ./gradlew assembleRelease`, install the APK, capture into `screenshots/raw/demo-*.png`.
5. Uninstall `com.scrolltaxapp.demo` and undo steps 1 to 3 before building the real app.
