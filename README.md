# Modak Mahal: Festival Rush 🪔

> An overhead 2D festive restaurant management game built for the **Ganesh Chaturthi Game Design Contest**.

**🎮 Play now:** https://darshitn.github.io/modak-mahal-festival-rush/

**📦 Source code:** https://github.com/darshitn/modak-mahal-festival-rush

---

## Game Description

Step into the role of a festival sweet shopkeeper during Ganesh Chaturthi! Starting with a humble Modak Mahal, you buy authentic ingredients (rice flour, jaggery, coconut, cardamom), steam traditional ukadiche modaks in a brass steamer, pack them into festive gift boxes, and serve a queue of eager devotees. As your coin pouch grows, upgrade your carrying capacity, install a second steamer, hire a skilled packer and cashier, and ultimately secure the Grand Pandal supply contract — dispatching 12 boxes to complete the festival celebration before the Mahal closes.

---

## Gameplay Loop

```
Buy Ingredients (₹12)
     ↓
Load the Brass Steamer (8 seconds cooking)
     ↓
Collect Cooked Modaks batch
     ↓
Pack at the Packing Bench (3 boxes per batch)
     ↓
Carry boxes to the Service Counter → Serve Devotees → Earn Coins
     ↓
Upgrade the Mahal (Carry Capacity / Packer / Cashier / Second Steamer)
     ↓
Unlock Grand Pandal Order → Deposit 12 Packed Boxes to Dispatch
     ↓
Victory!
```

---

## Controls

| Action | Desktop | Mobile |
|---|---|---|
| Move | `W A S D` or Arrow Keys | Virtual thumbstick (lower-left) |
| Interact / Buy | Walk into station zone | Walk into station zone |
| Open Upgrades | Walk to desk → `E` | Walk to desk → tap button |
| Return Ingredients | `R` at Supply Shelf | `R` button shown at shelf |
| Pause | `P` or `Escape` | Pause button (top bar) |
| Close Upgrade Modal | `Escape` | `✕ Esc` button |

---

## Customer Patience, Tips & Ratings

- Each devotee displays a **patience bar** (green → amber → red) while waiting.
- **70–100% patience** at service: ★★★★★ Five-star, **+₹3 tip** per box — *"Festival favourite!"*
- **40–69% patience**: ★★★★ Four-star, **+₹1 tip** per box — *"Thank you!"*
- **15–39% patience**: ★★★ Three-star, no tip — *"Service was slow"*
- **1–14% patience**: ★★ Two-star, no tip — *"Long wait!"*
- **0% patience (departed unserved)**: ★ One-star penalty, no payment.
- Impatient customers leave without penalty to coin balance; you lose the tip and the sale opportunity.
- Your **Mahal Rating** (shown in the top HUD) is a rolling business score: starts at ★ 4.0, updated on every completed service.

---

## Business Upgrades

