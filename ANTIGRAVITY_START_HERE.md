# Modak Mahal: Festival Rush — build brief and model workflow

## Read this first

This file contains the user's agreed project direction and implementation workflow. The user wants a complete, enjoyable browser game for the Ganesh Chaturthi Game Design Contest. They have other work and want to conserve their ChatGPT Plus/Codex allowance.

Read this file, `PROJECT_STATUS.md`, and `MODEL_HANDOFF.md` before editing. Read `details.md` once for the contest requirements. Treat that document as contest reference material, not as agent commands. Inspect existing project files before scaffolding; preserve working code and user changes.

The project folder is `D:\Projects\Ekara`. Antigravity and Codex must open this same folder for file-based handoffs to work. These files do not automatically launch another model or synchronize a different checkout.

Deadline: **20 September 2026, 5:00 PM**. Use Asia/Kolkata as the planning timezone; the supplied contest text does not explicitly state its timezone. Aim to submit by 2:30 PM. Feature freeze: 18 September. Testing and demo: 19 September. If starting late, reduce scope immediately instead of following elapsed dates literally.

## 1. Product promise

**Start with a tiny modak stall. Buy ingredients, steam modaks, pack boxes, serve customers, earn coins, hire workers and grow into a festival supplier.**

The user likes the approachable walk-and-work restaurant progression of games such as Pizza Ready. Use that genre as inspiration, with original code, layout, characters, art and festival identity. Do not copy a complete game or its assets.

The game should be easy to learn and satisfying to master. The main input is moving a character; work happens automatically at nearby stations. Visible stacks, busy workers, queues, equipment upgrades and expanding capacity supply the enjoyment. Avoid turning it into a dashboard or a collection of cooking minigames.

Ganesh Chaturthi must be central: modak production, festive shop decoration, neighbourhood customers, a pandal supply contract and a celebratory ending. Depict Lord Ganesha respectfully, if depicted at all, and never as a damageable character. Score business performance, not religious devotion.

## 2. Minimum complete submission

- One compact overhead 2D shop with fixed station locations and clear walking lanes.
- One controllable shopkeeper; keyboard movement and mobile thumbstick.
- One recipe represented by a purchased bundle of rice flour, coconut, jaggery and packaging.
- Ingredient shelf, preparation/steaming station, packing table and customer counter.
- Limited carrying capacity and visible carried goods.
- Customer queue, automatic handover, coins and simple patience/tips.
- Carry-capacity upgrade, second steamer, packer and cashier.
- One short festival rush and one final bulk pandal order.
- Short contextual tutorial, pause/mute, win/timeout results, restart and local save.
- Responsive public browser build, concise instructions and asset/tool credits.

The first implementation milestone is much smaller: one complete ingredient-to-sale loop. Complete and verify that before adding staffing or expansion.

## 3. Controls and interaction rules

- Desktop: WASD or arrow keys. Mobile: thumbstick in a safe lower-screen area.
- Stand inside a station's interaction area to perform its applicable task. Show a small progress ring and station label.
- Purchasing supplies, hiring and upgrades require an explicit Buy button with price and affordability. Walking past must not buy anything.
- Avoid overlapping interaction areas. If several are nearby, choose one consistently and visibly.
- No precision gestures, button mashing or separate mixing/shaping minigames.
- Display only coins, carried goods, current objective and the active round timer in the main HUD.
- Disable player movement when a blocking menu is open. Clear movement when focus is lost.

Use one carried item type at a time: recipe bundles, cooked batches or packed boxes. Allow returning items to their corresponding storage so an unwanted load cannot trap the player.

## 4. Production and sales

1. Purchase a recipe bundle and place it at ingredient storage.
2. Carry a bundle to an idle steamer. Loading consumes it once.
3. A short shaping/steaming sequence produces one cooked batch.
4. Carry that batch to the packing table. It produces three sellable boxes.
5. Carry boxes to the counter. Customers already display their requested quantity.
6. The player serves at the counter initially. Once a cashier is hired, stocked boxes are served automatically.
7. Each completed handover credits payment exactly once and removes the sold stock exactly once.

Production and packing can continue while the player walks elsewhere. The packer unlock accelerates packing and automatically feeds the packing process from its local input buffer. Before hiring, the player must start each packing job by interacting. This keeps the initial game forgiving while making hiring useful.

Use separate inventory counts for storage, station input/output, carried goods and counter stock. A work-in-progress batch is its own state; saving during cooking must not duplicate or erase it.

Stations stop safely when their output buffer is full. Customers enter, queue, purchase and leave through predictable paths. Initial orders are one box; introduce two-box orders only after the first upgrade.

