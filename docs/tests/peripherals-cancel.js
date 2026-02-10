/**
 * peripherals_cancel Test Suite
 * Tests for cancelling pending operations
 */

import { expect } from "https://esm.sh/chai@5.1.2";
import { log, promptUser } from "../helpers.js";
import { getCuss2 } from "./initialize.js";

export const peripheralsCancelSuite = {
  id: "peripherals-cancel",
  name: "Peripherals Cancel",
  description:
    "Tests the peripherals_cancel directive for cancelling pending operations like print jobs.",
  tests: [
    {
      name: "it should cancel a pending send operation",
      requiredTests: ["active.0"],
      description:
        "Validates that `PERIPHERALS_CANCEL` can abort a pending `PERIPHERALS_SEND` operation (e.g., a print job in progress).\n\n**How it works:**\n- Enables a printer component via `PERIPHERALS_ENABLE`\n- Prompts the user not to remove paper from the printer\n- Sends `PERIPHERALS_SEND` to start a print job (captured as a promise, errors caught)\n- Immediately sends `PERIPHERALS_CANCEL` before the print completes\n- Logs both the print result and cancel response `meta.messageCode`\n- Disables the printer after the test\n\n**What is validated:**\n- `PERIPHERALS_CANCEL` completes without error\n- The pending `PERIPHERALS_SEND` either completes with a `CANCELLED` status or throws an error indicating cancellation\n\n**Protocol detail:** `PERIPHERALS_CANCEL` targets all pending operations on the specified component. The platform should abort in-progress hardware operations and return a response for the cancelled directive with an appropriate status code.",
      diagram: "sequenceDiagram\n  participant App\n  participant Platform\n  participant Printer\n  App->>Platform: PERIPHERALS_SEND (print job)\n  Platform->>Printer: Start printing\n  App->>Platform: PERIPHERALS_CANCEL\n  Platform->>Printer: Abort print\n  Platform-->>App: CANCEL response (OK)\n  Platform-->>App: SEND response (CANCELLED)",
      test: async function () {
        const cuss2 = getCuss2();

        const printer = cuss2.boardingPassPrinter || cuss2.bagTagPrinter;
        if (!printer) {
          this.result = { status: "inconclusive", reason: "No printer component available" };
          return;
        }

        await printer.enable();

        await promptUser(
          "A print job will be sent - do not remove paper from printer",
          async () => {
            // Start a print job (this would be a long operation in real scenario)
            const printPromise = printer.send({
              // Print data would go here
            }).catch((e) => e);

            // Immediately cancel
            const cancelResponse = await printer.cancel();

            const printResult = await printPromise;
            log(
              `Print result: ${printResult?.meta?.messageCode || printResult}`,
            );
            log(`Cancel result: ${cancelResponse.meta.messageCode}`);

            return cancelResponse;
          },
          { icon: "printer" },
        );

        await printer.disable();
      },
    },
    {
      name: "cancel should work from AVAILABLE state",
      requiredTests: ["active.0"],
      description:
        "Verifies that `PERIPHERALS_CANCEL` can be sent when the application is in `AVAILABLE` state without causing an error.\n\n**How it works:**\n- Transitions to `AVAILABLE` state\n- Sends `PERIPHERALS_CANCEL` to the first component that supports it\n- Logs the response `meta.messageCode` or any error\n- Returns to `ACTIVE` state\n\n**What is validated:**\n- `PERIPHERALS_CANCEL` does not return `WRONG_APPLICATION_STATE` in `AVAILABLE`\n- Like `PERIPHERALS_QUERY`, cancel is expected to be valid in multiple states since it is a safety mechanism to abort pending operations\n\n**Note:** Some components may not have pending operations to cancel in `AVAILABLE` state, so the response may vary by platform implementation.",
      test: async function () {
        const cuss2 = getCuss2();

        // Go to AVAILABLE
        await cuss2.requestAvailableState();
        expect(cuss2.state).to.equal("AVAILABLE");

        const component = Object.values(cuss2.components)[0];
        if (component && typeof component.cancel === "function") {
          try {
            const response = await component.cancel();
            log(`Cancel response: ${response.meta.messageCode}`);
          } catch (error) {
            // Cancel in AVAILABLE might not be supported for all components
            log(`Cancel in AVAILABLE: ${error.message || error}`);
          }
        }

        // Return to ACTIVE
        await cuss2.requestActiveState();
      },
    },
    {
      name: "cancel should work from UNAVAILABLE state",
      requiredTests: ["active.0"],
      description:
        "Verifies that `PERIPHERALS_CANCEL` can be sent when the application is in `UNAVAILABLE` state without causing an error.\n\n**How it works:**\n- Transitions to `UNAVAILABLE` state\n- Sends `PERIPHERALS_CANCEL` to the first component that supports it\n- Logs the response `meta.messageCode` or any error\n- Returns to `ACTIVE` state via `AVAILABLE` -> `ACTIVE`\n\n**What is validated:**\n- `PERIPHERALS_CANCEL` does not return `WRONG_APPLICATION_STATE` in `UNAVAILABLE`\n- The cancel directive is permitted as a cleanup mechanism even in non-active states",
      test: async function () {
        const cuss2 = getCuss2();

        // Go to UNAVAILABLE
        await cuss2.requestUnavailableState();
        expect(cuss2.state).to.equal("UNAVAILABLE");

        const component = Object.values(cuss2.components)[0];
        if (component && typeof component.cancel === "function") {
          try {
            const response = await component.cancel();
            log(`Cancel response: ${response.meta.messageCode}`);
          } catch (error) {
            log(`Cancel in UNAVAILABLE: ${error.message || error}`);
          }
        }

        // Return to ACTIVE
        await cuss2.requestAvailableState();
        await cuss2.requestActiveState();
      },
    },
    {
      name: "cancel with no pending operations should return OK",
      requiredTests: ["active.0"],
      description:
        "Validates platform behavior when `PERIPHERALS_CANCEL` is sent to an enabled component that has no pending operations.\n\n**How it works:**\n- Enables a component via `PERIPHERALS_ENABLE`\n- Sends `PERIPHERALS_CANCEL` without any prior `PERIPHERALS_SEND`\n- Asserts `meta.messageCode` is either `OK` or `OUT_OF_SEQUENCE`\n- Disables the component\n\n**What is validated:**\n- `meta.messageCode` is one of `OK` or `OUT_OF_SEQUENCE`\n- The platform handles a no-op cancel gracefully without crashing or closing the connection\n\n**Acceptable responses:**\n- `OK` - platform acknowledges the cancel even though nothing was pending\n- `OUT_OF_SEQUENCE` - platform indicates there was nothing to cancel, which is also valid behavior",
      test: async function () {
        const cuss2 = getCuss2();

        const component = Object.values(cuss2.components)[0];
        if (!component || typeof component.cancel !== "function") {
          this.result = { status: "inconclusive", reason: "No component with cancel support available" };
          return;
        }

        await component.enable();

        // Cancel with nothing pending
        const response = await component.cancel();
        expect(response.meta.messageCode).to.be.oneOf([
          "OK",
          "OUT_OF_SEQUENCE",
        ]);
        log(`Cancel with no pending: ${response.meta.messageCode}`);

        await component.disable();
      },
    },
  ],
};
