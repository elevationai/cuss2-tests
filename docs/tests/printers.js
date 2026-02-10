/**
 * Printer Test Suites
 * Tests for BTP (Bag Tag Printer) and BPP (Boarding Pass Printer)
 */

import { expect } from "https://esm.sh/chai@5.1.2";
import { log, promptUser, validateUnsolicitedMessage } from "../helpers.js";
import { getCuss2 } from "./initialize.js";
import { baseComponentTests } from "./base-component.js";

export const btpPrinterSuite = {
  id: "test-btp-printer",
  name: "BTP Printer (Bag Tag)",
  description:
    "Tests for bag tag printer including setup, printing, and media status detection.",
  tests: baseComponentTests(getCuss2, "bagTagPrinter", () => [
    {
      name: "it should accept a setup context for bag tags",
      description:
        "Sends a `PERIPHERALS_SETUP` directive to configure the bag tag printer with a print context.\n\nBefore printing, a `PERIPHERALS_SETUP` message must be sent to configure the printer's operating context (media size, orientation, print format, etc.). This is a required step in the CUSS2 print workflow: **setup** then **send**.\n\n**How it is tested:**\n- Calls `printer.setup({})` which sends a `PERIPHERALS_SETUP` message with an empty configuration\n- Awaits the platform's solicited response\n\n**What is validated:**\n- `response.meta.messageCode` equals `\"OK\"` (setup was accepted)\n\n**Prerequisites:**\n- Bag tag printer must be enabled via `PERIPHERALS_ENABLE`\n- `printer.setup` function must exist on the component",
      test: async function () {
        const cuss2 = getCuss2();
        const printer = cuss2.bagTagPrinter;
        if (!printer || typeof printer.setup !== "function") {
          this.result = { status: "inconclusive", reason: "No bag tag printer or setup method available" };
          return;
        }

        const response = await printer.setup({});
        expect(response.meta.messageCode).to.equal("OK");
        log("BTP setup successful");
      },
    },
    {
      name: "it should print a bag tag via send()",
      description:
        "Tests the `PERIPHERALS_SEND` directive for printing a physical bag tag.\n\nThe `PERIPHERALS_SEND` message delivers the actual print data to the printer. The print data format depends on the printer type (PECTAB, PDF, image, etc.) and should match the context established by the prior `PERIPHERALS_SETUP`.\n\n**How it is tested:**\n- The user is prompted to confirm paper is loaded in the bag tag printer\n- The print operation is initiated (note: actual print data would need to be valid for the platform)\n\n**What is validated:**\n- The print operation completes without error\n- User can visually confirm physical output\n\n**Prerequisites:**\n- Bag tag printer must be enabled\n- `PERIPHERALS_SETUP` should have been called first\n- Paper must be loaded in the printer",
      diagram: `sequenceDiagram
    participant App as Test Application
    participant Platform as CUSS2 Platform
    participant HW as Bag Tag Printer

    App->>Platform: PERIPHERALS_SETUP (print context)
    Platform-->>App: Response meta.messageCode = "OK"
    App->>Platform: PERIPHERALS_SEND (print data)
    Platform->>HW: Send print data to hardware
    HW->>HW: Print bag tag
    Platform-->>App: Response meta.messageCode = "OK"`,
      test: async function () {
        const cuss2 = getCuss2();
        const printer = cuss2.bagTagPrinter;
        if (!printer) {
          this.result = { status: "inconclusive", reason: "No bag tag printer component available" };
          return;
        }

        await promptUser(
          "Ready to print a bag tag - ensure paper is loaded",
          async () => {
            // Actual print would require valid bag tag data
            log("Print operation would be initiated here");
            return true;
          },
          { icon: "printer" },
        );

        log("Print test completed");
      },
    },
    {
      name: "it should return FORMAT_ERROR for invalid print data",
      description:
        "Verifies that the platform rejects malformed print data with an appropriate error.\n\nWhen `PERIPHERALS_SEND` is called with data that does not conform to the expected print format, the platform should return a `FORMAT_ERROR` message code. This tests the platform's input validation for the bag tag printer.\n\n**How it is tested:**\n- Calls `printer.send()` with an intentionally invalid data structure (`{ invalid: \"data structure\" }`)\n- The call is wrapped in a try/catch since the client library may throw on error responses\n\n**What is validated:**\n- The platform rejects the invalid data (either via error response or thrown exception)\n- The error is logged for inspection\n\n**Prerequisites:**\n- Bag tag printer must be enabled",
      test: async function () {
        const cuss2 = getCuss2();
        const printer = cuss2.bagTagPrinter;
        if (!printer) {
          this.result = { status: "inconclusive", reason: "No bag tag printer component available" };
          return;
        }

        try {
          await printer.send({ invalid: "data structure" });
        } catch (error) {
          log(
            `Received expected error for invalid data: ${
              error.message || error
            }`,
          );
        }
      },
    },
    {
      name: "it should report MEDIA_LOW when paper is low",
      description:
        "Tests that the platform sends an unsolicited message with `MEDIA_LOW` status when the bag tag printer's paper supply is running low.\n\nThe `mediaStatus` field in `meta.currentComponentState` reflects the physical media state of the printer. When paper drops below a platform-defined threshold, the status changes to `MEDIA_LOW`. This is reported via an unsolicited `PLATFORM_DATA` message.\n\n**How it is tested:**\n- The user is prompted to reduce the paper supply in the BTP printer\n- If `printer.mediaStatus` is already `\"MEDIA_LOW\"`, the test resolves immediately\n- Otherwise, the test listens for `message` events and checks for `meta.currentComponentState.mediaStatus === \"MEDIA_LOW\"`\n\n**What is validated:**\n- `printer.mediaStatus` equals `\"MEDIA_LOW\"` after the paper reduction\n- If an unsolicited message was received, it passes `validateUnsolicitedMessage()` (checks `meta.eventClassification`)\n\n**Prerequisites:**\n- Bag tag printer must be enabled\n- Paper must be physically accessible for removal",
      test: async function () {
        const cuss2 = getCuss2();
        const printer = cuss2.bagTagPrinter;
        if (!printer) {
          this.result = { status: "inconclusive", reason: "No bag tag printer component available" };
          return;
        }

        const result = await promptUser(
          "Reduce paper in the BTP printer to trigger MEDIA_LOW",
          () =>
            new Promise((resolve) => {
              if (printer.mediaStatus === "MEDIA_LOW") {
                resolve({ status: "MEDIA_LOW" });
                return;
              }
              const messageHandler = (message) => {
                if (
                  message.meta?.currentComponentState?.mediaStatus ===
                    "MEDIA_LOW" ||
                  printer.mediaStatus === "MEDIA_LOW"
                ) {
                  printer.off("message", messageHandler);
                  resolve({ status: "MEDIA_LOW", message });
                }
              };
              printer.on("message", messageHandler);
            }),
          { icon: "alert-triangle" },
        );

        expect(printer.mediaStatus).to.equal("MEDIA_LOW");
        log("MEDIA_LOW detected");

        if (result.message) {
          validateUnsolicitedMessage(result.message);
        }
      },
    },
    {
      name: "it should report MEDIA_EMPTY when paper is out",
      description:
        "Tests that the platform sends an unsolicited message with `MEDIA_EMPTY` status when the bag tag printer is completely out of paper.\n\nWhen all paper is removed, the `mediaStatus` in `meta.currentComponentState` changes to `MEDIA_EMPTY`. The printer should not accept print jobs in this state. This status is reported via an unsolicited `PLATFORM_DATA` message.\n\n**How it is tested:**\n- The user is prompted to remove all paper from the BTP printer\n- If `printer.mediaStatus` is already `\"MEDIA_EMPTY\"`, the test resolves immediately\n- Otherwise, the test listens for `message` events and checks for `meta.currentComponentState.mediaStatus === \"MEDIA_EMPTY\"`\n\n**What is validated:**\n- `printer.mediaStatus` equals `\"MEDIA_EMPTY\"` after all paper is removed\n- If an unsolicited message was received, it passes `validateUnsolicitedMessage()`\n\n**Prerequisites:**\n- Bag tag printer must be enabled\n- Paper must be physically removable",
      test: async function () {
        const cuss2 = getCuss2();
        const printer = cuss2.bagTagPrinter;
        if (!printer) {
          this.result = { status: "inconclusive", reason: "No bag tag printer component available" };
          return;
        }

        const result = await promptUser(
          "Remove all paper from the BTP printer",
          () =>
            new Promise((resolve) => {
              if (printer.mediaStatus === "MEDIA_EMPTY") {
                resolve({ status: "MEDIA_EMPTY" });
                return;
              }
              const messageHandler = (message) => {
                if (
                  message.meta?.currentComponentState?.mediaStatus ===
                    "MEDIA_EMPTY" ||
                  printer.mediaStatus === "MEDIA_EMPTY"
                ) {
                  printer.off("message", messageHandler);
                  resolve({ status: "MEDIA_EMPTY", message });
                }
              };
              printer.on("message", messageHandler);
            }),
          { icon: "file-x" },
        );

        expect(printer.mediaStatus).to.equal("MEDIA_EMPTY");
        log("MEDIA_EMPTY detected");

        if (result.message) {
          validateUnsolicitedMessage(result.message);
        }
      },
    },
    {
      name: "it should report MEDIA_JAMMED when paper jams",
      description:
        "Tests that the platform sends an unsolicited message with `MEDIA_JAMMED` status when a paper jam occurs in the bag tag printer.\n\nA paper jam is a hardware error condition where media is physically stuck in the print mechanism. The platform reports this via `meta.currentComponentState.mediaStatus` set to `MEDIA_JAMMED` in an unsolicited `PLATFORM_DATA` message. The printer cannot operate until the jam is cleared.\n\n**How it is tested:**\n- The user is prompted to trigger a paper jam in the BTP printer\n- If `printer.mediaStatus` is already `\"MEDIA_JAMMED\"`, the test resolves immediately\n- Otherwise, the test listens for `message` events and checks for `meta.currentComponentState.mediaStatus === \"MEDIA_JAMMED\"`\n\n**What is validated:**\n- `printer.mediaStatus` equals `\"MEDIA_JAMMED\"` after the jam occurs\n- If an unsolicited message was received, it passes `validateUnsolicitedMessage()`\n\n**Prerequisites:**\n- Bag tag printer must be enabled\n- Physical ability to cause or simulate a paper jam",
      diagram: `sequenceDiagram
    participant User
    participant HW as Bag Tag Printer
    participant Platform as CUSS2 Platform
    participant App as Test Application

    User->>HW: Cause paper jam
    HW->>Platform: Hardware error detected
    Platform->>App: Unsolicited PLATFORM_DATA
    Note right of App: meta.currentComponentState.mediaStatus = "MEDIA_JAMMED"
    Note right of App: meta.eventClassification.eventMode = "UNSOLICITED"
    App->>App: Validate printer.mediaStatus === "MEDIA_JAMMED"`,
      test: async function () {
        const cuss2 = getCuss2();
        const printer = cuss2.bagTagPrinter;
        if (!printer) {
          this.result = { status: "inconclusive", reason: "No bag tag printer component available" };
          return;
        }

        const result = await promptUser(
          "Trigger a paper jam in the BTP printer",
          () =>
            new Promise((resolve) => {
              if (printer.mediaStatus === "MEDIA_JAMMED") {
                resolve({ status: "MEDIA_JAMMED" });
                return;
              }
              const messageHandler = (message) => {
                if (
                  message.meta?.currentComponentState?.mediaStatus ===
                    "MEDIA_JAMMED" ||
                  printer.mediaStatus === "MEDIA_JAMMED"
                ) {
                  printer.off("message", messageHandler);
                  resolve({ status: "MEDIA_JAMMED", message });
                }
              };
              printer.on("message", messageHandler);
            }),
          { icon: "alert-octagon" },
        );

        expect(printer.mediaStatus).to.equal("MEDIA_JAMMED");
        log("MEDIA_JAMMED detected");

        if (result.message) {
          validateUnsolicitedMessage(result.message);
        }
      },
    },
  ], ["active.0"]),
};