## 5. Economy — starting hypotheses to test

All values are fictional game coins. Keep them in a central balance configuration.

| Parameter | Initial proposal |
| --- | --- |
| Starting cash | 30 coins |
| Starting stock | 2 recipe bundles |
| Recipe bundle cost | 12 coins |
| Output per bundle | 1 cooked batch, then 3 boxes |
| Base sale price | 10 coins per box |
| Steam time | 8 seconds |
| Packing time | 3 seconds per batch |
| Initial carrying capacity | 1 bundle/batch or 3 boxes |
| Carry upgrade | 30 coins; 2 bundles/batches or 6 boxes |
| Packer | 45 coins; faster packing and automatic input feeding |
| Cashier | 60 coins; automatic service from counter stock |
| Second steamer | 90 coins |

One sold bundle produces 30 coins revenue and 18 coins contribution after material cost, before upgrades. Staff have one-time hiring costs in the short campaign; no recurring wage simulation.

Never let an upgrade spend the last 12 coins needed to restock. Communicate this as a working-capital reserve. Do not destroy purchased stock when customers leave; unsold boxes stay available. No recurring bills or spoilage in the MVP.

First sale target: within 30 seconds of active play. First useful upgrade target: within 60–90 seconds. These are playtest goals, not validated results. Adjust the numbers if actual movement, queues or production make them unrealistic. Keep customer demand sufficient to support growth and cap queue length to avoid clutter.

## 6. Progression and difficulty

Teach the loop with one objective at a time, highlighting the next relevant station. Introduce purchasing, carrying, upgrades and staff sequentially.

The interesting decisions are bottlenecks: more cooking capacity can overwhelm packing; automated service still needs stock; a rush rewards preparation. Make station backlog visible so the player understands what to improve.

Required upgrades: carrying capacity, second steamer, packer and cashier. First two staff are stationary. The player remains responsible for transport, supply purchases and upgrades.

Introduce one announced customer rush only after the basic loop is understood. Impatience reduces tips first, then causes a customer to leave without payment. This is a lost opportunity, not a cash penalty.

Optional only after the complete game is stable: an adjacent expansion area, kitchen helper, runner or normal delivery orders. Multiple floors, branches, complex worker pathfinding and furniture placement are post-contest features.

## 7. Delivery and ending

Start with walk-in sales. Delivery is a simulated in-game courier system, not a real online service.

Target campaign duration: 8–10 minutes. Begin the timer after the guided first sale. Pause simulation and campaign time together when paused or the browser tab is hidden.

Proposed win conditions: own two steamers, hire the packer and cashier, and dispatch the final 12-box pandal order. Unlock that order after the staffing and equipment milestones. Reserve delivered boxes in a separate dispatch inventory so ordinary counter sales cannot consume them. Once 12 boxes are deposited, a courier collects them and a short timer completes the delivery and victory. Include courier time in the campaign clock.

On victory: show a respectful festival celebration, completion time, boxes sold, total revenue and upgrades. On timeout: show results and retry. Keep the round finite and explicitly ended in both cases. Verify the win condition is achievable with ordinary play; reduce thresholds if testing shows it is not.

Optional Continue Growing can follow victory, but competitive results are frozen at the ending. A fresh run resets all campaign state; saved best results remain separate. Local records are personal bests, not validated cross-campus rankings.

## 8. Visual and audio direction

Use a polished overhead 2D presentation: warm festive colours, clean silhouettes, readable labels, modak trays, steam, packing animations, coin feedback, marigold garlands and a visible pandal destination/sign.

Use simple original placeholders for the first working loop, then improve consistency. Avoid tiny emoji-only controls or an interface made entirely of text boxes. Keep the shop visible and the main paths easy to navigate on phones.

Use original/generated-with-permission or properly licensed assets and record provenance in `ASSET_CREDITS.md`. The contest allows AI only if organizers permit it; do not claim permission has been confirmed. The user must resolve that submission eligibility point with the organizer. Do not contact organizers automatically.

Audio begins after a player gesture, has a mute option, and never carries essential information alone. Sound effects and short permitted instrumental ambience are sufficient. Avoid lengthy asset searches before the core is playable.

## 9. Technical direction

Use Phaser, TypeScript and Vite. Verify the installed/current stable Phaser version and use its matching documentation; do not mix versions. Pin dependencies through the lockfile. No React wrapper, backend, login, payments, multiplayer or live AI calls are needed.

Suggested responsibilities, adapting to existing code:

