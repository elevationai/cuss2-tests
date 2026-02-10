/**
 * Keypad Test Suite
 * Tests for keypad input component
 */

import { expect } from "https://esm.sh/chai@5.1.2";
import { log, promptUser, validateUnsolicitedMessage } from "../helpers.js";
import { getCuss2 } from "./initialize.js";
import { baseComponentTests } from "./base-component.js";

const NAV_KEYS = [
  "NAVUP", "NAVDOWN", "NAVPREVIOUS", "NAVNEXT", "NAVENTER",
  "NAVHOME", "NAVEND", "NAVHELP", "VOLUMEUP", "VOLUMEDOWN",
];

/** Listen for a message with dataRecords, auto-cleanup on abort */
function waitForDataMessage(keypad, signal, filter) {
  return new Promise((resolve) => {
    const handler = (msg) => {
      if (msg.payload?.dataRecords && (!filter || filter(msg))) {
        keypad.off("message", handler);
        resolve(msg);
      }
    };
    keypad.on("message", handler);
    signal?.addEventListener("abort", () => keypad.off("message", handler));
  });
}

export const keypadSuite = {
  id: "keypad",
  name: "Keypad",
  description:
    "Tests for keypad input component including key press detection, key identification, and sequential input handling.",
  tests: baseComponentTests(getCuss2, "keypad", () => [
    {
      name: "it should correctly identify each navigation key",
      description:
        "Prompts the user to press each of the 5 navigation keys (UP, DOWN, PREVIOUS, NEXT, ENTER) one at a time and validates the full response structure.\n\nWhen a key is pressed on an enabled keypad, the platform sends an unsolicited `PLATFORM_DATA` message containing the key data in `payload.dataRecords`. Each record has `dataStatus`, `dsTypes`, and `data` (the key name such as `NAVUP`, `NAVENTER`, etc.).\n\n**How it is tested:**\n- For each key, the user is prompted to press that specific key\n- The test listens for a `message` event with `payload.dataRecords`\n\n**What is validated:**\n- The first message passes `validateUnsolicitedMessage()` (checks `meta.eventClassification`)\n- Each record has `dataStatus` equal to `DS_OK` and `dsTypes` including `DS_TYPES_KEY`\n- Each record's `data` matches the requested key (`NAVUP`, `NAVDOWN`, `NAVPREVIOUS`, `NAVNEXT`, `NAVENTER`)\n\n**Prerequisites:**\n- Platform must be in ACTIVE state\n- Keypad must be enabled",
      test: async function () {
        const cuss2 = getCuss2();
        const keypad = cuss2.keypad;
        if (!keypad) {
          this.result = { status: "inconclusive", reason: "No keypad component available" };
          return;
        }

        const testKeys = ["NAVUP", "NAVDOWN", "NAVPREVIOUS", "NAVNEXT", "NAVENTER"];

        for (let i = 0; i < testKeys.length; i++) {
          const targetKey = testKeys[i];
          const displayName = targetKey.replace("NAV", "");

          const message = await promptUser(
            `Press the <b>${displayName}</b> key`,
            (signal) => waitForDataMessage(keypad, signal),
            { icon: "keyboard" },
          );

          // Full validation on first key press
          if (i === 0) {
            validateUnsolicitedMessage(message);
            const records = message.payload.dataRecords;
            expect(records).to.be.an("array").with.length.greaterThan(0);
          }

          const record = message.payload.dataRecords[0];
          expect(record.dataStatus).to.equal("DS_OK");
          expect(record.dsTypes).to.be.an("array").that.includes("DS_TYPES_KEY");
          expect(record.data).to.equal(targetKey,
            `Expected ${targetKey}, got ${record.data}`);
          log(`${displayName}: OK`);
        }

        log("All 5 navigation keys correctly identified");
      },
    },
    {
      name: "it should setup DS_TYPES_KEY_DOWN and receive key down events",
      description:
        "Calls `setup()` with `DS_TYPES_KEY_DOWN` to request key-down events, then prompts the user to press a key and validates that a `DS_TYPES_KEY_DOWN` record is received.\n\nBy default, a keypad only reports `DS_TYPES_KEY` events. An application must explicitly request `DS_TYPES_KEY_DOWN` via setup to receive key-down notifications. If the platform does not support it, the setup response will be `NOT_SUPPORTED`.\n\n**What is validated:**\n- The `setup()` response `meta.messageCode` is `OK` or `NOT_SUPPORTED`\n- If supported, pressing a key produces a data record with `dsTypes` including `DS_TYPES_KEY_DOWN`\n\n**Prerequisites:**\n- Keypad must be enabled",
      test: async function () {
        const cuss2 = getCuss2();
        const keypad = cuss2.keypad;
        if (!keypad) {
          this.result = { status: "inconclusive", reason: "No keypad component available" };
          return;
        }

        if (keypad.enabled) await keypad.disable();

        const response = await keypad.setup([
          { dsTypes: ["DS_TYPES_KEY_DOWN"], data: "" },
        ]);

        if (response.meta.messageCode === "NOT_SUPPORTED") {
          await keypad.enable();
          log("DS_TYPES_KEY_DOWN not supported by platform");
          this.result = { status: "inconclusive", reason: "DS_TYPES_KEY_DOWN not supported" };
          return;
        }

        expect(response.meta.messageCode).to.equal("OK");
        await keypad.enable();
        log("Setup DS_TYPES_KEY_DOWN: OK");

        const message = await promptUser(
          "Press any key to test key-down event",
          (signal) => waitForDataMessage(keypad, signal, (msg) =>
            msg.payload.dataRecords.some((r) => r.dsTypes?.includes("DS_TYPES_KEY_DOWN")),
          ),
          { icon: "keyboard" },
        );

        const record = message.payload.dataRecords.find((r) =>
          r.dsTypes?.includes("DS_TYPES_KEY_DOWN"),
        );
        expect(record).to.be.ok;
        expect(record.dataStatus).to.equal("DS_OK");
        log(`Key down event received: ${record.data}`);
      },
    },
    {
      name: "it should setup DS_TYPES_KEY_UP and receive key up events",
      description:
        "Calls `setup()` with `DS_TYPES_KEY_UP` to request key-up events, then prompts the user to press and release a key and validates that a `DS_TYPES_KEY_UP` record is received.\n\nKey-up events are sent after the corresponding `DS_TYPES_KEY` event when the user releases the key. If the platform does not support it, the setup response will be `NOT_SUPPORTED`.\n\n**What is validated:**\n- The `setup()` response `meta.messageCode` is `OK` or `NOT_SUPPORTED`\n- If supported, releasing a key produces a data record with `dsTypes` including `DS_TYPES_KEY_UP`\n\n**Prerequisites:**\n- Keypad must be enabled",
      test: async function () {
        const cuss2 = getCuss2();
        const keypad = cuss2.keypad;
        if (!keypad) {
          this.result = { status: "inconclusive", reason: "No keypad component available" };
          return;
        }

        if (keypad.enabled) await keypad.disable();

        const response = await keypad.setup([
          { dsTypes: ["DS_TYPES_KEY_UP"], data: "" },
        ]);

        if (response.meta.messageCode === "NOT_SUPPORTED") {
          await keypad.enable();
          log("DS_TYPES_KEY_UP not supported by platform");
          this.result = { status: "inconclusive", reason: "DS_TYPES_KEY_UP not supported" };
          return;
        }

        expect(response.meta.messageCode).to.equal("OK");
        await keypad.enable();
        log("Setup DS_TYPES_KEY_UP: OK");

        const message = await promptUser(
          "Press and release any key to test key-up event",
          (signal) => waitForDataMessage(keypad, signal, (msg) =>
            msg.payload.dataRecords.some((r) => r.dsTypes?.includes("DS_TYPES_KEY_UP")),
          ),
          { icon: "keyboard" },
        );

        const record = message.payload.dataRecords.find((r) =>
          r.dsTypes?.includes("DS_TYPES_KEY_UP"),
        );
        expect(record).to.be.ok;
        expect(record.dataStatus).to.equal("DS_OK");
        log(`Key up event received: ${record.data}`);
      },
    },
    {
      name: "key-up should only fire when the key is physically released",
      timeout: 30000,
      description:
        "Verifies that the platform sends `DS_TYPES_KEY_UP` only when the user physically releases the key, not automatically after `DS_TYPES_KEY_DOWN`.\n\n**How it is tested:**\n- Setup with both `DS_TYPES_KEY_DOWN` and `DS_TYPES_KEY_UP`\n- The user is prompted to press and HOLD a key\n- After `DS_TYPES_KEY_DOWN` is received, the user is asked to keep holding for 3 seconds\n- During the hold, all messages are collected and checked for premature `DS_TYPES_KEY_UP`\n- The user is then prompted to release the key\n- The time between key-down and key-up is measured\n\n**What is validated:**\n- No `DS_TYPES_KEY_UP` record arrives during the 3-second hold\n- `DS_TYPES_KEY_UP` only arrives after the user releases\n- Total hold duration is greater than 2 seconds\n\n**Prerequisites:**\n- Platform must support both `DS_TYPES_KEY_DOWN` and `DS_TYPES_KEY_UP`",
      test: async function () {
        const cuss2 = getCuss2();
        const keypad = cuss2.keypad;
        if (!keypad) {
          this.result = { status: "inconclusive", reason: "No keypad component available" };
          return;
        }

        if (keypad.enabled) await keypad.disable();

        const response = await keypad.setup([
          { dsTypes: ["DS_TYPES_KEY_DOWN"], data: "" },
          { dsTypes: ["DS_TYPES_KEY_UP"], data: "" },
        ]);

        if (response.meta.messageCode === "NOT_SUPPORTED") {
          await keypad.enable();
          log("DS_TYPES_KEY_DOWN/UP not supported by platform");
          this.result = { status: "inconclusive", reason: "DS_TYPES_KEY_DOWN/UP not supported" };
          return;
        }

        expect(response.meta.messageCode).to.equal("OK");
        await keypad.enable();

        // Prompt: press and hold
        await promptUser(
          "Press and <b>HOLD</b> any key",
          (signal) => waitForDataMessage(keypad, signal, (msg) =>
            msg.payload.dataRecords.some((r) => r.dsTypes?.includes("DS_TYPES_KEY_DOWN")),
          ),
          { icon: "keyboard" },
        );

        const downTime = Date.now();
        log("Key down received");

        // Collect messages during 3s hold, verify no KEY_UP
        const holdMessages = [];
        const holdHandler = (msg) => {
          if (msg.payload?.dataRecords) holdMessages.push(msg);
        };
        keypad.on("message", holdHandler);

        await promptUser(
          "Keep holding...",
          () => new Promise((resolve) => setTimeout(resolve, 3000)),
          { icon: "keyboard", countdown: 3000 },
        );

        keypad.off("message", holdHandler);

        const prematureKeyUp = holdMessages.some((msg) =>
          msg.payload?.dataRecords?.some((r) => r.dsTypes?.includes("DS_TYPES_KEY_UP")),
        );
        expect(prematureKeyUp).to.be.false;
        log(`No KEY_UP during 3s hold (${holdMessages.length} message(s) collected)`);

        // Prompt: release
        await promptUser(
          "<b>Release</b> the key now",
          (signal) => waitForDataMessage(keypad, signal, (msg) =>
            msg.payload.dataRecords.some((r) => r.dsTypes?.includes("DS_TYPES_KEY_UP")),
          ),
          { icon: "keyboard" },
        );

        const holdDuration = Date.now() - downTime;
        log(`Key up received after ${holdDuration}ms hold`);
        expect(holdDuration).to.be.greaterThan(2000,
          `Hold duration was only ${holdDuration}ms — KEY_UP should not fire until key is physically released`);
      },
    },
    {
      name: "it should reset to default DS_TYPES_KEY via setup",
      description:
        "Calls `setup()` with `DS_TYPES_KEY` to restore the default key event type, then presses a key and validates that only `DS_TYPES_KEY` records are received (no key-down or key-up).\n\n**What is validated:**\n- The `setup()` response `meta.messageCode` is `OK`\n- Pressing a key produces only `DS_TYPES_KEY` records\n\n**Prerequisites:**\n- Keypad must be enabled",
      test: async function () {
        const cuss2 = getCuss2();
        const keypad = cuss2.keypad;
        if (!keypad) {
          this.result = { status: "inconclusive", reason: "No keypad component available" };
          return;
        }

        if (keypad.enabled) await keypad.disable();

        const response = await keypad.setup([
          { dsTypes: ["DS_TYPES_KEY"], data: "" },
        ]);
        expect(response.meta.messageCode).to.equal("OK");
        await keypad.enable();
        log("Setup DS_TYPES_KEY (default): OK");

        const messages = [];
        const handler = (msg) => {
          if (msg.payload?.dataRecords) messages.push(msg);
        };
        keypad.on("message", handler);

        await promptUser(
          "Press and release any key",
          (signal) => {
            const dataHandler = (msg) => {
              if (msg.payload?.dataRecords) {
                keypad.off("message", dataHandler);
                setTimeout(() => signal?.aborted || messages.length > 0 && Promise.resolve(), 500);
              }
            };
            keypad.on("message", dataHandler);
            signal?.addEventListener("abort", () => keypad.off("message", dataHandler));
            return new Promise((resolve) => {
              const check = (msg) => {
                if (msg.payload?.dataRecords) {
                  keypad.off("message", check);
                  setTimeout(resolve, 500);
                }
              };
              keypad.on("message", check);
              signal?.addEventListener("abort", () => keypad.off("message", check));
            });
          },
          { icon: "keyboard" },
        );

        keypad.off("message", handler);

        expect(messages.length).to.be.greaterThan(0);
        for (const msg of messages) {
          for (const record of msg.payload.dataRecords) {
            expect(record.dsTypes).to.include("DS_TYPES_KEY");
            expect(record.dsTypes).to.not.include("DS_TYPES_KEY_DOWN");
            expect(record.dsTypes).to.not.include("DS_TYPES_KEY_UP");
          }
        }
        log(`Received ${messages.length} message(s), all DS_TYPES_KEY only`);
      },
    },
    {
      name: "it should handle multiple sequential key presses",
      description:
        "Validates that the keypad correctly handles multiple sequential key press events without losing data or entering an error state.\n\n**How it is tested:**\n- The user is prompted to press 3 keys one after another\n- For each press, the test awaits a `message` event with `payload.dataRecords`\n\n**What is validated:**\n- Each of the 3 key presses produces a valid data record\n- The keypad remains functional across all 3 sequential operations\n\n**Prerequisites:**\n- Keypad must be enabled",
      test: async function () {
        const cuss2 = getCuss2();
        const keypad = cuss2.keypad;
        if (!keypad) {
          this.result = { status: "inconclusive", reason: "No keypad component available" };
          return;
        }

        for (let i = 1; i <= 3; i++) {
          const message = await promptUser(
            `Press any key (${i} of 3)`,
            (signal) => waitForDataMessage(keypad, signal),
            { icon: "keyboard" },
          );

          const record = message.payload.dataRecords[0];
          expect(record.dataStatus).to.equal("DS_OK");
          log(`Press ${i}: ${record.data}`);
        }

        log("All 3 sequential key presses received");
      },
    },
  ], ["active.0"]),
};