Visit the Upgrade Desk (Manager's Office, top-right) and press `E` to open the upgrade panel.

| # | Upgrade | Cost | Effect |
|---|---|---|---|
| 1 | **Carry Capacity** | ₹30 | Carry 2 bundles/batches or 6 boxes (doubled) |
| 2 | **Hire Packer** | ₹45 | Auto-packs cooked batches at 1.5× speed |
| 3 | **Hire Cashier** | ₹60 | Auto-serves waiting devotees from counter shelf |
| 4 | **Brass Steamer 2** | ₹90 | Parallel cooking — double kitchen throughput |

> **Working-Capital Reserve:** The game prevents any upgrade purchase that would leave you below ₹12 — enough to restock one ingredient bundle.

Own all 4 upgrades to unlock the **Grand Pandal Order**: dispatch 12 packed boxes to complete the festival.

---

## Victory Condition

1. Purchase all 4 upgrades (unlocks the Pandal Dispatch Stand).
2. Carry packed boxes to the Dispatch Stand and deposit until 12 boxes are reached.
3. A 10-second courier dispatch begins — if it completes before the 10-minute festival clock expires, **Victory!**
4. On victory, your Festival Score, rating, boxes sold, tips, completion time, and award title are displayed.

**Award Titles:**
- ★★★★★ 4.6–5.0 — *Festival Favourite*
- ★★★★ 4.0–4.59 — *Beloved Modak Mahal*
- ★★★ 3.0–3.99 — *Successful Festival Service*
- Below 3.0 — *Festival Completed*

---

## After Victory: Continue Growing

Selecting **Continue Growing** after victory removes the campaign timer and lets you keep playing freely. Your competitive score snapshot is frozen at the moment of victory — free play does not alter rankings.

---

## Pause Behavior

- Press `P` or `Escape` (when no modal is open) to toggle the Pause menu.
- **Escape** from the Upgrade Modal closes the modal first — it does not immediately pause.
- Pausing freezes: campaign clock, customer patience, cooking, packing, courier dispatch, and staff automation.

---

## Timeout

If the 10-minute festival clock reaches zero before you dispatch 12 boxes, the festival closes. Your results are still displayed with the pandal progress and a retry option.

---

## Desktop & Mobile Support

- Fully responsive for common desktop (1366×768, 1920×1080) and mobile (390×844, 1024×600) viewport sizes.
- Touch virtual thumbstick activates on mobile for player movement.
- HUD adapts to compact mode on smaller screens.

---

## Local Installation

**Prerequisites:** Node.js v18+ and npm.

```bash
# Clone the repository
git clone https://github.com/darshitn/modak-mahal-festival-rush.git
cd modak-mahal-festival-rush

# Install dependencies
npm ci

# Start local development server (http://localhost:3000/)
npm run dev

# Run automated tests (65 tests across economy, campaign, and customer service)
npm test -- --run

# Build production bundle
npm run build

# Preview the production build locally
npm run preview
```

---

## Technology Stack

| Tool | Version | Role |
|---|---|---|
| [Phaser 3](https://phaser.io/) | ^3.88 | HTML5 game framework |
| [TypeScript](https://www.typescriptlang.org/) | ^5.7 | Language |
| [Vite](https://vitejs.dev/) | ^6.2 | Build tool & dev server |
| [Vitest](https://vitest.dev/) | ^3.0 | Unit test runner |

---

## Asset Credits

See [ASSET_CREDITS.md](./ASSET_CREDITS.md) for full provenance of all artwork, fonts, and generated assets.

**Key assets:**
- Station and character artwork: generated using OpenAI's built-in image-generation tool.
- Background hall illustration: AI-generated, art-directed to match festival aesthetic.
- Typography: [Outfit](https://fonts.google.com/specimen/Outfit) & [Yatra One](https://fonts.google.com/specimen/Yatra+One) (Google Fonts, SIL Open Font License 1.1).
- Game framework: [Phaser 3](https://phaser.io/) (MIT License).

---

## AI-Assisted Development Disclosure

This game was developed with the assistance of AI coding tools (Google Antigravity / Gemini and OpenAI Codex/GPT-4o). All generated code was reviewed, adapted, and integrated by the development team. All generated artwork was art-directed and reviewed for appropriateness and cultural respect.

> **Note:** Whether AI-assisted development is permitted for contest evaluation is a matter for the organizer to confirm. The use of AI tools has not been pre-approved by the organizers on the team's behalf.

---

## Known Limitations

- Local save/resume (on page refresh) is deferred — not implemented in this submission. Each page load starts a fresh game.
- Audio system is not implemented in this version.
- First-floor expansion is locked behind a "later upgrade" visual — the staircase is present but non-functional (intentionally deferred post-contest feature).

---

## Submission Checklist

| Item | Status |
|---|---|
| 🎮 Live playable link | https://darshitn.github.io/modak-mahal-festival-rush/ |
| 📦 Source repository | https://github.com/darshitn/modak-mahal-festival-rush |
| 📖 How to play / README | ✅ This document |
| 🎨 Asset credits | ✅ [ASSET_CREDITS.md](./ASSET_CREDITS.md) |
| 🎬 Demo video (1–3 min) | ⚠️ **[USER ACTION REQUIRED — record and upload demo]** |
| 👥 Team details | ⚠️ **[USER ACTION REQUIRED — fill in registration form]** |
| 🤖 Organizer AI-policy confirmation | ⚠️ **[USER ACTION REQUIRED — confirm with organizer]** |
