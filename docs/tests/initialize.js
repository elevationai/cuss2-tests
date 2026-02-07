/**
 * INITIALIZE State Test Suite
 * Tests initial connection and state establishment
 */

import { expect } from "https://esm.sh/chai@5.1.2";
import { Cuss2 } from "https://ts.cuss2.dev/dist/cuss2.esm.js";

import { getConfig, log, testSetupInState } from "../helpers.js";

// Shared cuss2 instance
let cuss2 = null;

export function getCuss2() {
  return cuss2;
}

export function setCuss2(instance) {
  cuss2 = instance;
}

export const initializeSuite = {
  id: "initialize",
  name: "INITIALIZE",
  description:
    "Establishes the initial WebSocket connection and verifies the application enters the INITIALIZE state.",
  isState: true,
  dependencies: [],
  shutdown: function () {
    if (cuss2) {
      log("Closing cuss2 connection...");
      cuss2.connection.close(4999, "Test Complete");
      cuss2 = null;
    }
  },
  tests: [
    {
      name: "it should connect to the server and be in the INITIALIZE state",
      description:
        "Establishes a full CUSS2 connection using the `Cuss2.connect()` high-level API, which internally performs multiple protocol steps:\n\n1. Opens a WebSocket to the configured `server_url`\n2. Obtains an OAuth bearer token from `oauth_url` using `client_id` and `client_secret`\n3. Sends a `PLATFORM_ENVIRONMENT` directive with the token in `meta.oauthToken`\n4. Receives the `PlatformData` response containing `payload.environmentLevel`\n5. Sends `PLATFORM_COMPONENTS` to discover available peripherals\n6. Enters the `INITIALIZE` application state\n\nThis test also registers event listeners for `connecting`, `authenticating`, `authenticated`, `close`, and `error` events to log the connection lifecycle. The shared `cuss2` instance created here is reused by all subsequent test suites.\n\nValidates:\n- `cuss2.connected` promise resolves successfully\n- `cuss2.state` equals `\"INITIALIZE\"` after connection",
      diagram: "sequenceDiagram\n  participant App\n  participant OAuth\n  participant Platform\n  App->>Platform: WebSocket open\n  App->>OAuth: POST /oauth/token (client_id, client_secret)\n  OAuth->>App: access_token\n  App->>Platform: PLATFORM_ENVIRONMENT (oauthToken)\n  Platform->>App: ACK (ACK_OK)\n  Platform->>App: PlatformData (environmentLevel)\n  App->>Platform: PLATFORM_COMPONENTS\n  Platform->>App: ACK (ACK_OK)\n  Platform->>App: PlatformData (componentList)\n  Note over App: state = INITIALIZE",
      test: async function () {
        const config = getConfig();
        cuss2 = Cuss2.connect(
          config.client_id,
          config.client_secret,
          config.server_url,
          null,
          config.oauth_url,
        );

        // Listen for connection events
        cuss2.connection.on("connecting", (attemptCount) => {
          log(`Connecting to WebSocket... Attempt: ${attemptCount}`);
        });

        cuss2.connection.on("authenticating", (attemptCount) => {
          log(`Authenticating... Attempt: ${attemptCount}`);
        });

        cuss2.connection.once("authenticated", () => {
          log("Authenticated successfully");
        });

        cuss2.connection.on("close", () => {
          log("Connection closed");
        });

        cuss2.connection.on("error", (error) => {
          log(`Connection error: ${error.message}`);
        });

        // Wait for connection to be established
        log("Waiting for connection to be established...");
        await cuss2.connected;

        log("Connected successfully!");
        expect(cuss2.state).to.equal("INITIALIZE");
      },
    },
    {
      name: "it should accept setup in INITIALIZE state",
      description:
        "Sends a `PERIPHERALS_SETUP` directive while the application is in the `INITIALIZE` state. The `PERIPHERALS_SETUP` directive configures a component's operational parameters (such as media definitions for printers) and can be issued in any application state.\n\nThis test uses the first available printer component (`boardingPassPrinter` or `bagTagPrinter`) and calls its `setup()` method. The platform should accept the setup request and respond with `meta.messageCode` equal to `\"OK\"`.\n\nIf no printer component is available, the test is marked **inconclusive**.\n\n**Prerequisites:**\n- Application must be in `INITIALIZE` state\n- At least one printer component must be present in the component list",
      diagram: "sequenceDiagram\n  participant App\n  participant Platform\n  Note over App: state = INITIALIZE\n  App->>Platform: PERIPHERALS_SETUP (componentID)\n  Platform->>App: ACK (ACK_OK)\n  Platform->>App: PlatformData (messageCode: OK)",
      test: async function () {
        if (cuss2.state !== "INITIALIZE") {
          this.result = { status: "inconclusive", reason: `Not in INITIALIZE state (current: ${cuss2.state})` };
          return;
        }

        const result = await testSetupInState(cuss2, "INITIALIZE");
        if (result.inconclusive) {
          this.result = { status: "inconclusive", reason: result.reason };
        }
      },
    },
  ],
};
