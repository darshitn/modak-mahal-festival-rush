# Modak Mahal — visual and gameplay redesign

Prepared: 15 September 2026. Planning baseline: commit `2f32010`, with M2 implementation at `2431452`.

## 1. Decision

Build a bright, welcoming Ganesh Chaturthi modak shop with simple walk-and-work controls, visible production, useful staff, and a finite pandal delivery goal. Keep Phaser and the tested economy. Replace the presentation and improve the interactions in small, verified phases.

The target feeling: **“I can see what to do, doing it feels satisfying, and every upgrade visibly improves my little shop.”**

Use illustrated 2D objects with front faces, consistent outlines, and soft ground shadows. This creates depth while keeping ordinary X/Y movement and collision. A complete isometric engine, 3D rewrite, multiple floors, and free furniture placement would consume the remaining deadline without improving the core loop enough.

This document is the requested direction for a later Sol implementation. No game implementation or ownership state was changed while preparing it. `PROJECT_STATUS.md` currently says `GEMINI_ACTIVE`; it must be handed off or explicitly reassigned before Sol edits implementation. The newer user request selects Sol as the intended builder, but this document alone does not claim that another agent has stopped.

## 2. Evidence and comparison

### Reviewed material

- User video: `C:/Users/Darshit N/Videos/Captures/Arc 2026-09-15 23-06-54.mp4`, duration 1:53.70. Eight frames sampled across the recording were inspected. This is a visual/progression review, not frame-by-frame validation of the reference's transaction logic.
- The title visible in the recording is **Cat Pizza**, by Cosmo indie Games, on Poki. The game is illustrated 2D with an angled room, not a requirement for a 3D implementation.
- Opened the current local game at `http://127.0.0.1:3000/` and inspected a live desktop screenshot. Further browser measurement timed out; no new full playthrough or mobile verification is claimed here.
- Inspected `src/main.ts`, `index.html`, `BootScene.ts`, `ShopScene.ts`, `Player.ts`, production stations, `GameState.ts`, types, balance, and current coordination records.
- Read `details.md` as contest requirements. Existing test/build evidence comes from the preceding M2 review; this planning change did not require rerunning the same checks.

| Reference observation | Current Modak Mahal | Direction |
| --- | --- | --- |
| Pale floor and stronger object outlines | Dark brown floor, furniture and background merge | Light cream floor; walnut outlines; differentiated station materials |
| Oven, counter and carried pizzas are identifiable by silhouette | Stations rely on repeated labels; steamer resembles a flat circle | Recognizable brass pot, modak tray, packing bench and service counter |
| Camera framing changes as the character traverses the room | Whole room is squeezed into a fixed screen | Compact room on desktop; bounded following camera on narrow screens |
| Stacked food and money show transfers and rewards | Tiny goods and text carry much of the explanation | Visible stock stacks, short item transfer arcs and coin feedback |
| One brief objective, e.g. sell or buy an item | Banner, station title, status text, floor label and circles compete | One objective; contextual station action; small inventory badges |
| Purchase spots and upgrade arrows suggest the next investment | All upgrades live in a desk modal | Visible next improvement in the world; explicit purchase card |
| Distinct customer area and production floor | Queue extends toward the room edge | Clear street/queue lane and serving side of the counter |

Borrow readability, spatial feedback and progression. Create original characters, graphics, arrangement and text. The surrounding Poki ads, sidebars and rewarded boosts are outside the game design target.

## 3. Why ours looks blurry and sparse

`src/main.ts` sets a 960 × 540 game with `Phaser.Scale.FIT`. The live screenshot was displayed at 1280 × 720, an enlargement of the logical design. `BootScene.ts` generates many textures at only 44 × 44 or 80 × 64, and station text is often 9–11 logical pixels. Enlarging these assets cannot create additional detail. This is a source-backed likely contributor; browser device-pixel-ratio and backing-buffer measurements remain to be captured.

Blur and visual design need separate fixes:

