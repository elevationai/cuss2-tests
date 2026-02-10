/**
 * Passport Scan Test Suite
 * Tests for document reader / passport scanner component
 */

import { expect } from "https://esm.sh/chai@5.1.2";
import { log, promptUser, validateUnsolicitedMessage } from "../helpers.js";
import { getCuss2 } from "./initialize.js";
import { baseComponentTests } from "./base-component.js";

export const passportScanSuite = {
  id: "passport-scan",
  name: "Passport Scan",
  description:
    "Tests for document reader / passport scanner including MRZ reading and media state detection.",
  tests: baseComponentTests(getCuss2, "documentReader", () => [
    {
      name: "it should scan a passport (MEDIA_PRESENT → data → MEDIA_ABSENT)",
      description:
        "Tests the full document reader lifecycle from a single passport scan.\n\nWhen a passport is inserted into an enabled document reader, three events fire in sequence (potentially very fast):\n1. `MEDIA_PRESENT` — the platform detects a document in the reader\n2. `data` — the reader processes the MRZ and emits parsed data records\n3. `MEDIA_ABSENT` — the document is ejected or removed\n\nAll listeners are registered before any prompts to avoid missing fast events. Each step has its own prompt, but if the event already arrived, the prompt resolves immediately.\n\n**How it is tested:**\n- All listeners (`MEDIA_PRESENT`, `data`, `MEDIA_ABSENT`) are registered upfront\n- Prompt 1: \"Insert a passport\" — waits for `MEDIA_PRESENT`\n- Prompt 2: \"Wait for passport to be read\" — waits for `data` event\n- Prompt 3: \"Remove the passport\" — waits for `MEDIA_ABSENT`\n- Each prompt resolves immediately if its event already fired\n\n**What is validated:**\n- The `MEDIA_PRESENT` unsolicited message passes `validateUnsolicitedMessage()`\n- The `data` event produces a truthy result\n- If `dataStatus` is present, it is one of the valid CUSS2 status values\n- The `MEDIA_ABSENT` unsolicited message passes `validateUnsolicitedMessage()`\n\n**Prerequisites:**\n- Platform must be in ACTIVE state\n- Document reader must be enabled\n- A physical passport with a valid MRZ must be available",
      diagram: `sequenceDiagram
    participant User
    participant HW as Document Reader
    participant Platform as CUSS2 Platform
    participant App as Test Application

    App->>Platform: PERIPHERALS_ENABLE (documentReader)
    Platform-->>App: Response meta.messageCode = "OK"
    Note over App: Register all listeners upfront
    App->>User: Prompt: Insert a passport
    User->>HW: Insert passport
    HW->>Platform: Document detected
    Platform->>App: Unsolicited (MEDIA_PRESENT)
    App->>App: Validate MEDIA_PRESENT
    App->>User: Prompt: Wait for read
    HW->>Platform: MRZ processed
    Platform->>App: data event (dataRecords)
    App->>App: Validate data and dataStatus
    App->>User: Prompt: Remove passport
    HW->>Platform: Document removed
    Platform->>App: Unsolicited (MEDIA_ABSENT)
    App->>App: Validate MEDIA_ABSENT`,
      test: async function () {
        const cuss2 = getCuss2();
        const reader = cuss2.documentReader;
        if (!reader) {
          this.result = { status: "inconclusive", reason: "No document reader component available" };
          return;
        }

        if (!reader.enabled) {
          await reader.enable();
        }

        // Register all listeners upfront so fast events aren't missed
        let mediaPresentMsg = null;
        let mediaAbsentMsg = null;

        const mediaPresentPromise = new Promise((resolve) => {
          const handler = (msg) => {
            if (msg.meta?.currentComponentState?.status === "MEDIA_PRESENT") {
              reader.off("message", handler);
              mediaPresentMsg = msg;
              resolve(msg);
            }
          };
          reader.on("message", handler);
        });

        const dataPromise = new Promise((resolve) => {
          reader.once("data", resolve);
        });

        const mediaAbsentPromise = new Promise((resolve) => {
          const handler = (msg) => {
            if (msg.meta?.currentComponentState?.status === "MEDIA_ABSENT") {
              reader.off("message", handler);
              mediaAbsentMsg = msg;
              resolve(msg);
            }
          };
          reader.on("message", handler);
        });

        // Prompt 1: Insert passport → MEDIA_PRESENT
        await promptUser("Insert a passport", () => mediaPresentPromise, { icon: "id-card" });
        validateUnsolicitedMessage(mediaPresentMsg);
        log("MEDIA_PRESENT received");

        // Prompt 2: Wait for data (may already be resolved)
        const data = await promptUser("Wait for passport to be read", () => dataPromise, { icon: "id-card" });
        expect(data).to.be.ok;
        log("Received passport data");

        if (Array.isArray(data) && data[0]?.dataStatus) {
          const validStatuses = [
            "DS_OK",
            "DS_CORRUPTED",
            "DS_INCOMPLETE",
            "DS_ZEROLENGTH",
            "DS_INVALID",
            "DS_MISMATCH",
            "DS_DOCUMENT_AUTHENTICATION_FAILED",
          ];
          expect(validStatuses).to.include(data[0].dataStatus);
          log(`DataStatus: ${data[0].dataStatus}`);
        }

        // Prompt 3: Remove passport → MEDIA_ABSENT (may already be resolved)
        await promptUser("Remove the passport", () => mediaAbsentPromise, { icon: "file-output" });
        validateUnsolicitedMessage(mediaAbsentMsg);
        log("MEDIA_ABSENT received");
      },
    },
  ], ["active.0"]),
};