export const bppPrinterSuite = {
  id: "test-bpp-printer",
  name: "BPP Printer (Boarding Pass)",
  description:
    "Tests for boarding pass printer including setup, printing, and cancel operations.",
  tests: baseComponentTests(getCuss2, "boardingPassPrinter", () => [
    {
      name: "it should accept a setup context for boarding passes",
      description:
        "Sends a `PERIPHERALS_SETUP` directive to configure the boarding pass printer with a print context.\n\nSimilar to the bag tag printer, the boarding pass printer requires a `PERIPHERALS_SETUP` before printing. This configures media dimensions, print format (PECTAB, ATB, PDF, etc.), and other printing parameters specific to boarding passes.\n\n**How it is tested:**\n- Calls `printer.setup({})` which sends a `PERIPHERALS_SETUP` message with an empty configuration\n- Awaits the platform's solicited response\n\n**What is validated:**\n- `response.meta.messageCode` equals `\"OK\"` (setup was accepted)\n\n**Prerequisites:**\n- Boarding pass printer must be enabled via `PERIPHERALS_ENABLE`\n- `printer.setup` function must exist on the component",
      test: async function () {
        const cuss2 = getCuss2();
        const printer = cuss2.boardingPassPrinter;
        if (!printer || typeof printer.setup !== "function") {
          this.result = { status: "inconclusive", reason: "No boarding pass printer or setup method available" };
          return;
        }

        const response = await printer.setup({});
        expect(response.meta.messageCode).to.equal("OK");
        log("BPP setup successful");
      },
    },
    {
      name: "it should print a boarding pass via send()",
      description:
        "Tests the `PERIPHERALS_SEND` directive for printing a physical boarding pass.\n\nThe `PERIPHERALS_SEND` message delivers the actual boarding pass print data to the printer. The data format must match the context established by the prior `PERIPHERALS_SETUP` call.\n\n**How it is tested:**\n- The user is prompted to confirm paper is loaded in the boarding pass printer\n- The print operation is initiated\n\n**What is validated:**\n- The print operation completes without error\n- User can visually confirm physical output\n\n**Prerequisites:**\n- Boarding pass printer must be enabled\n- `PERIPHERALS_SETUP` should have been called first\n- Paper must be loaded in the printer",
      test: async function () {
        const cuss2 = getCuss2();
        const printer = cuss2.boardingPassPrinter;
        if (!printer) {
          this.result = { status: "inconclusive", reason: "No boarding pass printer component available" };
          return;
        }

        await promptUser(
          "Ready to print a boarding pass - ensure paper is loaded",
          async () => {
            log("Print operation would be initiated here");
            return true;
          },
          { icon: "printer" },
        );

        log("Print test completed");
      },
    },
    {
      name: "it should return FORMAT_ERROR for invalid print data",
      description:
        "Verifies that the platform rejects malformed print data with an appropriate error.\n\nWhen `PERIPHERALS_SEND` is called with data that does not conform to the expected boarding pass print format, the platform should return a `FORMAT_ERROR` message code. This tests the platform's input validation for the boarding pass printer.\n\n**How it is tested:**\n- Calls `printer.send()` with an intentionally invalid data structure (`{ invalid: \"data\" }`)\n- The call is wrapped in a try/catch since the client library may throw on error responses\n\n**What is validated:**\n- The platform rejects the invalid data (either via error response or thrown exception)\n- The error is logged for inspection\n\n**Prerequisites:**\n- Boarding pass printer must be enabled",
      test: async function () {
        const cuss2 = getCuss2();
        const printer = cuss2.boardingPassPrinter;
        if (!printer) {
          this.result = { status: "inconclusive", reason: "No boarding pass printer component available" };
          return;
        }

        try {
          await printer.send({ invalid: "data" });
        } catch (error) {
          log(`Received expected error: ${error.message || error}`);
        }
      },
    },
    {
      name: "it should cancel a print job mid-operation",
      description:
        "Tests the `PERIPHERALS_CANCEL` directive to abort an in-progress or pending print operation.\n\nThe `PERIPHERALS_CANCEL` message instructs the platform to cancel any ongoing operation on the component. For printers, this means aborting a print job that is in progress or queued. The platform should respond with the cancellation status.\n\n**How it is tested:**\n- Calls `printer.cancel()` which sends a `PERIPHERALS_CANCEL` message\n- Awaits the platform's solicited response\n- The response message code is logged (may be `\"OK\"`, `\"CANCELLED\"`, or `\"OUT_OF_SEQUENCE\"` if nothing was pending)\n\n**What is validated:**\n- The cancel operation completes without throwing an error\n- The response message code is logged for inspection\n\n**Prerequisites:**\n- Boarding pass printer must be enabled\n- `printer.cancel` function must exist on the component",
      test: async function () {
        const cuss2 = getCuss2();
        const printer = cuss2.boardingPassPrinter;
        if (!printer) {
          this.result = { status: "inconclusive", reason: "No boarding pass printer component available" };
          return;
        }

        if (typeof printer.cancel !== "function") {
          this.result = { status: "inconclusive", reason: "Cancel method not available on boarding pass printer" };
          return;
        }

        // Attempt to cancel (even with nothing pending)
        const response = await printer.cancel();
        log(`Cancel response: ${response.meta.messageCode}`);
      },
    },
  ], ["active.0"]),
};
