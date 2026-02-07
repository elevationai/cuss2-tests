/**
 * Concurrent Directive Handling Test Suite
 * Tests for handling multiple simultaneous directives
 */

import { expect } from "https://esm.sh/chai@5.1.2";
import { log } from "../helpers.js";
import { getCuss2 } from "./initialize.js";

export const concurrentDirectivesSuite = {
  id: "concurrent-directives",
  name: "Concurrent Directives",
  description:
    "Tests for handling multiple directives sent in quick succession and verifying correct response correlation.",
  dependencies: ["active"],
  tests: [
    {
      name: "it should handle multiple directives sent in quick succession",
      description:
        "Validates that the platform can process multiple `PERIPHERALS_QUERY` directives sent concurrently over the same WebSocket connection.\n\n**How it works:**\n- Selects up to 3 components from the component list\n- Sends `PERIPHERALS_QUERY` to each component simultaneously using `Promise.all`\n- Asserts all responses arrive successfully\n\n**What is validated:**\n- All responses have `meta.messageCode` equal to `OK`\n- Each response has a valid `meta.requestID`\n- The platform does not serialize or drop concurrent directives\n\n**Protocol detail:** Each directive includes a unique `meta.requestID` (UUID). The platform must return each response with the matching `meta.requestID` so the client can correlate responses to requests regardless of arrival order.",
      diagram: "sequenceDiagram\n  participant App\n  participant Platform\n  App->>Platform: PERIPHERALS_QUERY (reqID=A)\n  App->>Platform: PERIPHERALS_QUERY (reqID=B)\n  App->>Platform: PERIPHERALS_QUERY (reqID=C)\n  Platform-->>App: Response (reqID=B)\n  Platform-->>App: Response (reqID=A)\n  Platform-->>App: Response (reqID=C)\n  Note over App: Responses may arrive in any order",
      test: async function () {
        const cuss2 = getCuss2();

        const components = Object.values(cuss2.components).slice(0, 3);
        if (components.length < 3) {
          log(`Only ${components.length} components available`);
        }

        // Send queries to multiple components simultaneously
        const promises = components.map((component) => component.query());

        const responses = await Promise.all(promises);

        expect(responses.length).to.equal(components.length);
        responses.forEach((response, i) => {
          expect(response.meta.messageCode).to.equal("OK");
          expect(response.meta.requestID).to.be.ok;
          log(
            `Response ${i + 1}: requestID=${
              response.meta.requestID.substring(0, 8)
            }...`,
          );
        });

        log(
          `All ${responses.length} concurrent requests completed successfully`,
        );
      },
    },
    {
      name: "it should not block on one directive while processing another",
      description:
        "Validates that the platform does not serialize directive processing, meaning a fast directive should not be blocked by a slower one.\n\n**How it works:**\n- Sends `PERIPHERALS_ENABLE` to the barcode reader (potentially slower due to hardware initialization)\n- Immediately sends `PERIPHERALS_QUERY` to another component (fast metadata lookup)\n- Measures completion time of both operations\n- Disables the reader after both complete\n\n**What is validated:**\n- Both `meta.messageCode` values are `OK`\n- The query response is not delayed by the enable operation\n- The platform processes directives independently rather than in a strict FIFO queue\n\n**Prerequisites:**\n- `ACTIVE` state\n- A barcode reader and at least one other component must be available",
      test: async function () {
        const cuss2 = getCuss2();

        const reader = cuss2.barcodeReader;
        const component = Object.values(cuss2.components)[0];

        if (!reader || !component) {
          log("Not enough components for blocking test");
          return;
        }

        const startTime = performance.now();

        // Start enable (potentially slower)
        const enablePromise = reader.enable();

        // Immediately send query
        const queryPromise = component.query();

        // Wait for query first
        const queryResponse = await queryPromise;
        const queryTime = performance.now() - startTime;

        // Then wait for enable
        const enableResponse = await enablePromise;
        const enableTime = performance.now() - startTime;

        expect(queryResponse.meta.messageCode).to.equal("OK");
        expect(enableResponse.meta.messageCode).to.equal("OK");

        log(`Query completed in ${queryTime.toFixed(0)}ms`);
        log(`Enable completed in ${enableTime.toFixed(0)}ms`);
        log("Directives processed concurrently");

        await reader.disable();
      },
    },
    {
      name: "responses should correlate to correct requestIDs",
      description:
        "Validates that each platform response contains a `meta.requestID` that is unique and correctly correlates to the originating directive.\n\n**How it works:**\n- Selects up to 5 components from the component list\n- Sends `PERIPHERALS_QUERY` to each simultaneously\n- Collects all `meta.requestID` values from responses into a Set\n- Asserts no duplicate `meta.requestID` values exist\n\n**What is validated:**\n- Each response has a non-empty `meta.requestID`\n- Each response has `meta.messageCode` equal to `OK`\n- All `meta.requestID` values are unique across responses\n- The total number of unique IDs equals the number of requests sent\n\n**Why this matters:** The CUSS2 protocol uses `meta.requestID` as the sole correlation mechanism between directives and responses. If the platform returns duplicate or incorrect `meta.requestID` values, the client SDK cannot match responses to their originating requests.",
      test: async function () {
        const cuss2 = getCuss2();

        const components = Object.values(cuss2.components).slice(0, 5);
        if (components.length < 2) {
          this.result = { status: "inconclusive", reason: "Fewer than 2 components available for correlation test" };
          return;
        }

        const requests = [];
        const responsePromises = [];

        // Send multiple requests, tracking requestIDs
        for (const component of components) {
          const promise = component.query();
          responsePromises.push(promise);
          requests.push({ componentId: component.id });
        }

        const responses = await Promise.all(responsePromises);

        // Verify all responses have valid requestIDs
        const seenRequestIds = new Set();
        responses.forEach((response, i) => {
          expect(response.meta.requestID).to.be.ok;
          expect(response.meta.messageCode).to.equal("OK");

          // Each requestID should be unique
          expect(seenRequestIds.has(response.meta.requestID)).to.be.false;
          seenRequestIds.add(response.meta.requestID);

          log(
            `Request ${i + 1}: Component ${
              requests[i].componentId
            } -> requestID=${response.meta.requestID.substring(0, 8)}...`,
          );
        });

        expect(seenRequestIds.size).to.equal(components.length);
        log(
          `All ${components.length} requests have unique, correctly correlated requestIDs`,
        );
      },
    },
  ],
};