1. Measure CSS canvas size, backing-buffer size, device pixel ratio, camera zoom and source texture dimensions on the actual laptop and phone.
2. Define world coordinates separately from display size. Do not blindly double every hard-coded station coordinate.
3. Use sharper source art at 2× its largest intended displayed size. Generate procedural canvases at higher backing resolution, draw with scaled coordinates, and explicitly preserve display dimensions.
4. Set text raster resolution appropriate to the expected display scale using the installed Phaser API. Await font readiness before creating title/HUD text; bundle permitted fonts locally.
5. For a larger renderer surface, use supported resize/camera sizing for the installed version and retain a stable world coordinate system. Verify pointer-to-world conversion and UI hit testing at every size. Do not assume a global `resolution` option from another Phaser version works.
6. Keep antialiasing for smooth illustrated art. `image-rendering: pixelated` is not the selected style and cannot repair low-detail assets.
7. Profile any higher-resolution rendering on a phone; reduce effects before sacrificing text readability.

The installed package is Phaser **3.90.0** despite the dependency range starting at 3.88.2. Use installed source/types and matching docs. No framework upgrade is part of this redesign.

## 4. Art direction: warm festival courtyard

### Palette and typography

| Role | Color | Application |
| --- | --- | --- |
| Main floor | `#F7ECDD` | Large calm surfaces |
| Alternate floor | `#EEDCC8` | Very subtle large tiles |
| Paper/card | `#FFFDF7` | HUD and action cards |
| Deep walnut | `#45362E` | Text and outlines |
| Saffron | `#E99527` | Player apron, progress and accents |
| Brass | `#C9953D` | Steamer, lamps, serving details |
| Leaf green | `#35765A` | Available actions and completed objectives |
| Muted vermilion | `#B84E3B` | Shop sign and small festival accents |

Use dark readable text on light cards. Do not use saffron-on-cream for essential small text. Outfit is the primary UI font; Yatra One appears only in the title/sign and celebratory heading. Use consistent original icons rather than platform-dependent emoji as core controls.

At the displayed viewport, aim for 16–18 CSS-pixel equivalent essential text, 14 minimum for secondary labels, and touch targets of at least 44 × 44 CSS pixels. Measure after scaling, not just in logical coordinates.

### World and characters

- One cream-walled shop opening onto a short festival street. Show shallow front faces on counters and shelves; all assets share the same perspective and light direction.
- Human shopkeeper: cream kurta, saffron apron, simple topi. Larger readable silhouette and short walk cycle; carried goods remain visible without covering the face completely.
- Packer: green apron, hands and parcel movement. Cashier: distinct plum accent, small greeting animation. Four customer variants in festival clothing, sharing one animation rig.
- Steamer: brass vessel, handles, lid, stove base and a visible receiving tray. White ridged modaks on leaf-lined trays, never a generic orange dot.
- Boxes: ivory paper with a vermilion band and modak/leaf mark; avoid deity images on disposable packaging.
- One rangoli near the entrance, garlands along the sign, two lamps framing the pandal. Keep routes visually quiet.
- Show a respectful Ganesha murti in a decorated background pandal, away from work surfaces and player collision routes. Its presence establishes the festival; it is not an upgrade, damage target, currency source or disposable prop.
- Final delivery goes to the neighbourhood pandal. The visual reward is a completed offering table and celebration with the shop staff.

### Minimum asset set

One floor/wall kit; shopkeeper idle/walk; two staff; four customer recolors/variants; supply shelf; steamer idle/cooking/ready; packing bench; service counter; dispatch stand; bundle/tray/box/coin; 8–10 UI icons; one pandal illustration.

Use a single art template: same outline thickness, shadow angle, view, palette and export scale. Assets should be separate reusable sprites with transparency, not one generated background containing illegible baked-in text. Record source/license/tool in `ASSET_CREDITS.md`. Procedural SVG/canvas art is a viable deadline fallback if its silhouettes are redesigned consistently.

## 5. Layout and UI contract

Approximate desktop composition, adjusted in the first visual slice:

```text
┌ coins ───── next milestone / progress ───── pause / sound ┐
│                                                        │
│  Supply shelf → Steamer 1 + tray → Steamer 2 footprint   │
│        clear production aisle                          │
│             shopkeeper       packing bench + packer     │
│                                                        │
│  festive entrance    counter + cashier → customer lane │
│                                       dispatch/pandal  │
├ contextual action / one short objective ────────────────┤
└ touch joystick (mobile)           action button (mobile)┘
```

