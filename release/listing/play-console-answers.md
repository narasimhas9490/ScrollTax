# Play Console form answers

Answers for the forms under Policy > App content. They describe the app as it is built today:
no INTERNET permission, an AccessibilityService limited to five packages, and an overlay window.
Re-check them if the app changes.

## Privacy policy

URL: `[PUBLIC URL OF legal/PRIVACY_POLICY.md]`

## Ads

Does your app contain ads? **No.**

## App access

All functionality is available without special access. No login.

## Content rating questionnaire

- Category: Utility, Productivity, Communication or Other.
- Violence, sexual content, profanity, drugs, gambling: **No** to all.
- User-generated content or user interaction: **No**.
- Shares location or personal information: **No**.

## Target audience

Age groups: **13 and over**. Not designed for children.

## Data safety

- Does your app collect or share any of the required user data types? **No.**
- Is all user data encrypted in transit? Not applicable. Nothing is transmitted because the app has no internet permission.
- Can users request that data is deleted? Yes, in the app under Settings > Delete all my data.

## Accessibility API declaration

This is the form most likely to be reviewed by a person.

**Does your app use the AccessibilityService API?** Yes.

**Is it an accessibility tool?** No. `isAccessibilityTool` is not set, and the listing does not claim it.

**Core functionality that needs it**

```
ScrollTax is a digital wellbeing app that counts the short videos a user scrolls. It uses the
AccessibilityService API to detect when the short video on screen changes in Instagram Reels,
YouTube Shorts, Facebook Reels, Snapchat Spotlight and the X video feed, so it can count the
video and time how long it was on screen. There is no other Android API that reports this.
```

**What data is accessed and how it is used**

```
The service reads the position of the current item in the feed and, where that is not
available, on-screen text such as the username or title. This is used only to tell one video
from the next. It is held in memory and is never stored or transmitted. The app has no
INTERNET permission. Only the app name, start time and duration of each video are stored, on
the device. The service is restricted with android:packageNames to the five supported apps.
It performs no actions or gestures and does not record the screen.
```

**Prominent disclosure and consent**

```
Before the system accessibility settings are opened, the app shows a full-screen disclosure
that explains what the service reads and why, links to the Terms and Privacy Policy, and
requires the user to tap "Agree and open settings". The user can decline with "Not now".
```

**Video**: upload `video/accessibility-declaration.mp4` to YouTube as **Unlisted** and paste the link.
It shows: app opens, disclosure, Agree, service switched on, reels swiped, counter going up.

## Display over other apps

`SYSTEM_ALERT_WINDOW` is used to draw a small counter on top of the supported apps. The counter
never takes touches. This is the app's core feature. No separate declaration form exists for it
today, but keep this sentence ready if review asks.
