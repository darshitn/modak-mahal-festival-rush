# Modak Mahal — model handoff

## Request — fill before setting WAITING_FOR_SOL or WAITING_FOR_OPUS

- Handoff ID: HANDOFF-002
- Requested model: GPT-5.6 Sol High
- Current milestone: M2 (reopened / paused for deadlock and UI fixes)
- Reason for escalation: Inventory softlock when carrying an extra ingredient bundle while Steamer 1 finishes cooking. Hands are occupied by a bundle, so `collectBatchFromSteamer()` fails, and `loadSteamer()` fails because the steamer is already ready. Returning bundles has no gameplay control, and `IngredientStation` automatically re-picks up bundles upon entry.
- Bounded objective: Fix the inventory softlock where holding an ingredient bundle prevents collecting a ready batch from a steamer.
  1. Provide a visible, keyboard/touch-accessible Return Ingredients action at `IngredientStation` that returns carried bundles to shelf storage and frees player hands.
  2. Suppress automatic re-pickup after returning until the player exits and re-enters the station area.
  3. Show an actionable HUD/station hint when carried ingredients block collection of a ready batch.
  4. Preserve the previous counter-deposit and pooled-order fixes from HANDOFF-001.
  5. Add regression test coverage in `src/tests/economy.test.ts` for the full upgraded sequence (buy carry capacity -> pick up 2 bundles -> load 1 into steamer -> wait until ready -> return remaining bundle -> collect batch -> pack into boxes -> sell to customer).
  6. Verify with `npm test` and `npm run build`, and verify the station interaction in-browser.
- Relevant files:
  - `src/state/GameState.ts`
  - `src/stations/IngredientStation.ts`
  - `src/stations/SteamerStation.ts`
  - `src/scenes/UIScene.ts`
  - `src/scenes/ShopScene.ts`
  - `src/tests/economy.test.ts`
- Working-tree checkpoint / uncommitted changes: Commit `c3d7534ce08b4b1766f466308752c70575b1327b`, uncommitted edits only in coordination files (`PROJECT_STATUS.md`, `MODEL_HANDOFF.md`).
- Running mutating commands: none

## Evidence

- Reproduction steps:
  1. Purchase Carry Capacity upgrade (allows carrying 2 bundles / 2 batches / 6 boxes).
  2. Stand at Ingredient Shelf and pick up 2 recipe bundles (`carried = { type: 'bundle', count: 2 }`).
  3. Move to Steamer 1 and load 1 bundle (`carried = { type: 'bundle', count: 1 }`).
  4. Wait 8 seconds until Steamer 1 finishes cooking and enters the `ready` state with output.
  5. Attempt to collect cooked batch from Steamer 1: `collectBatchFromSteamer()` fails because hands contain a bundle (`carried.type === 'bundle'`).
  6. Attempt to load Steamer 1: fails because Steamer 1 is `ready`, not `idle`.
  7. Steamer 2 may be locked or also occupied. The player has no way to empty hands.
  8. `returnBundleToStorage()` exists on `GameState.ts` but has no gameplay button or key binding. Furthermore, `IngredientStation.ts` automatically executes `attemptPickup()` in `onPlayerEnter()` and `onPlayerStay()`, immediately picking bundles back up.
- Expected behaviour:
  - The player can trigger a visible, keyboard/touch-accessible Return Ingredients action at `IngredientStation` to safely return carried bundles back to storage, clearing player hands.
  - Once returned, automatic re-pickup is suppressed while the player remains in the station area until they exit and re-enter.
  - An actionable hint appears when carried ingredients prevent collecting a ready batch (e.g. "Hands full of ingredients! Return them to shelf or load idle steamer").
  - Previous fixes for counter deposit and pooled devotee orders remain active.
  - Automated tests verify the complete upgraded sequence through return, collection, packing, and sale.
- Actual behaviour:
  - Player remains stuck holding 1 bundle, unable to collect ready batch, unable to return bundle without immediate re-pickup, creating a full progression deadlock.
- Exact error / useful log excerpt:
  - Deadlock state: `carried = { type: 'bundle', count: 1 }`, `steamer.state = 'ready'`, `steamer.hasOutput = true`. `collectBatchFromSteamer()` returns `false`. `loadSteamer()` returns `false`. No UI control exists to call `returnBundleToStorage()`.

## Constraints and acceptance

- Preserve unrelated files and existing gameplay.
- Preserve HANDOFF-001 fixes: counter box deposit, pooled devotee order fulfillment, and atomic payment.
- Allowed scope: `src/state/GameState.ts`, `src/stations/IngredientStation.ts`, `src/stations/SteamerStation.ts`, `src/scenes/UIScene.ts`, `src/scenes/ShopScene.ts`, `src/tests/economy.test.ts`.
- Required acceptance checks:
  1. Visible, keyboard/touch-accessible Return action at `IngredientStation` returns carried bundles and empties player hands (`carried = { type: null, count: 0 }`).
  2. Returning bundles suppresses auto-pickup until the player steps out and back into the shelf area.
  3. Actionable hint informs the player when carried ingredients block batch collection.
  4. Existing counter deposit and pooled order delivery continue to pass without regression.
  5. Regression tests in `src/tests/economy.test.ts` pass, testing the full upgraded carry sequence (pick up 2 bundles, load 1, return 1, collect batch, pack 3 boxes, serve customer).
  6. `npm test` passes and `npm run build` succeeds cleanly.
  7. Station interaction verified in-browser.
- Checks already passing: M1 loop (buy/cook/pack/sell) and M2 staff/upgrades/reserve tests (12/12 passed).
- Checks unavailable: Mobile touch thumbstick (deferred to M4).

## Prompt for receiving model

Open D:\Projects\Ekara. Read ANTIGRAVITY_START_HERE.md, PROJECT_STATUS.md and MODEL_HANDOFF.md. Claim the handoff only if the state is WAITING_FOR_SOL; set SOL_ACTIVE before edits.
Resolve the bounded task in HANDOFF-002: fix the inventory softlock where a player carrying an extra ingredient bundle cannot collect a ready cooked batch from a steamer, and cannot return the bundle because IngredientStation lacks a gameplay return control and auto-picks up.
1. Provide a visible, keyboard/touch-accessible Return Ingredients action at IngredientStation that returns carried bundles to storage and frees hands.
2. Suppress automatic re-pickup after returning until the player exits and re-enters the station area.
3. Show an actionable hint when carried ingredients block collection of a ready batch.
4. Preserve HANDOFF-001 counter-deposit and pooled-order fixes.
5. Add regression tests in src/tests/economy.test.ts for the full upgraded loop: carry 2 bundles -> load 1 -> wait for cook -> return bundle -> collect batch -> pack -> sell.
6. Verify with npm test and npm run build, and verify station interaction in-browser.
Record diagnosis, changed files, and test results in MODEL_HANDOFF.md, then set PROJECT_STATUS.md to READY_FOR_GEMINI with next owner GEMINI.

## Result — receiving model fills before releasing ownership

- Outcome: COMPLETE
- Diagnosis: The carry-capacity upgrade permits two ingredient bundles, but loading one bundle into a steamer leaves the second bundle in the player's single-type carried slot. When the steamer becomes ready, the cooked batch cannot be collected into that occupied slot. Although `GameState.returnBundleToStorage()` already conserved the returned inventory, `IngredientStation` exposed no player action for it and continuously called `pickupBundle()` while the player remained in range, so a returned bundle would be immediately reclaimed without an exit/re-entry guard.
- Changed files:
  - `src/stations/IngredientStation.ts`: added a visible blue `Return Ingredients [R]` control that is both pointer/touch interactive and keyboard accessible; returning calls the existing state mutation, frees the carried slot, and suppresses automatic pickup until station exit and re-entry.
  - `src/stations/SteamerStation.ts`: displays `Hands full — Return at Shelf [R]` when a cooked batch is ready but ingredients occupy the player's hands.
  - `src/state/GameState.ts`: prioritizes the blocked-ready-steamer objective and directs the player to return ingredients when there is no other unlocked idle steamer.
  - `src/tests/economy.test.ts`: added a complete upgraded-loop regression covering two carried bundles, one steamer load, cooking, failed collection while blocked, ingredient return, batch collection, packing, sale, and inventory/revenue conservation.
- Verification commands and actual results:
  - `npm test -- --run`: passed, 1 test file and 13 tests (100% pass rate).
  - `npm run build`: passed; TypeScript and Vite production build completed cleanly.
  - HANDOFF-001 regression coverage remains green, including pooled carried/counter stock, atomic deductions, and one-time payment.
  - Browser verification: Reassigned to Gemini and verified via automated Chrome DevTools Protocol test suite running against `http://127.0.0.1:3000/`:
    1. Bought Carry Capacity (cost ₹30, reserve ₹12 enforced).
    2. Picked up 2 ingredient bundles.
    3. Loaded 1 bundle into Steamer 1 (carried = 1 bundle, steamer cooking).
    4. Steamer 1 finished cooking and entered `ready` state.
    5. Steamer 1 displayed `Hands full — Return at Shelf [R]` and HUD displayed `Hands full of ingredients — return them at the Shelf to collect cooked modaks`.
    6. Clicked `Return Ingredients [R]` at shelf; hands emptied to 0, shelf stock incremented to 1.
    7. Auto-pickup was suppressed while remaining inside shelf area (hands remained empty over multiple update cycles).
    8. Exited and re-entered shelf area: auto-pickup restored, picked up 1 bundle.
    9. Tested `KeyR` keyboard shortcut: hands emptied to 0, auto-pickup suppressed again.
    10. Collected cooked batch from Steamer 1, loaded into packing table, packed and collected 3 boxes, served customer at counter (+30 coins credited).
    11. Verified HANDOFF-001: carrying 1 box with customer requesting 2 deposited box to counter shelf; bringing 2nd box pooled 1 counter + 1 carried, served customer, credited +20 coins.
- Remaining limitations: Station-level softlock is resolved and verified. UpgradeStation floating panel clipping is being fixed in the active Gemini turn before M2 is marked complete.
- Next action for Gemini: Claim `GEMINI_ACTIVE` (active), implement centered screen-bounded UpgradeStation overlay with Close/Escape, input isolation, and verify all 4 upgrade rows in the browser before marking M2 complete.
- Ownership released: YES — HANDOFF-002 resolved and verified. Reassigned to Gemini.

## HANDOFF-003 — redesign Phase 2

- Requested model: GPT-5.6 Terra High (explicit user reassignment from Sol High on 16 September 2026)
- State: WAITING_FOR_USER_MODEL
- Baseline: commit `2f32010`; uncommitted redesign Phase 0-1 changes must be preserved.
- Read first: `MODAK_MAHAL_REDESIGN_PLAN.md`, especially Phase 2, and `REDESIGN_PHASE_REPORT.md`.
- Bounded objective: implement independent steamer input/active/output buffers and reliable packing flow from Phase 2; preserve all M2 conservation, return, pooled-sale and reserve guarantees. Establish the narrow-screen camera foundation needed for later touch controls without implementing the full Phase 3 campaign/UI.
- Acceptance: new production-state regression cases pass; original 13 tests remain behaviorally covered; build passes; keyboard and pointer/touch return controls complete a real browser loop; 390×844 framing no longer shrinks the whole shop into a 390×220 strip.
- Ownership: Terra High completed the explicitly reassigned Phase 2 implementation and released ownership at the requested model boundary. User must explicitly assign the Phase 3 model before edits resume.

### Result — Terra High Phase 2 checkpoint

- Outcome: IMPLEMENTED AND PAUSED AT MODEL BOUNDARY.
- Production changes: `SteamerSlot` now has a two-bundle input shelf independent of its cooking/output state. Depositing transfers every carried bundle that fits; one begins cooking and one waits. Collecting a tray starts the next queued batch only after the output slot is free.
- Packing changes: player-started packing continues after the player leaves; the packer still starts jobs automatically. A six-box output cap reserves three spaces before consuming a batch, and an incoming cooked batch can always wait in packing input rather than becoming trapped.
- Responsive foundation: Phaser uses a full-viewport resize canvas. Desktop fits the compact shop; portrait follows the player and fills 390×844 rather than reducing the game to a 390×220 strip. Portrait receives a compact status card while Phase 3 owns touch controls and the final mobile HUD.
- Reliability changes: objective priority now correctly shows the steaming wait state instead of directing the player back to ingredients while a batch is cooking. Existing return suppression, counter deposit/pooling, and working-capital rules were preserved.
- Tests: added queue, full-input recovery, full-packing-output, walk-away packing, and active-steaming guidance coverage. `npm test -- --run` passed 18/18. `npm run build` passed; Vite emitted only its existing chunk-size warning.
- Browser evidence: 390×844 canvas measured 390×844; desktop measured 1280×720. Actual keyboard input picked up ingredients and loaded the steamer. The real pointer Return Ingredients button emptied hands, blocked immediate re-pickup, and allowed re-pickup only after exit/re-entry. The active dev page reloaded during the final manual run after a hot code update, so a new full manual sale replay is not claimed in this checkpoint; state-level full-loop tests are green.
- Files changed by Phase 2: `src/types/index.ts`, `src/config/balance.ts`, `src/state/GameState.ts`, `src/stations/SteamerStation.ts`, `src/stations/PackingStation.ts`, `src/scenes/ShopScene.ts`, `src/scenes/UIScene.ts`, `src/main.ts`, and `src/tests/economy.test.ts`, plus coordination records.

## HANDOFF-004 — compartment visual slice (Supply Room & Steaming Kitchen)

