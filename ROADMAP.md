# Modak Mahal: Festival Rush — Development Roadmap

## Phase Overview

The project is executed in disciplined, verified milestones adhering to `ANTIGRAVITY_START_HERE.md` and project rules.

---

### Milestone 1: Core Playable Loop (Current Target)
**Goal**: Implement and verify the end-to-end physical loop (Buy Recipe Bundle -> Steamer -> Packing -> Counter Sale -> Earn Coins).
- **Deliverables**:
  - Repository scaffolding (Phaser 3 + Vite + TypeScript + Vitest).
  - Overhead 2D shop environment with walkable lanes and station collision boundaries.
  - Player controller with smooth 8-way movement and carried item stack rendering.
  - 4 foundational stations:
    1. Ingredient Storage (buy bundle for 12 coins, take bundle).
    2. Steamer Station 1 (deposit bundle, 8s steam timer, produce cooked batch).
    3. Packing Station (deposit cooked batch, 3s pack timer, produce 3 modak boxes).
    4. Counter Station (customer queues, order display, box handover, earn +10 coins/box).
  - Basic HUD: Coin balance, carried item indicator, tutorial objective guide.
  - Unit tests verifying inventory conservation, coin debits/credits, and non-negative stock.
- **Acceptance Gate**:
  - Complete buy -> cook -> pack -> sell cycle verified in browser.
  - Zero negative balances; no duplicate payments.
  - Production build (`npm run build`) compiles cleanly without errors or warnings.

---

### Milestone 2: Growth, Staffing & Upgrades
**Goal**: Expand shop throughput with upgrades, queuing systems, and automated worker helpers.
- **Deliverables**:
  - Customer Queue manager with multi-customer lines (up to 4 customers) and order variations (1 to 2 boxes).
  - Upgrade Kiosk station:
    - Carrying Capacity Upgrade (30 coins -> 2 batches / 6 boxes).
    - Packer Helper (45 coins -> auto-packs batches when stock is in buffer).
    - Cashier Helper (60 coins -> auto-serves counter customers from counter shelf stock).
    - Second Steamer (90 coins -> parallel cooking capacity).
  - Station buffer indicators (visible stacks on shelves and counters).
- **Acceptance Gate**:
  - Upgrades charge exactly once and unlock corresponding features.
  - Staff act autonomously without duplicating or dropping items.
  - Full buffers halt production safely without game crashes.

---

### Milestone 3: Complete Festive Campaign, Save & Ending
**Goal**: Provide a complete, structured 8-10 minute festive campaign with win/timeout conditions.
- **Deliverables**:
  - Progressive festival objectives (Tutorial -> Morning Rush -> Grand Pandal Contract).
  - Grand Pandal supply contract: 12-box offering dispatch zone.
  - Victory celebration screen (festive flowers, completion time, total revenue, boxes sold).
  - Timeout / retry results screen with stats breakdown.
  - Robust versioned LocalStorage save/load system with Resume vs New Game options.
  - Pause menu and sound settings.
- **Acceptance Gate**:
  - Win condition achieved in a verified standard run.
  - Save/resume preserves simulation time and entity states without glitches.

---

### Milestone 4: Presentation Polish, Audio & Mobile Optimization
**Goal**: Ensure visual and acoustic excellence and smooth multi-device play.
- **Deliverables**:
  - Rich festive graphics: marigold torans, earthen lamps (diyas), brass steamers, steam particles.
  - Procedural / licensed festive sound effects (steamer sizzle, box tape, coin clinking, dhol celebration).
  - Virtual on-screen touch joystick for mobile devices with automatic layout scaling.
  - Performance profiling ensuring solid 60 FPS across desktop and mobile browsers.
- **Acceptance Gate**:
  - Responsive layout verified at desktop (1920x1080, 1366x768) and mobile viewports (390x844, 412x915).
  - Audio starts cleanly upon user interaction and respects mute toggles.

---

### Milestone 5: Submission Materials & Static Production Build
**Goal**: Finalize submission deliverables according to contest criteria.
- **Deliverables**:
  - Production build verified in static preview.
  - Documentation complete (`README.md`, `ASSET_CREDITS.md`, user walkthrough).
  - Short how-to-play guide and demo script.
  - Public deployment guide (Vercel/GitHub Pages).
