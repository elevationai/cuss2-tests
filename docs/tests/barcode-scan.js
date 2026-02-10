/**
 * Barcode Scan Test Suite
 * Tests for barcode reader component
 */

import { expect } from "https://esm.sh/chai@5.1.2";
import { log, promptUser, validateUnsolicitedMessage } from "../helpers.js";
import { getCuss2 } from "./initialize.js";
import { baseComponentTests } from "./base-component.js";

export const barcodeScanSuite = {
  id: "barcode-scan",
  name: "Barcode Scan",
  description:
    "Tests for barcode reader component including standard component operations, data scanning, encoding validation, and sequential scan handling.",
  tests: baseComponentTests(getCuss2, "barcodeReader", () => [
    {
      name: "it should return valid data from a scan",
      description:
        "Tests the primary barcode reader data flow by scanning a physical barcode and validating the full response.\n\nWhen a barcode is scanned on an enabled reader, the platform sends an unsolicited `PLATFORM_DATA` message containing the scanned data in `payload.dataRecords`. The client library parses this and emits a `data` event with the records directly. The raw message is also available via the `message` event.\n\n**How it is tested:**\n- The reader is already enabled (from the base component enable test)\n- The user is prompted to scan a barcode\n- The test listens for a raw `message` event containing `payload.dataRecords` (filtering out non-data messages like `MEDIA_PRESENT`)\n\n**What is validated:**\n- The unsolicited message passes `validateUnsolicitedMessage()` (checks `meta.eventClassification` with `eventMode: \"UNSOLICITED\"`)\n- `payload.dataRecords` is present and contains at least one record\n- If `encoding` is present on the first record, it is `\"TEXT\"` or `\"BASE64\"`\n- If `mediaType` is present on the first record, it equals `\"BARCODE\"`\n\n**Prerequisites:**\n- Platform must be in ACTIVE state\n- Barcode reader must be enabled via `PERIPHERALS_ENABLE`",
      diagram: `sequenceDiagram
    participant User
    participant HW as Barcode Reader
    participant Platform as CUSS2 Platform
    participant App as Test Application

    App->>Platform: PERIPHERALS_ENABLE (barcodeReader)
    Platform-->>App: Response meta.messageCode = "OK"
    User->>HW: Scan a barcode
    HW->>Platform: Raw barcode data
    Platform->>App: Unsolicited PLATFORM_DATA
    Note right of App: meta.eventClassification.eventMode = "UNSOLICITED"
    Note right of App: payload.dataRecords = [{data, encoding, mediaType}]
    App->>App: Validate eventMode, dataRecords, encoding, mediaType`,
      test: async function () {
        const cuss2 = getCuss2();
        const reader = cuss2.barcodeReader;

        const message = await promptUser(
          "Scan a barcode",
          () =>
            new Promise((resolve) => {
              const handler = (msg) => {
                if (msg.payload?.dataRecords) {
                  reader.off("message", handler);
                  resolve(msg);
                }
              };
              reader.on("message", handler);
            }),
          { icon: "scan-barcode" },
        );

        // Validate unsolicited event classification
        validateUnsolicitedMessage(message);

        // Validate data records
        const data = message.payload.dataRecords;
        expect(data).to.be.an("array").with.length.greaterThan(0);
        log(`Received ${data.length} data record(s)`);

        const record = data[0];

        // Validate encoding
        if (record.encoding) {
          expect(record.encoding).to.be.oneOf(["TEXT", "BASE64"]);
          log(`Encoding: ${record.encoding}`);
        }

        // Validate mediaType
        if (record.mediaType) {
          expect(record.mediaType).to.equal("BARCODE");
          log(`mediaType: ${record.mediaType}`);
        }
      },
    },
    {
      name: "it should handle multiple sequential scans",
      description:
        "Validates that the barcode reader correctly handles multiple sequential scan operations without losing data or entering an error state.\n\nEach scan should produce an independent unsolicited `PLATFORM_DATA` message. The client library emits a `data` event for each, which provides the parsed `payload.dataRecords` directly.\n\n**How it is tested:**\n- The user is prompted to scan 3 barcodes one after another\n- For each scan, the test awaits a `data` event using `reader.once(\"data\", ...)`\n- Each iteration waits for completion before prompting the next scan\n\n**What is validated:**\n- Each of the 3 scans produces a truthy `data` event\n- The reader remains functional across all 3 sequential operations\n\n**Prerequisites:**\n- Barcode reader must be enabled",
      test: async function () {
        const cuss2 = getCuss2();
        const reader = cuss2.barcodeReader;

        for (let i = 1; i <= 3; i++) {
          const data = await promptUser(
            `Scan barcode ${i} of 3`,
            () =>
              new Promise((resolve) => {
                reader.once("data", resolve);
              }),
            { icon: "scan-barcode" },
          );

          expect(data).to.be.ok;
          log(`Scan ${i}: received data`);
        }

        log("All 3 sequential scans successful");
      },
    },
  ], ["active.0"]),
};
