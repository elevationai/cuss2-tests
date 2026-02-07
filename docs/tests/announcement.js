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
  dependencies: ["active"],
  tests: baseComponentTests(getCuss2, "announcement", () => [
    {
      name: "it should return OUT_OF_SEQUENCE if play is called when not enabled",
      description:
        "Sends a `PERIPHERALS_ANNOUNCEMENT_PLAY` directive while the component is disabled.\n\nPer the CUSS2 protocol, calling `play` (or `send`) on a component that has not been enabled is an invalid operation. The platform must reject it with `OUT_OF_SEQUENCE`.\n\n**How it is tested:**\n- The component is disabled (via `disable()`) to ensure it is not enabled\n- `play()` is called with SSML content\n- The response or thrown error is checked for `OUT_OF_SEQUENCE`\n- The component is re-enabled for subsequent tests\n\n**What is validated:**\n- The platform returns `OUT_OF_SEQUENCE` (as response or thrown error)\n\n**Prerequisites:**\n- Announcement component must exist",
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

        // Ensure disabled
        if (announcement.enabled) {
          await announcement.disable();
        }

        try {
          const response = await announcement.play({ ssml: "<speak>Test.</speak>" });
          expect(response.meta.messageCode).to.equal("OUT_OF_SEQUENCE");
        } catch (error) {
          expect(error.message || String(error)).to.include("OUT_OF_SEQUENCE");
        }
        log("Received expected OUT_OF_SEQUENCE for play when disabled");

        // Re-enable for subsequent tests
        await announcement.enable();
      },
    },
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
        const response = await announcement.play({
          ssml: `<speak>The number is ${correct}.</speak>`,
        });
        expect(response.meta.messageCode).to.equal("OK");
        log("SSML audio played");

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
      description:
        "Sends a `PERIPHERALS_ANNOUNCEMENT_PAUSE` directive to suspend audio playback that is currently in progress.\n\nIf no audio is currently playing, the platform may return `OUT_OF_SEQUENCE` instead of `OK`, which is an acceptable response indicating the pause operation is not valid in the current playback state.\n\n**What is validated:**\n- The response `meta.messageCode` is either `OK` or `OUT_OF_SEQUENCE`\n\n**Prerequisites:**\n- Announcement component must be enabled\n- Ideally, audio playback should be in progress (from a prior `PERIPHERALS_ANNOUNCEMENT_PLAY`)",
      test: async function () {
        const cuss2 = getCuss2();
        const announcement = cuss2.announcement;
        if (!announcement) {
          this.result = { status: "inconclusive", reason: "No announcement component available" };
          return;
        }

        if (typeof announcement.pause === "function") {
          const response = await announcement.pause();
          expect(response.meta.messageCode).to.be.oneOf([
            "OK",
            "OUT_OF_SEQUENCE",
          ]);
          log(`Pause response: ${response.meta.messageCode}`);
        } else {
          log("Pause method not available");
        }
      },
    },
    {
      name: "it should resume playback after pause",
      description:
        "Sends a `PERIPHERALS_ANNOUNCEMENT_RESUME` directive to continue audio playback from the point where it was paused.\n\nIf playback was not previously paused, the platform may return `OUT_OF_SEQUENCE` instead of `OK`, which is an acceptable response indicating there is nothing to resume.\n\n**What is validated:**\n- The response `meta.messageCode` is either `OK` or `OUT_OF_SEQUENCE`\n\n**Prerequisites:**\n- Announcement component must be enabled\n- Ideally, playback should have been paused by a prior `PERIPHERALS_ANNOUNCEMENT_PAUSE`",
      test: async function () {
        const cuss2 = getCuss2();
        const announcement = cuss2.announcement;
        if (!announcement) {
          this.result = { status: "inconclusive", reason: "No announcement component available" };
          return;
        }

        if (typeof announcement.resume === "function") {
          const response = await announcement.resume();
          expect(response.meta.messageCode).to.be.oneOf([
            "OK",
            "OUT_OF_SEQUENCE",
          ]);
          log(`Resume response: ${response.meta.messageCode}`);
        } else {
          log("Resume method not available");
        }
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
        "Sends two consecutive `PERIPHERALS_ANNOUNCEMENT_PLAY` directives without waiting for the first to complete.\n\nPer the CUSS2 specification, issuing a new play while audio is already in progress should implicitly stop the current playback and begin the new announcement. This validates that the platform does not queue or reject the second request.\n\n**What is validated:**\n- Both directives receive responses\n- The second `PERIPHERALS_ANNOUNCEMENT_PLAY` response has `meta.messageCode` equal to `OK`\n- The first play may return `OK` or be cancelled by the platform\n\n**Prerequisites:**\n- Announcement component must be enabled\n- Platform must support concurrent directive handling",
      test: async function () {
        const cuss2 = getCuss2();
        const announcement = cuss2.announcement;
        if (!announcement || typeof announcement.play !== "function") {
          this.result = { status: "inconclusive", reason: "No announcement component or play method available" };
          return;
        }

        // First play
        const play1 = announcement.play({
          ssml: "<speak>First announcement.</speak>",
        });

        // Immediately start second play
        const play2 = announcement.play({
          ssml: "<speak>Second announcement.</speak>",
        });

        const [response1, response2] = await Promise.all([play1, play2]);

        log(`First play: ${response1.meta.messageCode}`);
        log(`Second play: ${response2.meta.messageCode}`);

        // Second should succeed, first may be cancelled
        expect(response2.meta.messageCode).to.equal("OK");
      },
    },
  ]),
};