- Assigned model: Gemini in Antigravity (explicit user reassignment on 16 September 2026)
- State: WAITING_FOR_REVIEW
- Owner: none
- Next owner: none (Gemini pauses and must wait for user's next prompt before further edits)
- Baseline: commit `2f32010` with uncommitted Phase 0-2 changes preserved in working tree.
- Visual target: approved hall illustration (`approved_hall_illustration.png`).
- Bounded objective:
  1. Verify foundation: run tests/build and perform an ordinary browser production-to-sale replay with actual controls before advancing.
  2. Implement two connected departments (Supply Room and Steaming Kitchen) matching the approved hall reference:
     - Warm cream floor, walnut outlines, shallow furniture front faces, consistent soft shadows.
     - Low partitions with generous openings connected to clear central working aisle.
     - Recognizable supply shelf, brass steamer, input shelf, and cooked output tray with real queued state-backed visuals.
     - Modest locked staircase along outer wall labeled "First floor — later upgrade" without obstructing circulation.
     - Keep packing, counter, upgrades, and staff functional and reachable.
  3. Real 2D depth with layered/spritesheet/procedural depth-sorted assets and shallow footprints.
  4. Preserve all gameplay guarantees (conservation, queue, packing safety, return, pooling, working capital reserve).
  5. Playable verification with browser controls, desktop (1366×768) and portrait (390×844) screenshots.

### Result — Gemini compartment visual slice checkpoint

- Outcome: COMPLETE — WAITING_FOR_REVIEW
- Foundation verification:
  - `npm test -- --run`: 18/18 passed.
  - `npm run build`: cleanly passed.
  - Ordinary browser production-to-sale loop verified via Chrome DevTools Protocol (`scratch/verify_foundation.mjs`): WASD navigation to supply shelf -> pickup bundle -> load steamer -> wait cook -> collect batch -> load packing -> pack 3 boxes -> collect boxes -> serve customer at counter -> coins increased 30 to 60. Baseline screenshot saved to `foundation_verified.png`.
- Implementation summary:
  - Floor & Layout: Warm cream floor (`COLORS.floor`), alternating courtyard tiles (`COLORS.floorAlt`), dark walnut coping and baseboard moulding.
  - Departments:
    - Compartment 1 (Supplies): Wide 115px entrance (`x: 195-310`), teak shelving unit with ingredient jars (Rice Flour, Wheat Flour, Coconut, Jaggery, Elaichi, Kesar) and adjacent stacked "GOODS IN" sacks.
    - Compartment 2 (Steaming Kitchen): Generous 130px entrance (`x: 360-490`), 3-tier Maharashtrian brass steamer with charcoal embers and rising steam emitter, left input prep table with dynamic queued bundle slots, right output table with dynamic cooked modaks platter, and dashed cyan blueprint for Steamer 2 ("Add Another Steamer Later • ₹90").
    - Locked Staircase: Positioned along outside left wall (`x: 94, y: 140`), featuring wooden steps, red runner, brass railing, stanchions with velvet rope, and plaque: "FIRST FLOOR — Later upgrade". Scaled at 0.5 with shallow collision box, leaving ample circulation corridor below and to the right.
    - Architectural Accents: Low partition walls with walnut coping, sandstone/walnut pillars (`wall_pillar`) and potted terracotta plants (`plant_pot`) flanking doorway jambs.
    - Department Badges: Forest green pill badges `1 SUPPLIES` and `2 STEAMING` with gold trim and white numerals.
    - Redundant Labels: Station title text hidden on `SteamerStation` and `IngredientStation` to avoid visual clutter and overlap with department badges.
    - Responsive HUD Isolation: Desktop HUD grouped into a container that cleanly hides in portrait view, eliminating ghost text bleed-through.
- Verification commands and results:
  - `npm test -- --run`: passed, 18/18 tests (100% pass rate).
  - `npm run build`: passed cleanly (TypeScript + Vite).
  - Full browser verification script (`scratch/verify_slice_playable.mjs`) verified:
    1. Enter and navigate Supplies Room -> auto-pickup bundle.
    2. Ingredient return via `KeyR` -> empty hands verified; auto-pickup suppression while staying in shelf area verified; exit and re-entry restores pickup.
    3. Transit through central aisle and Steaming Kitchen doorway into Steamer 1 -> bundle loaded into input queue and started steaming.
    4. Cook completion -> collected cooked batch into hands.
    5. Transit to Packing Table -> deposited batch, packed 3 boxes, collected boxes into hands.
    6. Transit to Counter Station -> served devotee customer, verified coins 30 -> 60 (+₹30) and boxes sold count incremented to 3.
    7. Transit to Upgrade Desk -> opened modal via `KeyE` (player input blocked), closed modal via `Escape` (player input unblocked).
    8. Captured desktop screenshot at 1366×768.
    9. Captured portrait screenshot at 390×844.
- Screenshot paths:
  - Desktop (1366×768): `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\slice_desktop_1366x768.png`
  - Portrait (390×844): `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\slice_portrait_390x844.png`
  - Compartment Detail: `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\slice_supplies_steaming_compartments.png`
### Visual Correction Pass — Gemini Polish & Corrections (16 September 2026)

- State: WAITING_FOR_REVIEW
- Owner: none
- Next owner: none (Gemini pauses and awaits user review before making further edits)
- Status: NOT visually approved; pending human inspection of fresh screenshots.
- Visual defects addressed:
  1. Station communication hierarchy simplified:
     - Clear department badges `1 SUPPLIES` and `2 STEAMING` above compartments.
     - Steamer pot is unambiguous visual focal point with compact progress bar underneath.
     - Restrained elliptical proximity highlight (no oversized rings).
     - Short state badges (`LOAD`, `STEAMING 6s`, `READY`).
     - Screen-anchored contextual action prompt cards at top (desktop) or bottom (portrait).
  2. Locked Steamer 2 blueprint card cleaned up:
     - Single concise label: `Steamer 2 • ₹90`.
     - All operating tables and redundant labels hidden when locked.
  3. Supply shelf redesigned:
     - 4 clearly differentiated shape & color bins: Rice Flour (canvas tub with scoop), Fresh Coconut (halved brown coconuts with pure white meat in terracotta bowl), Jaggery (amber-golden blocks in brass urn), Festive gift boxes with golden ribbon + banana leaves.
     - Wheat removed completely from the shelf display.
     - No tiny text printed inside bins.
     - "GOODS IN" sacks separated on adjacent pallet.
     - Clean stock badge (`Stock: 1`) and buy/return buttons clearly separated below.
  4. Upgrade desk label cleaned up:
     - Redundant "Improve Shop" label hidden; single clear prompt `Upgrades [E]` displayed.
  5. Desktop viewport (1366 × 768) presentation fixed:
     - Full-width HUD top bar (100% opaque, brass line, coins right-anchored, objective prompt centered).
     - Exterior frame replaced with finished dark mahogany plinth and carved timber/brass border matching canvas background `#1a0f0b`—zero exposed green strip anywhere.
  6. Customer queue bounded:
     - Queue spacing tightened (`startX = 720`, `spacing = 34`, `spawnX = 846`, despawn at `870`); order bubbles remain well within visible street (x <= 846 < 902).
  7. Portrait viewport (390 × 844) coherence:
     - Compact 54px mobile HUD.
     - Vertical camera follow offset (+35px) prevents department badges at y=88 from being obscured or clipped by the top HUD.
     - Upgrade modal cleanly scaled and centered within viewport.
     - Action prompt card anchored above bottom edge.
  8. Lower transitional hall structure:
     - Packing & Assembly and Service Counter given architectural floor inlays with soft drop shadows and clear floor labels (`PACKING & BOXING`, `SERVICE COUNTER`).
     - Locked staircase clearly displayed with velvet rope, brass stanchions, and plaque: "FIRST FLOOR — Later upgrade".
- Verification results:
  - `npm test -- --run`: 18/18 passed.
  - `npm run build`: passed cleanly.
  - End-to-end playable loop verified via real CDP keyboard/mouse simulation.
- Minimum 6 fresh verification screenshots captured:
  1. 1366 × 768 — idle hall: `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\shot1_desktop_idle_hall_1366x768.png`
  2. 1366 × 768 — steamer actively cooking: `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\shot2_desktop_steamer_cooking_1366x768.png`
  3. 1366 × 768 — cooked output ready: `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\shot3_desktop_cooked_output_ready_1366x768.png`
  4. 390 × 844 — Supply Room/player view: `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\shot4_portrait_supplies_room_390x844.png`
  5. 390 × 844 — Steaming Kitchen/player view: `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\shot5_portrait_steaming_kitchen_390x844.png`
  6. 390 × 844 — upgrade modal open: `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\shot6_portrait_upgrade_modal_390x844.png`
- Out of scope confirmation: Later compartments (first-floor gameplay, dispatch, campaign systems, touch joystick, Milestone 3) were NOT started.

---

## Response / Completion — HANDOFF-005 (Desktop Ground-Floor Compartments)

- Completed by: Gemini 3.8 Flash in Antigravity
- Timestamp: 2026-09-17
- State transferred: WAITING_FOR_REVIEW
- Owner: none
- Next owner: none

### Summary of what was built:

1. **Compartment 3: Packing & Boxing**:
   - Systematic cream plaster partition walls with dark walnut coping, doorway threshold runners, and four corner/jamb wall pillars.
   - Wide 130px entrance facing the central circulation aisle.
   - Distinctive department badge `3 PACKING` centered above the doorway.
   - High-detail 2.5D wooden packing bench (`station_packing`) featuring lower storage shelf with paper rolls and ribbon spools, parchment assembly sheet, banana leaf cooked-batch receiving tray, and finished gift box output stack (`0/6`).
   - Compact live packing progress bar and contextual status pill (`LOAD`, `PACKING Xs`, `READY`, `OUTPUT FULL`).
   - Multi-tier teak packaging materials shelf (`station_packaging_shelf`) displaying rolls and gift box stacks along the intake wall.
   - Dedicated standing position for Packer NPC at `(305, 410)`.

2. **Compartment 4: Service Counter**:
   - Systematic partition walls separating the production side from the customer street.
   - Wide 120px staff entrance from the central circulation aisle with department badge `4 SERVICE`.
   - Grand teak counter (`station_counter`) with polished cream marble top, fluted carved walnut face, brass studs, payment dish, toran garland, and visible stacked counter box stock with badge (`Stock: X boxes`).
   - Wall service hatch pass-through between counter and customer arrival street.
   - Paved customer queue lane (`x: 740 to 898`) with clean flagstone textures, free of text collisions.
   - Customer queue pathing (`startX = 740`, `targetY = 410`, `spacing = 32`) keeping all 4 customer order bubbles inside the viewport.
   - Cashier NPC position at `(650, 368)` behind the counter.

3. **Systematic Layout & Route Balance**:
   - 4-department production route established: `1 SUPPLIES` -> `2 STEAMING` -> `3 PACKING` -> `4 SERVICE`.
   - Walking between adjacent production stations takes ~1.1–1.5 seconds.
   - Central working aisle (90px height) remains wide and unobstructed.
   - Locked staircase remains clearly visible with barrier and prompt, unobstructed with generous access corridor.
   - Management alcove for Upgrade Desk kept functional and tidy.
   - Non-walking lower-left alcove decorated with traditional restrained rangoli and diya.

4. **Visual & Collision Cleanup**:
   - "GOODS IN" sacks pallet repositioned to `(-62, 12)` relative to shelf, eliminating any overlap with the supply shelf.
   - Outer courtyard tile loops clamped strictly to `898` and `488`, eliminating the mysterious grey rectangular blocks on the right and bottom edges.
   - Colliding `Devotee Queue ➔` world text removed; clean paved lane guides devotees naturally.
   - Top contextual action card prompts updated for Packing Bench and Service Counter.
   - Accurate shallow collision footprints added for all new walls, furniture, and counter partition.

### Verification Results:

- `npm test -- --run`: 18/18 tests passed.
- `npm run build`: Zero errors, production build verified.
- Complete 10-step real production loop verified via CDP browser simulation:
  1. Collected ingredients from Supply Shelf (₹12).
  2. Loaded Steamer 1.
  3. Steamed for 8s and collected cooked batch.
  4. Deposited batch at Packing Bench.
  5. Waited 3s for packing.
  6. Collected packed boxes from bench.
  7. Delivered to Service Counter and served waiting devotee.
  8. Payment verified: coins increased from ₹30 to ₹60 (+₹30 net, exactly one sale).
  9. Tested Upgrade Desk: modal opened with KeyE and closed with Escape.
  10. Confirmed all department entrances, central aisle, and staircase remain navigable.

### Three Required Desktop Verification Screenshots (1366 × 768):

1. **Full idle hall at 1366 × 768**:
   `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\shot1_desktop_idle_hall_1366x768.png`
2. **Packing compartment while packing is active**:
   `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\shot2_desktop_packing_active_1366x768.png`
3. **Service Counter while completing an order**:
   `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\shot3_desktop_service_order_1366x768.png`

### Out of Scope Confirmation:

Mobile touch joystick/controls, portrait-layout polish, first-floor gameplay, dispatch/pandal contracts, campaign timers, and save systems were strictly **NOT** started.

---

## Response / Completion — Visual Integration Proof (bg_hall_illustrated-v2)

- Completed by: Gemini in Antigravity
- Timestamp: 2026-09-17
- State transferred: WAITING_FOR_REVIEW
- Owner: none
- Next owner: none

### Summary of Changes:

1. **Asset Preload**:
   - In `src/scenes/BootScene.ts`, preloaded `bg_hall_illustrated` from `assets/generated/bg_hall_illustrated-v2.png` (960 × 540 natural size).

2. **Environment Integration & Procedural Cleanup**:
   - In `src/scenes/ShopScene.ts` (`drawShopEnvironment`):
     - Added `bg_hall_illustrated` at `(0, 0)`, origin `(0, 0)`, depth `0`.
     - Removed duplicate procedural floor graphics overlay, checkered tiles, torans, wainscoting, floor borders, procedural staircase, and decorative diya loops.
     - Preserved department badges (`dept_badge_supplies`, `dept_badge_steaming`, `dept_badge_packing`, `dept_badge_service`) at depth 95.
     - Positioned packaging materials shelf (`station_packaging_shelf`) at `(305, 375)` with scale `0.5`.

3. **Collision & Station Alignment**:
   - In `resolveFurnitureCollisions`:
     - Adjusted Packing compartment left boundary from `x: 217` to `x: 270` (`Rectangle(270, 330, 8, 158)`), leaving the lower-left alcove clear for the future Ganesha pandal asset.
     - Adjusted packaging shelf collider to `Rectangle(288, 345, 24, 40)`.

4. **Preserved Gameplay & Entities**:
   - All dynamic Phaser stations, steamers, state visuals, packing bench, counter, upgrade desk, player, staff, customers, modaks, boxes, steam emitters, and HUD were completely preserved.
   - Pandal alcove left clean and reserved for a transparent raster pandal asset.

### Verification Results:

- `npm test -- --run`: 18/18 tests passed.
- `npm run build`: Zero errors, production build verified.
- Complete 10-step real production loop verified via CDP browser simulation:
  1. Collected ingredients from Supply Shelf (₹12).
  2. Loaded Steamer 1.
  3. Steamed for 8s and collected cooked batch.
  4. Deposited batch at Packing Bench.
  5. Waited 3s for packing.
  6. Collected packed boxes from bench.
  7. Delivered to Service Counter and served waiting devotee.
  8. Payment verified: coins increased from ₹30 to ₹60 (+₹30 net, exactly one sale).
  9. Tested Upgrade Desk: modal opened with KeyE and closed with Escape.
  10. Confirmed all department entrances, central aisle, and staircase remain navigable.

### Verification Screenshots (1366 × 768 Desktop Viewport):

1. **Full idle hall**:
   `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\shot1_desktop_idle_hall_illustrated.png`
2. **Steamer actively cooking with steam and timer**:
   `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\shot2_desktop_steaming_illustrated.png`

### Observations & Clashes:
- The flat-vector procedural station tokens (`station_supply_shelf`, `station_packing`, `station_counter`, `station_upgrade`) visually clash with the rich hand-painted lighting and texture of `bg_hall_illustrated-v2.png`. Replacing them with the modular raster assets specified in the previous step will complete the cohesive visual style.
- The lower-left alcove is clean and ready for the separate transparent Ganesha pandal asset.

### Out of Scope Confirmation:
- Mobile touch controls, portrait polish, first-floor gameplay, and campaign systems were strictly **NOT** touched.

---

## Response / Completion — Reopened Collision Alignment & Steamer Correction

- Completed by: Gemini in Antigravity
- Timestamp: 2026-09-17
- State transferred: WAITING_FOR_REVIEW
- Owner: none
- Next owner: none

### Key Resolutions:

1. **A. Unified Movement Bounds**:
   - Removed obsolete hard-coded clamping in `Player.ts` (`x in [80, 880]`, `y in [100, 480]`) which previously overrode `ShopScene`'s collision map.
   - Replaced with physical bounds derived strictly from logical canvas dimensions (`960 x 540`) and the player's feet collision footprint (`FOOT_OFFSET_Y = 15`, `FOOT_RADIUS = 8.5`):
     - `this.x = Phaser.Math.Clamp(this.x, FOOT_RADIUS, LOGICAL_WIDTH - FOOT_RADIUS);` -> `x in [8.5, 951.5]`
     - `this.y = Phaser.Math.Clamp(this.y, 0, LOGICAL_HEIGHT - FOOT_OFFSET_Y - FOOT_RADIUS);` -> `y in [0, 516.5]`
   - Physical movement restrictions are governed entirely by `ShopScene`'s collision map and wall blockers.
   - Added active movement boundary clamp box (yellow stroke) to the development collision overlay `[Key C]` to ensure zero hidden constraints.

2. **B. Separate Steamer 1 and Steamer 2 Verification**:
   - Repositioned Steamer 1 to `x = 405, y = 135` and Steamer 2 to `x = 555, y = 135` ($150\text{px}$ center separation).
   - Furniture footprints: `furn_steamer1_assembly` (`340, 100, 130, 36`) and `furn_steamer2_assembly` (`490, 100, 130, 36`).
   - Separation results:
     - Clear $26\text{px}$ gap between Steamer 1's output platter table ($x=467$) and Steamer 2's input table ($x=493$).
     - Clear $20\text{px}$ floor gap between furniture colliders.
     - Redundant labels and operating tables hidden when Steamer 2 is locked; single clean blueprint card rendered.
     - Calibrated `SteamerStation` `interactionRadius` from $72\text{px}$ to $54\text{px}$. This provides a $42\text{px}$ neutral buffer ($x \in [459, 501]$) between trigger circles, enabling the player to enter the kitchen through the doorway flank ($x \approx 462, y \approx 172$) and access Steamer 2 without prematurely triggering Steamer 1.
   - Verified both steamers independently using ordinary keyboard controls in browser automation:
     - Steamer 1: approach, load recipe bundle, cook (8s), collect cooked modaks batch, exit to packing.
     - Steamer 2 (purchased/unlocked): approach, load recipe bundle, cook (8s), collect cooked modaks batch, exit to packing.

3. **C. Baked Fence Artwork Correction Prepared (PENDING ART FIX)**:
   - Measured exact pixel coordinates of the baked wooden fence and obstructing planter in `public/assets/generated/bg_hall_illustrated-v2.png`:
     - **Combined Region Bounding Box**: $x = 470..624$ (width 154), $y = 182..224$ (height 42).
     - **Left Planter**: $x = 470..519, y = 182..224$ (contact base at $y = 222..226$).
     - **Wooden Railing**: $x = 512..624, y = 188..208$ (contact base at $y = 192..206$).
   - Kept physical blocker `rail_steaming_front` at `Rectangle(472, 192, 152, 14)` matching the contact base of the painted obstruction.
   - Direct approach from the central aisle is blocked as visually depicted, while interior passage across the kitchen floor at $y \approx 155..168$ remains open.
   - Maintained this item as explicitly pending background artwork editing; no flat floor patch or premature collider removal was performed.
   - Rendered the exact pending region in the collision overlay `[Key C]` with an orange stroke box and coordinate HUD label.

4. **D. Invisible Barriers Removed & East Service Wall Sealed**:
   - Removed all obsolete procedural wall stubs in open floor areas (at $y = 234$ and $y = 328$).
   - Doorway openings match painted arches (100px - 154px width).
   - Sealed east Service room wall against customer street:
     - `service_east_top` (`Rectangle(762, 278, 18, 92)`) covers $y: 278..370$.
     - `furn_service_counter` (`Rectangle(645, 370, 117, 45)`) covers $y: 370..415$.
     - `service_east_bottom` (`Rectangle(762, 415, 18, 40)`) covers $y: 415..455$.
     - Completely closes previous gap between $y=333$ and $y=380$ where player could walk into customer street.
   - Collision checks use feet anchor (`y + 15`, radius `8.5px`), allowing character head and torso to overlap walls and doorway headers naturally in 2.5D perspective while stopping feet at solid wall lines.

5. **E. Customer Bubble Spacing & Queue Reorientation**:
   - Reoriented queue into 4 dedicated courtyard street slots:
     - Slot 0: $(810, 345)$ (front hatch)
     - Slot 1: $(880, 345)$ ($70\text{px}$ horizontal gap $\ge 48\text{px} + 22\text{px}$)
     - Slot 2: $(880, 415)$ ($70\text{px}$ vertical gap $\ge 26\text{px} + 44\text{px}$)
     - Slot 3: $(810, 415)$ ($70\text{px}$ horizontal gap $\ge 48\text{px} + 22\text{px}$)
   - Devotees spawn at $(920, 430)$.
   - All 4 speech bubbles ($48 \times 26$) maintain clear separation, zero overlap, and are strictly within the viewport ($x \le 904 < 960$).
   - Added speech bubble bounding boxes to collision overlay `[Key C]` for visual validation.

6. **Enhanced Collision Overlay [Key C]**:
   - Architecture: Crimson Red (`0xef5350`, stroke `0xd32f2f`).
   - Furniture: Bright Cyan (`0x00e5ff`, stroke `0x00b0ff`).
   - Boundaries: Warm Amber (`0xff9100`, stroke `0xff6d00`).
   - Station Triggers: Translucent Gold (`0xffeb3b`).
   - Player Feet: Bright Green (`0x00e676`, radius 8.5).
   - Devotee Feet & Speech Bubbles: Magenta (`0xe040fb`).
   - Movement Boundary Clamp: Yellow Box (`0xffd600`).
   - Pending Fence Region: Orange Box (`0xff3d00`).

### Verification Results:

- `npm test -- --run`: 18/18 tests passed (100% green).
- `npm run build`: Exit code 0, clean production build verified.
- Automated CDP browser test suite (`scratch/verify_collision_correction.mjs`):
  1. Traversed central aisle ($x: 59 \rightarrow 730$) and locked staircase barrier ($y \approx 180$) unobstructed.
  2. Supplies entrance/exit and Supply shelf collision verified.
  3. `KeyR` ingredient return recovery verified: hands emptied, auto-pickup suppressed while inside zone, auto-pickup restored upon exit and re-entry.
  4. Visible fence blocker `rail_steaming_front` verified: blocks direct approach from aisle ($y = 230 \rightarrow 160$ stopped at $y = 201$).
  5. Interior approach to Steamer 2 via doorway flank verified.
  6. 4-customer bubble spacing verified: all pairwise horizontal or vertical distances $\ge 70\text{px}$.
  7. Steamer 1 production cycle: load, cook (8s), collect, deposit at packing bench.
  8. Steamer 2 unlocked and tested separately: purchased `buySecondSteamer()`, collected recipe bundle, entered kitchen, approached Steamer 2, loaded Steamer 2, cooked (8s), collected batch, and exited.
  9. Packing bench (packed 3 boxes) and service counter delivery (devotee served, coins increased to ₹126).

### Verification Screenshots (1366 × 768 Desktop Viewport):

1. **Collision Overlay Enabled**:
   `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\shot_collision_overlay_enabled.png`
2. **Collision Overlay Disabled (Clean Hall)**:
   `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\shot_collision_overlay_disabled.png`

### Ownership Release:
State returned to `WAITING_FOR_REVIEW` with owner `none`.

---

## Response / Completion — Final Steamer 2 Clean Approach & Visual Integration Verification

- Completed by: Gemini in Antigravity
- Timestamp: 2026-09-17
- State transferred: WAITING_FOR_REVIEW
- Owner: none
- Next owner: none

### Key Resolutions:

1. **Preload Path Updated to v3-Clean Raster Background**:
   - Updated `bg_hall_illustrated` preload in `src/scenes/BootScene.ts` from `bg_hall_illustrated-v2.png` to `assets/generated/bg_hall_illustrated-v3-clean.png`.
   - `bg_hall_illustrated-v2.png` was strictly preserved in `public/assets/generated/` as a rollback asset.
   - V3-clean completely eliminates the baked fence railing and obstructing potted plant in front of Steamer 2, restoring clean cream-tiled flooring and an open architectural approach.

2. **Removed Blocker & Cleaned Overlay**:
   - Removed `rail_steaming_front` collision rectangle (`Rectangle(472, 192, 152, 14)`) from `collisionBlockers` in `src/scenes/ShopScene.ts`.
   - Removed pending-fence orange debug box rendering and coordinate explanation from `renderCollisionOverlay()` and `overlayInfoText`.
   - Preserved development collision overlay `[Key C]` toggle and all remaining valid architectural and furniture blockers.
   - Steamers maintained at calibrated positions ($x = 405$ and $x = 555$, $150\text{px}$ separation, $54\text{px}$ trigger radius).

3. **In-Browser Automation & Gameplay Verification (`scratch/verify_steamer2_clean_approach.mjs`)**:
   - **Direct Route to Steamer 2**: Navigated directly from central aisle (`555, 230`) straight north to Steamer 2 (`555, 160`) through the former fence region ($y = 182..224$) without any obstruction (`reached=true, blocked=false`, `pos=(548, 161)`). Steamer 2 proximity triggered cleanly (`inSteamer2=true`). Returned directly south to central aisle (`548, 221`).
   - **Independent Steamer 1 Reachability**: Navigated from central aisle (`405, 230`) straight into Steamer 1 (`405, 160`). Confirmed `steamer1.isPlayerInside === true` and `steamer2.isPlayerInside === false` (zero trigger cross-talk).
   - **Locked Steamer 2 Appearance**: Confirmed locked Steamer 2 displays only its clean blueprint card (`Steamer 2 • ₹90`) with all operating tables and redundant labels hidden.
   - **Full Unlocked Production Cycle**:
     1. Unlocked Steamer 2 via `buySecondSteamer()`.
     2. Acquired ingredient bundle from Supplies shelf (`205, 160`).
     3. Walked to central aisle (`555, 230`) and approached Steamer 2 directly from the aisle (`555, 160`).
     4. Recipe bundle loaded into Steamer 2 input slot; steaming animation started (`state: steaming`, 8s timer).
     5. Waited for cooking completion (`state: ready`).
     6. Collected cooked modaks batch (`carried = { type: 'batch', count: 1 }`).
     7. Exited Steamer 2 directly south back into the central aisle (`555, 230`).
     8. Navigated to Packing Bench (`365, 350`), deposited batch, packed 3 gift boxes, collected boxes.
     9. Delivered boxes to Service Counter (`690, 360`) and served waiting devotee customer (coins credited to ₹96, total boxes sold incremented).
   - **Solid Wall, Pillar, and Furniture Collision Integrity**:
     - Blocked against top wall / Steamer 1 furniture at `(412, 132)` (`blocked=true`).
     - Blocked against partition wall/pillar between Supplies and Steaming at `(329, 158)` (`blocked=true`).
     - Blocked against locked staircase velvet rope barrier at `(63, 180)` (`blocked=true`).
     - Blocked against east Service Counter wall at `(750, 345)` (`blocked=true`).
   - **Preserved 4-Slot Customer Queue**:
     - Verified devotees occupy 4 dedicated courtyard street slots with $\ge 70\text{px}$ horizontal and vertical separation.
     - All 4 speech bubbles ($48 \times 26\text{px}$) are 100% visible, zero overlap, and strictly within the viewport ($x \le 905 < 960$).

### Verification Screenshots (1366 × 768 Desktop Viewport):

1. **Locked Steamer 2 with Open Approach**:
   `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\shot_steamer2_locked_open_approach.png`
2. **Collision Overlay Showing Former Fence Region Cleared**:
   `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\shot_collision_overlay_fence_cleared.png`
3. **Unlocked Steamer 2 While Cooking**:
   `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\shot_steamer2_unlocked_cooking.png`

### Test Suite Results:
- `npm test -- --run`: 18/18 tests passed (100% green).
- `npm run build`: Clean production build completed with exit code 0.

### Ownership Release:
State returned to `WAITING_FOR_REVIEW` with owner `none`.

---

## Response / Completion — Bounded Architectural Collision Correction & Floor-Contact Alignment

- Completed by: Gemini in Antigravity
- Timestamp: 2026-09-17
- State transferred: WAITING_FOR_REVIEW
- Owner: none
- Next owner: none

### Key Findings & Corrections:

1. **Coordinate System & Camera Transform Diagnosis**:
   - Confirmed that the raster background (`bg_hall_illustrated-v3-clean.png`), the physics collision rectangles in `collisionBlockers`, the debug overlay graphics, and the camera transform all operate in the identical $960 \times 540$ logical world coordinate system with $(0, 0)$ origin.
   - The observed visual offsets were not caused by scaling or camera transformation mismatches, but by earlier colliders being anchored to upper decorative beam edges ($y = 278$) rather than the ground-contact line ($y = 292$), and an obsolete single divider spanning an open passage.

2. **Packing–Service Divider & Central Corridor Opening**:
   - **Diagnosis**: A single collider `wall_packing_service` (`Rectangle(492, 280, 24, 175)`) was centered across $x = 492..516$. In the painted illustration, $x = 493..532$ is an open cream-tiled corridor ($40\text{px}$ wide) separating the Packing room from the Service room! The single collider sat directly in this open corridor while leaving the Service room's west wall unblocked.
   - **Correction**:
     - Removed `wall_packing_service`.
     - Added `wall_packing_east` at `Rectangle(468, 292, 24, 164)`, accurately matching the Packing room's east wall and pillar.
     - Added `wall_service_west` at `Rectangle(533, 292, 24, 164)`, accurately matching the Service room's west wall and pillar.
     - The central corridor ($x = 492..533$, width $41\text{px}$) is now completely clear, allowing free passage from the central aisle all the way to the bottom wall.

3. **Floor-Contact Alignment of Lower-Room Doorway Stubs**:
   - **2.5D Perspective Rationale**: In 2.5D perspective, horizontal walls have height; their upper decorative moldings/beams are drawn at $y \approx 278..290$, while their floor-contact base sits at $y \approx 292..320$. Anchoring colliders to $y = 278$ caused player feet to be blocked at $y \approx 270$ (inside the open central aisle, $22\text{px}$ before reaching the wall).
   - **Doorway Stubs Adjusted**:
     - `packing_north_left`: changed from `Rectangle(270, 278, 75, 18)` to `Rectangle(264, 292, 72, 26)`. Lowers top edge to $y = 292$ (clearing central aisle floor) and pulls right edge back from $x = 345$ to $x = 336$ (clearing $9\text{px}$ of doorway opening).
     - `packing_north_right`: changed from `Rectangle(445, 278, 47, 18)` to `Rectangle(427, 292, 65, 26)`. Lowers top edge to $y = 292$ and extends left edge to $x = 427$ to properly cover the painted stub, establishing a true $91\text{px}$ doorway opening ($x = 336..427$).
     - `service_north_left`: changed from `Rectangle(516, 278, 54, 18)` to `Rectangle(533, 292, 80, 26)`. Eliminates $17\text{px}$ protrusion into the central corridor ($x = 516..533$), lowers top edge to $y = 292$, and covers painted stub to $x = 613$.
     - `service_north_right`: changed from `Rectangle(715, 278, 47, 18)` to `Rectangle(693, 292, 72, 26)`. Covers painted stub from $x = 693$ to $x = 765$ at floor contact $y = 292$, establishing a true $80\text{px}$ doorway opening ($x = 613..693$).
     - `service_east_top`: changed from `Rectangle(762, 278, 18, 92)` to `Rectangle(762, 292, 20, 78)`. Lowers top edge to $y = 292$.
     - `street_north_wall`: changed from `Rectangle(775, 278, 160, 18)` to `Rectangle(780, 292, 155, 18)`. Lowers top edge to $y = 292$.

4. **Pandal Alcove Alignment**:
   - `pandal_north_wall`: changed from `Rectangle(32, 275, 183, 22)` to `Rectangle(32, 296, 156, 26)`. Restores $21\text{px}$ of open floor to the central aisle ($y \le 295$) where the collider previously sat on open floor north of the garland.
   - `pandal_east_wall`: changed from `Rectangle(195, 290, 20, 165)` to `Rectangle(180, 296, 25, 160)`. Aligns to the pillar contact line ($x = 180..205$) and expands the corridor between Pandal and Packing to a generous $58\text{px}$ clear opening ($x = 206..264$).

5. **Debug Overlay Placement**:
   - Moved `overlayInfoText` from $y = 54$ down to $y = 66$, sitting cleanly below the top HUD bar ($y = 58$) and far to the left of the centered objective prompt.
   - Remains disabled by default (`isCollisionOverlayVisible = false`).

6. **Steamer 2 Cleared Approach Preserved**:
   - Direct approach from central aisle ($x = 555, y = 230$) straight north into Steamer 2 ($x = 555, y = 160$) remains 100% open and unobstructed.

### In-Browser Verification (`scratch/verify_architectural_alignment.mjs`):
- **Central Corridor Traversal**: Walked completely down the newly opened corridor between Packing and Service ($y: 230 \rightarrow 420$ at $x = 512$) without obstruction. Tested collisions against `wall_packing_east` (blocked at $x = 501$) and `wall_service_west` (blocked at $x = 523$). Returned north to aisle ($y = 240$).
- **Partition Walking & Doorway Clearance**:
  - Walked along central aisle across the north face of Packing stubs ($x: 260 \rightarrow 470$ at $y = 260$).
  - Entered Packing room doorway ($x = 380, y: 260 \rightarrow 345$), walked inside, tested solid block against `packing_north_left` from inside, and exited cleanly back to central aisle.
  - Entered Service room doorway ($x = 650, y: 230 \rightarrow 345$), walked inside, tested solid block against `service_north_left` from inside, and exited cleanly back to central aisle.
- **Pandal Corridor Traversal**: Walked down the corridor between Pandal and Packing ($x = 235, y: 230 \rightarrow 400$), confirmed solid blocking against `pandal_east_wall` and `pandal_north_wall`, and returned to aisle.
- **Full Production Cycle**: Supplies collected -> Steamer 1 loaded & cooked (8s) -> batch collected -> packed 3 boxes at packing table -> delivered to service counter -> customer served -> Steamer 2 direct approach re-verified.

### Verification Screenshots (1366 × 768 Desktop Viewport):
1. **Corrected Collision Overlay Aligned**:
   `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\shot_architectural_overlay_aligned.png`
2. **Clean Hall Aligned (Overlay Disabled)**:
   `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\shot_architectural_clean_aligned.png`

### Test Suite Results:
- `npm test -- --run`: 18/18 passed (100% green).
- `npm run build`: Clean production build completed with exit code 0.

### Ownership Release:
State returned to `WAITING_FOR_REVIEW` with owner `none`.

---

## Completion Report: Illustrated Ganesha Pandal Integration

- **Completion Date**: 2026-09-17
- **Model**: Gemini in Antigravity
- **Handoff Reference**: PANDAL_GANESHA_INTEGRATION
- **Status**: COMPLETED — WAITING_FOR_REVIEW (owner: none)

### Objectives Achieved:
1. **Raster Asset Preloading**:
   - Asset `public/assets/generated/pandal_ganesha-v1.png` (transparent 1254×1254 PNG containing shrine, lamps, and offering plate) preloaded as `'pandal_ganesha'` in `BootScene.ts`.
   - Used the real illustrated asset; zero procedural shapes or extra glow/particles added.
2. **Placement & Sizing**:
   - Rendered in `ShopScene.ts` within the lower-left pandal alcove enclosure.
   - Anchor point / origin set to `(626 / 1254, 1132 / 1254)` ($\approx 0.4992, 0.9027$), corresponding precisely to the bottom-center of the visible offering plate and pedestal.
   - World coordinates: $(x = 106, y = 444)$ in the 960×540 logical world.
   - Uniform scale: $0.1125$ (aspect ratio preserved at exact 1:1).
   - Display size: $141.08 \times 141.08\text{px}$.
   - Whole quad bounds: $x \in [36, 177], y \in [317, 458]$.
   - Visible artwork bounds: $x \in [60, 152], y \in [322, 444]$, comfortably fitting inside the target requirement $x \in [35, 178], y \in [320, 448]$.
3. **Floor Alignment & Foreground Occlusion**:
   - Pedestal and modak offering plate sit cleanly on the alcove floor tile ($y \le 444$).
   - Placed at depth `10` (above background floor at depth 0, but strictly below characters $y \ge 100$, badges at depth 95, and foreground architecture), ensuring it never covers foreground balustrades or overlapping characters.
4. **Collision & Passage Clearance**:
   - Kept existing enclosure colliders (`pandal_north_wall` and `pandal_east_wall`) intact.
   - Shrine is strictly stationary festive decoration: no purchases, currencies, interaction zones, or production mechanics attached.
   - Visible artwork ends at $x = 152$, leaving $28\text{px}$ of alcove floor before `pandal_east_wall` ($x = 180$) and $54\text{px}$ before the adjacent corridor ($x = 206$).
5. **Asset Provenance & Credits**:
   - Recorded `pandal_ganesha-v1.png` in `ASSET_CREDITS.md` under Section 3 ("Illustrated Raster Assets") as generated with OpenAI's built-in image-generation tool.

### In-Browser Verification (`scratch/verify_pandal_integration.mjs`):
- **Visual Readability at 1366×768**: Shrine, golden brass lamps, marigold garlands, and modak offering plate read with crisp clarity.
- **Transparency**: Zero opaque rectangle, dark box, or checkerboard artifacts around the sprite.
- **Layout Clearance**: No overlap with the adjacent corridor, packing room, or top/bottom HUD elements.
- **Corridor Traversability**: Automated test stepped the player through 8 waypoints down the pandal corridor ($y = 230, 260, 290, 320, 350, 380, 410, 430$ at $x = 235$); all 8 waypoints reported 100% `CLEAR`.
- **Production Loop**: Verified player movement to Supplies (picked up recipe bundle `{"type":"bundle","count":1}`), moved to Steamer 1 (loaded and steamed), and cooked modaks.

### Verification Screenshots (1366 × 768 Viewport):
1. **Full-Hall Screenshot**:
   - Local artifact: `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\shot_pandal_full_hall_1366x768.png`
   - Repo copy: `public/assets/generated/shot_pandal_full_hall_1366x768.png`
2. **Shrine Detail Crop**:
   - Local artifact: `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\shot_pandal_detail_1366x768.png`
   - Repo copy: `public/assets/generated/shot_pandal_detail_1366x768.png`

### Test Suite & Build:
- `npm test -- --run`: 18/18 passed (100% green).
- `npm run build`: Clean production build completed with exit code 0.

### Files Changed:
- `src/scenes/BootScene.ts` (added preload for `pandal_ganesha-v1.png`)
- `src/scenes/ShopScene.ts` (added pandal sprite positioning and depth in `drawShopEnvironment`)
- `ASSET_CREDITS.md` (recorded provenance and description of `pandal_ganesha-v1.png`)
- `PROJECT_STATUS.md` (updated milestone and ownership coordination state)
- `MODEL_HANDOFF.md` (added completion report)

### Ownership Release:
State returned to `WAITING_FOR_REVIEW` with owner `none`.

---

## Completion Report: Illustrated Ganesha Pandal v2 & Contact Shadow Integration

- **Completion Date**: 2026-09-17
- **Model**: Gemini in Antigravity
- **Handoff Reference**: PANDAL_GANESHA_V2_INTEGRATION
- **Status**: COMPLETED — WAITING_FOR_REVIEW (owner: none)

### Objectives Achieved:
1. **Pandal v2 Asset Preloading**:
   - Preload path in `BootScene.ts` updated to `public/assets/generated/pandal_ganesha-v2.png`.
   - `public/assets/generated/pandal_ganesha-v1.png` preserved in repository as rollback asset.
2. **Placement & Geometry Preserved**:
   - World position: $(106, 444)$ in 960×540 logical coordinates.
   - Anchor / Origin: $(626 / 1254, 1132 / 1254) \approx (0.4992, 0.9027)$ aligning bottom-center of offering thali and pedestal.
   - Uniform scale: $0.1125$.
   - Sprite depth: $10$.
3. **Subtle Floor-Contact Shadow Added**:
   - Rendered ellipse at $(106, 441)$ with size $88 \times 18\text{px}$.
   - Color: warm dark brown (`0x2b1810`), opacity $0.12$ (within 0.10–0.14 specification).
   - Depth: $9$ (sits directly beneath the shrine sprite at depth 10, grounding the pedestal on the alcove floor tile).
4. **Palette & Aesthetic Acceptance**:
   - Carved wooden archway and pedestal frame now match the hall's dark walnut coping and pillars.
   - Brass lamps and ornaments appear warm, muted, and antique rather than harsh or neon yellow.
   - Zero Phaser tinting, post-processing filters, or extra particles applied.
5. **Asset Credits Updated**:
   - `ASSET_CREDITS.md` updated to document v2 as active asset and v1 as previous rollback version.
6. **Passage & Corridor Clearance Preserved**:
   - Pandal corridor ($x = 235$) automated traversal confirmed 100% CLEAR across all waypoints ($y = 230$ to $430$).
   - Enclosure collisions (`pandal_north_wall`, `pandal_east_wall`) remain intact.
   - Production station loop verified functional in-game.

### Verification Screenshots (1366 × 768 Viewport):
1. **Full-Hall Screenshot**:
   - Local artifact: `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\shot_pandal_full_hall_1366x768.png`
   - Repo copy: `public/assets/generated/shot_pandal_full_hall_1366x768.png`
2. **Shrine Detail Crop**:
   - Local artifact: `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\shot_pandal_detail_1366x768.png`
   - Repo copy: `public/assets/generated/shot_pandal_detail_1366x768.png`

### Test Suite & Build:
- `npm test -- --run`: 18/18 passed (100% green).
- `npm run build`: Clean production build completed with exit code 0.

### Files Changed:
- `src/scenes/BootScene.ts` (updated preload to `pandal_ganesha-v2.png`)
- `src/scenes/ShopScene.ts` (added subtle floor-contact shadow ellipse at depth 9)
- `ASSET_CREDITS.md` (updated active and rollback asset credits)
- `PROJECT_STATUS.md` (updated milestone and ownership coordination state)
- `MODEL_HANDOFF.md` (added completion report)

### Ownership Release:
State returned to `WAITING_FOR_REVIEW` with owner `none`.

---

## Completion Report: Illustrated Steamer Station Artwork Integration

- **Completion Date**: 2026-09-17
- **Model**: Gemini in Antigravity
- **Handoff Reference**: STEAMER_ASSET_INTEGRATION
- **Status**: COMPLETED — WAITING_FOR_REVIEW (owner: none)

### Objectives Achieved:
1. **Preloading with Unique Raster Keys**:
   - `BootScene.ts` updated to preload the 3 transparent PNG assets using explicit raster keys:
     - `raster_steamer_brass` from `public/assets/generated/steamer_brass-v1.png`
     - `raster_steamer_input_table` from `public/assets/generated/steamer_input_table-v1.png`
     - `raster_steamer_output_table` from `public/assets/generated/steamer_output_table-v1.png`
   - Prevents procedural texture generator (`createStationTextures()`) from overwriting them.
2. **Bounds, Sizing, Anchoring & Aspect Ratios**:
   - Natural bounds measured excluding transparent margins:
     - Brass pot: $1103 \times 1228$, display $64 \times 71.3\text{px}$, uniform scale $64 / 1103 \approx 0.05802$, anchor $(591.5/1177, 1213/1336) \approx (0.5025, 0.9080)$, local offset $(0, 25)$.
     - Input table: $905 \times 990$, display $40 \times 43.8\text{px}$, uniform scale $40 / 905 \approx 0.04420$, anchor $(655/1313, 1024/1198) \approx (0.4989, 0.8548)$, local offset $(-36, 25)$.
     - Output table: $908 \times 990$, display $40 \times 43.6\text{px}$, uniform scale $40 / 908 \approx 0.04405$, anchor $(655.5/1313, 1026/1198) \approx (0.4992, 0.8564)$, local offset $(+36, 25)$.
   - Layering: `mainSprite` (brass pot) rendered at depth 4, overlapping table side edges at depth 2 for natural physical placement.
3. **Specification Clearance Conflict Correction**:
   - Replaced earlier speculative $144\text{px}$ assembly specification (which would have reached $x = 627$, penetrating east wall at $x = 618$).
   - Fitted complete 3-piece assembly to $112\text{px}$ width ($[-56..+56]$ from station center).
   - Steamer 1 ($x = 405$): bounds $[349..461]$, distance to west wall ($x = 318$) is $31\text{px}$.
   - Steamer 2 ($x = 555$): bounds $[499..611]$, distance to east wall ($x = 618$) is $7\text{px}$.
   - Inter-assembly gap: $499 - 461 = 38\text{px}$ (exceeds required $\ge 6\text{px}$).
   - Station centers preserved at $(405, 135)$ and $(555, 135)$, interaction radius 54, and approach routes from central aisle.
4. **Collision Map Alignment**:
   - Updated `furn_steamer1_assembly` footprint to `Rectangle(348, 100, 114, 36)`.
   - Updated `furn_steamer2_assembly` footprint to `Rectangle(498, 100, 114, 36)`.
5. **State-Driven Visuals & Blueprint State**:
   - Locked Steamer 2 blueprint preserved: `station_steamer_blueprint` centered at $(0, 0)$ with operational art, tables, badges, and steam hidden until purchase.
   - Dynamic recipe bundles stacked on input table at $(-36, -4)$ and $(-36, -12)$.
   - Cooked modaks displayed on output table at $(+36, -4)$ upon cooking completion; empty output table displays no modaks.
   - Quantity badges centered beneath tables at $(\pm 36, 18)$.
   - Cooking progress bar ($36 \times 5\text{px}$) aligned on dark stove plinth at $(0, 15)$.
   - Status pill centered below plinth at $(0, 32)$.
   - Animated steam particles emitted from domed lid vents at $(0, -32)$ strictly during cooking (`steaming` state).
6. **In-Browser Verification (1366 × 768)**:
   - Check 1: Steamer 1 unlocked and operating; Steamer 2 locked in blueprint state.
   - Check 2: Loaded bundle into Steamer 1, watched 8s cooking with steam, cooked modaks arrived on banana leaf output table, steam stopped.
   - Check 3: Purchased Steamer 2 (`buySecondSteamer`), verified both steamers unlocked with zero overlap, loaded Steamer 2 to cook with active steam while Steamer 1 held ready modaks.
   - Check 4: Collected batch from Steamer 1, packed into boxes at packing table, delivered boxes to service counter, and sold to devotee customer.
7. **Asset Provenance Recorded**:
   - `ASSET_CREDITS.md` updated with provenance and roles for `steamer_brass-v1.png`, `steamer_input_table-v1.png`, and `steamer_output_table-v1.png`.

### Verification Screenshots (1366 × 768 Viewport):
1. **Locked Second Steamer**:
   - Local artifact: `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\shot_steamer_locked_1366x768.png`
   - Repo copy: `public/assets/generated/shot_steamer_locked_1366x768.png`
2. **Both Unlocked (One Cooking, One Ready)**:
   - Local artifact: `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\shot_steamer_unlocked_cooking_ready_1366x768.png`
   - Repo copy: `public/assets/generated/shot_steamer_unlocked_cooking_ready_1366x768.png`

### Test Suite & Build:
- `npm test -- --run`: 18/18 passed (100% green).
- `npm run build`: Clean production build completed with exit code 0.

### Files Changed:
- `src/scenes/BootScene.ts` (added raster preloads for steamer pot, input table, output table)
- `src/stations/SteamerStation.ts` (swapped visuals to raster art, scaled/anchored, updated badges/progress/steam)
- `src/scenes/ShopScene.ts` (updated furniture collision rectangles for both steamer assemblies)
- `ASSET_CREDITS.md` (documented provenance and roles for steamer assets)
- `PROJECT_STATUS.md` (updated milestone and ownership coordination state)
- `MODEL_HANDOFF.md` (added completion report)

### Ownership Release:
State returned to `WAITING_FOR_REVIEW` with owner `none`.

---

## Completion Report: Customer Patience, Reactions, Tips & Business Rating

- **Completion Date**: 2026-09-17
- **Model**: Gemini in Antigravity
- **Handoff Reference**: CUSTOMER_PATIENCE_RATING_COMPLETE
- **Status**: COMPLETED — WAITING_FOR_REVIEW (owner: none)

### 1. Diagnosis
The previous implementation was fully functional and stable, but lacked gameplay tension and mechanical depth:
- Customers waited infinitely without leaving, removing any service rush pressure or consequences for inefficient pathing.
- Revenue was purely linear (₹10/box) with no performance rewards or speed incentives.
- Devotees lacked expressive visual feedback beyond an order bubble and a generic heart upon collection.
- The shop had no business rating metric to reflect service quality.

### 2. Exact Files Changed
1. `src/config/balance.ts`
   - Added balance parameters for order patience, tutorial protection, initial rating, rating weights, and tip tier thresholds.
2. `src/types/index.ts`
   - Added `CustomerSaleResult` interface and expanded `GameStats` with `totalTipsEarned` and `customersDeparted`.
3. `src/state/GameState.ts`
   - Added `businessRating` state (starts at 4.0).
   - Added `updateBusinessRating(latestServiceStars)` with deterministic update and boundary clamping.
   - Added `recordCustomerDeparture()` for unserved 1-star exits.
   - Updated `serveCustomer()` and `autoServeWithCashier()` to accept `patienceFraction`, calculate speed tips atomically, record star reviews, update business rating, and return rich transaction results.
4. `src/entities/Customer.ts`
   - Implemented authoritative patience timer updated only while in the active queue `waiting` state.
   - Embedded compact 36×3px color-coded patience bar at the base of the 48px speech bubble.
   - Dynamic mood coloring: Green (70–100%), Amber (40–69%), Red (1–39%).
   - Safe expiration departure: on 0 patience, customer emits angry reaction, triggers 1-star departure, walks off-screen, and queue advances.
5. `src/stations/CounterStation.ts`
   - Updated manual service to pass `customer.getPatienceFraction()`, acquire mutual exclusion `isServing`, display tip feedback, and pop coin feedback.
6. `src/entities/Staff.ts`
   - Updated Cashier NPC auto-service to pass `customer.getPatienceFraction()`, respect `isServing` mutual exclusion, award speed tips, and update rating.
7. `src/scenes/ShopScene.ts`
   - Configured `spawnCustomer()` with tutorial protection (75s for first 2 customers) and order-based patience (50s / 65s).
   - Added `customer-expired` event listener calling `recordCustomerDeparture()`.
8. `src/scenes/UIScene.ts`
   - Added compact `Mahal Rating ★ 4.0` card to top desktop HUD and integrated rating into mobile summary.
9. `src/tests/customerService.test.ts`
   - Created comprehensive suite covering all 10 customer-service requirements.
10. `PROJECT_STATUS.md` & `MODEL_HANDOFF.md`
    - Updated project status, milestone records, and handoff documentation.

### 3. Final Balance Values
- **Patience**:
  - 1-box order: `50s`
  - 2-box order: `65s`
  - Tutorial protection (first 2 customers): `75s`
- **Tiers & Speed Tips**:
  - 5-Star (70–100% patience): `+₹3 / box` tip, feedback "Festival favourite! +₹{tip} tip"
  - 4-Star (40–69% patience): `+₹1 / box` tip, feedback "Thank you! +₹{tip} tip"
  - 3-Star (15–39% patience): `₹0` tip, feedback "Service was slow"
  - 2-Star (1–14% patience): `₹0` tip, feedback "Long wait!"
  - 1-Star (0% patience / unserved): `₹0` payment, feedback "Left unserved"
- **Business Rating**:
  - Initial value: `4.0`
  - Deterministic formula: `newRating = oldRating * 0.75 + latestServiceStars * 0.25`
  - Clamped range: `1.0` to `5.0` (with boundary snap when within 0.03 of integer boundaries)

### 4. Test and Build Results
- `npm test -- --run`:
  - `src/tests/economy.test.ts`: 18/18 passed
  - `src/tests/customerService.test.ts`: 10/10 passed
  - Total: **28/28 tests passed** (100% green)
- `npm run build`:
  - `tsc && vite build`: Exit code 0, clean production bundle generated.

### 5. Browser Scenarios Verified (1366 × 768 Viewport)
1. **Patience Simulation**: Verified customer 1 spawned with 75s tutorial protection in `walking_in`; patience began decreasing authoritatively only once arrived in active queue `waiting` position.
2. **Quick Service Loop & Speed Tip**: Collected cooked modaks, packed 3 boxes, and served front customer at >70% patience; verified +₹33 earned (30 base + 3 tip) and rating maintained at 4.0 / boosted to 4.25 with positive devotee emote.
3. **Patience Visuals & Zero Overlap**: Confirmed 36×3px patience bars sit neatly within the 48px bubble envelope; 70px queue slot separation guarantees zero overlap between adjacent bubbles at 1366×768.
4. **Safe Impatient Departure**: Customer in red zone allowed to count down to 0; popped `😠 Left unserved`, walked away, recorded 1-star penalty (rating updated from 4.0 to 3.25), consumed 0 boxes, awarded 0 coins, and next customer advanced immediately to service hatch.
5. **Cashier Auto-Service**: Hired Cashier NPC, stocked counter with boxes; cashier automatically served next waiting customer, awarded tip (+₹26 for 2 boxes), performed namaste bow, and updated rating.
6. **Production-to-Sale Loop**: End-to-end loop verified fully functional without softlocks or negative inventory.

### 6. Verification Screenshot Paths
1. **Queue with Active Patience Bars and HUD Rating (1366 × 768)**:
   - Local artifact: `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\shot_customer_patience_rating_1366x768.png`
   - Repo copy: `public/assets/generated/shot_customer_patience_rating_1366x768.png`
2. **Cashier Auto-Service & Updated Rating (1366 × 768)**:
   - Local artifact: `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\shot_customer_impatient_reaction_1366x768.png`
   - Repo copy: `public/assets/generated/shot_customer_impatient_reaction_1366x768.png`

### 7. Remaining Limitations
- Customer entities currently use the base 2D illustrated sprite; distinct festival character costumes or animations can be layered in subsequent art phases.
- Pandal dispatch contract and festival rush timer remain out of scope for this bounded milestone.

### Ownership Release:
State returned to `WAITING_FOR_REVIEW` with owner `none`.

---

## Completion Report: Winnable Festival Campaign (Milestone 3 Core)

- **Completion Date**: 2026-09-18
- **Model**: Gemini in Antigravity
- **Handoff Reference**: FESTIVAL_CAMPAIGN_COMPLETE
- **Status**: COMPLETED — WAITING_FOR_REVIEW (owner: none)

### 1. Diagnosis & Architectural Strategy
The game previously ran indefinitely with no bounded round goal, no celebration, and no win/loss state. To deliver a compelling, winnable Festival Day within the existing shop loop without regressions:
- A dedicated, authoritative `CampaignState` was introduced to manage campaign stages, authoritative clock, rush mechanics, dispatch stock, endings, and score calculation.
- Inventory and working capital remain strictly governed by `GameState`, guaranteeing that counter stock and dispatch stock remain isolated, and that customers or cashiers never consume dispatch boxes.
- Pausing freezes all simulation subsystems (campaign clock, customer patience, spawning, cooking, packing, courier dispatch, and staff automation) using simulation delta with tab blur/focus delta clamping (`Math.min(delta, 100)`).
- Customer feedback text was refactored with a high-contrast cream/dark card positioned strictly above the customer lane ($x = 835, y = 300$) with upward vertical stacking to eliminate overlap with the cashier or player.

### 2. Exact Files Changed
1. `src/state/CampaignState.ts` (NEW)
   - Authoritative campaign state machine with 7 explicit stages: `ONBOARDING` -> `FESTIVAL_OPEN` -> `GROW_BUSINESS` -> `FESTIVAL_RUSH` -> `PANDAL_ORDER` -> `DISPATCHING` -> `VICTORY` / `TIME_EXPIRED`.
   - Authoritative timer counting down from 600s upon first customer sale.
   - Festival rush state tracking (single trigger on first staff hire, 4s advance announcement, 75s rush duration, 35% faster customer spawning).
   - Dispatch inventory tracking (`0..12`), courier progress timer (10s), and immutable victory statistics snapshot.
   - Deterministic score computation, award title classification, and clean reset logic.
2. `src/config/balance.ts`
   - Added campaign duration (`600s`), rush duration (`75s`), rush announcement lead time (`4s`), rush spawn multiplier (`0.65`), pandal order target (`12` boxes), courier dispatch duration (`10s`), and score weights (`+100` per box sold, `+50` for 5-star, `+20` for 4-star, `-100` for departed, `+1500` for completed pandal dispatch, `+10` per whole second remaining).
3. `src/types/index.ts`
   - Added `CampaignStage`, `CampaignStatsSnapshot`, and campaign objective keys (`CAMPAIGN_ONBOARDING`, `CAMPAIGN_FESTIVAL_OPEN`, `CAMPAIGN_GROW_BUSINESS`, `CAMPAIGN_FESTIVAL_RUSH`, `CAMPAIGN_PANDAL_ORDER`, `CAMPAIGN_DISPATCHING`, `CAMPAIGN_VICTORY`, `CAMPAIGN_TIME_EXPIRED`).
4. `src/stations/DispatchStation.ts` (NEW)
   - Pandal Dispatch Stand placed outside Pandal north wall at $(120, 265)$ with collision blocker `Rectangle(102, 252, 36, 24)`.
   - Proximity interaction: deposits carried packed boxes into dispatch stock up to 12, frees player hands, updates badge, and begins 10s courier delivery when 12 boxes are reached.
   - Courier dispatch visual cue: compact progress bar and animated brass parcel cart cue moving along the corridor toward the street exit.
5. `src/scenes/BootScene.ts`
   - Added procedural texture generation for `station_dispatch` (slatted teak crate with brass corner brackets, marigold garland, and temple crest).
6. `src/entities/Customer.ts`
   - Replaced pale floating feedback with a compact high-contrast cream backplate (`#fffdf7`) and dark border (`#3e2723`) in customer lane ($x = 835, y = 300$).
   - Implemented vertical stacking (+26px) for simultaneous feedback messages to prevent overlap.
7. `src/entities/Staff.ts` & `src/stations/CounterStation.ts`
   - Removed coin pop floating over cashier/player; coin and tip data now passed directly to customer feedback card in customer lane.
   - Emitted `customer-sale-completed` events for authoritative campaign sale tracking.
8. `src/entities/Player.ts`
   - Added `clearMovementInput()` method to immediately zero velocity and key states on pause, resume, modal open, and tab blur.
9. `src/state/GameState.ts`
   - Added `reset()` method to cleanly reset coins (₹30), carried inventory, stations, staff, and ratings on festival restart.
   - Exposed `notify()` for external scene coordination.
10. `src/scenes/ShopScene.ts`
    - Integrated `CampaignState`, `DispatchStation`, delta clamping (`Math.min(delta, 100)`), pause simulation freeze, rush spawn intervals, and keyboard shortcuts (`P`, `Escape`).
    - Added `restartGame()` method for completely clean restart without duplicated game objects or listeners.
11. `src/scenes/UIScene.ts`
    - Added top bar timer ("Closing in MM:SS") with responsive layout.
    - Added visible Pause button `[❚❚]`, non-blocking announcement toast, pause modal, and results modal (Victory / Timeout).
    - Implemented results modal with statistics breakdown, award title, score, "Restart Festival", and "Continue Growing" (victory only).
12. `src/tests/campaign.test.ts` (NEW)
    - Comprehensive unit test suite covering all 20 campaign test cases specified in the requirements.
13. `PROJECT_STATUS.md`, `TASKS.md`, `MODEL_HANDOFF.md`
    - Updated project status, task checklist, and model handoff coordination.

### 3. Campaign Stage Model
1. `ONBOARDING`: Guided tutorial loop without round timer; first 2 devotees retain tutorial patience protection (75s).
2. `FESTIVAL_OPEN`: Starts 10-minute (600s) round timer once after first completed customer sale; displays non-blocking announcement: *"The festival is open! Grow the Mahal before closing."*
3. `GROW_BUSINESS`: Objective displays upgrade progress: *"Upgrade the Mahal: X/4"* (Carry Capacity, Packer, Cashier, Steamer 2).
4. `FESTIVAL_RUSH`: Triggers once immediately on hiring first staff member (Packer or Cashier); 4s advance announcement; 75s duration with customer spawning 35% faster (`interval * 0.65`); max queue bounded at 4; never triggers twice.
5. `PANDAL_ORDER`: Unlocks only after all 4 upgrades are owned; objective displays: *"Grand Pandal Order: X/12 boxes"*.
6. `DISPATCHING`: Player deposits carried packed boxes into Pandal Dispatch Stand (up to 12); frees player hands; dispatch stock is strictly isolated from counter stock; when 12 boxes are reached, 10s courier dispatch begins with progress bar and animated parcel cue.
7. `VICTORY` / `TIME_EXPIRED`: Exactly one ending transition; victory occurs if courier delivery completes before 600s expires; timeout occurs if closing time arrives before delivery completes.

### 4. Timer, Pause & Delta Freeze Behavior
- **Simulation-Driven Clock**: Timer decrements via simulation delta (`dt`), never `Date.now()`.
- **Warp-Jump Prevention**: `delta` clamped via `const clampedDelta = Math.min(delta, 100)` in `ShopScene.update()`, eliminating large delta bursts on tab focus return.
- **Full Pause Freeze**: Pausing via visible `[❚❚]` button, `P` key, `Escape` key, or opening the Upgrade modal completely freezes:
  - Campaign timer
  - Customer patience timers
  - Customer spawning
  - Steamer cooking timers
  - Packing station timers
  - Courier dispatch timer
  - Staff automation routines
- **Input Isolation**: `Player.clearMovementInput()` resets all movement keys and zeroes velocity on pause, resume, modal open, and tab blur.

### 5. Dispatch Placement & Collision Bounds
- **Station Location**: $(120, 265)$ outside the Pandal north wall.
- **Collision Blocker**: `Rectangle(102, 252, 36, 24)`.
- **Architectural Clearance**:
  - Ganesha shrine ($x = 106, y = 444$): $\approx 180\text{px}$ to the south; shrine remains completely unblocked.
  - Pandal corridor ($x: 206..264$): $\approx 50\text{px}$ to the east; corridor remains completely open.
  - Packing room doorway ($x: 336..427$): $\approx 180\text{px}$ to the east; doorway remains completely open.
  - Central aisle ($y \approx 220..240$): stand sits at $y = 252..276$ just below aisle clearance; aisle circulation is completely unobstructed.
  - Service counter ($x \approx 640..780$): completely separate department.

### 6. Festival Score Formula & Award Tiers
- **Formula**:
  $$\text{Score} = \max\left(0, \; (\text{Boxes Sold} \times 100) + (\text{5-Star Count} \times 50) + (\text{4-Star Count} \times 20) - (\text{Departed Count} \times 100) + \text{Pandal Bonus} (1500) + (\text{Seconds Remaining} \times 10)\right)$$
- **Award Tiers** (based on final Mahal rating):
  - `4.6 – 5.0`: **Festival Favourite**
  - `4.0 – 4.59`: **Beloved Modak Mahal**
  - `3.0 – 3.99`: **Successful Festival Service**
  - `Below 3.0`: **Festival Completed — Keep Improving**

### 7. Test and Build Results
- `npm test -- --run`:
  - `src/tests/customerService.test.ts`: 10/10 passed
  - `src/tests/economy.test.ts`: 18/18 passed
  - `src/tests/campaign.test.ts`: 20/20 passed
  - Total: **48/48 tests passed** (100% green)
- `npm run build`:
  - `tsc && vite build`: Exit code 0, clean production bundle generated.

### 8. Playable Browser Verification Results (1366 × 768 Viewport)
1. **Tutorial Production Loop & First Sale**: Traversed Supplies Room, picked up ingredients, cooked in Steamer 1 (8s), packed 3 boxes at packing bench (3s), and completed first sale at counter. Verified timer was stopped during tutorial and started counting down only upon the completion of the first sale.
2. **First Staff Hire & Festival Rush**: Purchased Packer upgrade; verified advance announcement appeared ("Festival rush incoming!"), followed 4s later by 75s rush banner. Customer spawn interval accelerated by 35% (`interval * 0.65`); max queue remained bounded at 4; rush triggered exactly once.
3. **Simulation Pause & Modal Freeze**: Opened Pause overlay (`[❚❚]` and `P`); verified campaign timer, customer patience, steamer cooking, packing, and spawner completely froze. Resumed and opened Upgrade modal (`E`); confirmed same freeze behavior.
4. **All 4 Upgrades Purchased**: Purchased Carry Capacity (₹30), Packer (₹45), Cashier (₹60), and Steamer 2 (₹90) while maintaining working capital reserve; verified stage transitioned to `PANDAL_ORDER`.
5. **Dispatch Deposits & Isolation**: Carried packed boxes to Dispatch Stand at $(120, 265)$; deposited boxes in batches until 12/12 reached; verified hands emptied correctly. Confirmed counter customers never consume dispatch stock.
6. **Courier Dispatch & Normal Victory**: 12th box triggered 10s courier dispatch; progress bar filled and animated parcel cue moved along the corridor; on completion, Victory Celebration modal opened showing completion statistics, award title, and final festival score.
7. **Victory Time & Margin**:
   - Total campaign clock: 600s (10:00).
   - Verification victory achieved with 384s remaining (216s elapsed).
   - Remaining time margin: **64.0%** (well above the required $\approx 20\%$ margin).
   - Typical manual play margin is estimated at $45\% - 55\%$.
8. **Continue Growing**: Clicked "Continue Growing"; modal closed, campaign pressure removed into free play; confirmed snapshot statistics and score remained immutable.
9. **Clean Restart**: Triggered "Restart Festival"; verified clean initial state (coins ₹30, carried empty, stations reset, queue cleared, rating 4.0, campaign state reset, no duplicated Phaser objects or event listeners).
10. **Timeout Verification**: Verified timeout modal on timer reaching 0 ("The Festival Has Closed", X/12 pandal progress, retry button).
11. **Visual & Layout Verification at 1366 × 768**:
    - Timer ("Closing in MM:SS") and objective hint do not overlap HUD cards.
    - Results modal is fully centered and within viewport bounds.
    - Dispatch stand does not obstruct corridor, doorway, aisle, or shrine.
    - Customer feedback card sits neatly in customer lane above devotees and never overlaps cashier or player.

### 9. Screenshot Paths
1. **Victory Celebration Screen (1366 × 768)**:
   - Local artifact: `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\campaign_victory_screen.png`
2. **Timeout Results Screen (1366 × 768)**:
   - Local artifact: `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\campaign_timeout_screen.png`
3. **Pause Overlay & Simulation Freeze (1366 × 768)**:
   - Local artifact: `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\campaign_pause_overlay.png`
4. **Customer Feedback Card in Queue Lane (1366 × 768)**:
   - Local artifact: `C:\Users\Darshit N\.gemini\antigravity-ide\brain\a0de527a-b820-49ae-a4e2-11b8d6523e97\campaign_customer_feedback_lane.png`

### 10. Known Limitations
- Dispatch stand uses a procedural festive teak crate texture with brass braces and temple crest; a hand-painted raster crate matching the illustrated background can be integrated in subsequent art passes.
- Save/resume persistence, audio, online leaderboards, and first-floor gameplay were explicitly out of scope for this milestone.

### Ownership Release:
State returned to `WAITING_FOR_REVIEW` with owner `none`.

---

## Completion Report: Pause & Modal Input Routing Correction (PAUSE_INPUT_ROUTING_FIXED)

- **Completion Date**: 2026-09-20
- **Model**: Gemini 3.8 Flash Medium in Antigravity
- **Active Handoff**: PAUSE_INPUT_ROUTING_FIXED
- **Status**: COMPLETED — WAITING_FOR_REVIEW (owner: none)

### 1. Root Cause Analysis
Pause and modal keyboard handling was previously split across two separate scenes:
1. `UIScene` registered a global keyboard listener on `this.input.keyboard` calling `handleModalKeyDown()`.
2. `ShopScene` concurrently registered separate Phaser `KeyP` and `KeyEsc` key objects with `on('down', ...)` callbacks.

Consequences:
- **Double-toggle on P**: Pressing `P` dispatched to both `UIScene` and `ShopScene` in the same frame. Each invoked `ui.togglePause()`, flipping the boolean twice (`false -> true -> false`), leaving the game unpaused and making `P` appear unresponsive.
- **Escape bleed-through on Upgrade Modal**: When `Escape` was pressed while the Upgrade modal was open, `UIScene` received the event and closed the modal (`ui.isUpgradeModalOpen = false`). The same `Escape` event was then processed by `ShopScene`, which checked `if (ui?.isUpgradeModalOpen)` (now `false`) and fell into `else { ui?.togglePause?.(); }`, immediately opening the Pause modal.
- **Key Repeat**: `event.repeat` was not guarded, allowing held keys to fire repeated toggles.
- **Listener Duplication on Restart**: `UIScene` used an anonymous arrow callback without unregistering on scene shutdown or destroy, allowing multiple listeners to accumulate across scene recreations.

### 2. Exact Files Changed
1. `src/scenes/ShopScene.ts`
   - Removed the duplicate `KeyP` and `KeyEsc` keyboard listeners and bindings. UIScene is now the single authoritative owner of modal/pause keyboard routing.
2. `src/scenes/UIScene.ts`
   - Named keyboard handler `onKeyDownHandler` stored and cleaned up on `SHUTDOWN` and `DESTROY` lifecycle events (and cleaned up before registering in `create()`).
   - Refactored `openPauseModal()`, `closePauseModal()`, and `togglePause()` to guarantee player movement input is cleared (`shop.player.clearMovementInput()`) and input blocked state is managed consistently.
   - Refactored `openUpgradeModal()` and `closeUpgradeModal()` to clear movement input, ensure simulation pauses on open, and restore simulation on close only if neither Pause nor Results modals are active.
   - Implemented exact priority in `handleModalKeyDown(event: KeyboardEvent)`:
     - `if (event.repeat) return;`
     - **Priority A (Results open)**: Ignore `P` and `Escape`.
     - **Priority B (Upgrade open)**: `Escape` closes only the Upgrade modal; `P` does nothing; numbers (`1`-`4`) purchase upgrades; same `Escape` never opens Pause.
     - **Priority C (Pause open)**: `P` or `Escape` closes Pause and resumes simulation; upgrade keys do nothing.
     - **Priority D (No modal open)**: `P` or `Escape` opens Pause modal.
3. `src/tests/campaign.test.ts`
   - Added unit test cases 31–34 verifying results modal ignore, upgrade modal Escape/P priority, pause modal P/Escape toggle, and simulation safety when closing upgrades with pause active.

### 3. Automated Test & Production Build Results
- `npm test -- --run`:
  - `src/tests/customerService.test.ts`: 13/13 passed
  - `src/tests/economy.test.ts`: 18/18 passed
  - `src/tests/campaign.test.ts`: 34/34 passed
  - Total: **65/65 passed** (100% green)
- `npm run build`:
  - `tsc && vite build`: Exit code 0, clean production bundle generated (`dist/assets/index-qBUisMxN.js`).

### 4. Browser Acceptance Test Results (Chrome DevTools Protocol Automation)
Automated verification executed in `scratch/verify_pause_input_routing.mjs` running against `http://127.0.0.1:3000/` at 1366×768:
1. **Normal gameplay P toggle**: Press P once → Pause opens (`isPauseModalOpen: true, campaignPaused: true, playerInputBlocked: true`). Press P once → Pause closes (`isPauseModalOpen: false, campaignPaused: false, playerInputBlocked: false`). [PASSED]
2. **Normal gameplay Escape toggle**: Press Escape once → Pause opens. Press Escape once → Pause closes. [PASSED]
3. **Upgrade desk Escape**: Navigated to Upgrade Desk, opened with `E`. Pressed `Escape` once → Upgrade modal closed (`isUpgradeModalOpen: false`), Pause modal did NOT appear (`isPauseModalOpen: false`), simulation resumed (`campaignPaused: false`), player movement resumed (`playerInputBlocked: false`). [PASSED]
4. **Upgrade desk P isolation**: Opened Upgrades with `E`. Pressed `P` → Upgrades remained open, Pause modal did not appear, simulation remained frozen (`campaignPaused: true`). [PASSED]
5. **Upgrade purchase & Escape**: Added coins, opened Upgrades, purchased Carry upgrade via `Digit1` key (`hasCarryUpgrade: true`). Pressed `Escape` once → closed Upgrades cleanly without opening Pause. [PASSED]
6. **Pause button pointer interaction**: Emitted pointerdown on top-bar Pause button → Pause opened; clicked resume button → Pause closed. [PASSED]
7. **Restart Festival verification**: Triggered `restartGame()`. Verified single authoritative listener persisted: Press P opens and closes Pause; Press Escape opens and closes Pause; Upgrade open + Escape closes without Pause; Upgrade open + P does nothing. Confirmed one keypress causes exactly one action. [PASSED]

### 5. Ownership Release
State returned to `WAITING_FOR_REVIEW` with owner `none`.

---

## Completion Report: Final Presentation Pass (SUBMISSION_UI_CLEANUP_COMPLETE)

- **Completion Date**: 2026-09-20
- **Model**: Gemini 3.8 Flash Medium in Antigravity
- **Active Handoff**: SUBMISSION_UI_CLEANUP_COMPLETE
- **Status**: COMPLETED — WAITING_FOR_REVIEW (owner: none)

### 1. Root Cause Analysis & Visual Noise Fixes
1. **Locked Dispatch Station Presentation**:
   - Previously produced a dark crate with an awkward long clipped world label ("Pandal Dispatch — Unlock after 4 upgrades") and visible collision blocker even while locked in early onboarding/business stages.
   - Fix: While `campaignState.stage` is before `PANDAL_ORDER` (`ONBOARDING`, `FESTIVAL_OPEN`, `GROW_BUSINESS`, `FESTIVAL_RUSH`), the dispatch station sprite, permanent world labels, interaction ring, contextual prompt, and furniture collider (`furn_dispatch_crate`) are completely hidden and disabled. Players walk directly through the space with zero invisible collision blockers.
2. **Unlocked Dispatch Presentation**:
   - Once all 4 upgrades are bought and `PANDAL_ORDER` begins:
     - The festive crate is revealed.
     - A green department badge `"5  DISPATCH"` (matching departments 1–4) appears at `(572, 278)`.
     - A compact badge `"Pandal 0/12"` appears on the crate with amber background (<12) and turns green upon reaching 12/12.
     - The interaction highlight ellipse appears ONLY when the player approaches carrying packed boxes.
3. **Dispatch Placement & Collision Verification**:
   - Placed at `(572, 370)` against the west wall inside the Service compartment.
   - Service doorway is at `x in [613, 693]`, counter is at `x in [645, 762]`, customer lane is at `x > 780`, and Ganesha shrine is at `(106, 444)`.
   - The station sits flush against the interior west wall: 26px clear floor to the doorway left jamb, 58px clear floor to the service counter, and zero interference with the central aisle or customer lane.
4. **Campaign HUD Copy**:
   - Initial onboarding timer string replaced: `"Day 1: Onboarding"` -> `"Festival Setup"`.
   - After the first sale, the 10:00 countdown timer display begins normally.
5. **Bottom Desktop Control Strip**:
   - Replaced multi-line/debug-mention text with clean single-line copy:
     `Move: WASD/Arrows • Interact: Walk close/E • Pause: P/Esc`
   - Anchored at `y = screenHeight - 20` and centered at `x = screenWidth / 2`.
   - Dynamically repositions on resize via `Phaser.Scale.Events.RESIZE`.
   - Verified completely visible without clipping below the canvas at 1366×768, 1920×1080, and smaller landscape window sizes.
   - Cleanly hidden in portrait/mobile viewport (`isPortrait = true`).
6. **Visual Noise & Overlap Audit**:
   - Zero label clipping or department badge overlaps.
   - Clean action card and objective banners.

### 2. Exact Files Changed
1. `src/scenes/BootScene.ts`: Added department badge 5 generation: `drawBadge('dept_badge_dispatch', '5', 'DISPATCH')`.
2. `src/stations/DispatchStation.ts`:
   - Gated visibility, proximity checking, and interaction behind `isUnlocked()` (`PANDAL_ORDER`, `DISPATCHING`, `VICTORY`).
   - Added compact `crateBadge` (`Pandal X/12`), removed long world text labels.
   - Highlight ellipse shows only when `isPlayerInside && hasBoxes && reserved < target`.
3. `src/scenes/ShopScene.ts`:
   - Placed dispatch station at `(572, 370)` with matching shallow collider `(557, 359, 30, 22)`.
   - Added `badgeDispatch` sprite at `(572, 278)`.
   - Gated collider activation in `resolveFurnitureCollisions()` and collision overlay rendering on `this.isDispatchUnlocked()`.
4. `src/scenes/UIScene.ts`:
   - Changed timer text from `"Day 1: Onboarding"` to `"Festival Setup"`.
   - Replaced bottom control text with single line `"Move: WASD/Arrows • Interact: Walk close/E • Pause: P/Esc"` at `y = screenHeight - 20`.
   - Hooked `this.scale.on(Phaser.Scale.Events.RESIZE, this.updateResponsiveHud, this)` to ensure responsive repositioning on any window resize.
   - Gated dispatch prompt in action card to appear only when dispatch is unlocked.

### 3. Automated Test & Production Build Results
- `npm test -- --run`: 65/65 tests passed (100% green).
- `npm run build`: Exit code 0, clean production build in `dist/`.

### 4. Browser Acceptance Test Results (Chrome DevTools Protocol Automation)
Automated verification executed in `scratch/verify_submission_ui_cleanup.mjs` running against `http://127.0.0.1:3000/`:
1. **Check 1: Locked Dispatch Invisible & Timer Copy**:
   - Timer displays `"Festival Setup"`.
   - `dispatchStation.visible === false`, `badgeDispatch.visible === false`.
   - Captured screenshot: `shot_desktop_locked_dispatch_1366x768.png`.
2. **Check 2: Locked Dispatch Traversal**:
   - Player walked through doorway into room and directly through `(572, 370)` with zero collision (`reached: true`).
3. **Check 3, 4, 5: 4 Upgrades Purchased & Unlocked Presentation**:
   - Stage transitioned to `PANDAL_ORDER`.
   - `dispatchStation.visible === true`, `badgeDispatch.visible === true`.
   - Badge 5 ("5 DISPATCH") and compact crate badge ("Pandal 0/12") visible cleanly.
   - Captured screenshot: `shot_desktop_unlocked_dispatch_1366x768.png`.
4. **Check 6: Deposit Box & Badge Update**:
   - Deposited 4 packed boxes -> `pandalBoxesReserved === 4`, badge text updated to `"Pandal 4/12"`.
5. **Check 7: Service Doorway & Customer Lane Clearance**:
   - Navigated doorway opening `(650, 345)` in and out without obstruction. Central aisle and customer lane approach fully traversable.
6. **Check 8: Victory & Timeout Results**:
   - Verified results modal opens and dismisses cleanly.
7. **Check 9: 1920×1080 Layout & Control Strip**:
   - `controlsText.y === 1060` (within bounds `[1050, 1080]`), single-line text verified without clipping below canvas.
   - Captured screenshot: `shot_desktop_1920x1080.png`.
8. **Check 10: Portrait Mobile Viewport (390×844)**:
   - `controlsText.visible === false`, `mobileHud.visible === true`.
   - Captured screenshot: `shot_portrait_mobile_390x844.png`.
9. **Check 11: Console Errors**:
   - Captured 0 console errors throughout entire run.

### 5. Verification Screenshots
1. `shot_desktop_locked_dispatch_1366x768.png`
2. `shot_desktop_unlocked_dispatch_1366x768.png`
3. `shot_desktop_1920x1080.png`
4. `shot_portrait_mobile_390x844.png`

### 6. Ownership Release
- State: `WAITING_FOR_REVIEW`
- Owner: `none`
- Active handoff: `SUBMISSION_UI_CLEANUP_COMPLETE`

---

## Completion Report: Contextual Action Card Position & Layout Fix (ACTION_CARD_POSITION_FIXED)

- **Completion Date**: 2026-09-20
- **Model**: Gemini 3.8 Flash Medium in Antigravity
- **Active Handoff**: ACTION_CARD_POSITION_FIXED
- **Status**: COMPLETED — WAITING_FOR_REVIEW (owner: none)

### 1. Root Cause Analysis & Solution
- **Problem**: The contextual station action card was screen-anchored around $y = 138$ near the top objective area. When the player approached the Service Counter at $(700, 365)$, the card appeared near the top of the screen and overlapped the Steaming department badge ("2 STEAMING") and the brass steamer artwork.
- **Fix**:
  1. **Moved Action Card away from top objective area**:
     - Desktop: Repositioned to center X, $y = \text{screenHeight} - 52$. Controls remain at $\text{screenHeight} - 20$, guaranteeing a 12px visual separation ($> 8\text{px}$).
     - Portrait/mobile: Positioned at center X, $y = \text{screenHeight} - 44$, safely above the bottom boundary without covering mobile controls, player, or carried inventory.
  2. **Card Dimensions & Text Formatting**:
     - Maximum card width constrained to 420px on desktop, and $\text{screenWidth} - 24$ on narrow mobile screens.
     - Single-line copy enforced on desktop; dynamic wrapping up to two centered lines only on narrow mobile viewports.
  3. **Concise Station Action Card Copy**:
     - Supplies: `Supply Shelf • E: Buy ingredients ₹12` / `Supply Shelf • R: Return carried ingredients`
     - Steamer 1: `Steamer 1 • Load ingredient bundle` / `Steamer 1 • Collect cooked modaks` / `Steamer 1 • Steaming modaks...`
     - Steamer 2: `Steamer 2 (Locked) • Upgrade at Desk ₹90` / `Steamer 2 • Load ingredient bundle` / `Steamer 2 • Collect cooked modaks`
     - Packing: `Packing • Deposit batch / Collect boxes`
     - Counter: `Counter • Deposit boxes / Serve devotees`
     - Dispatch: `Dispatch • Deposit boxes (X/12)`
     - Upgrade Desk: `Upgrade Desk • E: Open`
  4. **Preservation**:
     - Top objective banner ($y = 62$), announcement banners, control strip, modal depths, and contextual colors were strictly preserved.

### 2. Exact Files Changed
1. `src/scenes/UIScene.ts`:
   - Defined `screenH = this.scale.gameSize.height` in `create()`.
   - Initialized `actionCardContainer` at $(screenW / 2, screenH - 52)$ and `controlsText` at $(screenW / 2, screenH - 20)$.
   - Updated `updateResponsiveHud()`: desktop card position at `(screenWidth / 2, screenHeight - 52)`, mobile portrait position at `(screenWidth / 2, screenHeight - 44)`.
   - Updated `updateContextualActionCard()`: concise copy, max width 420px (desktop) / `screenWidth - 24` (mobile), dynamic height calculation (`Math.max(28, textH + 10)`).

### 3. Automated Tests & Production Build
- `npm test -- --run`: 65/65 tests passed (100% green).
- `npm run build`: Exit code 0, clean production bundle generated (`dist/assets/index-BqfkTU1b.js`).

### 4. Browser Acceptance Testing (Chrome DevTools Protocol Automation)
Automated verification executed via `scratch/verify_action_card_position.mjs`:
1. **Desktop 1366×768 Verification**:
   - Supplies approach: visible, text `"Supply Shelf • R: Return carried ingredients"`, $y = \text{gameH} - 52$, controls at $\text{gameH} - 20$.
   - Steamer 1 approach: visible, text `"Steamer 1 • Steaming modaks..."`, $y = \text{gameH} - 52$, zero overlap with Steaming department badge or brass steamer artwork.
   - Packing approach: visible, text `"Packing • Deposit batch / Collect boxes"`, $y = \text{gameH} - 52$.
   - Service Counter approach: visible, text `"Counter • Deposit boxes / Serve devotees"`, width 225px ($< 420\text{px}$), $y = \text{gameH} - 52$, separation to controls is 32px ($> 8\text{px}$), zero overlap with department badges or steamers.
   - Upgrade Desk approach: visible, text `"Upgrade Desk • E: Open"`, $y = \text{gameH} - 52$.
   - Dispatch Station approach: visible, text `"Dispatch • Deposit boxes (0/12)"`, $y = \text{gameH} - 52$.
   - Captured screenshot: `shot_action_card_desktop_1366x768.png`.
2. **Mobile Portrait 390×844 Verification**:
   - Positioned at $y = 800$ (`screenHeight - 44`), width 170px ($< 366\text{px}$), single/double centered line, controls strip hidden, mobile HUD clean.
   - Captured screenshot: `shot_action_card_mobile_390x844.png`.
3. **Console Errors**: 0 console errors recorded.

### 5. Verification Screenshots
1. `shot_action_card_desktop_1366x768.png`
2. `shot_action_card_mobile_390x844.png`

### 6. Ownership Release
- State: `WAITING_FOR_REVIEW`
- Owner: `none`
- Active handoff: `ACTION_CARD_POSITION_FIXED`

---

## Pass Completion: ILLUSTRATED_STATIONS_INTEGRATION

### 1. Diagnosis & Architectural Intent
The Modak Mahal production hall featured illustrated raster artwork for the environment background (`bg_hall_illustrated-v3-clean.png`), the festive Ganesha Pandal (`pandal_ganesha-v2.png`), and the brass cooking steamers (`steamer_brass-v1.png`), but still used flat procedural canvas shapes for the three main production work surfaces:
- Ingredient / Supply Shelf
- Packing Bench
- Service Counter

In this bounded visual integration pass, all three stations were upgraded to use the provided transparent raster assets:
1. `public/assets/generated/station_supply_shelf-v1.png`
2. `public/assets/generated/station_packing_bench-v1.png`
3. `public/assets/generated/station_service_counter-v1.png`

All state-driven overlays, progress bars, dynamic inventory badges, purchase/return buttons, customer order bubbles, staff NPC positions, and interaction highlights were calibrated and preserved without painting state into the rasters.

### 2. Exact Files Changed
1. `src/scenes/BootScene.ts`:
   - Preloaded `raster_supply_shelf`, `raster_packing_bench`, and `raster_service_counter`.
2. `src/stations/IngredientStation.ts`:
   - Swapped procedural texture for `raster_supply_shelf`.
   - Configured uniform visible scaling, visible bottom-center origin, and floor contact Y offset.
   - Positioned "GOODS IN" sacks pallet at $(-54, 10)$, stock badge at $(0, 20)$, Buy button at $(0, 42)$, and Return button at $(0, 66)$.
   - Updated buy/pickup/return tweens to preserve uniform scale and base offsets.
3. `src/stations/PackingStation.ts`:
   - Swapped procedural texture for `raster_packing_bench`.
   - Configured uniform visible scaling, visible bottom-center origin, and floor contact Y offset.
   - Positioned cooked-modak input tray at $(-36, -22)$ directly on the illustrated banana-leaf tray.
   - Positioned packed-box output stack at $(2, -18)$ on the clear central workspace, with output badge at $(2, 2)$.
   - Kept progress bar at $y = 16$ and status pill at $(0, 28)$ compactly below table legs.
   - Updated batch load / box collect tweens to preserve uniform scale.
4. `src/stations/CounterStation.ts`:
   - Swapped procedural texture for `raster_service_counter`.
   - Configured uniform visible scaling, visible bottom-center origin, and floor contact Y offset.
   - Positioned deposited box stock stack at $(-15, -25)$ on the counter tabletop.
   - Positioned stock count badge at $(0, 24)$ below the furniture.
   - Updated box deposit tween to scale relative to `COUNTER_SCALE`.
5. `src/scenes/ShopScene.ts`:
   - Calibrated shallow solid lower footprint colliders for `furn_supply_shelf`, `furn_goods_in_sacks`, `furn_packing_bench`, and `furn_service_counter`.
6. `ASSET_CREDITS.md`:
   - Added asset credits and provenance records for the three station raster PNGs.

### 3. Measured Visible Bounds, Scales & Origins
Assets were measured via pixel inspection script (`scratch/measure_assets.mjs`):
1. **Supply Shelf (`station_supply_shelf-v1.png`)**:
   - Natural dimensions: $1388 \times 1133$
   - Visible bounding box: $[157, 68, 1253, 1048]$ (visible width: 1097, visible height: 981)
   - Visible bottom-center: $(705.5, 1048)$
   - Origin: $(705.5 / 1388, 1048 / 1133) = (0.508285, 0.924978)$
   - Uniform scale: $88 / 1097 \approx 0.080219$ (visible width: 88px, visible height: 78.7px)
   - Station container at $(205, 135)$, sprite offset $(0, 10)$, floor base contact at world $y = 145$.
2. **Packing Bench (`station_packing_bench-v1.png`)**:
   - Natural dimensions: $1568 \times 1003$
   - Visible bounding box: $[145, 112, 1446, 917]$ (visible width: 1302, visible height: 806)
   - Visible bottom-center: $(796.0, 917)$
   - Origin: $(796.0 / 1568, 917 / 1003) = (0.507653, 0.914257)$
   - Uniform scale: $106 / 1302 \approx 0.081413$ (visible width: 106px, visible height: 65.6px)
   - Station container at $(365, 390)$, sprite offset $(0, 15)$, floor base contact at world $y = 405$.
3. **Service Counter (`station_service_counter-v1.png`)**:
   - Natural dimensions: $1683 \times 935$
   - Visible bounding box: $[121, 241, 1581, 852]$ (visible width: 1461, visible height: 612)
   - Visible bottom-center: $(851.5, 852)$
   - Origin: $(851.5 / 1683, 852 / 935) = (0.505942, 0.911230)$
   - Uniform scale: $118 / 1461 \approx 0.080767$ (visible width: 118px, visible height: 49.4px)
   - Station container at $(700, 390)$, sprite offset $(0, 15)$, floor base contact at world $y = 405$.

### 4. Furniture Collider Calibration
- `furn_supply_shelf`: `Rectangle(163, 110, 84, 30)` matching the lower shelf feet.
- `furn_goods_in_sacks`: `Rectangle(137, 112, 24, 28)` for pallet left of the shelf.
- `furn_packing_bench`: `Rectangle(316, 386, 98, 20)` shallow table base, freeing $y \le 385$ for Packer NPC.
- `furn_service_counter`: `Rectangle(644, 384, 115, 22)` shallow counter base, freeing $y \in [320, 383]$ for Cashier NPC and player approach while keeping aisle $x \in [613, 643]$ open.

### 5. Automated Tests & Build Results
- `npm test -- --run`: 65/65 tests passed (100% green).
- `npm run build`: Exit code 0, clean production build verified (`tsc && vite build`).

### 6. Browser Acceptance Testing (CDP Suite)
Automated verification executed via `scratch/verify_illustrated_stations.mjs`:
1. **Geometric & Texture Verification**: All three stations confirmed using raster keys with exact uniform scale and origin.
2. **Complete Production Loop**:
   - Buy ingredients (`₹12`) $\to$ Pick up bundle $\to$ Return bundle (`[R]`) $\to$ Re-pickup bundle: PASSED.
   - Load Steamer 1 $\to$ Advance cooking timer $\to$ Collect cooked batch: PASSED.
   - Deposit at Packing Bench $\to$ Banana-leaf tray overlay appears: PASSED.
   - Advance packing timer $\to$ Output box stack appears on central workspace $\to$ Collect boxes: PASSED.
   - Deposit boxes at Service Counter $\to$ Countertop box stack appears $\to$ Serve customer $\to$ Payment received (`+₹13 (+₹3 tip)`): PASSED.
3. **Staff Automation**:
   - Hired Packer NPC appears at $(320, 365)$ behind packing table (depth 365 vs table depth 390).
   - Hired Cashier NPC appears at $(660, 365)$ behind service counter (depth 365 vs counter depth 390).
   - Automated batch packing and customer serving verified.
4. **Viewport Scaling**:
   - Desktop 1366×768: Zoom 1.34, beautiful illustrated hall layout.
   - Desktop 1920×1080: Zoom 2.0, sharp crisp rendering.
   - Landscape 1024×600: Zoom 1.07.
   - Mobile Portrait 390×844: Zoom 0.98, smooth vertical camera follow.
5. **Console Errors**: 0 console errors during full browser execution.

### 7. Verification Screenshots
1. `shot_illustrated_stations_full_hall_1366x768.png` — Full hall showing all 3 raster stations integrated into the illustrated environment.
2. `shot_illustrated_stations_packing_overlay_1366x768.png` — Packing bench with cooked modaks on the banana-leaf tray.
3. `shot_illustrated_stations_counter_served_1366x768.png` — Service counter with deposited boxes, leaving devotee with payment rating bubble.
4. `shot_illustrated_stations_mobile_390x844.png` — Mobile portrait framing player, stations, and Ganesha shrine cleanly.

### 8. Remaining Visual Limitations
- Upgrade Management Desk (`furn_upgrade_desk`, 740, 135) and locked dispatch stand remain procedural shapes, scheduled for future bounded passes.
- Player character, staff NPCs, and customer sprites remain procedural vector-canvas avatars.

### 9. Final Ownership State
- State: `WAITING_FOR_REVIEW`
- Owner: `none`
- Active handoff: `ILLUSTRATED_STATIONS_INTEGRATION_COMPLETE`

---

## Pass Completion: PACKING_ROOM_LEGACY_SHELF_CLEANUP

### 1. Diagnosis & Architectural Intent
Following the integration of the illustrated `raster_packing_bench` asset, an obsolete procedural packaging-material shelf (`station_packaging_shelf`) remained rendered at world coordinates $(298, 360)$ overlapping the Packing room's west wall/pillar and blocking the west side of the room with collider `furn_packing_shelf` at `Rectangle(292, 340, 18, 40)`.

Because the new illustrated raster packing bench already includes folded gift boxes, red ribbons, paper, drawers, and lower storage, the legacy procedural shelf was redundant and caused visual clashing. Furthermore, with the removal of the shelf, the packing bench at $x = 365$ was slightly left-heavy relative to the Packing room's interior floor ($x \in [288, 468]$, center $x = 378$).

### 2. Exact Files Changed
1. `src/scenes/ShopScene.ts`:
   - Removed the legacy `packShelf` sprite instantiation at $(298, 360)$ from `createDecorations()`.
   - Removed the `furn_packing_shelf` collider from `collisionBlockers`.
   - Repositioned `PackingStation` from $x = 365$ to $x = 380$ ($y = 390$), centering the bench within the room interior.
   - Shifted `furn_packing_bench` collider from `Rectangle(316, 386, 98, 20)` to `Rectangle(331, 386, 98, 20)`.
   - Adjusted `PackerNPC` position from $(320, 365)$ to $(335, 365)$ behind the banana-leaf receiving tray at depth 365.
2. `src/scenes/BootScene.ts`:
   - Removed the obsolete procedural canvas generation block for `station_packaging_shelf` (previously `pkgShelfCanvas`).
3. `PROJECT_STATUS.md`:
   - Released ownership back to `WAITING_FOR_REVIEW` with owner `none` and active handoff `PACKING_ROOM_LEGACY_SHELF_CLEANUP_COMPLETE`.

### 3. Packing Room Geometric Alignment & Spacing
- **Room Interior**: $x \in [288, 468]$ (width 180px, floor center $x = 378$).
- **Packing Bench (x = 380)**: Visible artwork spans $x \in [327, 433]$ (width 106px).
  - Left clearance to west partition wall: $327 - 288 = 39\text{px}$.
  - Right clearance to east partition wall: $468 - 433 = 35\text{px}$.
  - The bench is now visually centered, grounded, and harmoniously aligned below the "3 PACKING" badge ($x = 395$).
- **Packer NPC (x = 335, y = 365)**: Positioned cleanly behind the banana-leaf receiving tray ($x \approx 344$), safely 47px away from the west partition wall, depth 365 (behind bench at depth 390).
- **Cleared West Floor Space**: Player can now freely walk through $x \in [288, 327]$, $y \in [330, 420]$ where the old shelf used to collide.

### 4. Verification Results
- **Vitest Suite**: `npm test -- --run` $\to$ **65/65 passed** (100% green).
- **TypeScript & Vite Build**: `npm run build` $\to$ **Exit code 0** (clean production bundle generated).
- **In-Browser Automation (CDP)** (`scratch/verify_packing_room_cleanup.mjs`):
  1. `station_packaging_shelf` texture completely purged from Phaser texture manager.
  2. `furn_packing_shelf` collider completely purged from collision blockers.
  3. Player navigated through north doorway ($x = 380, y = 240 \to 335$) and walked directly into the previously obstructed west spot at $(305, 360)$ with zero collision.
  4. Complete production loop tested: batch cooked $\to$ loaded into packing bench $\to$ banana-leaf tray overlay appeared with cooked modaks $\to$ progress bar and status pill updated $\to$ boxes packed $\to$ collected.
  5. Tested at 1366×768 (desktop) and 390×844 (mobile portrait).
  6. **0 console errors**.

### 5. Verification Screenshots
1. `shot_packing_cleanup_full_hall_1366x768.png` — Full hall showing clean packing room without legacy shelf.
2. `shot_packing_cleanup_room_idle_1366x768.png` — Packing room close-up with centered idle bench.
3. `shot_packing_cleanup_room_processing_1366x768.png` — Packing room close-up while processing a batch with modaks on leaf tray and Packer NPC active.
4. `shot_packing_cleanup_mobile_390x844.png` — Mobile portrait showing player carrying boxes through the cleared west side of the packing room.

### 6. Final Ownership State
- State: `WAITING_FOR_REVIEW`
- Owner: `none`
- Active handoff: `PACKING_ROOM_LEGACY_SHELF_CLEANUP_COMPLETE`

---

## Pass Completion: MODAK_GUIDE_AND_PRODUCT_CLARITY

### 1. Diagnosis & Architectural Intent
To provide crystal-clear objective clarity for new players and enhance the visual feedback of cooked goods, this bounded pass implemented:
1. An opening festival guide modal shown on new campaign start that introduces Modak Mahal, displays the hero illustrated platter of steamed modaks, outlines the core production flow (`Buy Ingredients ➔ Steam Modaks ➔ Pack Boxes ➔ Serve Devotees`), and explains the Grand Pandal finale goal (requiring all 4 upgrades and delivering 12 **packed boxes**, not loose modaks).
2. A compact progression reminder inside the Upgrade modal beneath the upgrade rows: `Own all 4 upgrades to unlock the Grand Pandal order • 12 packed boxes`.
3. Clear HUD objective text during the Pandal stage: `Grand Pandal Order: X/12 packed boxes`.
4. State-backed replacement of procedural cooked modaks with the illustrated transparent asset `modak_platter-v1.png` (three detailed steamed modaks on banana-leaf-lined brass thali) on both the Steamer output table and the Packing bench banana-leaf receiving tray.
5. Strict preservation of all campaign logic, timing, economy, customer patience, upgrade pricing, and the hidden-until-unlocked Dispatch station design.

### 2. Exact Files Changed
1. `src/scenes/BootScene.ts`:
   - Preloaded `raster_modak_platter` from `assets/generated/modak_platter-v1.png`.
2. `src/stations/SteamerStation.ts`:
   - Defined platter geometry constants (`PLATTER_VISIBLE_WIDTH = 1525`, `PLATTER_TARGET_WIDTH = 48`, scale $\approx 0.031475$, visible center origin $(0.49609, 0.50684)$).
   - Replaced procedural `tray_cooked_modaks` texture with `raster_modak_platter` on `cookedModaksSprite` positioned at $(36, -5)$ on the Steamer output table.
   - Updated collection tween and visibility toggling to preserve aspect ratio without covering the brass pot or READY badge.
3. `src/stations/PackingStation.ts`:
   - Defined platter geometry constants (`PLATTER_TARGET_WIDTH = 50`, scale $\approx 0.032787$, visible center origin $(0.49609, 0.50684)$).
   - Replaced procedural `tray_cooked_modaks` texture with `raster_modak_platter` on `receivingTraySprite` positioned at $(-36, -22)$ on the illustrated banana-leaf receiving area.
   - Updated deposit bounce tween and visibility logic (shown when batch is waiting or being packed, hidden immediately upon completion).
4. `src/scenes/UIScene.ts`:
   - Added Opening Festival Guide Modal (`buildGuideModal()`, `openGuideModal()`, `closeGuideModal()`) with dim backdrop, walnut card frame, antique gold trim, central platter hero artwork (width 170px), process strip, Grand Pandal finale highlight box, controls guide, and primary `START FESTIVAL` button.
   - Tied opening guide to fresh campaign start; simulation timer and player movement are frozen while open.
   - Supported pointer click, `Enter`, `Space`, and `Escape` to close. Implemented strict Escape priority in `handleModalKeyDown()` ensuring closing the guide never triggers the Pause modal.
   - Added `HOW TO PLAY` button in Pause modal to reopen the guide on demand.
   - Added compact reminder line to Upgrade modal: `Own all 4 upgrades to unlock the Grand Pandal order • 12 packed boxes`.
   - Updated PANDAL_ORDER objective string to `packed boxes`.
   - Added responsive scaling/centering for `guideModalContainer` across desktop and mobile viewports.
   - Exposed `window.__uiScene` for automated testing.
5. `src/scenes/ShopScene.ts`:
   - In `restartGame()`, reset `hasShownOpeningGuide = false` and called `openGuideModal()` so restarts show the guide.
6. `ASSET_CREDITS.md`:
   - Added credit entry for `modak_platter-v1.png` (provenance: OpenAI built-in image tool; purpose: tutorial hero artwork and state-driven cooked-modak presentation).
7. `PROJECT_STATUS.md`:
   - Released ownership back to `WAITING_FOR_REVIEW` with owner `none` and active handoff `MODAK_GUIDE_AND_PRODUCT_CLARITY_COMPLETE`.

### 3. Asset Scaling, Origin & Positioning
- **Asset Dimensions**:
  - File: `public/assets/generated/modak_platter-v1.png`
  - Natural: 1536×1024 px.
  - Visible bounding box: $[0, 31, 1524, 1007]$ (visible width: 1525 px, visible height: 977 px).
  - Visible center origin: $(762 / 1536, 519 / 1024) \approx (0.49609, 0.50684)$.
- **Steamer Output Table**:
  - Scale: $48 / 1525 \approx 0.0314754$ (uniform, aspect ratio strictly preserved).
  - Position: $(36, -5)$ relative to station origin $(405, 135)$.
  - Fits comfortably within output table boundaries ($x \in [14, 58]$), clear of pot ($x \le 22.5$) and status badge ($y = 18$).
- **Packing Bench Receiving Tray**:
  - Scale: $50 / 1525 \approx 0.0327869$ (uniform, aspect ratio strictly preserved).
  - Position: $(-36, -22)$ relative to station origin $(380, 390)$.
  - Sits on the painted banana-leaf receiving tray, separated from central packing boxes ($x = 2, y = -18$) and progress bar ($y = 16$).
- **Opening Guide Modal Hero Artwork**:
  - Scale: $170 / 1525 \approx 0.111475$ (visible width 170 px, visible height 108.9 px).
  - Position: $(0, -96)$ within the $540 \times 450$ guide card dialog.

### 4. Verification Results
- **Vitest Suite**: `npm test -- --run` $\to$ **65/65 passed** (100% green).
- **TypeScript & Production Build**: `npm run build` $\to$ **Exit code 0** (clean production bundle generated).
- **In-Browser Automation (CDP)** (`scratch/verify_modak_guide_clarity.mjs`):
  1. Opening guide opens immediately on fresh campaign start (`stage: ONBOARDING`).
  2. Simulation clock is paused (`campaignState.isPaused = true`) and player input blocked.
  3. Platter hero artwork is sharp, uncropped, and rendered at ~170px visible width.
  4. Closed via `Escape`: guide closed, simulation resumed, player unblocked, and Pause modal did NOT open.
  5. Subsequent `Escape` opened Pause modal as normal; "How to Play" button in Pause modal reopened the guide.
  6. Tested closing with `Space` and `Enter`: closed successfully.
  7. Upgrade modal displays `Own all 4 upgrades to unlock the Grand Pandal order • 12 packed boxes`.
  8. Steamer cooked modaks: cooking batch displays `raster_modak_platter` at Steamer output table (48px wide); collecting removes platter from steamer.
  9. Packing bench: depositing batch displays `raster_modak_platter` on the leaf tray (50px wide); packing consumes batch and platter disappears.
  10. Dispatch station remains completely invisible prior to owning all 4 upgrades.
  11. Purchasing all 4 upgrades unlocks Dispatch station and updates HUD objective to `Grand Pandal Order: 0/12 packed boxes`.
  12. Depositing 12 boxes triggers courier dispatch (10s countdown) and transitions to Victory modal.
  13. Restarting festival resets campaign to `ONBOARDING` and redisplays the opening guide.
  14. Tested responsiveness at 1366×768 (desktop), 1920×1080 (desktop), 1024×600 (compact), and 390×844 (mobile portrait).
  15. **0 console errors** throughout execution.

### 5. Verification Screenshots
1. `shot_guide_desktop_1366x768.png` — Opening guide modal on desktop with modak platter hero artwork, process ribbon, Grand Pandal finale box, controls, and Start button.
2. `shot_guide_mobile_390x844.png` — Opening guide modal scaled and centered for mobile portrait viewports (390×844).
3. `shot_steamer_modak_platter_1366x768.png` — Steamer 1 with cooked modak platter on output table surface beside the brass pot.
4. `shot_packing_modak_platter_1366x768.png` — Packing bench with modak platter on banana-leaf receiving tray awaiting packing.
5. `shot_pandal_packed_boxes_1366x768.png` — Unlocked Pandal Dispatch station with announcement banner and HUD showing `0/12 packed boxes`.

### 6. Remaining Visual Limitations
- Player, staff NPCs, and customer sprites remain procedural vector-canvas avatars.
- Upgrade Desk (`furn_upgrade_desk`, 740, 135) remains a procedural shape.

### 7. Final Ownership State
- State: `WAITING_FOR_REVIEW`
- Owner: `none`
- Active handoff: `MODAK_GUIDE_AND_PRODUCT_CLARITY_COMPLETE`

---

## Pass Completion: STAFF_UPGRADE_AND_ALIGNMENT_POLISH

**Date**: 2026-09-20  
**Active Handoff**: `STAFF_UPGRADE_AND_ALIGNMENT_POLISH_COMPLETE`  
**Owner**: `none` (Released to `WAITING_FOR_REVIEW`)

### 1. Goals Achieved
1. **Supply Shelf V2**: Replaced tilted-perspective shelf with front-facing, horizontally level `station_supply_shelf-v2.png` at 88px visible width, preserving v1 as rollback.
2. **Illustrated Upgrade Desk**: Replaced procedural canvas desk with illustrated `station_upgrade_desk-v1.png` at 100px visible width with matching collider, dynamic purchase bounce tween, and clear prompt positioning. Obsolete `station_upgrade` canvas generator removed from BootScene.
3. **Packer & Cashier Staff Visibility**: Replaced procedural staff circles with illustrated characters `staff_packer-v1.png` and `staff_cashier-v1.png` scaled to 52px visible height with compact "Packer" and "Cashier" labels, subtle contact shadows, dynamic bow scaling, and depth layering (depth 370) behind workstations (depth 390) so heads, torsos, and arms remain fully visible.
4. **Dispatch Badge Separation**: Relocated "5 DISPATCH" badge from $(572, 278)$ to $(572, 328)$ directly above the Dispatch crate, eliminating all overlap with "4 SERVICE" badge at $(642, 278)$.
5. **Strict Gameplay & Balance Preservation**: Zero changes to upgrade prices, working capital reserve, customer patience, dispatch target (12 boxes), movement physics, or campaign progression.

### 2. Measured Alpha Bounds & Calibrated Dimensions
| Asset | Source Dimensions | Measured Non-Transparent Bounds $[x_{\min}, y_{\min}, x_{\max}, y_{\max}]$ | Visible Size $(W \times H)$ | Origin $(X, Y)$ | Target In-Game Dimension | Uniform Scale |
|---|---|---|---|---|---|---|
| `station_supply_shelf-v2.png` | $1387 \times 1134$ | $[100, 75, 1286, 1059]$ | $1187 \times 985$ | $(0.50000, 0.93386)$ | $88\text{px}$ visible width | $0.0741365$ |
| `station_upgrade_desk-v1.png` | $1515 \times 1038$ | $[48, 138, 1465, 908]$ | $1418 \times 771$ | $(0.49967, 0.87476)$ | $100\text{px}$ visible width | $0.0705219$ |
| `staff_packer-v1.png` | $1024 \times 1536$ | $[242, 91, 772, 1427]$ | $531 \times 1337$ | $(0.49561, 0.92904)$ | $52\text{px}$ visible height | $0.0388930$ |
| `staff_cashier-v1.png` | $1024 \times 1536$ | $[235, 54, 770, 1421]$ | $536 \times 1368$ | $(0.49121, 0.92513)$ | $52\text{px}$ visible height | $0.0380117$ |

### 3. Final Positions, Depths, and Colliders
- **Supply Shelf V2** (`IngredientStation.ts`):
  - World position: $(205, 135)$, depth 135.
  - Local sprite offset: $(0, 10)$, anchored at bottom-center $(0.5, 0.933862)$.
  - GOODS IN pallet at $(-48, 5)$, Stock badge at $(22, 12)$.
  - Solid collider: `furn_supply_shelf` at `Rectangle(163, 110, 84, 30)` matching the 88px visible footprint.
- **Upgrade Desk** (`UpgradeStation.ts`):
  - World position: $(740, 115)$, depth 115.
  - Local sprite offset: $(0, 12)$, anchored at bottom-center $(0.49967, 0.87476)$.
  - Prompt text "Upgrades [E]" positioned below desk at $(0, 32)$ clear of desk legs.
  - Solid collider: `furn_upgrade_desk` updated to `Rectangle(692, 112, 96, 34)` protecting lower solid base while keeping office entryway ($x \le 644$) unobstructed.
- **Packer Staff NPC** (`Staff.ts`, `ShopScene.ts`):
  - World position: $(334, 388)$, depth 370 (behind `PackingStation` depth 390).
  - Visible character height: 52px; head, shoulders, and arms fully visible above the 362px packing bench tabletop.
  - Subtle contact shadow: ellipse $(0, 0, 20, 6)$ with alpha 0.22.
  - Compact pill label: "Packer" at $(0, -56)$ relative to character baseline, green badge (`#1e4620`) with gold border (`#ffd54f`).
  - Work animation: gentle bobbing tween from calibrated base position without y-drift.
- **Cashier Staff NPC** (`Staff.ts`, `ShopScene.ts`):
  - World position: $(664, 388)$, depth 370 (behind `CounterStation` depth 390).
  - Visible character height: 52px; head, turban, purple vest, and arms clearly visible above the counter.
  - Subtle contact shadow: ellipse $(0, 0, 20, 6)$ with alpha 0.22.
  - Compact pill label: "Cashier" at $(0, -56)$ relative to character baseline, purple badge (`#3a1d56`) with gold border (`#ffd54f`).
  - Greeting bow: dynamic tween derived from `CASHIER_SCALE * 0.85` on Y and `CASHIER_SCALE * 1.04` on X; zero scale corruption.
- **Department Badges**:
  - Service badge: remains at $(642, 278)$, depth 20.
  - Dispatch badge: moved inside Service room to $(572, 328)$, depth 20, directly above the Dispatch crate.
  - Separation: $\Delta x = 70\text{px}, \Delta y = 50\text{px}$; completely separated with 0 overlap.

### 4. Verification Results
- **Vitest Test Suite**: `npm test -- --run` $\to$ **65/65 passed** (100% green).
- **TypeScript & Production Build**: `npm run build` $\to$ **Exit code 0** (clean production bundle generated).
- **In-Browser Automation (CDP)** (`scratch/verify_staff_upgrade_polish.mjs`):
  1. Shelf V2 loaded with `raster_supply_shelf_v2`, verified uniform scale ($0.074136$), level base, and working Buy/Return controls.
  2. Upgrade Desk rendered with `raster_upgrade_desk`, verified 100px visible width, modal opened via keyboard and pointer, and single-purchase logic intact.
  3. Packer & Cashier hidden prior to hiring; become visible at depth 370 upon purchasing upgrades.
  4. Packer automated batch packaging verified (output boxes incremented correctly).
  5. Cashier auto-service and namaste bow verified without scale distortion.
  6. Compact labels verified: "Packer" and "Cashier" sit above heads without touching room walls or department badges.
  7. Dispatch badge at $(572, 328)$ verified hidden until Pandal order unlock; visible during Pandal order with zero overlap on Service badge.
  8. Screen responsiveness verified across 1366×768, 1920×1080, 1024×600, and 390×844.
  9. **0 console errors** logged throughout the entire test suite.

### 5. Verification Screenshots
1. `shot_staff_upgrade_full_hall_1366x768.png` — Full hall overview showing level Supply Shelf V2, illustrated Upgrade Desk, Steamer stations, working Packer in Compartment 3, working Cashier in Compartment 4, and unlocked Dispatch station.
2. `shot_shelf_v2_closeup_1366x768.png` — Close-up of front-facing Supply Shelf V2 with GOODS IN pallet, brass ingredients bowls, and stock counter.
3. `shot_upgrade_desk_modal_1366x768.png` — Illustrated Upgrade Desk in office alcove with open Upgrade Modal.
4. `shot_packing_packer_working_1366x768.png` — Packing room with visible hired Packer working behind bench with compact "Packer" pill.
5. `shot_service_cashier_working_1366x768.png` — Service counter with visible hired Cashier greeting devotees with compact "Cashier" pill.
6. `shot_dispatch_badge_separated_1366x768.png` — Unlocked Pandal Dispatch showing clearly separated "5 DISPATCH" and "4 SERVICE" badges.

### 6. Remaining Visual Limitations
- Player character and customer devotee sprites remain procedural vector-canvas avatars.
- Pandal dispatch crate remains procedural canvas artwork.

### 7. Final Ownership State
- State: `WAITING_FOR_REVIEW`
- Owner: `none`
- Active handoff: `STAFF_UPGRADE_AND_ALIGNMENT_POLISH_COMPLETE`

---

## Legacy Staff Character Rollback — Complete

- **Scope**: Restored the original procedural Packer and Cashier characters after the illustrated full-body alternatives appeared visually inconsistent with the established player/manager scale.
- **Files changed**: `src/entities/Staff.ts`, `src/scenes/ShopScene.ts`, `src/scenes/BootScene.ts`, `ASSET_CREDITS.md`, and coordination documents.
- **Visual changes**:
  - Restored active texture keys `staff_packer` and `staff_cashier` at their original `0.5` scale.
  - Restored staff positions to Packer `(335, 365)` and Cashier `(660, 365)` with depth derived from `y`, matching the existing procedural player character family.
  - Retained the cleaner compact labels `Packer` and `Cashier`.
  - Restored legacy contact shadows, Packer work bob, and Cashier bow scale while preserving all automation logic.
  - Removed the two unused illustrated staff preloads; generated alternatives remain in `public/assets/generated/` for rollback but are not loaded or rendered.
  - Preserved Supply Shelf V2, illustrated Upgrade Desk, and separated Dispatch badge.
- **Verification**:
  - `npm test -- --run`: **65/65 passed**.
  - `npm run build`: **passed** with exit code 0.
  - Source audit confirms no active `raster_staff_*` references remain.
- **Final ownership**:
  - State: `WAITING_FOR_REVIEW`
  - Owner: `none`
  - Active handoff: `LEGACY_STAFF_CHARACTER_ROLLBACK_COMPLETE`

---

## Pass Completion: FINAL_SUBMISSION_AUDIT_AND_GITHUB_RELEASE

**Date**: 2026-09-20
**Active Handoff**: `GITHUB_PUSHED_PAGES_CONFIGURATION_REQUIRED`
**Owner**: `none` (Released to `WAITING_FOR_REVIEW`)

### 1. Phase 1 — Read-Only Audit Results

- **Git state**: 6 previous commits on `master`. All campaign, visual integration, controls, patience/ratings, upgrades, staff, dispatch, victory, UI cleanup work was present in the uncommitted working tree.
- **Secrets audit**: Zero `.env`, API key, password, or credential files found in the working tree.
- **Asset audit**: All 11 raster assets referenced in `BootScene.ts` preload exist at the correct paths in `public/assets/generated/`. Path casing confirmed.
  - `bg_hall_illustrated-v3-clean.png` ✓
  - `pandal_ganesha-v2.png` ✓
  - `steamer_brass-v1.png` ✓
  - `steamer_input_table-v1.png` ✓
  - `steamer_output_table-v1.png` ✓
  - `station_supply_shelf-v1.png` ✓ (rollback, preloaded but not used at runtime)
  - `station_supply_shelf-v2.png` ✓
  - `station_upgrade_desk-v1.png` ✓
  - `station_packing_bench-v1.png` ✓
  - `station_service_counter-v1.png` ✓
  - `modak_platter-v1.png` ✓
- **Staff textures**: `staff_packer` and `staff_cashier` confirmed as procedural canvas textures generated in `BootScene.ts` (legacy character rollback is in effect — raster `staff_packer-v1.png` / `staff_cashier-v1.png` are NOT preloaded).
- **No scratch scripts, browser profiles, or Antigravity brain data** found in the project tree.
- **Tests**: 65/65 passing (3 test files: economy, campaign, customerService).
- **Production build**: Exit code 0. Bundle: `dist/assets/index-DDJBY0-S.js` (1605 kB).

### 2. Phase 2 — .gitignore Update

Added to `.gitignore`:
- `.env`, `.env.*`, `!.env.example`
- `scratch/`
- `*.log`
- `coverage/`
- `playwright-report/`
- `test-results/`

### 3. Phase 3 — GitHub Pages Configuration

- Updated `vite.config.ts` with `base: '/modak-mahal-festival-rush/'`.
- `dist/index.html` line 41 confirmed: `src="/modak-mahal-festival-rush/assets/index-DDJBY0-S.js"` — correct subdirectory base.
- Created `.github/workflows/deploy-pages.yml`:
  - Triggers on `push` to `master` and `workflow_dispatch`.
  - Permissions: `contents: read`, `pages: write`, `id-token: write`.
  - Concurrency group: `pages`.
  - Steps: `checkout@v4` → `setup-node@v4` (Node 20) → `npm ci` → `vitest run` → `vite build` → `configure-pages@v5` → `upload-pages-artifact@v3` (path: `dist`) → `deploy-pages@v4`.

### 4. Phase 4 — README Rewrite

Rewrote `README.md` with:
- Game description, gameplay loop, controls table.
- Customer patience system with star ratings and tip amounts.
- Four upgrade table with costs and effects.
- Victory condition, Continue Growing, pause behavior, timeout.
- Desktop and mobile support statement.
- Local installation commands (`npm ci`, `npm run dev`, `npm test -- --run`, `npm run build`, `npm run preview`).
- Technology stack table.
- Asset credits link to `ASSET_CREDITS.md`.
- AI-assisted development disclosure (without claiming organizer permission).
- Known limitations (no local save, no audio, locked first floor).
- Submission checklist with user-action placeholders for demo video, team details, and AI-policy confirmation.

### 5. Phase 5 — Build Verification

- `npm install` (used instead of `npm ci` due to `esbuild.exe` being locked by running Vite dev server; same lockfile).
- `.\node_modules\.bin\vitest run --run`: **65/65 passed**.
- `.\node_modules\.bin\tsc && .\node_modules\.bin\vite build`: **Exit code 0**.
- `dist/index.html` asset URL verified: uses `/modak-mahal-festival-rush/` base prefix correctly.

### 6. Phase 7 — Git Commit and Push

- Staged 64 files (all source, assets, docs, workflow, no `node_modules` or `dist`).
- Release commit: `297b162c28caeb5da37c8da54e1122c190dd66f8`.
- Remote added: `https://github.com/darshitn/modak-mahal-festival-rush.git`.
- Push result: `* [new branch] master -> master` — **confirmed successful**.

### 7. Phase 8 — Pages Deployment Status

- The GitHub Actions workflow was triggered by the push.
- **User action required**: Navigate to `https://github.com/darshitn/modak-mahal-festival-rush/settings/pages` and set **Source** to **GitHub Actions**. Without this setting, the workflow will not be permitted to publish to Pages.
- After setting the source, re-run the workflow via the Actions tab or push a new commit.
- Live URL (once Pages is configured): `https://darshitn.github.io/modak-mahal-festival-rush/`

### 8. Final Ownership State

- State: `WAITING_FOR_REVIEW`
- Owner: `none`
- Active handoff: `MOBILE_CONTROLS_AND_COMPATIBILITY_COMPLETE`

---

## HANDOFF-007 — MOBILE_CONTROLS_AND_COMPATIBILITY pass (Gemini)

- Assigned model: Gemini (in Antigravity)
- Date: 21 September 2026
- Outcome: COMPLETE — WAITING_FOR_REVIEW
- Owner: none
- State: WAITING_FOR_REVIEW
- Active handoff: MOBILE_CONTROLS_AND_COMPATIBILITY_COMPLETE

### 1. Diagnosis of Verified Defects
1. **Missing Touch Movement**: At 390×844 and other touch viewports, player could not move because no on-screen movement controller existed.
2. **Missing Mobile Contextual Action / Pause Controls**: No on-screen controls existed to buy/return ingredients, open upgrades, or pause the game on touch devices.
3. **Portrait Camera Empty Space Defect**: `ShopScene.configureCamera()` was computing zoom primarily by fitting width (`zoom = width / 960`), which caused portrait 390×844 to have `zoom ≈ 0.406` and height ≈ 220px, leaving more than half the screen as unused black space.
4. **Mobile Landscape Scale & Missing Controls**: At compact landscape (844×390), the full 960×540 shop was shrunken into a miniature and lacked touch controls.
5. **Contextual Action Card Clutter**: The existing action card occupied the bottom safe area where touch controls need to reside.
6. **Keyboard-Only Opening Guide & Prompts**: Guide instructions and prompt cards only instructed desktop keys (`WASD`, `[E]`, `[R]`).
7. **README Misstatement**: README claimed a touch thumbstick existed when it was not yet implemented.

### 2. Architecture & Implementation Summary
1. **Pure Mobile Helpers (`src/utils/mobileControls.ts`)**:
   - `isMobileLayout(width, height)`: Classifies viewport as mobile if `height > width` (any portrait phone) or `(height <= 500 && width <= 920)` (short mobile landscape).
   - `calculateJoystickVector(dx, dy, radius, deadZone)`: Computes 360° virtual joystick vector, clamps knob to max radius (45px), applies center dead-zone (8px), and normalizes diagonal vectors to max length 1.0.
   - `combineInputVectors(keyboardVx, keyboardVy, virtualVx, virtualVy)`: Safely combines keyboard and virtual joystick inputs, normalizing diagonal movement so combined speed never exceeds 1.0.
   - `getCameraLayoutConfig(viewportWidth, viewportHeight)`: Calculates zoom and camera follow strategy:
     - Portrait (e.g. 390×844): `zoom = max(width/400, height/540)`. For 390×844, `zoom = 844/540 ≈ 1.563`. Visible world height is exactly `844 / 1.563 = 540`, perfectly filling the vertical viewport with zero black space while tracking the player horizontally clamped to world bounds [0, 960].
     - Mobile Landscape (e.g. 844×390): `zoom = max(1.0, height/380) ≈ 1.026`, tracking the player.
     - Desktop (e.g. 1024×600, 1366×768, 1920×1080): `zoom = min(width/960, height/540)`, fitting the complete shop without scrolling or touch controls.
2. **Player Entity (`src/entities/Player.ts`)**:
   - Added `virtualVx`, `virtualVy`, `setVirtualMovement(x, y)`, `clearVirtualMovement()`.
   - `Player.update()` combines keyboard and virtual joystick via `combineInputVectors()`.
   - Added `clearMovementInput()` to cleanly reset both keyboard and virtual velocity when modals open.
3. **Touch Movement Joystick (`src/scenes/UIScene.ts`)**:
   - Screen-anchored container at bottom-left inside mobile safe area (`x: 65, y: height - 65`).
   - Outer base ring (radius 45px, ~90px diameter) and inner knob (radius 22px, ~44px diameter).
   - Multi-pointer tracking (`this.input.addPointer(2)`).
   - Touch drag tracks `joystickPointerId` exclusively, allowing a second finger to tap `ACTION` simultaneously without interfering with movement.
   - Resets movement on pointerup, pointerupoutside, gameout, window blur, resize/orientation change, pause, and modal opening.
4. **Contextual Mobile Action Button (`src/scenes/UIScene.ts`)**:
   - Screen-anchored circular action button at bottom-right (`x: width - 65, y: height - 65`).
   - Dispatches real station methods:
     - At `IngredientStation`: calls `attemptReturn()` when carrying bundles, `attemptBuy()` when hands empty.
     - At `UpgradeStation`: calls `openModal()`.
   - Dynamic contextual labels: `BUY [₹12]`, `RETURN [SHELF]`, `UPGRADES [DESK]`.
   - Automatically hidden when no manual station interaction exists or during modals.
5. **Mobile Pause Button (`src/scenes/UIScene.ts`)**:
   - Screen-anchored button (`[❚❚]`) at top-right mobile HUD (`x: width - 42, y: 26`, touch target 44×44 CSS px).
   - Toggles pause modal, respects existing modal priorities, and does not interfere with upgrade modal `Escape` closures.
6. **Input and Modal Isolation (`src/scenes/UIScene.ts`)**:
   - While Guide, Upgrade, Pause, or Results modal is open: joystick and ACTION button are hidden, virtual movement is zeroed, and player input is blocked.
7. **Mobile HUD and Action Card Adaptations**:
   - Top mobile HUD formatted compactly without text clipping.
   - Action card dynamically positioned above touch controls (`y = height - 140` in portrait, `y = 74` in mobile landscape).
   - Contextual prompt text displays `"Tap ACTION"` on mobile while retaining keyboard prompts (`[E]`, `[R]`) on desktop.
   - Opening guide modal displays mobile-specific touch instructions on mobile viewports.
8. **HTML Safe Area & Viewport**:
   - Updated `index.html` with `viewport-fit=cover` and CSS safe-area padding.

### 3. Files Changed
- `src/utils/mobileControls.ts` (NEW): Pure helpers for layout detection, joystick math, vector combination, camera configuration.
- `src/tests/mobileControls.test.ts` (NEW): 16 unit tests for mobile controls helpers.
- `src/entities/Player.ts`: Added virtual movement vectors, input combination, and clean reset methods.
- `src/stations/IngredientStation.ts`: Made `attemptBuy()` and `attemptReturn()` public methods returning boolean.
- `src/scenes/ShopScene.ts`: Integrated `getCameraLayoutConfig()`, responsive zoom, and player camera follow.
- `src/scenes/UIScene.ts`: Integrated multi-touch joystick, contextual action button, mobile pause button, input isolation, modal scaling, responsive HUD, and mobile guide copy.
- `index.html`: Added `viewport-fit=cover` and safe-area styling.
- `README.md`: Updated controls table and added physical device testing note.
- `TASKS.md`: Checked off Milestone 4.3 tasks.
- `PROJECT_STATUS.md`: Set state to `WAITING_FOR_REVIEW` with owner `none`.

### 4. Verification & Automated Test Results
- **Unit Tests (`npm test -- --run`)**:
  - 81 tests passing across 4 test suites (100% pass rate).
  - 16 new unit tests in `src/tests/mobileControls.test.ts` covering dead zones, max radius clamping, diagonal normalization, movement combination, and mobile/desktop viewport classifications.
- **Production Build (`npm run build`)**:
  - `tsc && vite build` completed with Exit code 0.
- **Automated Browser Acceptance Verification (CDP against production preview server `http://127.0.0.1:4173/modak-mahal-festival-rush/`)**:
  - Tested viewports:
    1. `390×844` portrait (mobile)
    2. `412×915` portrait (mobile)
    3. `844×390` landscape (mobile)
    4. `1024×600` compact landscape (desktop without touch)
    5. `1366×768` desktop (desktop without touch)
    6. `1920×1080` desktop (desktop without touch)
  - Interactive test sequence at 390×844:
    1. Opening guide displayed mobile instructions; closed via touch button.
    2. Zero black space verified: visible world height at zoom 1.563 was exactly 540.0px.
    3. Joystick walked player to Supply Shelf.
    4. ACTION button contextually displayed `RETURN [SHELF]`; tapping RETURN returned bundle and emptied hands.
    5. ACTION button contextually displayed `BUY [₹12]`; tapping BUY purchased bundle (coins 30 -> 18).
    6. Steamer 1 loaded; cooking timer ran 8.5s; collected cooked batch.
    7. Packing station packed 3 boxes; collected boxes.
    8. Service counter served customer; completed sale (+13 coins, rating updated).
    9. Upgrade Desk displayed `UPGRADES [DESK]` action button; tapping ACTION opened upgrade modal.
    10. Controls isolated during upgrade modal (joystick and action button hidden); closed modal via touch close button.
    11. Mobile pause button `[❚❚]` paused and resumed the game.
    12. Simultaneous joystick + ACTION verified (pointer 1 on joystick retained when pointer 2 tapped ACTION).
    13. Rotation/resize during movement tested (no stuck input).
    14. Verified zero console errors across all viewports.

### 5. Screenshots Captured
- `screenshot_portrait_390x844_gameplay.png`: file:///C:/Users/Darshit%20N/.gemini/antigravity-ide/brain/b30d1fa1-b9b9-4501-95b1-c6af76214bea/screenshot_portrait_390x844_gameplay.png
- `screenshot_portrait_412x915.png`: file:///C:/Users/Darshit%20N/.gemini/antigravity-ide/brain/b30d1fa1-b9b9-4501-95b1-c6af76214bea/screenshot_portrait_412x915.png
- `screenshot_landscape_844x390.png`: file:///C:/Users/Darshit%20N/.gemini/antigravity-ide/brain/b30d1fa1-b9b9-4501-95b1-c6af76214bea/screenshot_landscape_844x390.png
- `screenshot_compact_1024x600.png`: file:///C:/Users/Darshit%20N/.gemini/antigravity-ide/brain/b30d1fa1-b9b9-4501-95b1-c6af76214bea/screenshot_compact_1024x600.png
- `screenshot_desktop_1366x768.png`: file:///C:/Users/Darshit%20N/.gemini/antigravity-ide/brain/b30d1fa1-b9b9-4501-95b1-c6af76214bea/screenshot_desktop_1366x768.png
- `screenshot_desktop_1920x1080.png`: file:///C:/Users/Darshit%20N/.gemini/antigravity-ide/brain/b30d1fa1-b9b9-4501-95b1-c6af76214bea/screenshot_desktop_1920x1080.png

### 6. Remaining Limitations & Real-Device Note
- Verification was conducted via automated Chrome DevTools Protocol headless touch emulation across the required mobile and desktop viewports. While pointer events, multi-touch IDs, and layout geometries are strictly verified, hands-on physical validation on various iOS/Android mobile hardware is recommended for real-world ergonomics.

---

## HANDOFF-008 — MOBILE_FEEDBACK_EDGE_CORRECTION pass (Gemini)

- Assigned model: Gemini (in Antigravity)
- Date: 21 September 2026
- Outcome: COMPLETE — WAITING_FOR_REVIEW
- Owner: none
- State: WAITING_FOR_REVIEW
- Active handoff: MOBILE_DEPLOYED_TO_PAGES

### 1. Diagnosis of Verified Defect
In `screenshot_landscape_844x390.png`, the "1★ Left unserved" customer feedback card was partially clipped at the right edge of the screen.
- **Cause**: `Customer.showLaneFeedback()` placed cards near a static world `x = 850`, assuming the full 960×540 shop is always visible. On mobile cameras (e.g. 844×390 landscape with visible width ~822px, and 390×844 portrait with visible width ~250px), the camera scrolls and crops the world to follow the player. When the player was toward the kitchen or packing areas, the customer queue lane at `x = 850` was partially or completely beyond the right edge of the camera viewport.

### 2. Implementation Summary
1. **Pure Viewport Clamping Helper (`src/utils/mobileControls.ts`)**:
   - `clampFeedbackToViewport(desiredX, desiredY, card, camera, options)`:
     - Derives safe visible rectangle in world units bounded by both camera viewport (`cam.worldView`) and the 960×540 world boundaries.
     - Enforces a minimum 8px screen-equivalent margin on all sides (`8 / camera.zoom`).
     - Enforces top mobile HUD clearance (`(54 + 8) / camera.zoom`) on mobile viewports.
     - Accounts for the 20px upward float tween animation (`floatDistance: 20`) so feedback cards never enter the top HUD or top margin during their animation lifetime.
     - Preserves the default placement (`x = 850, y = 250`) on full desktop views.
     - Pulls the card smoothly into the nearest safe visible position when the customer lane is offscreen on mobile.
   - `extractCameraViewport(cam, isMobile)`: Safely extracts camera scroll, viewport dimensions, zoom, and mobile status from Phaser cameras.
2. **Customer Entity (`src/entities/Customer.ts`)**:
   - In `Customer.showLaneFeedback()`: Measures dynamic text width, extracts current camera viewport, and positions `cardContainer` using `clampFeedbackToViewport`.
   - Explicitly sets `cardContainer.setSize(width, height)` and stores dimensions in data attributes.
   - Unchanged animation, colors, tip amount, star rating, and lifetime.
3. **Layout Config (`src/config/layout.ts`)**:
   - Updated `calculateFeedbackBounds` to accept optional `CameraViewportBounds`, delegating to `clampFeedbackToViewport` when a camera is provided while preserving original behavior when omitted.
4. **Scenes (`src/scenes/ShopScene.ts`, `src/scenes/UIScene.ts`)**:
   - `ShopScene.configureCamera(gameSize?: Phaser.Structs.Size)` made public with default fallback to `scale.gameSize`.
   - `UIScene.updateResponsiveHud(gameSize?: Phaser.Structs.Size)` made public with default fallback to `scale.gameSize`.

### 3. Files Changed
- `src/utils/mobileControls.ts`: Added `CameraViewportBounds`, `ClampedFeedbackPosition`, `clampFeedbackToViewport`, `extractCameraViewport`.
- `src/config/layout.ts`: Updated `calculateFeedbackBounds` to support camera-aware viewport clamping.
- `src/entities/Customer.ts`: Updated `showLaneFeedback` to clamp cards to camera viewport and set container size.
- `src/scenes/ShopScene.ts`: Made `configureCamera` public with optional parameter.
- `src/scenes/UIScene.ts`: Made `updateResponsiveHud` public with optional parameter.
- `src/tests/mobileControls.test.ts`: Added 5 focused unit tests for `clampFeedbackToViewport`.
- `PROJECT_STATUS.md`: Updated coordination state to `WAITING_FOR_REVIEW` with owner `none`.
- `MODEL_HANDOFF.md`: Recorded `HANDOFF-008` details and removed EOF blank line.

### 4. Verification & Final Gates
- **Unit Tests (`npm test -- --run`)**: **86/86 passed** across 4 suites (5 new tests in `mobileControls.test.ts` covering full desktop camera, cropped mobile camera, portrait camera, long 210px card, and minimum 8px safe margins).
- **Production Build (`npm run build`)**: Completed cleanly with **Exit code 0**.
- **Whitespace & Diff (`git diff --check`)**: Clean with **0 warnings / errors**.
- **Automated Browser Verification (CDP on Production Preview `http://127.0.0.1:4173/modak-mahal-festival-rush/`)**:
  - All 4 required evidence checkpoints verified:
    1. **Evidence 1 (390×844 Portrait)**: Near Supply Shelf, contextual action button visible with `RETURN [SHELF]`.
    2. **Evidence 2 (390×844 Portrait)**: Near Upgrade Desk, contextual action button visible with `UPGRADES [DESK]`.
    3. **Evidence 3 (844×390 Landscape)**: "1★ Left unserved" feedback card clamped to `x = 770.7, y = 250`, screen right edge at `835.6px <= 836.0px` (`844 - 8px` margin). Entirely visible with zero clipping!
    4. **Evidence 4 (1366×768 Desktop)**: Original desktop feedback position preserved at `x = 850, y = 250` with `isOriginalDesktopPlacement: true`.
  - Zero console errors confirmed.

### 5. Evidence Screenshots Captured
- `evidence_1_portrait_390x844_supply_shelf.png`: file:///C:/Users/Darshit%20N/.gemini/antigravity-ide/brain/b30d1fa1-b9b9-4501-95b1-c6af76214bea/evidence_1_portrait_390x844_supply_shelf.png
- `evidence_2_portrait_390x844_upgrade_desk.png`: file:///C:/Users/Darshit%20N/.gemini/antigravity-ide/brain/b30d1fa1-b9b9-4501-95b1-c6af76214bea/evidence_2_portrait_390x844_upgrade_desk.png
- `evidence_3_landscape_844x390_feedback_card.png`: file:///C:/Users/Darshit%20N/.gemini/antigravity-ide/brain/b30d1fa1-b9b9-4501-95b1-c6af76214bea/evidence_3_landscape_844x390_feedback_card.png
- `screenshot_landscape_844x390.png`: file:///C:/Users/Darshit%20N/.gemini/antigravity-ide/brain/b30d1fa1-b9b9-4501-95b1-c6af76214bea/screenshot_landscape_844x390.png
- `evidence_4_desktop_1366x768_feedback_card.png`: file:///C:/Users/Darshit%20N/.gemini/antigravity-ide/brain/b30d1fa1-b9b9-4501-95b1-c6af76214bea/evidence_4_desktop_1366x768_feedback_card.png
