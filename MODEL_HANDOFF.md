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