- Start with three understandable workstations and a supply shelf. Locked improvements are tidy silhouettes with one price badge, not complete nonfunctional stations with warning paragraphs.
- The repeat route should be a short loop. Aim for roughly 1–2 seconds of walking between adjacent production stations at base speed.
- Furniture has shallow collision footprints; players cannot walk through benches. Use simple rectangles, generous aisle widths and a consistent nearest eligible station rule.
- Keep customer queue bubbles within the viewport and out of the production aisle.
- HUD: coins; one current objective/progress; pause/sound. Timer appears after onboarding. Carry count is a small icon badge near the player or bottom action area.
- Hide inactive interaction circles. Highlight the selected station with a subtle ground pad; show a small progress bar only while it is doing work.
- Use one short action such as `Load ingredients`, `Take modaks`, `Pack boxes`, or `Serve` near the active station. Show longer explanation only when blocked.
- Upgrade desk opens only on deliberate tap/click/E, not merely walking through its zone. Keep the centered modal but use clear item cards with cost, benefit, ownership and reserve explanation.
- Modal close, Escape, backdrop behavior, keyboard focus and movement clearing must agree. Blocking overlays pause campaign time and simulation together.
- Mobile portrait: reserve top HUD and bottom controls, show the world through a bounded camera following the player, and provide an objective direction cue when needed. Do not shrink the entire landscape game into a narrow phone width.
- Desktop/landscape: zoom to fit the compact shop if readable. UI stays screen anchored; world objects stay world anchored.

## 6. Mechanics: simple actions, meaningful improvements

### The loop

**Buy a recipe bundle → unload into steamer input → collect cooked tray → pack → deliver boxes to counter → automatic payment → improve shop → supply pandal.**

Keep one recipe and the existing fictional economy. No mixing minigame or individual rice/coconut/jaggery shopping list. Purchases always require an explicit action. Normal item transport and valid transfers happen by standing at stations.

### A. Make ingredient handling forgiving

Add a visible input shelf to each steamer. Initial hypothesis: capacity 2 queued bundles and 1 output batch per steamer, plus at most 1 active cooking batch.

- Input storage and output storage are independent. An unlocked steamer can accept ingredients into its input shelf even while cooking or while its output tray is occupied.
- Unload carried bundles up to free input capacity, with short staggered item animations. Each unit transfers exactly once; state is authoritative, animations are visual.
- A steamer starts only if it has queued input and can reserve its output slot. Move one bundle from input into active cooking exactly once. Complete into the reserved output slot.
- No second cooking job begins while output capacity is occupied. Timers must not consume or erase queued ingredients.
- At a station, deposit compatible carried ingredients first; if hands become empty and output exists, collect it. Resolve one ordered transaction sequence per update, with a short cooldown.
- With two bundles carried, unload both, leaving hands free. One cooks and one waits. This removes the routine return trip that made the upgrade feel worse.
- Keep the existing Return Ingredients action and shelf exit/re-entry suppression. If all input shelves are full, the return route must still work for free.
- Keep one carried item type at a time. Mixed inventory and automatic teleporting between stations are unnecessary.

This changes the steamer state model: a single `state`/`hasOutput` pair cannot fully describe queued input plus output plus cooking. Update the type, mutation methods, visuals and tests together. Existing low-level tests may need adjusted assertions; preserve their conservation and recoverability guarantees.

### B. Make packing and payment understandable

- Before hiring the packer, standing at the table initiates one packing job; once started, that job completes even if the player walks away. A later job needs player initiation.
- Packer automatically initiates queued jobs and works 1.5× faster. Show the actual worker handling boxes.
- Cap packing output at a small visible stack, initially 6 boxes. Reserve 3 free output spaces before consuming a batch. Full output pauses safely. Preserve a receiving area for returned cooked batches so capacity cannot trap the carried item; if needed, keep this recovery input unbounded for the contest version.
- Depositing boxes at the counter frees hands even when the front customer's request is larger. Retain pooled carried/counter fulfillment and one payment per completed order.
- Cashier consumes actual counter stock. Keep payment automatic; animate coins toward the HUD. Do not add a second walk just to collect money.
- Every carried item has a free receiving location: bundles to supply shelf, batches to packing input, boxes to counter. Refunds or deleting goods are not the recovery mechanic.

