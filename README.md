# أصواتي العربية

Standalone Arabic RTL PWA, published at https://hamada013.github.io/arabic-sounds/. It moved out of the tools repository on 2026-11-25; the tools page keeps only a card to it, and the old `tools/arabicsounds/` address forwards here. Saved children stay, because both addresses are on the same site (storage key `arabicsounds-children-v1`).

## Content

31 Arabic sound recordings and pictures, custom sound pairs, speech levels, guided practice, ten-trial tests, Ling observations and PDF reports, matching, and paired memory games. Pair practice begins with a colorful 1–2–3 countdown, plays the first displayed card ten times while covering the second, then the second ten times while covering the first. It keeps one-second gaps and returns automatically to the same pair and order. Pair tests start after the same countdown, use ten balanced questions, advance after each answer, and show the final score. Pair controls are icon-only; custom and level-selected pairs share this flow. Leaving or hiding the page cancels the session.

The supplied logo is `images/logo.webp`. Installation icons are in `icons/`. The home uses the project home-screen style. Its download dialog offers installation when supported, offline download, and a percentage bar. Downloading saves this app's own 62 media files, verifies hashes, and resumes missing files on retry. Offline audio supports byte ranges. Cache names include this app's name and hosting scope.

Ling has a separate setup dialog with the child's name and two mode buttons. Detection presents the six existing sound pictures one at a time, plays each recording automatically, and preserves tick/cross/no-response observations while navigating with arrows. The report becomes available after all six observations. Identification has five numbered levels with 2, 3, 4, 5, and 6 choices; the level dialog offers every possible set (15, 20, 15, 6, and 1 sets). Each chosen set starts ten balanced trials with automatic audio and large correct/incorrect feedback. Replay is an icon in the activity header. Changing sets starts a fresh ten-trial session; hiding the page pauses audio until Replay is pressed. Both reports include the child's name, the automatic session date, mode-specific results, optional notes, and a direct PDF download without browser URL headers or GitHub links.

Drag and Match covers the three lower cards individually. Tapping a covered card plays its sound without revealing it or recording an answer; dragging the target onto a covered card still submits a match. The hide setting persists across rounds. The sound-pool catalog uses image-only selection cards, keeps at least three sounds, and applies changes only when saved.

Drag and Match and Memory omit visible match counters and card captions while keeping accessible names. Their image cards stay square in covered and revealed states. Six-card Memory always uses two rows of three cards, including desktop and landscape screens.

Drag and Match uses the same large animated tick/cross feedback as Ling, then automatically advances a correct answer or allows another attempt after an incorrect answer. Leaving the activity cancels its pending feedback. These games and active Ling tests size their boards to both the viewport width and height, keeping all cards and controls on one screen; 12-card Memory uses a compact grid that also fits short landscape screens. Detailed reports and selection dialogs retain their own content layouts.

Ling reports use a numeric day/month/year date and separate correct and incorrect responses. Identification passes the app's session criterion at 8/10 (80%) or higher. The summary lists missed sounds in the low (م، و), middle (ا، ي), and high (ش، س) screening groups, or multiple groups, and explicitly marks untested groups. These approximate groups follow [Advanced Bionics' interpretation guidance](https://www.advancedbionics.com/content/dam/advancedbionics/Documents/libraries/Tools-for-Toddlers/tools-for-parents/The-Ling-Six-Sound-Check.pdf); the session summary does not diagnose hearing loss. Detection retains observation-only scoring. PDF exports keep a fixed readable text size and move complete table sections to a new page when needed, without GitHub links.

Complete new releases wait for «تحديث الآن» or «لاحقًا». Update checks run when opening the app and returning online. Rebuild release manifests before publishing changes.

## The 2026-11 redesign

- **Home:** the logo, today's two sounds as big cards (tap to hear), the road of today's steps (نسمع، نختار، نطابق، نتذكّر، أحسنت) that lights up as each step is finished, one big «ابدأ» for «المسار التلقائي», then levels, matching and memory.
- **During the route:** a slim road bar on top of each step.
- **Feedback:** the answered card glows green with a soft chime made in the browser (`assets/reward.js`); a wrong answer gets a soft amber ring; three right answers in a row add a small burst of dots. Nothing covers the screen; with reduced motion only the colour changes.
- **Therapist only (013):** Ling, the intervention plan and goals, reports and «ملف الطفل».
- **Pictures:** the small sound marks (such as [b]) were removed from the 31 pictures.
- **Type:** Cairo (bundled) on every screen; styles in `assets/redesign.css`, loaded last.

## Clinic link

Like كلمة, جملة, مقطع and اتبع التعليمات: `assets/child-file.js`, `assets/speech-sync.js` and `assets/speech-entry.js` (app id `arabicsounds`), the locked start screen (child's name + number, or 013), «أطفال من العيادة» in the accounts window, and progress sent to the clinic database. Keep these three files byte-identical with the other apps.

## Development

```sh
npm run build        # Rebuild the offline release after changing files.
npm test             # Release hashes, manifest, Ling reports.
npm run test:browser # The move and redesign in Chromium and WebKit (set SOUNDS_PLAYWRIGHT to a Playwright package if needed).
npm run stage && npm run test:links  # What GitHub Pages publishes, and no links back to other sites.
```

`npm run test:legacy` is the old activity suite from the tools repository; it was already failing there before the move.
