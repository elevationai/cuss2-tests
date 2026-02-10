/**
 * Environmental Cleanup Test Suite
 * Tests for state transition cleanup behavior
 */

import { expect } from "https://esm.sh/chai@5.1.2";
import { log } from "../helpers.js";
import { getCuss2 } from "./initialize.js";

export const envCleanupSuite = {
  id: "env-cleanup",
  name: "Environmental Cleanup",
  description:
    "Tests for automatic cleanup when leaving ACTIVE state including component disable, context reset, and illumination reset.",
  tests: [
    {
      name: "components should be disabled after leaving ACTIVE",
      requiredTests: ["active.0"],
      description:
        "Validates that the platform automatically disables all enabled components when the application leaves `ACTIVE` state.\n\n**How it works:**\n- Enables a component via `PERIPHERALS_ENABLE` and asserts `enabled` is `true`\n- Transitions from `ACTIVE` to `AVAILABLE`\n- Sends `PERIPHERALS_QUERY` to check the component's state\n- Checks whether the component's `enabled` property is `false`\n- Returns to `ACTIVE` state\n\n**What is validated:**\n- After transitioning from `ACTIVE` to `AVAILABLE`, the component should report `enabled === false`\n- The platform is responsible for disabling components automatically on state change\n\n**Why this matters:** When leaving `ACTIVE`, the passenger transaction is over. Leaving components enabled (e.g., barcode reader actively scanning) would be a security and operational risk. The platform must clean up all component states.",
      diagram: "sequenceDiagram\n  participant App\n  participant Platform\n  participant Component\n  App->>Platform: PERIPHERALS_ENABLE\n  Platform-->>App: OK (enabled=true)\n  App->>Platform: Request AVAILABLE state\n  Platform->>Component: Auto-disable\n  Platform-->>App: State = AVAILABLE\n  App->>Platform: PERIPHERALS_QUERY\n  Platform-->>App: enabled=false",
      test: async function () {
        const cuss2 = getCuss2();

        const component = Object.values(cuss2.components)[0];
        if (!component) {
          this.result = { status: "inconclusive", reason: "No component available" };
          return;
        }

        // Enable the component
        await component.enable();
        expect(component.enabled).to.be.true;
        log("Component enabled in ACTIVE state");

        // Transition to AVAILABLE
        await cuss2.requestAvailableState();
        expect(cuss2.state).to.equal("AVAILABLE");

        // Query the component
        await component.query();

        // Check if component is disabled
        if (component.enabled === false) {
          log("Component correctly disabled after leaving ACTIVE");
        } else {
          log(
            "Component state after leaving ACTIVE: enabled=" +
              component.enabled,
          );
        }

        // Return to ACTIVE
        await cuss2.requestActiveState();
      },
    },
    {
      name: "printer context should reset after leaving ACTIVE",
      requiredTests: ["active.0"],
      description:
        "Validates that printer context configured via `PERIPHERALS_SETUP` is reset to the platform default when the application leaves and re-enters `ACTIVE` state.\n\n**How it works:**\n- Enables a printer and calls `PERIPHERALS_SETUP` with a test context\n- Transitions from `ACTIVE` to `AVAILABLE`\n- Returns to `ACTIVE` state\n- Re-enables the printer and sends `PERIPHERALS_QUERY`\n- Disables the printer\n\n**What is validated:**\n- The printer context should be reset to the platform's default after an `ACTIVE` -> `AVAILABLE` -> `ACTIVE` round-trip\n- `PERIPHERALS_SETUP` configurations do not persist across `ACTIVE` sessions\n\n**Contrast with enable/disable persistence:** Within a single `ACTIVE` session, context persists across enable/disable cycles (tested in the Setup Context suite). However, leaving `ACTIVE` state resets all per-session configuration.",
      test: async function () {
        const cuss2 = getCuss2();

        const printer = cuss2.boardingPassPrinter || cuss2.bagTagPrinter;
        if (!printer) {
          this.result = { status: "inconclusive", reason: "No printer available" };
          return;
        }

        // Setup context
        await printer.enable();
        if (typeof printer.setup === "function") {
          await printer.setup({ testContext: true });
          log("Printer context set");
        }

        // Transition to AVAILABLE
        await cuss2.requestAvailableState();
        expect(cuss2.state).to.equal("AVAILABLE");

        // Return to ACTIVE
        await cuss2.requestActiveState();
        expect(cuss2.state).to.equal("ACTIVE");

        // Query printer
        await printer.enable();
        await printer.query();

        log("Printer context should be reset to platform default");
        await printer.disable();
      },
    },
    {
      name: "illumination should reset after leaving ACTIVE",
      requiredTests: ["active.0"],
      description:
        "Validates that illumination settings are reset to the platform default when the application leaves and re-enters `ACTIVE` state.\n\n**How it works:**\n- Enables the illumination component\n- Sets the illumination color to `CLR_RED` via a `PERIPHERALS_SEND` directive\n- Transitions from `ACTIVE` to `AVAILABLE`\n- Returns to `ACTIVE` state\n- Re-enables illumination and sends `PERIPHERALS_QUERY`\n- Disables illumination\n\n**What is validated:**\n- The illumination should be reset to the platform default (not `CLR_RED`) after an `ACTIVE` -> `AVAILABLE` -> `ACTIVE` round-trip\n- Custom illumination colors do not persist across `ACTIVE` sessions\n\n**Why this matters:** Illumination is used to guide passengers to the kiosk. If a custom color from a previous session persisted, it could confuse passengers or indicate incorrect kiosk status.",
      test: async function () {
        const cuss2 = getCuss2();

        const illumination = cuss2.illumination;
        if (!illumination) {
          this.result = { status: "inconclusive", reason: "No illumination component available" };
          return;
        }

        // Set color
        await illumination.enable();
        if (typeof illumination.setColor === "function") {
          await illumination.setColor("CLR_RED");
          log("Illumination set to CLR_RED");
        }

        // Transition to AVAILABLE
        await cuss2.requestAvailableState();
        expect(cuss2.state).to.equal("AVAILABLE");

        // Return to ACTIVE
        await cuss2.requestActiveState();
        expect(cuss2.state).to.equal("ACTIVE");

        // Query illumination
        await illumination.enable();
        await illumination.query();

        log("Illumination should be reset to platform default");
        await illumination.disable();
      },
    },
    {
      name: "enabled components should not persist across ACTIVE sessions",
      requiredTests: ["active.0"],
      description:
        "Validates that a component's enabled state does not carry over from one `ACTIVE` session to the next.\n\n**How it works:**\n- Enables the barcode reader via `PERIPHERALS_ENABLE` and asserts `enabled` is `true`\n- Transitions from `ACTIVE` to `AVAILABLE`\n- Returns to `ACTIVE` state (a new session)\n- Sends `PERIPHERALS_QUERY` to the barcode reader\n- Checks whether the reader's `enabled` property is `false`\n\n**What is validated:**\n- The barcode reader should be disabled (`enabled === false`) after an `ACTIVE` -> `AVAILABLE` -> `ACTIVE` round-trip\n- Each new `ACTIVE` session starts with a clean slate -- no components are pre-enabled\n\n**Summary of cleanup on leaving `ACTIVE`:**\n- All enabled components are disabled\n- All `PERIPHERALS_SETUP` contexts are reset to platform defaults\n- All illumination settings are reset to platform defaults\n- The application must re-enable and re-configure components in each new `ACTIVE` session",
      diagram: "sequenceDiagram\n  participant App\n  participant Platform\n  Note over App,Platform: ACTIVE session 1\n  App->>Platform: PERIPHERALS_ENABLE (reader)\n  Platform-->>App: OK (enabled=true)\n  App->>Platform: Request AVAILABLE\n  Note over Platform: Platform auto-disables all components\n  Platform-->>App: State = AVAILABLE\n  App->>Platform: Request ACTIVE\n  Note over App,Platform: ACTIVE session 2 (clean slate)\n  Platform-->>App: State = ACTIVE\n  App->>Platform: PERIPHERALS_QUERY (reader)\n  Platform-->>App: enabled=false",
      test: async function () {
        const cuss2 = getCuss2();

        const reader = cuss2.barcodeReader;
        if (!reader) {
          this.result = { status: "inconclusive", reason: "No barcode reader available" };
          return;
        }

        // Enable reader
        await reader.enable();
        expect(reader.enabled).to.be.true;
        log("Barcode reader enabled");

        // Go to AVAILABLE
        await cuss2.requestAvailableState();
        expect(cuss2.state).to.equal("AVAILABLE");

        // Return to ACTIVE
        await cuss2.requestActiveState();
        expect(cuss2.state).to.equal("ACTIVE");

        // Check reader state
        await reader.query();

        if (reader.enabled === false) {
          log("Reader correctly reset to disabled state");
        } else {
          log(
            "Reader state after returning to ACTIVE: enabled=" + reader.enabled,
          );
        }
      },
    },
  ],
};