### C. Make growth visible and useful

Recommended suggestions, not forced purchase order:

1. First sale: unlock view of upgrades and explain the working-capital reserve once.
2. Carry basket, ₹30: visibly larger stack capacity and fewer journeys.
3. Packer, ₹45: an actual worker appears and takes over repeated packing.
4. Cashier, ₹60: automatically serves stocked boxes while the player cooks/transports.
5. Second steamer, ₹90: a small floor footprint becomes an operating cooking unit.

Buying any improvement gets one short arrival/unpack animation, visible benefit, and objective update. Keep familiar prices initially; tune only after a full timed run.

### D. One source of pressure

Use a single announced festival rush after the first staff hire. Queue activity increases briefly, with enough warning to prepare stock. No penalties for empty shelves, recurring rent, wages, breakdowns or spoiled inventory.

Recommended contest balance: customer patience affects optional tips, not the ability to eventually sell a stocked box. If customers leave, they only reduce that opportunity; orders continue arriving and stock remains. Explain the next useful action instead of displaying a generic “earn more” prompt.

Keep audio brief: soft pickup, lid/steam cue, paper fold, coin chime and one milestone flourish. Start audio after a gesture, provide mute and reduced-motion settings, and never rely on audio alone.

## 7. Winnable campaign and proof

Retain an 8–10 minute target. Begin the timed round after the guided first sale, with a clear transition. The initial limit is 10 minutes; tune it using ordinary players, not only scripted state changes.

Win: own the four current upgrades, reserve 12 packed boxes at a separate pandal dispatch stand, then complete a short 10-second courier journey. Show `Pandal order 0/12` only when unlocked. Ordinary customers and cashier cannot consume reserved delivery boxes. Dispatch is explicit and occurs once.

Results: festival completed / time expired, completion time, boxes sold and improvements. Provide Restart and optionally Continue Growing after victory; continued play cannot modify the finished competitive result.

### Economy check using the current prices

- Starting cash: ₹30; starting free bundles: 2.
- Each bought bundle costs ₹12 and produces 3 boxes worth ₹30: contribution ₹18.
- All four upgrades total ₹225.
- One feasible aggregate budget: sell 13 batches = 39 boxes; prepare 4 further batches = 12 delivery boxes.
- Total production 17 bundles, of which 15 are bought. Closing cash: `30 + 390 - (15 × 12) - 225 = ₹15`.
- This is a conservative whole-batch sale route with no tips. It demonstrates aggregate affordability, not the timing or purchase-order proof. Intermediate purchases must each preserve the ₹12 upgrade reserve, and ingredients must be bought in an executable order.
- At 8 seconds of steaming and 3 seconds packing, raw processing for 17 batches is 187 seconds before parallelism; travel, onboarding, queue delays and upgrades add time. An 8–10 minute round is plausible but not yet validated.

Acceptance: run a deterministic state simulation with valid chronological purchases, transport, production and dispatch, then two normal browser winning runs without debug money, teleporting, timer resets or forced sales. At least one unfamiliar player should finish with 20% time margin. If not, shorten paths/processing or extend the limit before adding more content. Test timeout and restart too.

Save/resume: versioned local save must include carried goods, input/output/active production, upgrades, cash, objective stage, dispatch and remaining time. Pause and hidden tabs freeze the same simulation clock. Handle invalid/old saves and missing storage gracefully; avoid restoring duplicate customer payments or granting offline income.

## 8. Implementation phases for Sol

Each phase ends with a reviewable checkpoint and actual evidence. Read this plan and current coordination records; inspect current code rather than rebuilding from an old summary. Estimates below are focused development/review time, not guaranteed model runtime or token consumption.

### Phase 0 — baseline and measurable targets (30–45 minutes)

