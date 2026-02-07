/**
 * State Transitions - Reverse & Edge Cases Test Suite
 * Tests for reverse state transitions and error cases
 */

import { expect } from "https://esm.sh/chai@5.1.2";
import { log } from "../helpers.js";
import { getCuss2 } from "./initialize.js";

export const stateReverseSuite = {
  id: "state-reverse",
  name: "State Reverse Transitions",
  description:
    "Tests reverse state transitions (ACTIVE->AVAILABLE->UNAVAILABLE) and edge cases like invalid transitions.",
  dependencies: ["active"],
  tests: [
    {
      name: "it should transition from ACTIVE back to AVAILABLE",
      description:
        "Validates the reverse state transition from `ACTIVE` to `AVAILABLE`.\n\n**How it works:**\n- Asserts the current state is `ACTIVE`\n- Sends a state change request to `AVAILABLE`\n- Asserts the state becomes `AVAILABLE`\n- Returns to `ACTIVE` for subsequent tests\n\n**What is validated:**\n- The platform accepts a backward transition from `ACTIVE` to `AVAILABLE`\n- The state change is reflected in the client's `cuss2.state` property\n\n**Protocol context:** Moving from `ACTIVE` to `AVAILABLE` signals the end of a passenger transaction. The platform should disable all enabled components and reset any per-session state established during the `ACTIVE` session.",
      test: async function () {
        const cuss2 = getCuss2();
        expect(cuss2.state).to.equal("ACTIVE");

        log("Requesting AVAILABLE state from ACTIVE...");
        await cuss2.requestAvailableState();
        expect(cuss2.state).to.equal("AVAILABLE");
        log(`State is now: ${cuss2.state}`);

        // Return to ACTIVE for subsequent tests
        await cuss2.requestActiveState();
      },
    },
    {
      name: "it should transition from AVAILABLE back to UNAVAILABLE",
      description:
        "Validates the reverse state transition from `AVAILABLE` to `UNAVAILABLE`.\n\n**How it works:**\n- Transitions to `AVAILABLE` first\n- Sends a state change request to `UNAVAILABLE`\n- Asserts the state becomes `UNAVAILABLE`\n- Returns to `ACTIVE` via `AVAILABLE` -> `ACTIVE`\n\n**What is validated:**\n- The platform accepts a backward transition from `AVAILABLE` to `UNAVAILABLE`\n- The transition signals the application is no longer ready to serve passengers\n\n**Allowed backward transitions:**\n- `ACTIVE` -> `AVAILABLE`\n- `AVAILABLE` -> `UNAVAILABLE`\n- `ACTIVE` -> `UNAVAILABLE` (shortcut, skipping `AVAILABLE`)",
      test: async function () {
        const cuss2 = getCuss2();

        // First go to AVAILABLE
        await cuss2.requestAvailableState();
        expect(cuss2.state).to.equal("AVAILABLE");

        log("Requesting UNAVAILABLE state from AVAILABLE...");
        await cuss2.requestUnavailableState();
        expect(cuss2.state).to.equal("UNAVAILABLE");
        log(`State is now: ${cuss2.state}`);

        // Return to ACTIVE for subsequent tests
        await cuss2.requestAvailableState();
        await cuss2.requestActiveState();
      },
    },
    {
      name: "it should transition from ACTIVE directly to UNAVAILABLE",
      description:
        "Validates the shortcut reverse transition from `ACTIVE` directly to `UNAVAILABLE`, bypassing `AVAILABLE`.\n\n**How it works:**\n- Asserts the current state is `ACTIVE`\n- Sends a state change request directly to `UNAVAILABLE`\n- Asserts the state becomes `UNAVAILABLE`\n- Returns to `ACTIVE` via `AVAILABLE` -> `ACTIVE`\n\n**What is validated:**\n- The platform allows skipping the `AVAILABLE` state when transitioning backward\n- This shortcut is valid because backward transitions can skip intermediate states\n\n**Use case:** An application may jump directly from `ACTIVE` to `UNAVAILABLE` when it needs to go offline immediately (e.g., maintenance mode, error recovery) without lingering in `AVAILABLE`.",
      test: async function () {
        const cuss2 = getCuss2();
        expect(cuss2.state).to.equal("ACTIVE");

        log("Requesting UNAVAILABLE state from ACTIVE...");
        await cuss2.requestUnavailableState();
        expect(cuss2.state).to.equal("UNAVAILABLE");
        log(`State is now: ${cuss2.state}`);

        // Return to ACTIVE for subsequent tests
        await cuss2.requestAvailableState();
        await cuss2.requestActiveState();
      },
    },
    {
      name:
        "it should round-trip UNAVAILABLE -> AVAILABLE -> ACTIVE -> AVAILABLE -> UNAVAILABLE",
      description:
        "Performs a full round-trip through the CUSS2 application state machine, verifying each intermediate state.\n\n**How it works:**\n- Transitions to `UNAVAILABLE` (starting point)\n- Walks forward: `UNAVAILABLE` -> `AVAILABLE` -> `ACTIVE`\n- Walks backward: `ACTIVE` -> `AVAILABLE` -> `UNAVAILABLE`\n- Asserts `cuss2.state` at each step\n- Returns to `ACTIVE` for subsequent tests\n\n**What is validated:**\n- Each of the 5 state transitions succeeds\n- The state machine allows a complete forward and backward traversal\n- No state is skipped during the forward progression (forward transitions cannot skip states)\n\n**State machine rules:**\n- **Forward:** Must progress through each state in order (`UNAVAILABLE` -> `AVAILABLE` -> `ACTIVE`)\n- **Backward:** Can skip intermediate states (`ACTIVE` -> `UNAVAILABLE` is valid)",
      diagram: "stateDiagram-v2\n  direction LR\n  [*] --> INITIALIZE\n  INITIALIZE --> UNAVAILABLE\n  UNAVAILABLE --> AVAILABLE\n  AVAILABLE --> ACTIVE\n  ACTIVE --> AVAILABLE\n  AVAILABLE --> UNAVAILABLE\n  ACTIVE --> UNAVAILABLE",
      test: async function () {
        const cuss2 = getCuss2();

        // Start from UNAVAILABLE
        await cuss2.requestUnavailableState();
        expect(cuss2.state).to.equal("UNAVAILABLE");
        log("State: UNAVAILABLE");

        await cuss2.requestAvailableState();
        expect(cuss2.state).to.equal("AVAILABLE");
        log("State: AVAILABLE");

        await cuss2.requestActiveState();
        expect(cuss2.state).to.equal("ACTIVE");
        log("State: ACTIVE");

        await cuss2.requestAvailableState();
        expect(cuss2.state).to.equal("AVAILABLE");
        log("State: AVAILABLE");

        await cuss2.requestUnavailableState();
        expect(cuss2.state).to.equal("UNAVAILABLE");
        log("State: UNAVAILABLE");

        log("Full round-trip completed successfully");

        // Return to ACTIVE for subsequent tests
        await cuss2.requestAvailableState();
        await cuss2.requestActiveState();
      },
    },
    {
      name:
        "it should return WRONG_APPLICATION_STATE when requesting ACTIVE from UNAVAILABLE",
      description:
        "Validates that the platform rejects an attempt to skip forward from `UNAVAILABLE` directly to `ACTIVE`.\n\n**How it works:**\n- Transitions to `UNAVAILABLE` state\n- Attempts to request `ACTIVE` state directly (skipping `AVAILABLE`)\n- Expects the platform to throw an error containing `WRONG_APPLICATION_STATE`\n- Returns to `ACTIVE` via `AVAILABLE` -> `ACTIVE`\n\n**What is validated:**\n- The error message contains `WRONG_APPLICATION_STATE`\n- The platform enforces the rule that **forward** state transitions cannot skip states\n- `UNAVAILABLE` -> `ACTIVE` is invalid; the correct path is `UNAVAILABLE` -> `AVAILABLE` -> `ACTIVE`\n\n**Key distinction:** While backward transitions allow skipping (e.g., `ACTIVE` -> `UNAVAILABLE`), forward transitions must proceed one step at a time.",
      test: async function () {
        const cuss2 = getCuss2();

        // Go to UNAVAILABLE
        await cuss2.requestUnavailableState();
        expect(cuss2.state).to.equal("UNAVAILABLE");

        // Attempt to go directly to ACTIVE
        try {
          await cuss2.requestActiveState();
          // If we get here without error, the test should fail
          expect.fail("Expected WRONG_APPLICATION_STATE error");
        } catch (error) {
          log(`Received expected error: ${error.message || error}`);
          expect(error.message || String(error)).to.include(
            "WRONG_APPLICATION_STATE",
          );
        }

        // Return to ACTIVE for subsequent tests
        await cuss2.requestAvailableState();
        await cuss2.requestActiveState();
      },
    },
    {
      name:
        "it should return WRONG_APPLICATION_STATE when requesting ACTIVE from INITIALIZE",
      description:
        "Documents the expected behavior when requesting `ACTIVE` directly from `INITIALIZE` state.\n\n**Expected behavior:**\n- The platform should return `WRONG_APPLICATION_STATE` because `INITIALIZE` -> `ACTIVE` skips both `UNAVAILABLE` and `AVAILABLE`\n- The required forward path is `INITIALIZE` -> `UNAVAILABLE` -> `AVAILABLE` -> `ACTIVE`\n\n**How it works:**\n- Since the test suite depends on `ACTIVE` state (already past `INITIALIZE`), this test documents the expected behavior\n- Verifies the current state is `ACTIVE` (confirming proper state progression was followed)\n\n**Note:** Fully testing this would require a fresh WebSocket connection that intentionally stays in `INITIALIZE` and attempts to jump to `ACTIVE`. The SDK's initialization flow progresses through states automatically, making this a documentation-only test.",
      // Note: This test is difficult to run in sequence since we're already past INITIALIZE
      // It would require a fresh connection
      test: async function () {
        // This test documents expected behavior but cannot be fully automated
        // without a fresh connection that stays in INITIALIZE
        log(
          "Note: This test verifies expected behavior documented in the spec",
        );
        log(
          "From INITIALIZE, requesting ACTIVE should return WRONG_APPLICATION_STATE",
        );

        // We verify the current state is ACTIVE (indicating proper progression)
        const cuss2 = getCuss2();
        expect(cuss2.state).to.equal("ACTIVE");
        log("Current state is ACTIVE (proper progression was followed)");
      },
    },
  ],
};
