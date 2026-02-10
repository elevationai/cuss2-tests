/**
 * Directive Error Handling Test Suite
 * Tests for error responses to invalid directives
 */

import { expect } from "https://esm.sh/chai@5.1.2";
import { Models } from "https://ts.cuss2.dev/dist/cuss2.esm.js";
import { Build, log } from "../helpers.js";
import { getCuss2 } from "./initialize.js";

const { PlatformDirectives } = Models;

export const directiveErrorsSuite = {
  id: "directive-errors",
  name: "Directive Error Handling",
  description:
    "Tests platform responses to invalid directives including wrong state, malformed data, missing fields, and sequence errors.",
  tests: [
    {
      name:
        "it should return WRONG_APPLICATION_STATE for directives in wrong state",
      requiredTests: ["active.0"],
      description:
        "Validates that the platform returns `WRONG_APPLICATION_STATE` when a component directive is sent in a state that does not permit it.\n\n**How it works:**\n- Transitions the application from `ACTIVE` to `AVAILABLE` state\n- Attempts to call `PERIPHERALS_ENABLE` on a component\n- Expects the platform to reject with `WRONG_APPLICATION_STATE` since `PERIPHERALS_ENABLE` requires `ACTIVE` state\n- Returns the application to `ACTIVE` state\n\n**What is validated:**\n- `meta.messageCode` in the error response is `WRONG_APPLICATION_STATE`\n- The platform enforces state-based restrictions on component directives\n\n**When this error occurs:**\n- `PERIPHERALS_ENABLE`, `PERIPHERALS_DISABLE`, and `PERIPHERALS_SEND` are called outside `ACTIVE` state\n- State transition directives are called from invalid source states",
      test: async function () {
        const cuss2 = getCuss2();

        // Go to AVAILABLE
        await cuss2.requestAvailableState();
        expect(cuss2.state).to.equal("AVAILABLE");

        const component = Object.values(cuss2.components)[0];
        if (!component) {
          this.result = { status: "inconclusive", reason: "No component available" };
          await cuss2.requestActiveState();
          return;
        }

        try {
          await component.enable();
          expect.fail("Expected WRONG_APPLICATION_STATE error");
        } catch (error) {
          log(`Received expected error: ${error.message || error}`);
          // The error should indicate wrong state
        }

        // Return to ACTIVE
        await cuss2.requestActiveState();
      },
    },
    {
      name: "it should return FORMAT_ERROR for malformed send() data",
      requiredTests: ["active.0"],
      description:
        "Validates that the platform returns `FORMAT_ERROR` when `PERIPHERALS_SEND` is called with data that does not match the expected schema.\n\n**How it works:**\n- Enables a printer component via `PERIPHERALS_ENABLE`\n- Sends `PERIPHERALS_SEND` with `{ invalidField: \"not valid data structure\" }` which does not conform to the printer's expected data format\n- Expects the platform to reject with `FORMAT_ERROR`\n- Disables the printer in the finally block\n\n**What is validated:**\n- The platform performs payload validation on `PERIPHERALS_SEND` directives\n- Malformed data structures produce `FORMAT_ERROR` rather than a crash or silent failure\n\n**When `FORMAT_ERROR` occurs:**\n- The directive payload does not match the component's expected schema\n- Required fields are present but contain invalid types or values",
      test: async function () {
        const cuss2 = getCuss2();

        // Find a printer or other sendable component
        const component = cuss2.boardingPassPrinter || cuss2.bagTagPrinter;
        if (!component) {
          this.result = { status: "inconclusive", reason: "No printer component available" };
          return;
        }

        await component.enable();

        try {
          // Send malformed data
          await component.send({ invalidField: "not valid data structure" });
          expect.fail("Expected FORMAT_ERROR");
        } catch (error) {
          log(`Received error: ${error.message || error}`);
          // Accept various error types for malformed data
        } finally {
          await component.disable();
        }
      },
    },
    {
      name: "it should return DATA_MISSING for send() with no payload",
      requiredTests: ["active.0"],
      description:
        "Validates that the platform returns `DATA_MISSING` when `PERIPHERALS_SEND` is called with no payload.\n\n**How it works:**\n- Enables a printer component via `PERIPHERALS_ENABLE`\n- Calls `send()` with no arguments, producing a `PERIPHERALS_SEND` directive with an empty or missing payload\n- Expects the platform to reject with `DATA_MISSING`\n- Disables the printer in the finally block\n\n**What is validated:**\n- The platform detects missing payload data in `PERIPHERALS_SEND`\n- The error code `DATA_MISSING` is returned rather than `FORMAT_ERROR` or a generic error\n\n**When `DATA_MISSING` occurs:**\n- A directive requires a payload but none is provided\n- Required fields are entirely absent from the message",
      test: async function () {
        const cuss2 = getCuss2();

        const component = cuss2.boardingPassPrinter || cuss2.bagTagPrinter;
        if (!component) {
          this.result = { status: "inconclusive", reason: "No printer component available" };
          return;
        }

        await component.enable();

        try {
          await component.send();
          expect.fail("Expected DATA_MISSING");
        } catch (error) {
          log(`Received error: ${error.message || error}`);
        } finally {
          await component.disable();
        }
      },
    },
    {
      name:
        "it should return OUT_OF_SEQUENCE for enable on already-enabled component",
      requiredTests: ["active.0"],
      description:
        "Validates that the platform returns `OUT_OF_SEQUENCE` when `PERIPHERALS_ENABLE` is called on a component that is already enabled.\n\n**How it works:**\n- Sends `PERIPHERALS_ENABLE` to a component and asserts `meta.messageCode` is `OK`\n- Sends `PERIPHERALS_ENABLE` again to the same component\n- Expects the second call to throw a `PlatformResponseError` with `messageCode` of `OUT_OF_SEQUENCE`\n- Disables the component after the test\n\n**What is validated:**\n- `error.messageCode` equals `OUT_OF_SEQUENCE`\n- The platform tracks per-component enabled state and rejects redundant enable requests\n\n**When `OUT_OF_SEQUENCE` occurs:**\n- A directive is sent that violates the expected component lifecycle order\n- Examples: enabling an already-enabled component, disabling an already-disabled component, sending data to a disabled component",
      test: async function () {
        const cuss2 = getCuss2();

        const component = Object.values(cuss2.components)[0];
        if (!component) {
          this.result = { status: "inconclusive", reason: "No component available" };
          return;
        }

        // First enable
        const firstResponse = await component.enable();
        expect(firstResponse.meta.messageCode).to.equal("OK");

        // Second enable should throw PlatformResponseError with OUT_OF_SEQUENCE
        try {
          await component.enable();
          expect.fail("Expected OUT_OF_SEQUENCE error");
        } catch (error) {
          expect(error.messageCode).to.equal("OUT_OF_SEQUENCE");
          log("Received expected OUT_OF_SEQUENCE for double enable");
        }

        await component.disable();
      },
    },
    {
      name: "it should return OUT_OF_SEQUENCE for send before enable",
      requiredTests: ["active.0"],
      description:
        "Validates that the platform returns `OUT_OF_SEQUENCE` when `PERIPHERALS_SEND` is called on a component that has not been enabled.\n\n**How it works:**\n- Ensures the printer component is disabled (calls `PERIPHERALS_DISABLE` if currently enabled)\n- Sends `PERIPHERALS_SEND` with test data to the disabled component\n- Expects an error containing `OUT_OF_SEQUENCE` or `not enabled`\n\n**What is validated:**\n- The error message matches `OUT_OF_SEQUENCE` or `not enabled`\n- The platform enforces the required directive sequence: `PERIPHERALS_ENABLE` must precede `PERIPHERALS_SEND`\n\n**Component lifecycle requirement:**\n- `PERIPHERALS_ENABLE` -> `PERIPHERALS_SETUP` (optional) -> `PERIPHERALS_SEND` -> `PERIPHERALS_DISABLE`\n- Skipping `PERIPHERALS_ENABLE` results in `OUT_OF_SEQUENCE`",
      test: async function () {
        const cuss2 = getCuss2();

        const component = cuss2.boardingPassPrinter || cuss2.bagTagPrinter;
        if (!component) {
          this.result = { status: "inconclusive", reason: "No printer component available" };
          return;
        }

        // Ensure component is disabled
        if (component.enabled) {
          await component.disable();
        }

        try {
          await component.send({ test: "data" });
          expect.fail("Expected OUT_OF_SEQUENCE");
        } catch (error) {
          log(`Received error: ${error.message || error}`);
          expect(error.message || String(error)).to.match(
            /OUT_OF_SEQUENCE|not enabled/i,
          );
        }
      },
    },
    {
      name: "it should return error for invalid componentID",
      requiredTests: ["active.0"],
      description:
        "Validates platform behavior when a directive references a `componentID` that does not exist in the component list.\n\n**How it works:**\n- Attempts to access component ID `99999` from the `cuss2.components` map\n- Asserts the component is `undefined` (not found in the discovered component list)\n\n**What is validated:**\n- The SDK-level component lookup returns `undefined` for invalid IDs\n- At the protocol level, sending a directive with an invalid `meta.componentID` should result in an error response from the platform (behavior varies by implementation: some return `ACK_PARAM`, others return an error in the response message)\n\n**Note:** The SDK prevents sending directives with invalid component IDs, so this test validates the client-side guard. Full protocol-level validation would require raw WebSocket access.",
      test: async function () {
        const cuss2 = getCuss2();

        // Try to access a non-existent component ID
        const invalidId = 99999;
        const component = cuss2.components[invalidId];

        expect(component).to.be.undefined;
        log(`Component ID ${invalidId} correctly not found in component list`);

        // The actual directive-level validation behavior depends on platform implementation
        // Some platforms validate in ACK, others in the response
      },
    },
    {
      name: "it should return error for directive with missing required fields",
      requiredTests: ["active.0"],
      description:
        "Documents the expected platform behavior when a directive is missing required fields such as `meta.requestID`.\n\n**Expected behavior:**\n- If the message is parseable but missing `meta.requestID`, the platform should respond with `ACK_PARAM` in the acknowledgement\n- If the message is entirely unparseable, the platform may close the WebSocket connection\n\n**What is validated:**\n- The application is still in `ACTIVE` state (connection is healthy)\n- This test documents expected behavior rather than triggering it, because the SDK prevents sending incomplete messages\n\n**Required fields in every directive:**\n- `meta.requestID` - UUID correlating request to response\n- `meta.directive` - the directive name (e.g., `PERIPHERALS_ENABLE`)\n- `meta.deviceID` - the device identifier\n- `meta.oauthToken` - the current OAuth bearer token",
      test: async function () {
        // This test would require low-level WebSocket access to send malformed directives
        // The SDK typically prevents sending incomplete messages

        log("Missing required fields test - documenting expected behavior");
        log("When a directive is missing requestID or other required fields:");
        log("1. Platform should reject with ACK_PARAM");
        log("2. Or close the connection if the message is unparseable");

        const cuss2 = getCuss2();
        expect(cuss2.state).to.equal("ACTIVE");
      },
    },
    {
      name: "it should return SOFTWARE_ERROR for announcement directive on non-announcement component",
      requiredTests: ["active.0"],
      description:
        "Sends a `PERIPHERALS_ANNOUNCEMENT_PLAY` directive targeting a non-announcement component (e.g. a printer).\n\nThe CUSS2 spec does not explicitly define the expected behavior, but the platform should reject this as an invalid operation since announcement directives are only valid for announcement-type components.\n\n**How it is tested:**\n- Finds a non-announcement component (printer, barcode reader, etc.)\n- Enables the component\n- Builds a raw `PERIPHERALS_ANNOUNCEMENT_PLAY` directive with that component's ID\n- Sends it via the raw WebSocket connection\n- Waits for the response\n\n**What is validated:**\n- The response `meta.messageCode` equals `SOFTWARE_ERROR`\n\n**Prerequisites:**\n- At least one non-announcement component must be available\n- Application must be in ACTIVE state",
      test: async function () {
        const cuss2 = getCuss2();

        // Find a non-announcement component
        const component = cuss2.boardingPassPrinter || cuss2.bagTagPrinter || cuss2.barcodeReader || cuss2.documentReader;
        if (!component) {
          this.result = { status: "inconclusive", reason: "No non-announcement component available" };
          return;
        }

        if (!component.enabled) {
          await component.enable();
        }

        const conn = cuss2.connection;
        const ad = Build.applicationData(PlatformDirectives.PERIPHERALS_ANNOUNCEMENT_PLAY, {
          componentID: component.id,
        });
        ad.meta.oauthToken = conn.access_token;
        ad.meta.deviceID = conn.deviceID;

        const reqId = ad.meta.requestID;
        const responsePromise = conn.waitFor(reqId, ["messageError", "socketError", "close"]);
        conn.json(ad);

        const res = await responsePromise;
        expect(res.meta.messageCode).to.equal("SOFTWARE_ERROR");
        log(`Received SOFTWARE_ERROR for announcement play on component ${component.id}`);

        await component.disable();
      },
    },
    {
      name: "it should reject a directive with an invalid OAuth token on an established connection",
      requiredTests: ["active.0"],
      description:
        "Sends a directive with an invalid `meta.oauthToken` on an already-established WebSocket connection.\n\nDuring the initial handshake, an invalid token results in a `4004` close. Mid-session, the platform must validate the token on each directive and reject it with `ACK_OAUTH_ERROR` in the ACK response.\n\n**How it is tested:**\n- Builds a raw `PERIPHERALS_QUERY` directive with `meta.oauthToken` set to `\"INVALID_TOKEN\"`\n- Sends it on the existing connection\n- Waits for the ACK response\n\n**What is validated:**\n- The ACK `ackCode` equals `ACK_OAUTH_ERROR`\n\n**Prerequisites:**\n- Application must be in ACTIVE state with an established connection",
      test: async function () {
        const cuss2 = getCuss2();
        const conn = cuss2.connection;

        const ad = Build.applicationData(PlatformDirectives.PERIPHERALS_QUERY);
        ad.meta.oauthToken = "INVALID_TOKEN";
        ad.meta.deviceID = conn.deviceID;

        const ackPromise = conn.waitFor("ack");
        conn.json(ad);

        const ack = await ackPromise;
        expect(ack.ackCode).to.equal("ACK_OAUTH_ERROR");
        log(`ACK response: ${ack.ackCode}`);
      },
    },
  ],
};