- Confirm prior writer stopped and claim the authorized handoff. Inspect git status, current M2 docs and existing tests.
- Capture desktop and phone-size baseline images, actual renderer/display measurements, and a normal production loop.
- Establish reusable layout, palette, typography and asset sizing tokens. Record file map and remaining time.
- Gate: baseline tests/build pass; no undocumented working-tree conflict. Record the browser tool used and limitations.

### Phase 1 — one polished playable visual slice (2–3 hours)

Files: `src/main.ts`, `index.html`, `BootScene.ts`, `ShopScene.ts`, `UIScene.ts`, `Player.ts`, common station visuals, new small theme/layout helpers as needed.

- Solve renderer/texture/text sharpness and font readiness first.
- Implement cream shop floor, one coherent player, supply shelf, brass steamer, packing bench and counter.
- Make the first production loop look good with existing logic. Remove redundant labels and permanent rings; shorten routes and establish safe collision footprints.
- Add one objective and responsive screen-anchored HUD. Keep old functional upgrades accessible during the transition.
- Gate: compare screenshots at 1366×768 and 1920×1080, plus 844×390 and 390×844 layouts. No clipped HUD, tiny essential text, overlapping queue bubbles or accidental station triggers. Real goods must be identifiable without labels.
- Produce an actual playable screenshot before spreading the style across every screen. If the style still feels like the original placeholder UI, revise this slice first.

### Phase 2 — production flow and interaction reliability (2–3 hours)

Files: `src/types/index.ts`, `src/state/GameState.ts`, `src/config/balance.ts`, Ingredient/Steamer/Packing/Counter stations, `src/tests/economy.test.ts`.

- Implement independent steamer input/output and safe start/finish transitions.
- Implement packing job initiation/completion behavior and bounded output.
- Preserve return suppression, counter deposits, pooled fulfillment and reserve rules.
- Ensure UI animation cannot cause, delay indefinitely, or repeat authoritative inventory/payment mutations.
- Tests: two bundles unload; busy/ready steamer accepts input; full input returns safely; full output never destroys stock; deposit/collect ordering; packing keeps working after departure; staff starts queued jobs; simultaneous cashier/player service cannot pay twice.
- Add model-based or table-driven sequences checking nonnegative stock and bundle-equivalent conservation, including active jobs and boxes divided by three.
- Gate: original behavioral guarantees and new tests pass, plus a real browser loop using keyboard and pointer/touch return controls. Browser testing must use actual controls, not only calling state methods through developer tools.

### Phase 3 — visible growth, feedback and phone controls (2–3 hours)

Files: `Staff.ts`, `Customer.ts`, `Player.ts`, `UIScene.ts`, `UpgradeStation.ts`, `ShopScene.ts`, art assets.

- Complete staff/customer appearances, visible stock stacks and brief transfer/payment feedback.
- Make upgrade opening deliberate; show affordable next improvement in the world and concise detail in the modal.
- Add touch joystick and contextual action button, pointer ownership, focus-loss reset and modal input isolation. Camera follows on narrow screens; UI never moves with the world.
- Add respectful pandal background and restrained decoration. No shrine in the walking route.
- Gate: an unfamiliar player makes the first sale without explanation in roughly 30–45 seconds; a helper visibly changes the player's work; phone control hit areas remain usable.

### Phase 4 — campaign, ending, pause and save (3–4 hours)

Files: new focused campaign/save/result modules, connected through `ShopScene`, `UIScene`, state/config/types and tests.

- Guided first sale, upgrade objectives, one rush, dispatch, victory, timeout and restart.
- One simulation clock for production, customers, courier and campaign; pause/hidden tab semantics are consistent.
- Versioned save/resume with transaction-safe inventories and ended-run behavior.
- Automated checks: dispatch stock isolation, one ending transition, valid save during cooking/packing/courier, corrupt save fallback, no duplicate payment after resume, timer pause, complete valid-money winning sequence.
- Gate: two ordinary browser wins with timings and margin recorded, one timeout/retry, pause/refresh/restart tests. A scripted economy win alone does not pass the gameplay gate.

### Phase 5 — final polish and submission readiness (2–3 hours)

