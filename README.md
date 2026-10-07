# Cram & Coffee

A responsive, cozy study app inspired by the supplied dashboard and café references. The café is a true isometric room with movable illustrated furniture, a floor grid, a shop, and automatic saved layouts. The week-by-week timeline is not part of the website.

## Run locally

With Node.js installed, open a terminal in this folder and run:

```sh
npm start
```

Open http://localhost:4173 and choose **Enter the guest café**. No installation or build step is required. Keep the terminal running while using the website. Do not open index.html directly as a file; ES modules require an HTTP server.

Guest testing starts with 10,000 coins and empty study data. New accounts receive one free chair, table, and coffee counter. Settings includes **Reset test café · 10,000 coins** in guest mode. Existing guest testing changes are preserved after the initial reset. Guest changes are saved in this browser.

## What works

- Tasks with managed class dropdowns, an Add class button, class filtering, deadlines, priority, notes, and completion filters. Add in bulk creates up to 100 tasks for a selected class; each line can include title, due date, minutes, priority, and notes.
- Focus mode fills the main pane with the café illustration and places a compact Pomodoro timer at the top left. Class selection and skip controls sit near the bottom. Start, pause, reset, custom durations, and distraction-free mode remain available. Every fourth completed focus session leads to a long break (15 minutes by default); the other sessions lead to short breaks. Press Start break to begin a break. Skipped sessions do not advance this cycle.
- Completed sessions award 50 XP and 25 coins. Skipped sessions award nothing. The timer uses an absolute deadline so delayed browser callbacks do not slow the countdown. Reloading the tab resets an in-progress timer; completed sessions remain saved.
- The Classes list above the set preview lets you add, rename, and remove classes. Removing a class moves all its sets to Archive without deleting flashcards or review history. Archived sets remain studyable and editable; choose an active class while editing a set to move it out of Archive. Archive membership is preserved in saved progress and backups.
- Create named flashcard decks with a class and due date. Each class can contain multiple sets. Paste all terms as question | answer lines or paste two Excel columns; alternatively import an Excel .xlsx workbook with questions in column A and answers in column B. Review, quiz, shuffle, and due-card selection operate within the chosen deck. Existing cards migrate into saved decks. Editing a set preserves unchanged cards' review history. Flashcard XP is capped at one reward per card each day.
- Levels, coins, daily quests with explicit claiming, streaks, achievement badges, daily/weekly minute goals, and an exam countdown/boss goal.
- Eight master-atlas café themes: Daytime café, Evening glow, Spring garden, Rainy autumn, Cozy snowfall, Greenhouse, Breezy coast, and Midnight celestial. The JSON guide defines a 160 × 92.376 tile and ±30° axes. The earlier supplied SVG grid is fitted to that projection. Walls retain the shorter proportions; furniture and guest anchors, snapping, and pointer coordinates use the same floor. Fourteen portraits have six standing views, six seated views, and four walking frames in each of four directions. All 14 characters can visit. Drag or use arrow keys to move a selected item. Single-view furniture uses a mirrored alternate orientation with the guide’s rotated footprint. Fixed decorations remain baked into each room illustration.
- The shop includes the supplied furniture and accessory sheets (chairs, tables, sofa, shelves, counter, register, pastry display, cart, lamps, plants, and more). Shop and **My items** inventory support multiple copies of every item. Buy stores a copy; Place adds it to the room; Store returns it to inventory. Owned and available counts update automatically.
- Visitors enter, sit on available chairs, order, check out with your avatar, and leave. With no seats, they go directly to the counter. Each checkout pays 5 coins once. Today’s completed sessions, tasks, and flashcard reviews increase arrival frequency and visitor capacity (up to eight). The visitor total includes seated, walking, ordering, waiting, and departing guests. Your avatar and hired baristas have separate role labels and are not visitors. New drinks unlock at 3, 5, and 10 completed sessions.
- Seven-day study chart, per-subject time, monthly study calendar with weekday headings and correct date alignment, completion percentage, and session history based on actual recorded sessions.
- Profile name, avatar, dark theme, six selectable synthesized background sounds, volume control, and optional phase-end bell or chime, search, reminders, and JSON backup download and upload/restore. Uploaded backups are validated and previewed before replacement; the previous progress is kept for Undo last restore.

## Timer sounds

