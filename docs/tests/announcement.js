/**
 * Announcement Test Suite
 * Tests for audio announcement component
 */

import { expect } from "https://esm.sh/chai@5.1.2";
import { log, promptUser } from "../helpers.js";
import { getCuss2 } from "./initialize.js";
import { baseComponentTests } from "./base-component.js";

export const announcementSuite = {
  id: "announcement",
  name: "Announcement",
  description:
    "Tests for audio announcement component including play, pause, resume, and stop operations.",
  tests: baseComponentTests(getCuss2, "announcement", () => {
    let pauseState = null;
    return {
    beforeEnable: [
      {
        name: "it should return OUT_OF_SEQUENCE if play is called when not enabled",
        description:
          "Sends a `PERIPHERALS_ANNOUNCEMENT_PLAY` directive while the component is disabled.\n\nPer the CUSS2 protocol, calling `play` (or `send`) on a component that has not been enabled is an invalid operation. The platform must reject it with `OUT_OF_SEQUENCE`.\n\n**How it is tested:**\n- The component has not yet been enabled in this test sequence\n- `play()` is called with SSML content\n- The response or thrown error is checked for `OUT_OF_SEQUENCE`\n\n**What is validated:**\n- The platform returns `OUT_OF_SEQUENCE` (as response or thrown error)\n\n**Prerequisites:**\n- Announcement component must exist and not be enabled",
        test: async function () {
          const cuss2 = getCuss2();
          const announcement = cuss2.announcement;
          if (!announcement) {
            this.result = { status: "inconclusive", reason: "No announcement component available" };
            return;
          }
          if (typeof announcement.play !== "function") {
            this.result = { status: "inconclusive", reason: "Play method not available on announcement component" };
            return;
          }

          try {
            const response = await announcement.play("<speak>Test.</speak>");
            expect(response.meta.messageCode).to.equal("OUT_OF_SEQUENCE");
          } catch (error) {
            expect(error.message || String(error)).to.include("OUT_OF_SEQUENCE");
          }
          log("Received expected OUT_OF_SEQUENCE for play when disabled");
        },
      },
    ],
    tests: [
    {
      name: "it should play SSML audio",
      description:
        "Sends a `PERIPHERALS_ANNOUNCEMENT_PLAY` directive with SSML content that announces a random number, then asks the user to identify which number was spoken.\n\n**How it is tested:**\n- A random number (1-99) is generated along with 3 random distractors\n- The number is announced via SSML: `<speak>The number is N.</speak>`\n- The user is shown 4 buttons with the correct answer and distractors (shuffled)\n- The user must select the number they heard\n\n**What is validated:**\n- The `play()` response `meta.messageCode` equals `OK`\n- The user selects the correct number (proving audio was audible and intelligible)\n\n**Prerequisites:**\n- Announcement component must be enabled\n- Platform audio output must be functional",
      test: async function () {
        const cuss2 = getCuss2();
        const announcement = cuss2.announcement;
        if (!announcement) {
          this.result = { status: "inconclusive", reason: "No announcement component available" };
          return;
        }

        if (typeof announcement.play !== "function") {
          this.result = { status: "inconclusive", reason: "Play method not available on announcement component" };
          return;
        }

        if (!announcement.enabled) {
          await announcement.enable();
        }

        // Generate random number and 3 distractors
        const correct = Math.floor(Math.random() * 99) + 1;
        const choices = new Set([correct]);
        while (choices.size < 4) {
          choices.add(Math.floor(Math.random() * 99) + 1);
        }
        const shuffled = [...choices].sort(() => Math.random() - 0.5);

        // Play the number
        const response = await announcement.play(`<speak>The number is ${correct}.</speak>`);
        expect(response.meta.messageCode).to.equal("OK");
        expect(response.meta.currentComponentState.componentState).to.equal("BUSY");
        log("SSML audio played, componentState: BUSY");

        // Prompt user to identify the number
        const selected = await promptUser(
          "Select the number that was announced",
          null,
          {
            icon: "volume-2",
            buttons: shuffled.map((n) => ({ label: String(n), value: n })),
          },
        );

        expect(selected).to.equal(correct);
        log(`User correctly identified: ${correct}`);
      },
    },
    {
      name: "it should pause playback",
      timeout: 30000,
      description:
        "Plays an SSML sequence of 10 random 2-digit numbers with 1.5-second breaks and sends a `PERIPHERALS_ANNOUNCEMENT_PAUSE` directive during a silent break.\n\nThe user is then prompted to identify the last number they heard. Random numbers prevent guessing.\n\n**How it is tested:**\n- 10 distinct random 2-digit numbers are generated and played via SSML with `<break time=\"1500ms\"/>` between each\n- The delay is calculated to land in the middle of a break (after the target number has been fully spoken)\n- The user selects the last number they heard\n\n**What is validated:**\n- The `play()` response `meta.messageCode` equals `OK`\n- The `pause()` response `meta.messageCode` equals `OK`\n- The user's selected number is within ±1 position of the expected pause point\n\n**Prerequisites:**\n- Announcement component must be enabled\n- Platform audio output must be functional",
      test: async function () {
        const cuss2 = getCuss2();
        const announcement = cuss2.announcement;
        if (!announcement) {
          this.result = { status: "inconclusive", reason: "No announcement component available" };
          return;
        }
        if (typeof announcement.play !== "function" || typeof announcement.pause !== "function") {
          this.result = { status: "inconclusive", reason: "Play or pause method not available" };
          return;
        }

        if (!announcement.enabled) {
          await announcement.enable();
        }

        // Generate 10 distinct random 2-digit numbers
        const numbers = [];
        const used = new Set();
        while (numbers.length < 10) {
          const n = Math.floor(Math.random() * 90) + 10;
          if (!used.has(n)) {
            used.add(n);
            numbers.push(n);
          }
        }

        const ssml = "<speak>" + numbers.map((n, i) =>
          i < 9 ? `${n}<break time="1500ms"/>` : String(n),
        ).join("") + "</speak>";

        // Pick a random index to pause at (3-6, so user hears 4-7 numbers)
        // Each cycle is ~2s (speech ~500ms + 1500ms break)
        // Delay targets the middle of the break after the target number
        const pauseIndex = Math.floor(Math.random() * 4) + 3;
        const delay = pauseIndex * 2000 + 1250;

        const playResponse = await announcement.play(ssml);
        expect(playResponse.meta.messageCode).to.equal("OK");

        // Show prompt while audio plays, auto-dismiss when pause completes
        const pauseResponse = await promptUser(
          "Listen to the numbers. When it stops, you'll be asked what the last number you heard was.",
          async () => {
            await new Promise((r) => setTimeout(r, delay));
            return await announcement.pause();
          },
          { icon: "volume-2", countdown: delay },
        );
        expect(pauseResponse.meta.messageCode).to.equal("OK");
        pauseState = { pauseIndex, numbers };
        log(`Paused after ${delay}ms (expected last heard: ${numbers[pauseIndex]})`);

        // Choices: ±2 positions around expected pause point
        const choices = new Set();
        for (let i = pauseIndex - 2; i <= pauseIndex + 2; i++) {
          if (i >= 0 && i < 10) choices.add(numbers[i]);
        }
        const shuffled = [...choices].sort(() => Math.random() - 0.5);

        const selected = await promptUser(
          "What was the last number you heard?",
          null,
          {
            icon: "pause",
            buttons: shuffled.map((n) => ({ label: String(n), value: n })),
          },
        );

        const selectedIndex = numbers.indexOf(selected);
        expect(selectedIndex).to.not.equal(-1, `User selected ${selected} which is not in the sequence`);
        expect(Math.abs(selectedIndex - pauseIndex)).to.be.at.most(1,
          `Expected ~${numbers[pauseIndex]} (index ${pauseIndex}), user heard ${selected} (index ${selectedIndex})`);
        log(`User heard ${selected} (index ${selectedIndex}), expected ${numbers[pauseIndex]} (index ${pauseIndex})`);
      },
    },
    {
      name: "it should resume playback after pause",
      timeout: 30000,
      requiredTests: [".8"],
      description:
        "Sends a `PERIPHERALS_ANNOUNCEMENT_RESUME` directive to continue playback from where it was paused, then waits for the component to return to `READY` state (indicating playback finished).\n\nThe elapsed time from resume to completion is measured and compared against the expected remaining audio duration based on where the pause occurred.\n\n**How it is tested:**\n- `resume()` is called on the previously paused announcement\n- A prompt displays \"Waiting for audio to stop...\" while listening for an unsolicited message with `componentState` changing from `BUSY`\n- The elapsed time is compared to the expected remaining duration: `(10 - pausePoint) * 1000ms`\n\n**What is validated:**\n- The `resume()` response `meta.messageCode` equals `OK`\n- An unsolicited message is received with `componentState` no longer `BUSY`\n- The elapsed time is within a reasonable range of the expected remaining audio\n\n**Prerequisites:**\n- The pause test must have run successfully\n- Audio must still be in a paused state",
      test: async function () {
        const cuss2 = getCuss2();
        const announcement = cuss2.announcement;
        if (!announcement) {
          this.result = { status: "inconclusive", reason: "No announcement component available" };
          return;
        }
        if (typeof announcement.resume !== "function") {
          this.result = { status: "inconclusive", reason: "Resume method not available" };
          return;
        }
        if (!pauseState) {
          this.result = { status: "inconclusive", reason: "Pause test did not run" };
          return;
        }

        const resumeResponse = await announcement.resume();
        expect(resumeResponse.meta.messageCode).to.equal("OK");
        const resumedAt = Date.now();
        log("Resumed playback");

        // Wait for unsolicited message indicating playback finished
        const remainingNumbers = 10 - pauseState.pauseIndex - 1;
        await promptUser(
          "Waiting for audio to stop...",
          () =>
            new Promise((resolve) => {
              const handler = (message) => {
                if (
                  message.meta?.currentComponentState?.componentState &&
                  message.meta.currentComponentState.componentState !== "BUSY"
                ) {
                  announcement.off("message", handler);
                  resolve(message);
                }
              };
              announcement.on("message", handler);
            }),
          { icon: "loader", countdown: remainingNumbers * 2000 },
        );

        const elapsed = Date.now() - resumedAt;
        const expectedRemaining = remainingNumbers * 2000;

        log(`Elapsed: ${elapsed}ms, expected remaining: ~${expectedRemaining}ms (${remainingNumbers} numbers left)`);

        expect(elapsed).to.be.within(
          remainingNumbers * 1000,
          remainingNumbers * 3000,
          `Resume-to-finish time (${elapsed}ms) should roughly match remaining audio (~${expectedRemaining}ms)`,
        );
      },
    },
    {
      name: "it should return OUT_OF_SEQUENCE if stop is called when not playing",
      requiredTests: [".9"],
      description:
        "Sends a `PERIPHERALS_ANNOUNCEMENT_STOP` directive when no audio is playing (playback already finished after the resume test).\n\nPer the CUSS2 protocol, calling `stop` when nothing is playing is an invalid operation. The platform must reject it with `OUT_OF_SEQUENCE`.\n\n**What is validated:**\n- The platform returns `OUT_OF_SEQUENCE` (as response or thrown error)\n\n**Prerequisites:**\n- Announcement component must be enabled\n- No audio should be playing (the resume test waited for playback to finish)",
      test: async function () {
        const cuss2 = getCuss2();
        const announcement = cuss2.announcement;
        if (!announcement) {
          this.result = { status: "inconclusive", reason: "No announcement component available" };
          return;
        }
        if (typeof announcement.stop !== "function") {
          this.result = { status: "inconclusive", reason: "Stop method not available" };
          return;
        }

        try {
          const response = await announcement.stop();
          expect(response.meta.messageCode).to.equal("OUT_OF_SEQUENCE");
        } catch (error) {
          expect(error.message || String(error)).to.include("OUT_OF_SEQUENCE");
        }
        log("Received expected OUT_OF_SEQUENCE for stop when not playing");
      },
    },
    {
      name: "it should stop playback",
      description:
        "Sends a `PERIPHERALS_ANNOUNCEMENT_STOP` directive to halt audio playback entirely and reset the playback position.\n\nUnlike `PERIPHERALS_ANNOUNCEMENT_PAUSE`, a stop operation cannot be resumed. If no audio is currently playing, the platform may return `OUT_OF_SEQUENCE`.\n\n**What is validated:**\n- The response `meta.messageCode` is either `OK` or `OUT_OF_SEQUENCE`\n\n**Prerequisites:**\n- Announcement component must be enabled",
      test: async function () {
        const cuss2 = getCuss2();
        const announcement = cuss2.announcement;
        if (!announcement) {
          this.result = { status: "inconclusive", reason: "No announcement component available" };
          return;
        }

        if (typeof announcement.stop === "function") {
          const response = await announcement.stop();
          expect(response.meta.messageCode).to.be.oneOf([
            "OK",
            "OUT_OF_SEQUENCE",
          ]);
          log(`Stop response: ${response.meta.messageCode}`);
        } else {
          log("Stop method not available");
        }
      },
    },
    {
      name:
        "sending play while already playing should stop current and start new",
      description:
        "Sends three consecutive `PERIPHERALS_ANNOUNCEMENT_PLAY` directives without waiting for any to complete. The first two announce a number prefixed with \"You shouldn't hear\", and the third announces a different number followed by \"should be the only number you heard.\"\n\nPer the CUSS2 specification, issuing a new play while audio is already in progress should implicitly stop the current playback and begin the new announcement. Only the last message should be audible.\n\n**What is validated:**\n- All three directives receive responses\n- The third `PERIPHERALS_ANNOUNCEMENT_PLAY` response has `meta.messageCode` equal to `OK`\n- The user confirms they only heard the number from the third (final) announcement\n\n**Prerequisites:**\n- Announcement component must be enabled\n- Platform audio output must be functional",
      test: async function () {
        const cuss2 = getCuss2();
        const announcement = cuss2.announcement;
        if (!announcement || typeof announcement.play !== "function") {
          this.result = { status: "inconclusive", reason: "No announcement component or play method available" };
          return;
        }

        if (!announcement.enabled) {
          await announcement.enable();
        }

        // Generate 3 distinct random numbers
        const numbers = new Set();
        while (numbers.size < 3) {
          numbers.add(Math.floor(Math.random() * 99) + 1);
        }
        const [num1, num2, correct] = [...numbers];

        // Fire all 3 plays without awaiting — each should cancel the previous
        const play1 = announcement.play(`<speak>You shouldn't hear ${num1}.</speak>`);
        const play2 = announcement.play(`<speak>You shouldn't hear ${num2}.</speak>`);
        const play3 = announcement.play(`<speak>Select number ${correct}.</speak>`);

        const [response1, response2, response3] = await Promise.all([play1, play2, play3]);

        log(`Play 1 (${num1}): ${response1.meta.messageCode}`);
        log(`Play 2 (${num2}): ${response2.meta.messageCode}`);
        log(`Play 3 (${correct}): ${response3.meta.messageCode}`);

        expect(response3.meta.messageCode).to.equal("OK");

        // Prompt user to confirm which number they heard
        const shuffled = [num1, num2, correct].sort(() => Math.random() - 0.5);
        const selected = await promptUser(
          "Several play() commands are being sent.<br>Only the last message should be heard<br>Which number did you hear?",
          null,
          {
            icon: "volume-2",
            buttons: shuffled.map((n) => ({ label: String(n), value: n })),
          },
        );

        expect(selected).to.equal(correct);
        log(`User correctly identified: ${correct}`);
      },
    },
  ]};
  }, ["active.0"]),
};
