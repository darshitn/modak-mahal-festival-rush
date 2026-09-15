# Modak Mahal: Festival Rush — Task Checklist

## Milestone 1: Core Playable Loop
- [x] **M1.1 Project Setup & Tooling**
  - [x] Create project documentation (PROJECT.md, ARCHITECTURE.md, ROADMAP.md, TASKS.md, AI_INSTRUCTIONS.md, README.md)
  - [x] Initialize Vite + TypeScript + Phaser 3 + Vitest package environment
  - [x] Configure `tsconfig.json`, `vite.config.ts`, `index.html` with clean responsive viewport settings
  - [x] Establish asset generation/loading pipeline in `BootScene`
- [x] **M1.2 Core State & Economy Engine**
  - [x] Implement central balance configuration (`src/config/balance.ts`)
  - [x] Implement robust state manager (`src/state/GameState.ts`) with strict inventory conservation
  - [x] Implement unit tests (`src/tests/economy.test.ts`) verifying zero duplication, non-negative balances, and transactions
- [x] **M1.3 Shop Layout & Station Infrastructure**
  - [x] Create `ShopScene` with shop layout, warm festive floor, counter, and walls
  - [x] Implement `BaseStation` with circular proximity trigger and progress ring rendering
  - [x] Implement `Player` entity with 8-direction keyboard movement and carried stack visualization
- [x] **M1.4 Station Implementations & Loop Integration**
  - [x] Implement `IngredientStation`: display stock, allow 12-coin purchase of bundle, pickup bundle
  - [x] Implement `SteamerStation`: receive bundle, 8s steam timer with visual steam/progress, output cooked batch
  - [x] Implement `PackingStation`: receive cooked batch, 3s pack timer with progress, output 3 modak boxes
  - [x] Implement `CounterStation`: spawn waiting customer requesting 1 box, handover on proximity, credit +10 coins
- [x] **M1.5 HUD & Loop Verification**
  - [x] Implement `UIScene` with coin counter, carried item indicator, and step-by-step objective hint
  - [x] Verify complete buy -> steam -> pack -> sell cycle end-to-end in browser
  - [x] Run automated tests and production build (`npm run build`)
  - [x] Update `PROJECT_STATUS.md` and commit Milestone 1 to Git

---

## Milestone 2: Growth, Staff & Upgrades
- [x] **M2.1 Customer Queue Expansion**
  - [x] Implement multi-customer queuing (up to 4 customers in queue)
  - [x] Introduce customer queue pathing and 2-box orders
- [x] **M2.2 Upgrade Kiosk & Overlay System**
  - [x] Implement `UpgradeStation` with proximity trigger and kiosk visuals
  - [x] Build centered screen-bounded upgrade overlay in `UIScene` rendering above HUD with full input isolation
  - [x] Implement Close button and `Escape` key shortcut, and prevent background movement during modal
  - [x] Add Carrying Capacity upgrade (30 coins -> 2 batches / 6 boxes)
  - [x] Add Second Steamer unlock (90 coins -> unlocks Steamer 2)
  - [x] Strictly preserve 12-coin working-capital reserve on all purchases
  - [x] Ensure all 4 upgrade rows are fully visible and readable without screen clipping
- [x] **M2.3 Staff Automation & Softlock Protections**
  - [x] Implement Packer NPC (45 coins) stationed at packing table (faster auto-packing)
  - [x] Implement Cashier NPC (60 coins) stationed at counter to auto-serve from counter shelf
  - [x] Implement visible locked vs active states for staff and equipment
  - [x] HANDOFF-001: Counter box deposit and pooled order fulfillment to prevent partial order deadlock
  - [x] HANDOFF-002: Ingredient return control at shelf, auto-pickup suppression on return, and blocked collection hint
- [x] **M2.4 Milestone 2 Verification**
  - [x] Verify upgrades charge once, staff automate workflows without duping items, and build succeeds
  - [x] Verify upgraded loop end-to-end in browser (11-step sequence covering return, collection, packing, selling, and counter deposit)
  - [x] Verify centered upgrade overlay in browser: centered, screen-bounded, Escape/Close, input isolation, and all 4 rows visible

---

## Milestone 3: Complete Festive Campaign, Save & Ending
- [ ] **M3.1 Campaign Progression & Objectives**
  - [ ] Implement guided tutorial flow into festival morning rush
  - [ ] Implement Grand Pandal bulk order contract (12 boxes) with dedicated dispatch crate
- [ ] **M3.2 Round Timer & Endings**
  - [ ] Implement round timer (8-10 min) with pause support
  - [ ] Implement Victory Celebration modal with festival fireworks/garlands and score breakdown
  - [ ] Implement Timeout/Results modal with retry action
- [ ] **M3.3 Local Persistence**
  - [ ] Implement `SaveManager` with schema versioning and corruption handling
  - [ ] Provide Continue and New Game options on startup
- [ ] **M3.4 Milestone 3 Verification**
  - [ ] Complete full campaign playthrough, test save/resume, and verify build

---

## Milestone 4: Presentation, Audio & Mobile
- [ ] **M4.1 Visual Polish & Festive Assets**
  - [ ] Add marigold flower garlands, brass lamps, rangoli patterns, and decorative signs
  - [ ] Add particle effects (steam from steamers, coin pops, celebration flower petals)
- [ ] **M4.2 Audio System**
  - [ ] Implement `AudioManager` with Web Audio API sound effects (cooking, packing, coins, festival bells)
  - [ ] Add mute/volume toggle in HUD
- [ ] **M4.3 Mobile Controls & Responsiveness**
  - [ ] Implement touch virtual joystick with smooth drag tracking
  - [ ] Test layout scaling at mobile (390x844) and desktop (1920x1080)
- [ ] **M4.4 Milestone 4 Verification**
  - [ ] Verify touch controls, audio responsiveness, 60 FPS performance, and clean build

---

## Milestone 5: Build & Submission Readiness
- [ ] **M5.1 Final Quality Audit**
  - [ ] Run full test suite and verify production bundle
  - [ ] Ensure zero console errors or memory leaks
- [ ] **M5.2 Documentation & Credits**
  - [ ] Complete `README.md` with setup and gameplay instructions
  - [ ] Complete `ASSET_CREDITS.md` and contest compliance notes
  - [ ] Prepare demo outline and static deployment bundle
