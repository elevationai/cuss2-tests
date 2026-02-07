/**
 * Session Extension Test Suite
 * Tests for session extension functionality
 */

import { expect } from "https://esm.sh/chai@5.1.2";
import { log } from "../helpers.js";
import { getCuss2 } from "./initialize.js";

export const sessionExtensionSuite = {
  id: "session-extension",
  name: "Session Extension",
  description:
    "Tests for session extension functionality including extension requests, limits, and device help instructions.",
  dependencies: ["active"],
  tests: [
    {
      name: "EnvironmentLevel should include sessionExtensionDuration",
      description:
        "Validates that the platform's `EnvironmentLevel` data includes the `sessionExtensionDuration` field.\n\nThe `sessionExtensionDuration` value (in milliseconds) indicates how much additional time is granted each time a session extension is approved. This value is set by the platform operator and reported during the initial `PLATFORM_DATA` handshake.\n\n**What is validated:**\n- `cuss2.environment.sessionExtensionDuration` is a number (if present)\n\n**Prerequisites:**\n- Platform must have completed initialization and provided environment data",
      test: function () {
        const cuss2 = getCuss2();

        if (cuss2.environment?.sessionExtensionDuration === undefined) {
          this.result = { status: "inconclusive", reason: "sessionExtensionDuration not present in environment data" };
          return;
        }

        expect(cuss2.environment.sessionExtensionDuration).to.be.a("number");
        log(
          `sessionExtensionDuration: ${cuss2.environment.sessionExtensionDuration}ms`,
        );
      },
    },
    {
      name: "EnvironmentLevel should include maxSessionExtensions",
      description:
        "Validates that the platform's `EnvironmentLevel` data includes the `maxSessionExtensions` field.\n\nThe `maxSessionExtensions` value indicates the maximum number of times an application can extend its session before the platform forces termination. Once this limit is reached, further `PLATFORM_APPLICATIONS_EXTEND_SESSION_REQUEST` directives will be denied.\n\n**What is validated:**\n- `cuss2.environment.maxSessionExtensions` is a number (if present)\n\n**Prerequisites:**\n- Platform must have completed initialization and provided environment data",
      test: function () {
        const cuss2 = getCuss2();

        if (cuss2.environment?.maxSessionExtensions === undefined) {
          this.result = { status: "inconclusive", reason: "maxSessionExtensions not present in environment data" };
          return;
        }

        expect(cuss2.environment.maxSessionExtensions).to.be.a("number");
        log(
          `maxSessionExtensions: ${cuss2.environment.maxSessionExtensions}`,
        );
      },
    },
    {
      name:
        "it should return WRONG_APPLICATION_STATE if extend requested before SESSION_TIMEOUT",
      description:
        "Sends a `PLATFORM_APPLICATIONS_EXTEND_SESSION_REQUEST` before the `SESSION_TIMEOUT` unsolicited message has been received.\n\nSession extension requests are only valid during the kill timer window that begins after `SESSION_TIMEOUT` is received. If an application attempts to extend the session while the session timer is still running (i.e., before timeout), the platform must reject it with `WRONG_APPLICATION_STATE`.\n\n**What is validated:**\n- The extension request throws an error containing `WRONG_APPLICATION_STATE`\n\n**Prerequisites:**\n- Platform must be in the ACTIVE state\n- The `sessionTimeout` timer must still be running (no `SESSION_TIMEOUT` received yet)",
      test: async function () {
        const cuss2 = getCuss2();

        if (typeof cuss2.requestSessionExtension !== "function") {
          this.result = { status: "inconclusive", reason: "requestSessionExtension method not available" };
          return;
        }

        try {
          await cuss2.requestSessionExtension();
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
      name: "it should receive SESSION_TIMEOUT when session expires",
      description:
        "Documents the expected behavior when the `sessionTimeout` timer expires.\n\nWhen an application has been in the ACTIVE state for the duration specified by `sessionTimeout` (from `EnvironmentLevel`), the platform sends a `SESSION_TIMEOUT` unsolicited message. This message signals that the kill timer (`killTimeout`) has started. The application must either:\n- Request a session extension via `PLATFORM_APPLICATIONS_EXTEND_SESSION_REQUEST`\n- Complete its transaction and clean up before the kill timer expires\n\n**Expected sequence:**\n- Application enters ACTIVE state, `sessionTimeout` countdown begins\n- After `sessionTimeout` ms, platform sends `SESSION_TIMEOUT` unsolicited message\n- Kill timer (`killTimeout`) begins counting down\n- Application can request extension during this window\n\n**Note:** This test is marked inconclusive as the full timeout flow is validated in the Termination suite.",
      diagram: "sequenceDiagram\n    participant App as Application\n    participant Platform as CUSS2 Platform\n    App->>Platform: requestActiveState()\n    Platform-->>App: OK (ACTIVE)\n    Note over Platform: sessionTimeout countdown starts\n    Platform-->>App: SESSION_TIMEOUT (unsolicited)\n    Note over Platform: killTimeout countdown starts\n    alt Extension requested\n        App->>Platform: EXTEND_SESSION_REQUEST\n        Platform-->>App: granted: true + newSessionExpiry\n        Note over Platform: Session timer resets\n    else No extension\n        Note over Platform: killTimeout expires\n        Platform-->>App: Connection closed (4007)\n    end",
      test: function () {
        // Tested in termination suite with dedicated timeout handling
        this.result = { status: "inconclusive", reason: "Tested in Termination suite with dedicated timeout handling" };
      },
    },
    {
      name: "it should grant extension when requested during kill timer",
      description:
        "Documents the expected behavior when a `PLATFORM_APPLICATIONS_EXTEND_SESSION_REQUEST` is sent during the kill timer window.\n\nAfter receiving `SESSION_TIMEOUT`, the application has `killTimeout` milliseconds to request an extension. If the request is within the `maxSessionExtensions` limit, the platform grants the extension.\n\n**Expected behavior:**\n- Application sends `PLATFORM_APPLICATIONS_EXTEND_SESSION_REQUEST` during the kill timer window\n- Platform responds with `granted: true`\n- Response includes `newSessionExpiry` timestamp indicating when the extended session will expire\n- The session timer resets to `sessionExtensionDuration` milliseconds from now\n- The kill timer is cancelled\n\n**Note:** This test is marked inconclusive as it requires waiting for a full session timeout cycle.",
      test: function () {
        // Requires waiting for session timeout
        this.result = { status: "inconclusive", reason: "Requires waiting for a full session timeout cycle" };
      },
    },
    {
      name: "it should deny extension when max extensions reached",
      description:
        "Documents the expected behavior when the application has exhausted all allowed session extensions.\n\nThe platform tracks how many times an application has extended its session. When the count reaches `maxSessionExtensions` (from `EnvironmentLevel`), further requests are denied.\n\n**Expected behavior:**\n- After requesting `maxSessionExtensions` extensions across multiple timeout cycles, the next `PLATFORM_APPLICATIONS_EXTEND_SESSION_REQUEST` returns `granted: false`\n- The response includes `denialReason: MAX_EXTENSIONS_REACHED`\n- The kill timer continues counting down and the application will be terminated when it expires\n- The application should use the remaining kill timer window to save state and clean up\n\n**Note:** This test is marked inconclusive as it requires multiple session timeout cycles to exhaust the extension limit.",
      test: function () {
        // Requires multiple session timeout cycles
        this.result = { status: "inconclusive", reason: "Requires multiple session timeout cycles to exhaust extension limit" };
      },
    },
    {
      name:
        "it should terminate application if kill timer expires with no extension",
      description:
        "Documents the expected behavior when the kill timer expires without a session extension request.\n\nAfter `SESSION_TIMEOUT` is sent, the platform starts the `killTimeout` countdown. If the application does not send a `PLATFORM_APPLICATIONS_EXTEND_SESSION_REQUEST` before this timer expires, the platform forcibly terminates the application.\n\n**Expected behavior:**\n- Platform sends `SESSION_TIMEOUT` after `sessionTimeout` elapses\n- Kill timer (`killTimeout`) begins\n- Application does not request extension\n- Kill timer expires: platform closes the WebSocket connection with close code `4007`\n- All peripheral components are released\n- Application session is terminated\n\n**Note:** This test is marked inconclusive as the full sequence is validated in the Termination suite.",
      test: function () {
        // Tested in termination suite
        this.result = { status: "inconclusive", reason: "Tested in Termination suite with dedicated timeout handling" };
      },
    },
    {
      name: "it should retrieve device help instructions",
      description:
        "Iterates through the platform's components and checks for `deviceHelpInstructions` data.\n\nCUSS2 components can optionally provide `deviceHelpInstructions` that describe the physical device to the application. This information helps applications provide contextual help to passengers when interacting with peripherals.\n\n**Available help fields:**\n- `deviceDescription` - Human-readable description of the device\n- `deviceLocation` - Physical location of the device on the kiosk (e.g., \"left side\", \"top panel\")\n- `deviceProfile` - Technical profile of the device capabilities\n- `deviceUsage` - Instructions for how to use the device\n\n**What is validated:**\n- Each component's help instructions are logged (if available)\n- The test checks up to 3 components for help data\n\n**Prerequisites:**\n- Platform must have completed initialization with component discovery",
      test: function () {
        const cuss2 = getCuss2();

        for (const component of Object.values(cuss2.components).slice(0, 3)) {
          if (component.helpInstructions) {
            const help = component.helpInstructions;
            log(`Component ${component.id} help:`);
            if (help.deviceDescription) {
              log(`  Description: ${help.deviceDescription}`);
            }
            if (help.deviceLocation) log(`  Location: ${help.deviceLocation}`);
            if (help.deviceUsage) log(`  Usage: ${help.deviceUsage}`);
          } else {
            log(`Component ${component.id}: No help instructions available`);
          }
        }
      },
    },
    {
      name: "device help should include language code",
      description:
        "Validates that `deviceHelpInstructions` include a `languageCode` field conforming to ISO 639-1.\n\nThe `languageCode` field indicates the language of the help instruction text (e.g., `en` for English, `fr` for French). This allows multilingual applications to select appropriate help content for the current passenger's language preference.\n\n**What is validated:**\n- If `component.helpInstructions.languageCode` is present, it matches the ISO 639-1 two-letter lowercase pattern (`/^[a-z]{2}$/`)\n- The test checks up to 3 components\n\n**Prerequisites:**\n- Platform must have completed initialization\n- At least one component should provide `deviceHelpInstructions` with a `languageCode`",
      test: function () {
        const cuss2 = getCuss2();

        for (const component of Object.values(cuss2.components).slice(0, 3)) {
          if (component.helpInstructions?.languageCode) {
            expect(component.helpInstructions.languageCode).to.match(
              /^[a-z]{2}$/,
            );
            log(
              `Component ${component.id} language: ${component.helpInstructions.languageCode}`,
            );
          }
        }
      },
    },
  ],
};
