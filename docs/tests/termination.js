/**
 * Termination Test Suite
 * Tests for session timeout and platform shutdown behavior
 */

import { expect } from "https://esm.sh/chai@5.1.2";
import { Cuss2 } from "https://ts.cuss2.dev/dist/cuss2.esm.js";
import { getConfig, log, promptUser, validateUnsolicitedMessage } from "../helpers.js";
import { getCuss2 } from "./initialize.js";

export const terminationSuite = {
  id: "termination",
  name: "Termination",
  description:
    "Tests for session timeout and platform shutdown behavior. Uses fresh connections to ensure timer starts from zero.",
  beforeAll: async function () {
    // Close existing connection so we can create fresh ones for timeout tests
    const cuss2 = getCuss2();
    if (cuss2?.connection) {
      log("Closing existing connection for timeout tests...");
      await new Promise((resolve) => {
        cuss2.connection.once("close", resolve);
        cuss2.connection.close(4999, "Preparing for timeout tests");
      });
      // Small delay to ensure server has processed the disconnect
      await new Promise((resolve) => setTimeout(resolve, 500));
      log("Existing connection closed");
    }
  },
  tests: [
    {
      name: "it should receive SESSION_TIMEOUT and then disconnect after killTimeout",
      requiredTests: ["initialize.0"],
      description:
        "Creates a fresh WebSocket connection and transitions through all states to ACTIVE, then waits for the full session timeout and kill timeout sequence.\n\nA fresh connection is used so the `sessionTimeout` timer starts from zero. After entering ACTIVE state, the test waits for the platform to send a `SESSION_TIMEOUT` unsolicited message once `sessionTimeout` milliseconds have elapsed. It then waits for the kill timer (`killTimeout`) to expire, at which point the platform forcibly closes the WebSocket connection.\n\n**What is validated:**\n- State transitions succeed: INITIALIZE to UNAVAILABLE to AVAILABLE to ACTIVE\n- `SESSION_TIMEOUT` unsolicited message is received within `sessionTimeout + 5000` ms\n- The message has `meta.messageCode` equal to `SESSION_TIMEOUT`\n- The unsolicited message has a valid `eventClassification` (via `validateUnsolicitedMessage`)\n- The WebSocket connection is closed after `killTimeout` ms with close code `4007`\n\n**Prerequisites:**\n- Platform must provide `sessionTimeout` and `killTimeout` in the `EnvironmentLevel` data\n- The existing connection is closed in `beforeAll` to ensure a fresh timer\n- Test timeout is set to 180 seconds to accommodate long timer values",
      diagram: "sequenceDiagram\n    participant App as Application\n    participant Platform as CUSS2 Platform\n    App->>Platform: Connect (fresh WebSocket)\n    Platform-->>App: PLATFORM_DATA (environment)\n    App->>Platform: requestUnavailableState()\n    Platform-->>App: UNAVAILABLE\n    App->>Platform: requestAvailableState()\n    Platform-->>App: AVAILABLE\n    App->>Platform: requestActiveState()\n    Platform-->>App: ACTIVE\n    Note over Platform: sessionTimeout countdown starts\n    Note over Platform: ...sessionTimeout ms elapse...\n    Platform-->>App: SESSION_TIMEOUT (unsolicited)\n    Note over Platform: killTimeout countdown starts\n    Note over Platform: ...killTimeout ms elapse...\n    Platform--xApp: WebSocket close (code 4007)",
      timeout: 180000, // 3 minutes - allows for long session + kill timeouts
      test: async function () {
        const config = getConfig();

        // Create a fresh connection so the session timer starts now
        const cuss2 = Cuss2.connect(
          config.client_id,
          config.client_secret,
          config.server_url,
          null,
          config.oauth_url,
        );

        await cuss2.connected;
        const env = cuss2.environment;

        if (!env || !env.sessionTimeout || !env.killTimeout) {
          cuss2.connection.close(4999, "Test Complete");
          expect.fail("Environment data not available - cannot test timeouts");
        }

        // Transition to ACTIVE so the session timer starts
        // INITIALIZE → UNAVAILABLE → AVAILABLE → ACTIVE
        await cuss2.requestUnavailableState();
        expect(cuss2.state).to.equal("UNAVAILABLE");
        await cuss2.requestAvailableState();
        expect(cuss2.state).to.equal("AVAILABLE");
        await cuss2.requestActiveState();
        expect(cuss2.state).to.equal("ACTIVE");
        log(`State: ${cuss2.state}`);

        log(`sessionTimeout: ${env.sessionTimeout}ms, killTimeout: ${env.killTimeout}ms`);

        // Calculate remaining session time
        const remainingMs = env.sessionTimeout - (cuss2.sessionDuration || 0);

        log("Waiting for SESSION_TIMEOUT message...");

        // Wait for SESSION_TIMEOUT with countdown
        const message = await promptUser(
          "Waiting for SESSION_TIMEOUT",
          () => new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              cuss2.connection.off("message", handler);
              reject(new Error(`Timeout waiting for SESSION_TIMEOUT (waited ${env.sessionTimeout + 5000}ms)`));
            }, env.sessionTimeout + 5000);

            const handler = (msg) => {
              if (msg.meta?.messageCode === "SESSION_TIMEOUT") {
                clearTimeout(timeout);
                cuss2.connection.off("message", handler);
                resolve(msg);
              }
            };
            cuss2.connection.on("message", handler);
          }),
          { icon: "timer", countdown: remainingMs },
        );

        expect(message.meta.messageCode).to.equal("SESSION_TIMEOUT");
        validateUnsolicitedMessage(message);
        log("SESSION_TIMEOUT received with correct eventClassification");

        // Now wait for connection close (should happen after killTimeout)
        log("Waiting for kill timeout...");
        const closeEvent = await promptUser(
          "Waiting for KILL_TIMEOUT",
          () => new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              cuss2.connection.off("close", handler);
              reject(new Error(`Connection not closed after killTimeout (waited ${env.killTimeout + 5000}ms)`));
            }, env.killTimeout + 5000);

            const handler = (event) => {
              clearTimeout(timeout);
              resolve(event);
            };
            cuss2.connection.once("close", handler);
          }),
          { icon: "timer", countdown: env.killTimeout },
        );

        log(`Connection closed with code: ${closeEvent.code}`);
        expect(closeEvent.code).to.equal(4007); // Kill timeout code
      },
    },
    {
      name: "it should receive SYSTEM_SHUTDOWN before platform shuts down",
      requiredTests: ["initialize.0"],
      description:
        "Creates a fresh WebSocket connection, transitions to ACTIVE, then prompts the operator to shut down the CUSS2 platform.\n\nBefore a CUSS2 platform shuts down (for maintenance, restart, or end of operations), it must send a `SYSTEM_SHUTDOWN` unsolicited message to all connected applications. This gives applications an opportunity to save state and clean up before the connection is terminated.\n\n**What is validated:**\n- State transitions succeed through to ACTIVE\n- The `SYSTEM_SHUTDOWN` unsolicited message is received before the connection closes\n- The message has `meta.messageCode` equal to `SYSTEM_SHUTDOWN`\n- The unsolicited message has a valid `eventClassification` (via `validateUnsolicitedMessage`)\n\n**Prerequisites:**\n- A fresh connection is created for this test\n- The operator must have access to shut down the CUSS2 platform\n- The connection must not close before the `SYSTEM_SHUTDOWN` message is received",
      diagram: "sequenceDiagram\n    participant Op as Operator\n    participant Platform as CUSS2 Platform\n    participant App as Application\n    App->>Platform: Connect + transition to ACTIVE\n    Note over App: Waiting for shutdown...\n    Op->>Platform: Initiate platform shutdown\n    Platform-->>App: SYSTEM_SHUTDOWN (unsolicited)\n    Note over App: Save state, clean up\n    Platform--xApp: WebSocket close",
      test: async function () {
        const config = getConfig();

        // Create a fresh connection
        const cuss2 = Cuss2.connect(
          config.client_id,
          config.client_secret,
          config.server_url,
          null,
          config.oauth_url,
        );

        await cuss2.connected;

        // Transition to ACTIVE
        await cuss2.requestUnavailableState();
        await cuss2.requestAvailableState();
        await cuss2.requestActiveState();
        log(`State: ${cuss2.state}`);

        const env = cuss2.environment;
        const killMs = env
          ? (env.sessionTimeout + env.killTimeout) - (cuss2.sessionDuration || 0)
          : undefined;

        const message = await promptUser(
          "Shut down the CUSS2 platform<br>KILL_TIMEOUT will happen in",
          () =>
            new Promise((resolve, reject) => {
              const messageHandler = (msg) => {
                if (msg.meta?.messageCode === "SYSTEM_SHUTDOWN") {
                  cuss2.connection.off("message", messageHandler);
                  cuss2.connection.off("close", closeHandler);
                  resolve(msg);
                }
              };
              const closeHandler = (event) => {
                cuss2.connection.off("message", messageHandler);
                if (event?.code === 4007) {
                  reject(new Error("Session was killed (4007 KILL_TIMEOUT) before SYSTEM_SHUTDOWN was received"));
                } else {
                  reject(new Error(`Connection closed (code: ${event?.code || "unknown"}) before SYSTEM_SHUTDOWN received`));
                }
              };
              cuss2.connection.on("message", messageHandler);
              cuss2.connection.once("close", closeHandler);
            }),
          { icon: "power-off", countdown: killMs },
        );

        expect(message.meta.messageCode).to.equal("SYSTEM_SHUTDOWN");
        validateUnsolicitedMessage(message);
        log("SYSTEM_SHUTDOWN received with correct eventClassification");
      },
    },
  ],
};
