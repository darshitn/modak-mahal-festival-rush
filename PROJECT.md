# Modak Mahal: Festival Rush — Project Specification

## Problem
During Ganesh Chaturthi, sweet shops and festival stalls face overwhelming demand for fresh steamed modaks (ukadiche modak) to offer as prasad and serve festive devotees. Players need an engaging, accessible, and culturally resonant time/resource management game that captures the lively atmosphere of a festival stall without overwhelming micro-management or disconnected minigames.

## Target Users
- Students and casual web/mobile players participating in or testing games for the Ganesh Chaturthi Game Design Contest.
- Players of all ages looking for an approachable, tactile overhead "walk-and-work" tycoon/arcade management game (inspired by Pizza Ready) playable across mobile and desktop browsers with zero install.

## Project Goals
1. Deliver a responsive, bug-free, 60 FPS overhead 2D browser game in Phaser 3 + TypeScript + Vite.
2. Respectfully celebrate Ganesh Chaturthi traditions through modak making, festive shop decor, bustling devotee queues, and community pandal orders.
3. Provide an intuitive physical walk-to-interact loop (buy ingredients -> steam -> pack -> serve -> collect coins -> hire staff -> expand capacity).
4. Complete an achievable 8-10 minute festive campaign with clear win condition (completing the Grand Pandal 12-box offering order) and high-score / best-time replayability.

## Core Features
- **Overhead Shop Navigation**: Smooth 8-directional movement (WASD/Arrows on desktop, responsive virtual joystick on mobile touch screens).
- **Physical Station Interaction**: Proximal interaction rings at stations (Ingredient Storage, Steamers, Packing Station, Checkout Counter, Upgrade Desk).
- **Tactile Production Chain**:
  - Buy recipe bundle (Rice Flour, Fresh Coconut, Jaggery, Spices, Boxes).
  - Steam batch in traditional ukadiche steamer (steaming timer with steam particles).
  - Pack into 3 finished festive modak boxes.
  - Deliver to queuing customers or counter display buffer.
- **Physical Stacking & Carrying**: Visible carried goods stacked above the player's head with strict capacity limits.
- **Dynamic Customer Queue**: Devotees enter with order bubbles (1-2 boxes), patience timers, and generous tips for rapid service.
- **Automation & Upgrades**:
  - Staff: Dedicated Modak Packer and Front Counter Cashier.
  - Equipment: Capacity upgrade (double carrying load), Second Steamer.
- **Festive Pandal Delivery**: Mid-to-endgame bulk order for the local Ganesh pandal with celebratory ending.

## MVP (Milestone 1 Deliverable)
- Compact overhead shop with fixed stations and clean collision/walking lanes.
- Controllable shopkeeper (keyboard + touch).
- Working single-recipe loop:
  - Ingredient storage with buy action (12 coins).
  - Steaming station (8s cook time, 1 batch = 3 modaks).
  - Packing station (3s pack time = 3 sellable boxes).
  - Customer counter with customer arrival, order bubble, handover, and coin reward (+10 coins/box).
- Reliable state transitions without inventory leaks, negative stock, or duplicate coin credits.
- Clean responsive HUD (Coins, Carried Items, Objective).

## Advanced Features (Post-MVP / M2–M4)
- Multiple customer types and festival rush surges with traditional dhol-tasha musical cues.
- Second steamer and helper AI (Packer, Cashier).
- Grand Pandal supply contract with dedicated delivery dispatch slot.
- Audio (festive nagada/shehnai, steam whistles, coin clinks, ambient festival bustle).
- Local storage save/resume and personal best speedrun leaderboard.
- Rich canvas particles (flower petals, rangoli sparkles, steam puffs).

## Constraints
- **Contest Deadlines**: Submission deadline 20 September 2026, 5:00 PM IST (Target internal completion: 18-19 September).
- **Platform**: Pure client-side static web build (HTML5 canvas via Phaser 3, Vite, TypeScript). No mandatory backend, no login, no paywalls.
- **Storage**: LocalStorage with schema versioning and corruption fallbacks.
- **Cultural Respect**: Devotional reverence towards Lord Ganesha; respectful aesthetic celebrating festival joy without depiction of deities as damageable or failure states.

## Technical Challenges
1. **Accurate State & Conservation of Mass**: Strict inventory tracking across station inputs, progress states, buffers, carried goods, and customer orders to prevent item duplication or loss.
2. **Responsive Dual-Input Mechanics**: Seamless single-codebase support for keyboard + mouse and touch virtual thumbsticks without screen jitter or scrolling.
3. **Robust Game Loop & Timing**: Managing active production timers even during station detachment, pause/unfocus events, and browser tab backgrounding.
4. **Performance on Low-End Mobile**: Maintaining 60 FPS canvas rendering with Phaser 3 sprites, particle emitters, and UI overlays.

## Chosen Technology Stack
- **Game Engine**: Phaser 3 (Latest stable 3.88+)
- **Language**: TypeScript 5.x (Strict typing for game state and inventory)
- **Bundler & Tooling**: Vite 6.x
- **UI & Graphics**: Phaser GameObjects, Canvas Graphics, custom pixel/vector festive sprite sheets and particles
- **Audio**: Web Audio API (Phaser Sound Manager) with synthesized/licensed festive SFX
- **Testing & Quality**: Vitest for core state/economy unit tests, browser integration checks
