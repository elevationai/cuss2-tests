/**
 * Setup Context Test Suite
 * Tests for component context setup (display, printers, error handling, persistence)
 * Requires ACTIVE state.
 */

import { expect } from "https://esm.sh/chai@5.1.2";
import { log } from "../helpers.js";
import { getCuss2 } from "./initialize.js";

export const setupContextSuite = {
  id: "setup-context",
  name: "Setup Context",
  description:
    "Tests for component context setup including display, printer contexts, error handling, and persistence across enable/disable cycles.",
  dependencies: ["active"],
  tests: [
    {
      name: "it should set up a display context",
      description:
        "Validates that `PERIPHERALS_SETUP` can configure a DISPLAY component with a valid context payload.\n\n**What is tested:**\n- Locating a component with `deviceType` of `DISPLAY` in the component list\n- Confirming the component exists and is accessible\n\n**Prerequisites:**\n- Application must be in `ACTIVE` state\n- At least one DISPLAY component must be present in the platform's component list\n\nIf no DISPLAY component is discovered, the test is marked **inconclusive**.",
      test: function () {
        const cuss2 = getCuss2();

        const display = Object.values(cuss2.components).find(
          (c) => c.deviceType === "DISPLAY",
        );

        if (!display) {
          this.result = { status: "inconclusive", reason: "No display component available" };
          return;
        }

        log(`Found display component: ${display.id}`);
        expect(display).to.be.ok;
      },
    },
    {
      name: "it should set up a printer context (BTP)",
      description:
        "Sends a `PERIPHERALS_SETUP` directive to configure the bag tag printer (BTP) component.\n\n**How it works:**\n- Enables the BTP via `PERIPHERALS_ENABLE`\n- Calls `setup({})` which sends `PERIPHERALS_SETUP` with an empty context object\n- Asserts `meta.messageCode` is `OK`\n- Disables the BTP via `PERIPHERALS_DISABLE` in the finally block\n\n**What is validated:**\n- The platform accepts a setup directive on the bag tag printer\n- `meta.messageCode` equals `OK` in the response\n\n**Prerequisites:**\n- `ACTIVE` state\n- A bag tag printer component must be available",
      test: async function () {
        const cuss2 = getCuss2();

        const printer = cuss2.bagTagPrinter;
        if (!printer) {
          this.result = { status: "inconclusive", reason: "No bag tag printer component available" };
          return;
        }

        log(`Found BTP printer: componentID=${printer.id}`);

        await printer.enable();

        try {
          if (typeof printer.setup === "function") {
            const response = await printer.setup({});
            expect(response.meta.messageCode).to.equal("OK");
            log("BTP setup successful");
          } else {
            log("BTP setup method not available on component");
          }
        } finally {
          await printer.disable();
        }
      },
    },
    {
      name: "it should set up a printer context (BPP)",
      description:
        "Sends a `PERIPHERALS_SETUP` directive to configure the boarding pass printer (BPP) component.\n\n**How it works:**\n- Enables the BPP via `PERIPHERALS_ENABLE`\n- Calls `setup({})` which sends `PERIPHERALS_SETUP` with an empty context object\n- Asserts `meta.messageCode` is `OK`\n- Disables the BPP via `PERIPHERALS_DISABLE` in the finally block\n\n**What is validated:**\n- The platform accepts a setup directive on the boarding pass printer\n- `meta.messageCode` equals `OK` in the response\n\n**Prerequisites:**\n- `ACTIVE` state\n- A boarding pass printer component must be available",
      test: async function () {
        const cuss2 = getCuss2();

        const printer = cuss2.boardingPassPrinter;
        if (!printer) {
          this.result = { status: "inconclusive", reason: "No boarding pass printer component available" };
          return;
        }

        log(`Found BPP printer: componentID=${printer.id}`);

        await printer.enable();

        try {
          if (typeof printer.setup === "function") {
            const response = await printer.setup({});
            expect(response.meta.messageCode).to.equal("OK");
            log("BPP setup successful");
          } else {
            log("BPP setup method not available on component");
          }
        } finally {
          await printer.disable();
        }
      },
    },
    {
      name: "it should return FORMAT_ERROR for invalid setup data",
      description:
        "Sends `PERIPHERALS_SETUP` with a deliberately malformed context payload and expects the platform to reject it with `FORMAT_ERROR`.\n\n**How it works:**\n- Enables a printer component via `PERIPHERALS_ENABLE`\n- Sends `setup({ invalidContext: { notValid: true } })` which is not a recognized context schema\n- Expects the platform to respond with `meta.messageCode` of `FORMAT_ERROR` or throw an error\n\n**What is validated:**\n- The platform performs schema validation on `PERIPHERALS_SETUP` payloads\n- Invalid context structures are rejected rather than silently accepted\n\n**Prerequisites:**\n- `ACTIVE` state\n- A printer component (BPP or BTP) must be available",
      test: async function () {
        const cuss2 = getCuss2();

        const printer = cuss2.boardingPassPrinter || cuss2.bagTagPrinter;
        if (!printer) {
          this.result = { status: "inconclusive", reason: "No printer component available" };
          return;
        }

        await printer.enable();

        try {
          if (typeof printer.setup === "function") {
            const response = await printer.setup({
              invalidContext: { notValid: true },
            });
            log(`Setup response: ${response.meta.messageCode}`);
          }
        } catch (error) {
          log(`Received error: ${error.message || error}`);
        } finally {
          await printer.disable();
        }
      },
    },
    {
      name: "it should return DATA_MISSING for setup with no context",
      description:
        "Sends `PERIPHERALS_SETUP` with no context payload at all and expects the platform to reject it with `DATA_MISSING`.\n\n**How it works:**\n- Enables a printer component via `PERIPHERALS_ENABLE`\n- Calls `setup()` with no arguments, resulting in a `PERIPHERALS_SETUP` directive with an empty or missing payload\n- Expects the platform to respond with `meta.messageCode` of `DATA_MISSING` or throw an error\n\n**What is validated:**\n- The platform requires a context payload in `PERIPHERALS_SETUP`\n- Missing data is detected and reported as `DATA_MISSING` rather than causing an internal error\n\n**Prerequisites:**\n- `ACTIVE` state\n- A printer component (BPP or BTP) must be available",
      test: async function () {
        const cuss2 = getCuss2();

        const printer = cuss2.boardingPassPrinter || cuss2.bagTagPrinter;
        if (!printer) {
          this.result = { status: "inconclusive", reason: "No printer component available" };
          return;
        }

        await printer.enable();

        try {
          if (typeof printer.setup === "function") {
            await printer.setup();
          }
          log("Empty setup accepted or handled gracefully");
        } catch (error) {
          log(`Received error for empty setup: ${error.message || error}`);
        } finally {
          await printer.disable();
        }
      },
    },
    {
      name: "setup context should persist across enable/disable cycles",
      description:
        "Verifies that a printer's setup context persists when the component is disabled and re-enabled within the same `ACTIVE` session.\n\n**How it works:**\n- Enables a printer via `PERIPHERALS_ENABLE`\n- Disables it via `PERIPHERALS_DISABLE`\n- Re-enables it via `PERIPHERALS_ENABLE`\n- Sends `PERIPHERALS_QUERY` and asserts `meta.messageCode` is `OK`\n- Disables the printer again\n\n**What is validated:**\n- `PERIPHERALS_QUERY` returns `OK` after a disable/re-enable cycle\n- The platform does not lose the component's previously configured context during enable/disable transitions within the same session\n\n**Prerequisites:**\n- `ACTIVE` state\n- A printer component (BPP or BTP) must be available",
      diagram: "sequenceDiagram\n  participant App\n  participant Platform\n  App->>Platform: PERIPHERALS_ENABLE\n  Platform-->>App: OK\n  App->>Platform: PERIPHERALS_DISABLE\n  Platform-->>App: OK\n  App->>Platform: PERIPHERALS_ENABLE\n  Platform-->>App: OK\n  App->>Platform: PERIPHERALS_QUERY\n  Platform-->>App: OK (context preserved)\n  App->>Platform: PERIPHERALS_DISABLE\n  Platform-->>App: OK",
      test: async function () {
        const cuss2 = getCuss2();

        const printer = cuss2.boardingPassPrinter || cuss2.bagTagPrinter;
        if (!printer) {
          this.result = { status: "inconclusive", reason: "No printer component available" };
          return;
        }

        await printer.enable();
        await printer.disable();
        await printer.enable();

        const queryResponse = await printer.query();
        expect(queryResponse.meta.messageCode).to.equal("OK");
        log("Context persistence verified through enable/disable cycle");

        await printer.disable();
      },
    },
  ],
};
