# Modak Mahal: Festival Rush — AI Agent Instructions

## Primary Objective
Develop and maintain "Modak Mahal: Festival Rush", an overhead 2D festival tycoon management game created for the Ganesh Chaturthi Game Design Contest.

## Mandatory Coordination & Single-Writer Protocol
1. **Never edit code unless the ownership state in `PROJECT_STATUS.md` is `GEMINI_ACTIVE` or assigned to your model.**
2. **Never simulate another model or claim another model's actions.**
3. If an escalation trigger occurs (persistent bug after 2 distinct attempts, state corruption, or post-M4 review):
   - Fill `MODEL_HANDOFF.md`.
   - Update `PROJECT_STATUS.md` to `WAITING_FOR_SOL`.
   - Provide the exact prompt for Codex with GPT-5.6 Sol High.
   - End turn immediately without further code changes.
4. When resuming after handoff:
   - Check `PROJECT_STATUS.md` is `READY_FOR_GEMINI`.
   - Read the diagnosis and changes from `MODEL_HANDOFF.md`.
   - Switch state to `GEMINI_ACTIVE`.
   - Verify integration and continue.

## Code Standards
- **Engine**: Phaser 3 (Canvas / WebGL).
- **Language**: TypeScript with strict mode enabled.
- **State Management**: Decouple numerical inventory and economy math from visual GameObjects.
- **Inventory Invariants**:
  - Total items must be strictly conserved.
  - Transactions must be atomic (debit cash -> credit item; debit item -> credit cash).
  - No negative quantities under any circumstance.
  - Carried stack must observe carrying capacity.
- **Testing**:
  - Keep unit tests running under `npm test` (Vitest) for all state and economy changes.
  - Always verify `npm run build` passes before checking off milestone tasks.
- **Aesthetic Excellence**:
  - Vibrant festive palette (warm saffron, marigold yellow, vermilion, polished brass, clay).
  - Clear visual feedback: progress rings, floating coins, steam puffs, character bounce.
  - Intuitive controls on both desktop keyboard and mobile touch.