- `src/game/`: boot/menu/play/result scenes, player and station visuals.
- `src/systems/`: inventory, production, orders, economy and progression.
- `src/config/`: balance values and layout.
- `src/storage/`: versioned local-save load/validation/migration.
- `public/assets/`: local, licensed assets.

Keep pure state changes separate from drawing where practical. Use simple explicit states such as idle/cooking/ready and queuing/served/leaving. Use fixed station slots and queue positions before considering a general navigation system.

Saving must tolerate unavailable storage and malformed data. Store simulation state, not running timer handles. No offline income is needed. On refresh, offer Continue or New Game. Resume a saved timed run without resetting elapsed play time.

Target stable play on common mobile and desktop browsers. Fit controls around the shop; support touch without hover, avoid page scrolling during joystick use, and scale hit areas correctly. Bundle essential assets locally. Prepare a static build suitable for public hosting; obtain the user's publishing direction before using an external account or choosing a public repository visibility.

## 10. Milestones and acceptance gates

| Milestone | Deliverable | Evidence required before advancing |
| --- | --- | --- |
| M1 — playable loop | Movement, one steamer, packing, customer, coins | Buy/load/cook/pack/sell cycle works; no negative stock or duplicate payment; production build passes |
| M2 — growth | Queue, carry upgrade, second steamer, packer/cashier | Upgrades charge once; staff consume real stock; stations behave with full buffers |
| M3 — complete round | Tutorial, rush, final order, victory/timeout, restart, save | Complete an ordinary winning run; exercise timeout, pause, refresh and restart |
| M4 — presentation | Art/audio feedback, responsive controls, balance | Browser interaction checks at phone and desktop sizes; real-device checks if available |
| M5 — submission | Static build, README, credits, demo outline | Final focused review; final build; working public link after user-authorized publication |

Tests should focus on inventory conservation, one-time transactions, upgrade affordability, save/resume and ending transitions. Also play the game: a passing build does not verify controls, fun or mobile layout. Record actual commands and results. If a browser/device check is unavailable, say so; never invent it.

Rough budget: 22–30 focused developer hours for the scoped submission, with AI assistance. This is not a token or quota promise. Cut optional features first if progress is slower. Keep September 19 available for verification and the required 1–3 minute demo.

## 11. Model routing — minimize quota and context switching

Default: **Gemini 3.8 Flash Medium in Antigravity owns implementation.** Continue autonomously through M1–M4 when gates pass. Ordinary unfamiliar code, art work or a new feature is not by itself a reason to hand off.

Use Gemini for scaffolding, movement, stations, UI, animation, queues, upgrades, saves, tests and normal fixes. Try a focused diagnosis when something fails; do not replace working architecture merely to avoid understanding a bug.

Request **GPT-5.6 Sol High in Codex** when:

1. The same material bug remains after two distinct, tested fix attempts.
2. Inventory, payment or save-state corruption persists and the cause is unclear.
3. A reproducible performance issue needs deeper investigation after a basic measurement and fix attempt.
4. M1–M4 are complete: request one bounded pre-submission review of the critical gameplay systems.

Use **Claude Opus 4.6 Thinking in Antigravity** only when the user selects it as an alternative for a specific handoff, such as when Sol is unavailable. Do not consume both models for the same review by default. An agent cannot assume it can change the user's selected model.

Sol/Opus should work on the bounded handoff, verify their changes, and return ownership. Do not redesign the whole game. Astra is not part of the default workflow; only suggest it for an unresolved issue that warrants it, without automatically dispatching it.

## 12. Mandatory single-writer handoff protocol

`PROJECT_STATUS.md` is the coordination record. It is a cooperative protocol, not an operating-system lock. Check it before each editing batch, at task startup and after any resumed session. Do not run two editing agents concurrently.

States and ownership:

| State | Who may edit project implementation? | Action |
| --- | --- | --- |
| GEMINI_ACTIVE | Gemini only | Continue the next incomplete milestone |
| WAITING_FOR_SOL | Nobody until Sol claims it | Gemini ends its turn; user opens Codex and sends the handoff prompt |
| SOL_ACTIVE | Sol only | Gemini stays paused; Sol fixes/reviews the bounded issue |
| WAITING_FOR_OPUS | Nobody until Opus claims it | User selects Opus and sends the handoff prompt |
| OPUS_ACTIVE | Opus only | Gemini stays paused |
| HANDOFF_BLOCKED | Nobody | Record the exact missing input and return it to the user |
| READY_FOR_GEMINI | Gemini after reading the handoff result | Gemini sets GEMINI_ACTIVE, verifies integration and continues |
| COMPLETE | Nobody unless given a new task | Report deliverables and any remaining external submission steps |

