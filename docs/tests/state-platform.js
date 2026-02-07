/**
 * State Transitions - Platform-Controlled States Test Suite
 * Tests for platform-triggered state changes (SUSPENDED, DISABLED, RELOAD)
 */

import { expect } from "https://esm.sh/chai@5.1.2";
import { log, promptUser } from "../helpers.js";
import { getCuss2 } from "./initialize.js";

export const statePlatformSuite = {
  id: "state-platform",
  name: "Platform-Controlled States",
  description:
    "Tests for platform-triggered state changes including SUSPENDED, DISABLED, and RELOAD states. These require platform-side triggers or simulated conditions.",
  dependencies: ["active"],
  tests: [
    {
      name: "it should receive SUSPENDED state when platform suspends the app",
      description:
        "Validates that the application receives a `SUSPENDED` state notification when the platform triggers a suspend.\n\n**How it works:**\n- Records the current application state\n- Prompts the operator to trigger a `SUSPEND` from the platform management interface\n- Listens for the `stateChange` event on the CUSS2 client\n- Resolves when the state becomes `SUSPENDED`\n\n**What is validated:**\n- `cuss2.state` equals `SUSPENDED` after the platform trigger\n\n**What triggers `SUSPENDED`:**\n- The platform suspends the application (e.g., another application takes priority, operator intervention, system maintenance)\n- This is a **platform-controlled** state -- the application cannot request it\n\n**Behavior while `SUSPENDED`:**\n- All component directives (`PERIPHERALS_ENABLE`, `PERIPHERALS_SEND`, etc.) should be rejected with `WRONG_APPLICATION_STATE`\n- The application should pause its UI and wait for resumption",
      test: async function () {
        const cuss2 = getCuss2();
        const previousState = cuss2.state;

        await promptUser(
          "Trigger SUSPEND from the platform",
          () =>
            new Promise((resolve) => {
              if (cuss2.state === "SUSPENDED") {
                resolve();
                return;
              }
              const handler = (newState) => {
                if (newState === "SUSPENDED") {
                  cuss2.off("stateChange", handler);
                  resolve();
                }
              };
              cuss2.on("stateChange", handler);
            }),
          { icon: "pause-circle" },
        );

        expect(cuss2.state).to.equal("SUSPENDED");
        log(`Application is now SUSPENDED (was: ${previousState})`);
      },
    },
    {
      name: "it should reject component operations in SUSPENDED state",
      description:
        "Validates that the platform rejects component directives while the application is in `SUSPENDED` state.\n\n**How it works:**\n- Checks if the application is currently in `SUSPENDED` state (skips if not)\n- Attempts to call `PERIPHERALS_ENABLE` on the first available component\n- Expects the platform to throw an error containing `WRONG_APPLICATION_STATE`\n\n**What is validated:**\n- The error message includes `WRONG_APPLICATION_STATE`\n- The platform enforces the restriction that no component operations are permitted in `SUSPENDED` state\n\n**Blocked operations in `SUSPENDED`:**\n- `PERIPHERALS_ENABLE` / `PERIPHERALS_DISABLE`\n- `PERIPHERALS_SEND`\n- `PERIPHERALS_SETUP`\n- Application-initiated state transitions\n\n**Allowed operations:** `PERIPHERALS_QUERY` may still be permitted (implementation-dependent).",
      test: async function () {
        const cuss2 = getCuss2();

        if (cuss2.state !== "SUSPENDED") {
          this.result = { status: "inconclusive", reason: "Application is not in SUSPENDED state" };
          return;
        }

        const component = Object.values(cuss2.components)[0];
        if (!component) {
          this.result = { status: "inconclusive", reason: "No component available" };
          return;
        }

        try {
          await component.enable();
          expect.fail("Expected WRONG_APPLICATION_STATE error");
        } catch (error) {
          log(`Received expected error: ${error.message || error}`);
          expect(error.message || String(error)).to.include(
            "WRONG_APPLICATION_STATE",
          );
        }
      },
    },
    {
      name: "it should resume to prior state after SUSPENDED ends",
      description:
        "Validates that the application returns to its previous state when the platform lifts the `SUSPENDED` condition.\n\n**How it works:**\n- Prompts the operator to resume the application from the platform management interface\n- Listens for a `stateChange` event where the new state is not `SUSPENDED`\n- Asserts the state is no longer `SUSPENDED`\n- If the resumed state is not `ACTIVE`, transitions back to `ACTIVE` for subsequent tests\n\n**What is validated:**\n- `cuss2.state` is no longer `SUSPENDED` after resumption\n- The platform restores the application to an operational state\n\n**Expected behavior:** After `SUSPENDED` ends, the platform should return the application to the state it was in before suspension (e.g., if suspended from `ACTIVE`, it should resume to `ACTIVE`). However, the exact resumed state may depend on platform implementation.",
      test: async function () {
        const cuss2 = getCuss2();

        await promptUser(
          "Resume the application from SUSPENDED state",
          () =>
            new Promise((resolve) => {
              if (cuss2.state !== "SUSPENDED") {
                resolve();
                return;
              }
              const handler = (newState) => {
                if (newState !== "SUSPENDED") {
                  cuss2.off("stateChange", handler);
                  resolve();
                }
              };
              cuss2.on("stateChange", handler);
            }),
          { icon: "play-circle" },
        );

        expect(cuss2.state).to.not.equal("SUSPENDED");
        log(`Application resumed to: ${cuss2.state}`);

        // Ensure we're back in ACTIVE for subsequent tests
        if (cuss2.state !== "ACTIVE") {
          if (cuss2.state === "UNAVAILABLE") {
            await cuss2.requestAvailableState();
          }
          if (cuss2.state === "AVAILABLE") {
            await cuss2.requestActiveState();
          }
        }
      },
    },
    {
      name: "it should receive DISABLED state notification",
      description:
        "Validates that the application receives a `DISABLED` state notification when the platform disables the application.\n\n**How it works:**\n- Prompts the operator to trigger `DISABLED` state from the platform management interface\n- Listens for the `stateChange` event on the CUSS2 client\n- Resolves when the state becomes `DISABLED`\n\n**What is validated:**\n- `cuss2.state` equals `DISABLED` after the platform trigger\n\n**What triggers `DISABLED`:**\n- The platform permanently disables the application (e.g., kiosk taken offline, security lockout)\n- This is a **terminal platform-controlled state** -- the application cannot recover without platform intervention\n\n**Difference from `SUSPENDED`:**\n- `SUSPENDED` is temporary and the application can resume\n- `DISABLED` typically requires a new connection or platform-side re-enablement",
      test: async function () {
        const cuss2 = getCuss2();

        await promptUser(
          "Trigger DISABLED state from the platform",
          () =>
            new Promise((resolve) => {
              if (cuss2.state === "DISABLED") {
                resolve();
                return;
              }
              const handler = (newState) => {
                if (newState === "DISABLED") {
                  cuss2.off("stateChange", handler);
                  resolve();
                }
              };
              cuss2.on("stateChange", handler);
            }),
          { icon: "power-off" },
        );

        expect(cuss2.state).to.equal("DISABLED");
        log("Application is now DISABLED");
      },
    },
    {
      name: "it should handle RELOAD state request",
      description:
        "Documents the expected behavior when the platform requests a `RELOAD` of the application.\n\n**Expected behavior:**\n- The application transitions to `RELOAD` state\n- All component states are reset\n- The application returns to `INITIALIZE` state and must re-initialize\n\n**What triggers `RELOAD`:**\n- Platform-initiated restart of the application\n- Configuration changes that require re-initialization\n- The platform may close the WebSocket and expect the application to reconnect\n\n**Why this test is inconclusive:** Triggering a `RELOAD` would disrupt the entire test session, requiring a fresh WebSocket connection and full re-initialization. This test documents the expected behavior rather than executing it.",
      test: function () {
        // Would disrupt test session - cannot automatically verify
        this.result = { status: "inconclusive", reason: "Would disrupt test session by reinitializing the application" };
      },
    },
    {
      name: "it should close the connection when initTimeout expires",
      description:
        "Documents the expected platform behavior when an application fails to complete initialization within the `initTimeout` window.\n\n**Expected behavior:**\n- The application connects via WebSocket but does not send the required initialization directives\n- After `initTimeout` expires (platform-configured), the platform closes the WebSocket connection\n- The close code should indicate a timeout (typically `4008`)\n\n**What is validated:**\n- This test documents the expected behavior. It cannot be fully executed within the current test session because it requires a separate WebSocket connection with an intentional delay\n\n**Why `initTimeout` exists:** The platform enforces a time limit for initialization to prevent connections from sitting idle in `INITIALIZE` state indefinitely, which would consume platform resources without serving passengers.",
      test: function () {
        // Requires separate connection with intentional delay
        this.result = { status: "inconclusive", reason: "Requires a separate connection with intentional initialization delay" };
      },
    },
  ],
};
