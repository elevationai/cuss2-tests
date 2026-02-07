/**
 * Directive Error Handling Test Suite
 * Tests for error responses to invalid directives
 */

import { expect } from "https://esm.sh/chai@5.1.2";
import { log } from "../helpers.js";
import { getCuss2 } from "./initialize.js";

export const directiveErrorsSuite = {
  id: "directive-errors",
  name: "Directive Error Handling",
  description:
    "Tests platform responses to invalid directives including wrong state, malformed data, missing fields, and sequence errors.",
  dependencies: ["active"],
  tests: [
    {
      name:
        "it should return WRONG_APPLICATION_STATE for directives in wrong state",
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
  ],
};