- Reduce visual noise, inspect text at native screen scale, confirm no missing fonts/assets and cap transient particles.
- Add sound/mute/reduced motion and final results polish if time remains.
- Test a real phone and laptop. Check fullscreen/window resizing, portrait/landscape, focus loss, console errors and sustained play performance. Target stable 60 FPS on laptop and at least stable 30 FPS on a representative phone; measure rather than claim.
- Run final tests/build; update short how-to-play, asset/tool credits and a 1–3 minute demo outline. Verify ending and replay in the production build.
- Gate: playable public build only after the user selects/authorizes publishing destination; preserve the submission requirements in `details.md`.

### Time and scope rule

Total hypothesis: roughly 12–17 focused hours plus unfamiliar-player testing and submission work. With other commitments, prioritize phases 1, 2 and 4. Complete controls sufficiently for mobile regardless of art cuts.

Aim for visual slice and production flow on September 16; growth and campaign on September 17; freeze features September 18; test/demo September 19. Submit September 20 before the stated 5 PM cutoff, targeting 2:30 PM Asia/Kolkata under the existing project planning assumption.

If time slips: cut camera flourish, extra customer variants, richer sound and rush animation. Keep clean art, readable controls, reliable production, meaningful upgrades, win/timeout/restart and mobile play. Preserve a working build at every phase. No multiple floors, complex wandering workers, new recipes, branches, multiplayer or ad systems before submission.

## 9. Model allocation and handoff

These are task-fit recommendations, not verified speed/quality benchmarks or weekly usage promises. Model names/settings must match the user's actual selector.

| Model/tool | Best use here |
| --- | --- |
| GPT-5.6 Sol High | Production state changes, renderer/camera/input architecture, campaign/save correctness, final bounded audit |
| GPT-5.6 Sol Medium | Implement an agreed layout, asset integration, ordinary UI and animation work within one phase |
| Sol Instant / Luna | Concise documentation, small copy edits, simple isolated fixes; no need for deep reasoning |
| GPT-5.6 Terra | Alternative for a bounded implementation phase when its quality/usage tradeoff is preferable in the user's account |
| Gemini 3.8 Flash in Antigravity | Optional primary owner for straightforward art integration, layout and effects once the visual slice is settled; browser verification when its local tooling works |
| GPT-6 Astra | Design review or a specific unresolved structural issue that survives focused attempts; unnecessary for each routine phase |

Recommended default: Sol builds one phase at a time, using High for phases 2 and 4 and Medium for established visual work. Use Gemini for a whole bounded phase only when saving Codex allowance outweighs handoff overhead. Avoid having several models rewrite the same files or review every minor edit.

Before Sol implementation, the user must stop the active Antigravity writer and assign the next phase through the existing handoff protocol or explicit reassignment. The implementation owner records status, modified files, checks, screenshot evidence and next phase. For a continuous Sol assignment, record that ownership explicitly instead of releasing to Gemini after every phase by habit. Do not infer ownership from elapsed time.

Each phase handoff should include only: this document path, phase number, current commit, ownership, new findings, failed checks and acceptance evidence. Reuse the file instead of repeatedly pasting the entire chat. Never promise the whole game fits within a percentage of a weekly quota.

## 10. Definition of success

- The game immediately looks like a warm Ganesh festival shop with recognizable modaks.
- At normal display size, the player can identify goods, stations and the next action without reading a wall of labels.
- Movement and automatic work are the primary controls; purchases are deliberate.
- Carry upgrades improve throughput and never make ordinary play feel trapped.
- Staff visibly reduce work and consume real stock.
- An ordinary new player can finish a complete round with a comfortable margin.
- The result, restart and mobile controls work in the production build.

## References

- User recording and attached Modak Mahal screenshots; local game/source inspection on 15 September 2026.
- Contest reference: `D:/Projects/Ekara/details.md`.
- Reference game identity: https://poki.com/en/g/cat-pizza
- Phaser scaling concepts: https://docs.phaser.io/phaser/concepts/scale-manager
- Installed-version scale API: https://docs.phaser.io/api-documentation/3.90.0/class/scale-scalemanager
- Text rendering API: https://docs.phaser.io/api-documentation/class/gameobjects-text — check installed 3.90.0 source/types before implementation because unversioned documentation can change.