Click the music-note button on the timer to choose Rain, Brown noise, Fireplace, Forest birds, Café hum, or Soft keys. Press Play ambience, adjust the volume, or pause playback. Choose Bell, Soft chime, or Off for the phase-end alert, and use Preview tone to hear it. These sounds are generated locally, with no audio downloads. Preferences are saved and included in backups; ambience does not automatically start after reloading. The volume controls both ambience and phase-end sounds.

## Import decks and restore backups

In **Study tools**, choose **Create deck / set**, name the set, select or add its class, and choose a due date. Type vocabulary one question | answer per line or choose an Excel **.xlsx** file. The first worksheet is used; an optional Question / Answer header is skipped. The preview shows the imported card count and sample rows. Files are processed locally. Older .xls files should be saved as .xlsx first. A workbook may be up to 8 MB; a deck may contain up to 2,000 cards.

In **Settings**, **Download backup** exports your study data, preferences, and café. **Upload / restore backup** accepts that JSON file, shows a summary, and offers **Replace progress with this backup**. **Undo last restore** restores the progress from immediately before the last restore. Backups may be up to 5 MB. Guest restores stay in browser storage; connected-account restores use that account's existing cloud save.

The Excel reader handles the [SpreadsheetML worksheet and shared-string structure](https://learn.microsoft.com/en-us/office/open-xml/spreadsheet/structure-of-a-spreadsheetml-document) and uses the browser's [DecompressionStream API](https://developer.mozilla.org/en-US/docs/Web/API/DecompressionStream) to read compressed workbook parts.

## Connect Firebase

The app contains Firebase integration but no project has been provisioned or connected. Email sign-up/login, password reset, private account data, and cross-device persistence require your Firebase project configuration.

1. Create a Firebase project and register a Web app.
2. Enable **Authentication → Email/Password**.
3. Create a **Cloud Firestore** database.
4. Replace `window.FIREBASE_CONFIG = null` in **config.js** with the Firebase web configuration from your project settings. Keep it as a JavaScript object, for example:

```js
window.FIREBASE_CONFIG = {
  apiKey: 'YOUR_FIREBASE_WEB_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT',
  appId: 'YOUR_APP_ID'
};
```

5. Paste the contents of **firestore.rules** into the Firestore Rules editor and publish the rules before using accounts. They restrict `/users/{userId}` to its authenticated owner. Account state is stored under the `data` field of that user's document.
6. Add your hosting domain and `localhost` to Authentication's authorized domains where required.
7. Reload the site. The login/create-account form is now available. Guest data remains separate and is not silently copied into accounts.
8. Verify two separate accounts and sign-out/sign-in with your actual project before launch.

Firebase web SDK imports use the official CDN (12.19.0). Configuration values identify your project; never place a service-account key or private server credential in this website. The app reports cloud save failures and offers **Retry cloud save** and a backup export in Settings. Live Firebase behavior cannot be tested without a connected project.

Official setup: https://firebase.google.com/docs/web/setup
Email/password authentication: https://firebase.google.com/docs/auth/web/password-auth
Firestore rules: https://firebase.google.com/docs/firestore/security/rules-conditions

## Publish on GitHub Pages

1. Create a GitHub repository and upload this folder's contents to the root of its main branch, including the assets folder.
2. In the repository, open **Settings → Pages** and choose **Deploy from a branch**, `main`, and `/ (root)`.
3. Open the Pages URL after deployment completes. All asset references are relative, so a repository subpath works.
4. If Firebase is connected, add the GitHub Pages hostname to Firebase Authentication's authorized domains.

The site is static and requires no backend on GitHub Pages. Authentication and cloud data are handled by Firebase when configured. No repository or external Firebase project was created by this build.

## Artwork

Login and dashboard use the supplied café illustration and generated coffee-plant artwork. The editable café uses assets/isometric_atlas_all_assets.png and its supplied JSON cropping guide. master-atlas.js embeds that same guide for static hosting. The 434 named frames include eight rooms, 20 furniture pieces, 84 standing views, 84 seated views, 224 walking frames, and 14 portraits. Renderer crops use content rectangles, offsets use the guide anchors, and furniture collision sizes use its footprints. All character walking cycles are available. Single-angle furniture retains mirrored rotation. Earlier artwork remains for legacy decorations and existing purchased accessories absent from the master atlas. The supplied isometric_atlas_grid.png overlays the calibrated 30-degree floor projection, using the guide’s explicit ground-plane corners. Rooms, furniture, and people use one uniform atlas scale, stable across themes; shop previews also retain relative atlas sizes. Selected furnishings show a footprint without an item-name label. Prompts for earlier generated artwork are documented in ART-PROMPTS.txt.

## Validation and limits

Node integration checks cover decks by class, bulk vocabulary, preservation of review history, multiline/quoted terms, backup validation and restore, weekday alignment, all visitor phases, inventory quantities, repeat purchases, placement/storage, starter items, balances, class creation and bulk tasks, two complete four-session timer cycles, long-break duration, skipped-session behavior, sound preferences, six audio generators and their cleanup, phase-end tones, timers and reward deduplication, counter payments, productivity-based arrivals, rotated footprints, 289 projection/inverse coordinate round trips, persistence, all 14 portrait/standing/seated choices, eight theme persistence and backup restoration, 434 guide crops and anchors, all 224 walking frames, the supplied SVG grid, and all eight screens. Browser checks verified Excel import with compressed parts, shared/rich/inline text and numeric cells, class creation while preserving a deck draft, downloaded-backup restore, undo, the calendar, and the furnished café preview. Test files were imported into an isolated test origin to preserve the user's saved café.

Firebase remains unconfigured and live account behavior unverified. Account data uses one Firestore document. Café interaction and sprite anchors use the supplied room’s floor projection; guests use simple direct walking paths rather than obstacle pathfinding.


## Supplied audio

Rain, Fireplace, Forest birds, Café hum, and Piano play the supplied rain.mp3, fire.m4a, bird.mp3, cafe.m4a, and piano.m4a from assets/audio. Each recording loops at its end. Switching tracks or stopping audio releases the previous player. Volume continues to control playback. Brown noise and timer-end tones remain locally synthesized.

Placement uses the artwork’s bottom-center anchor, aligned to the front (lower) corner of its occupied grid footprint. Dragging and selection use the same footprint corners. Long tables, sofas, wide bookcases, checkout counters, service counters, and pastry displays retain their supplied two-square footprints. Mirroring swaps their footprint axes and their seated facing direction. Seated characters attach through hip points to the chair, armchair, sofa, or stool seat surface; character illustrations retain their native relative scale.

No additional floor shadows are drawn. The canvas footer caption has been removed.

Wide furnishings use their painted front floor corners (off-center within the crop), with two-tile footprints oriented along their painted long edge. Mirroring swaps both footprint axes.

Café rooms and theme previews use isometric_cafe_themes_atlas.png with its supplied JSON guide, loaded through theme-atlas.js. The furniture and character atlas remains separate. Both use the same 160 by 92.376 tile projection and uniform scene scale.


Café people render at 90% of the common atlas scale, with unchanged foot anchors and compensated seated hip attachments. Profile portraits keep their original size.

Seated character attachments are raised by 10 native atlas pixels on chairs, armchairs, sofas, and stools.

Standing and walking people now use 80% atlas scale; seated people retain 90% scale and the raised seat alignment. The upright reduction applies to the owner avatar, barista, and visitors.

The wooden café table is 65% of its original size and its anchor is halfway between the front corner and square center. Plants, carts, signs, lamps, coat stands, recycling bins, and other accessories use square-center anchors; dragging and hit areas use the same placement and scale.

All 14 café characters now use a single 75% scale for standing, sitting, and all walking frames. Scale is attached to character frames as well as the renderer so direct frame rendering follows the same setting. Seated anchors preserve the raised hip attachment. Updated script versions and no-store development responses prevent stale rendering code.

Character scales now account for their artwork proportions: Maple 90%, Indigo 65%, with explicit scales for all other characters in characters.js. Each character retains its scale across standing, walking, and sitting; foot and hip anchors stay fixed.

The stool uses 65% of its original scale, and seated hips follow its scaled seat surface. Accessories and both bookcases move forward by 0.1 grid units along each axis (9.238 native pixels lower on screen), without changing footprints.

Latest anchor tuning: bookcases have a -0.15 grid-unit offset toward the back; accessories use +0.2 units toward the front; the stool uses -0.1 units upward. Seated visitor positions include the stool offset. Avatar selection displays only profile portraits.

Guests check out only at a placed Checkout counter (register). Without a register they wait rather than using the coffee service counter. A placed barista moves behind the register to serve; the owner stays in their chosen position. Without staff, the owner serves. The barista is 20% smaller than before; payments remain exactly-once.

The daytime café uses first_cafe_aligned.png with its supplied floor calibration. Walking visitors are 20% smaller, the coffee counter is 10% smaller, and the wide bookshelf sits farther down and left. Demo guest capacity is 10. Depth ordering follows floor footprints, with seated guests drawn above their chairs.

Wide bookshelves are 10% smaller and tall bookcases 10% larger. All standing visitors, including checkout queues, share the reduced walking scale. Scene sprites render in eight-pixel vertical sections, ordered by each section’s floor depth, so long furniture can overlap differently along its length. Seated visitor depth follows the seat center so tables in front can cover them.

Cart size is 80% of its prior size and its placement shifts right. Recycling bins shift down and right. Both bookshelf types shift slightly up and right; dragging and hit areas follow their updated anchors.

Starting Pomodoro automatically continues through focus and breaks, including a long break after every four completed focus sessions. Pause and reset stop it; skipping a running phase continues into the next without earning completion rewards.

Reset Pomodoro stops the timer, selects Focus, and resets the four-session cycle while preserving study history and earned rewards. The smaller reset icon still resets only the current phase. Cycle progress is saved independently of lifetime session count.

Rotated bins and carts now mirror their placement offset around the tile center as well as their artwork. The right-facing wide bookshelf has a separate anchor adjustment up and left. These orientation-specific anchors are shared by drawing, selection, and dragging.

Left-facing tall and wide bookshelves now shift farther up and right; right-facing placements retain their previous calibration.
Right-facing bookcases also receive a small additional shift up and left.

Guest arrivals use a shuffled pool of all 14 characters, including Willow and Birch, before reshuffling. Avatar selection again shows each character’s name beneath their portrait.

Right-click a chair, armchair, stool, or sofa to sit or stand up. Your avatar uses the matching seated pose and reserves its seat; guests cannot claim it. Seats already occupied or reserved by arriving guests cannot be selected. Moving the avatar or storing its chair clears the reservation.

Character scales are capped using the tallest standing/walking artwork for each character. Larger characters are reduced consistently across all poses; smaller characters and portrait pictures remain unchanged.

Bookshelf placement now follows explicit floor corners instead of directional nudges: wide shelves anchor their artwork side corner to the left footprint corner when mirrored and to the right corner in the native view. Tall shelves anchor their bottom point to the square’s bottom point.

Corrected wide bookshelf facing mapping: native right-facing art aligns its left base corner to the footprint’s left corner; mirrored left-facing art aligns its right base corner to the footprint’s right corner.

The cart now uses the same side-corner alignment as the wide bookshelf in both orientations, replacing its earlier center-offset placement and retaining its 80% size.

Corrected cart orientation independently of the bookshelf: the cart source artwork uses the opposite side, so its base contact and footprint corner mappings are reversed. Bookshelf mappings are unchanged.

Only the selected café avatar receives an additional 20% reduction, in all café poses. Guests, the barista, and profile pictures retain their previous sizes.

Espresso machine, takeaway cups, and pastry tray are no longer buyable. Existing owned or placed copies are preserved; their My items cards offer placement without Buy another.

## XP café unlocks

Every 1,000 XP increases your level. Daytime and Spring garden themes start unlocked. Level 2 unlocks Evening glow, Cozy armchair, and Little bookshelf; level 3 unlocks Rainy autumn, Long study table, and Wide bookcase; level 4 unlocks Breezy coast, Two-seat sofa, Coffee serving cart, and Café barista; level 5 unlocks Cozy snowfall and Pastry display; level 6 unlocks Greenhouse; level 7 unlocks Midnight celestial. Themes are free; furniture and the barista require their usual coin purchase after unlocking. Requirements appear in the theme picker, shop, and Rewards page. Existing owned furniture and the active theme are preserved. Unlocks persist in saved progress and JSON backups.

The study library toolbar now says Create study set; class management remains above the set preview and in the set form. Login and Pomodoro backgrounds use assets/study-cafe-background.png, generated with built-in imagegen; the full prompt is in assets/study-cafe-background-prompt.txt.

Reading lamp is no longer buyable. Already owned copies remain in My items.

## Coffee plant care

The dashboard coffee plant has a separate care level, 0–4: soil only, sprout, seedling, young plant, fully grown. The pot, smiling cup, and café scene are retained in all four new growth illustrations. The original plant.png is the mature stage. Meet the daily study-minute goal in Settings to advance one stage and earn 5 bonus XP, once per calendar day. The day it becomes fully grown still earns 5 XP; each additional qualifying day while fully grown earns 15 XP. Every completed day without reaching the goal moves it back one stage, down to soil only; XP already earned is retained. Today is never penalized before the day ends. Missed days while the app is closed are applied when it reopens. Logged focus-session minutes count toward care; skipped phases do not. The goal for a previous day is retained when preferences change. Plant care begins when this feature is first used, with existing study history retained. Care and reward status persist in guest/cloud saves and backups. Growth artwork was edited using built-in imagegen; assets/plant-growth-prompts.json contains the prompts and asset filenames.
Settings now offers a saved time-zone selector for the live header date and clock. It defaults to the browser's zone and adjusts automatically for daylight saving. Avatar selection uses the portrait picker; the duplicate avatar dropdown and Evening theme checkbox have been removed. The café canvas outside each room now uses warm off-white (#eee2d1). Existing study-day calculations remain based on the device's local calendar.

The desktop sidebar stays within the viewport and scrolls independently when necessary. Short screens use compact navigation and hide the decorative quote to leave room for the profile. The top-right profile picture opens Settings on every page, including My café.

Flashcards have a Full screen button beside Edit set. The enlarged viewer supports reviewing, quizzes, shuffling, due-card selection, and ratings, keeping the selected set and card when leaving. Use Exit full screen or Escape. Browser full-screen mode is requested where supported; otherwise the viewer fills the app window.

Shuffle now reorders every card in the selected set using Fisher–Yates, starts at the first card in that new order, and retains card IDs and review history. Other sets stay in their existing order.

Notebooks: open Notebooks in the sidebar to create named, colored notebooks and organize them in folders and nested subfolders. Notebook details lets you rename a notebook, change its color, or move it into another folder. Folder menus support rename, moving to a different parent, and deletion; deleting a folder preserves its notes and subfolders by moving them to the parent.

Each notebook can contain multiple named pages. Add page creates a page; the thumbnail grid previews all pages and opens the selected page. Pages can be renamed, reordered, and deleted (one page always remains). Previous single-page notebooks migrate to Page 1 without losing their notes or typography.

Within a page, add Title, Heading, Subheading, and Body sections and choose fonts and sizes. Select text and use B, I, or U for bold, italic, and underline, or use Ctrl/Cmd+B/I/U. Text styles save with the notebook. Pasting brings in plain text to keep external markup out of the editor.

Export downloads formatted HTML or editable JSON for all notebook pages. Print / Save as PDF uses your browser's print dialog. Import notebook restores an exported JSON notebook as a new notebook, keeping the existing original. Full app backups retain notebooks, pages, formatting, colors, folders, and folder hierarchy. The global search finds text in notebook pages and the quick-notes scratchpad as well as tasks and flashcards; a notebook result opens its matching page.

Study tools uses a stack-of-flashcards icon; Notebooks keeps its notebook icon. In My café → My items, Store all café objects returns every placed object to inventory while keeping owned quantities, coins, the room theme, and your avatar. Reserved chairs are released, and guests are redirected until the café is arranged again.

Focus mode now includes One-time alarms (the bell control or Alarms button). Create alarms with a name, date/time, time zone, sound, and volume. Scheduled alarms can be edited or cancelled. Each alarm fires once and shows a dismissible alert anywhere in the app. Alarm scheduling is independent of the Pomodoro phase and pause/reset controls. Keep the app open for alarms to ring; after reopening, click in the app to unlock audio. Overdue scheduled alarms are shown once when the app resumes, and dismissed/cancelled alarms never recur. Alarms and their status are included in progress backups. For a repeated local time during a daylight-saving clock change, the earlier occurrence is used; nonexistent local times are rejected.

Notebook text boxes can be resized horizontally and vertically using their bottom-right corner. Sizes save automatically, remain responsive to the page width, and are included in notebook JSON and progress backups.

Reloading resumes the guest café automatically or waits for Firebase to restore the signed-in account, then opens the last visited page. Page choices are saved separately for each account and for guests in this browser. Logging out or leaving the guest café disables automatic entry until the next login. Firebase accounts use browser-local authentication persistence; passwords are not stored by the app.