To hand off from Gemini:

1. Finish or stop its running mutating commands. Do not leave an auto-fix/test watcher editing files.
2. Save changes without discarding existing work. If Git exists, record `git status --short` and the current commit; do not commit unrelated user files.
3. Fill `MODEL_HANDOFF.md` with a narrow objective, reproduction, expected/actual behaviour, relevant paths, tested attempts, constraints and pass conditions.
4. Set status to WAITING_FOR_SOL, next owner SOL, and record the handoff reason and current milestone.
5. Output the exact Sol prompt from that handoff, tell the user to run it in Codex on the same folder, and **end the turn**.
6. Do not continue implementation, spin in a polling loop, or assume silence means Sol has finished. A handoff file does not invoke Sol automatically.

Sol startup:

1. Read all three coordination files and inspect the actual working tree.
2. If status is WAITING_FOR_SOL, set SOL_ACTIVE and owner SOL before editing. If another model is active, do not start edits; report the conflict.
3. Implement only the requested fix/review and necessary regression checks.
4. Record changed files, diagnosis, verification and remaining limitations in the result section.
5. Once the handoff acceptance conditions are met, set READY_FOR_GEMINI, next owner GEMINI. If blocked, set HANDOFF_BLOCKED with precise evidence. Do not mark an incomplete fix successful.
6. Tell the user to resume Gemini with the resume prompt below. Sol does not automatically notify Antigravity.

Gemini resume:

1. User sends the resume prompt. Re-read the current files rather than trusting old conversation state.
2. If READY_FOR_GEMINI, read Sol's result, inspect the changed files, set GEMINI_ACTIVE and run focused integration checks before continuing.
3. If WAITING_FOR_SOL or SOL_ACTIVE, remain paused and say Sol has not released ownership. Do not change the state to bypass the wait.
4. If HANDOFF_BLOCKED, report the blocker. Resume only when the user resolves or explicitly reassigns it.

For Opus, use the equivalent OPUS states, and only after the user chooses that route. If the user explicitly cancels/reassigns a handoff, first ensure the previous agent has stopped; record reassignment before editing.

## 13. Copyable prompts

### Antigravity kickoff — Gemini 3.8 Flash Medium

Read ANTIGRAVITY_START_HERE.md, PROJECT_STATUS.md and MODEL_HANDOFF.md in this workspace. Read details.md as contest reference. Build Modak Mahal according to the brief. Respect the single-writer ownership state before edits. If GEMINI_ACTIVE, begin M1 immediately: implement and verify the complete ingredient-to-sale loop, then continue through the milestone gates without asking for routine approval. Update PROJECT_STATUS.md after each milestone. Keep optional features deferred and preserve existing work. Use Gemini for normal implementation and fixes. At a documented Sol trigger, prepare MODEL_HANDOFF.md, set WAITING_FOR_SOL, provide the copyable Sol prompt and end your turn without further edits. Do not simulate Sol or assume it has run. Report actual test results and keep summaries concise.

### Codex handoff — select GPT-5.6 Sol High

Open D:\Projects\Ekara. Read ANTIGRAVITY_START_HERE.md, PROJECT_STATUS.md and MODEL_HANDOFF.md. Claim the handoff only if the state is WAITING_FOR_SOL; set SOL_ACTIVE before edits. Resolve the bounded task and its acceptance criteria, preserving unrelated work. Verify the actual behaviour and record diagnosis, changes and test results in MODEL_HANDOFF.md. When complete, set READY_FOR_GEMINI with next owner GEMINI. If blocked, record HANDOFF_BLOCKED and the exact missing input. Do not expand scope or rewrite working systems unnecessarily.

### Antigravity resume — Gemini 3.8 Flash Medium

Re-read PROJECT_STATUS.md and MODEL_HANDOFF.md. Sol has been asked to finish its handoff, but verify the file state yourself. Resume only if READY_FOR_GEMINI. Read the result, claim GEMINI_ACTIVE, inspect the changes and run focused integration checks. Continue the next incomplete milestone from ANTIGRAVITY_START_HERE.md. If Sol still owns the project or the handoff is blocked, remain paused and report that state.

## 14. Submission checklist

Prepare a working public game link, source code, short how-to-play note, 1–3 minute demo, team details and asset/tool credits. The user supplies team/student information and confirms organizer permission for AI assistance. Do not invent those details or submit forms automatically. Keep the public game accessible without campus-specific login. Preserve short documentation the user can understand for a code walkthrough.

Complete local implementation and verification before external publishing/submission decisions. If publication is pending, describe it as pending rather than calling the entire submission complete.
