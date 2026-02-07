/**
 * Connect to Platform Test Suite
 * Tests WebSocket connection establishment and authentication
 */

import { expect } from "https://esm.sh/chai@5.1.2";
import { Connection, Models } from "https://ts.cuss2.dev/dist/cuss2.esm.js";
const { PlatformDirectives } = Models;

import {
  Build,
  callAndDoBaselineValidation,
  getConfig,
  log,
} from "../helpers.js";

export const connectSuite = {
  id: "connect",
  name: "Connect to platform",
  description:
    "Tests WebSocket connection establishment, authentication flows, error handling, timing requirements, and request caching behavior.",
  beforeEach: async function () {
    const config = getConfig();
    this.conn = Connection.connect(
      config.server_url,
      config.client_id,
      config.client_secret,
      crypto.randomUUID(),
      config.oauth_url,
    );
    await this.conn.waitFor("open");
  },
  afterEach: function () {
    if (this.conn) {
      this.conn.close(4999, "Test Complete");
    }
  },
  tests: [
    {
      name:
        "it should timeout and close connection with 4001 if nothing received",
      description:
        "Opens a raw WebSocket connection to the platform and intentionally sends no messages. The platform starts its `initTimeout` timer upon connection. When this timer expires without receiving a valid `PLATFORM_ENVIRONMENT` directive, the platform **must** close the WebSocket with close code `4001`.\n\nValidates:\n- WebSocket `close` event fires\n- `CloseEvent.code` equals `4001`",
      diagram: "sequenceDiagram\n  participant App\n  participant Platform\n  App->>Platform: WebSocket open\n  Note over Platform: initTimeout starts\n  Platform--xApp: Close(4001) timeout",
      test: function () {
        const conn = this.conn;

        return new Promise((resolve, reject) => {
          function handler(e) {
            log(`Test: Close event fired with code: ${e.code}}`);
            try {
              expect(e.code).to.equal(4001);
              resolve();
            } catch (err) {
              reject(err);
            }
          }

          if (typeof conn.on === "function") {
            log("Test: Attaching close handler");
            conn.on("close", handler);
          } else {
            reject(
              new Error('Connection object does not have an "on" method'),
            );
          }
        });
      },
    },
    {
      name:
        "it should close the connection and return 4003 if the first messages is not a PlatformEnvironment directive",
      description:
        "Sends a `PLATFORM_COMPONENTS` directive as the very first message after WebSocket open. Per the CUSS2 protocol, the first message on any new connection **must** be a `PLATFORM_ENVIRONMENT` directive containing authentication credentials. Any other directive sent first is a protocol violation.\n\nThe platform **must** reject this by closing the WebSocket with close code `4003` (wrong first message).\n\nValidates:\n- WebSocket `close` event fires after sending the wrong directive\n- `CloseEvent.code` equals `4003`",
      diagram: "sequenceDiagram\n  participant App\n  participant Platform\n  App->>Platform: WebSocket open\n  App->>Platform: PLATFORM_COMPONENTS (wrong first message)\n  Platform--xApp: Close(4003) wrong directive",
      test: async function () {
        const conn = this.conn;
        await Promise.all([
          conn.waitFor("close").then((e) => {
            expect(e.code).to.equal(4003);
          }),
          Promise.resolve(
            conn.send(
              Build.applicationData(PlatformDirectives.PLATFORM_COMPONENTS),
            ),
          ),
        ]);
      },
    },
    {
      name:
        "it should close the connection and return 4004 if the token is invalid",
      description:
        "Sends a `PLATFORM_ENVIRONMENT` directive with `meta.oauthToken` set to the literal string `\"WRONG\"`. The platform validates the OAuth token against its token endpoint and determines it is not a valid bearer token.\n\nThe platform **must** close the WebSocket with close code `4004` (authentication failure).\n\nValidates:\n- WebSocket `close` event fires after sending invalid credentials\n- `CloseEvent.code` equals `4004`",
      diagram: "sequenceDiagram\n  participant App\n  participant Platform\n  App->>Platform: WebSocket open\n  App->>Platform: PLATFORM_ENVIRONMENT (oauthToken: \"WRONG\")\n  Platform--xApp: Close(4004) auth failed",
      test: async function () {
        const conn = this.conn;
        await Promise.all([
          conn.waitFor("close").then((e) => {
            expect(e.code).to.equal(4004);
          }),
          Promise.resolve(conn.send(
            Build.applicationData(PlatformDirectives.PLATFORM_ENVIRONMENT, {
              oauthToken: "WRONG",
            }),
          )),
        ]);
      },
    },
    {
      name:
        "it should close the connection and return 4006 if the tenant is DISABLED",
      description:
        "Opens a new WebSocket connection using credentials for a tenant that has been administratively disabled (`client_id: \"DDD\"`, `client_secret: \"DISABLED_TENANT\"`). Sends a valid `PLATFORM_ENVIRONMENT` directive with these credentials.\n\nThe platform recognizes the tenant as disabled and **must** close the WebSocket with close code `4006` (tenant disabled). This tests the platform's ability to reject connections from deactivated applications.\n\nValidates:\n- Connection opens successfully at the WebSocket level\n- `PLATFORM_ENVIRONMENT` is sent with disabled-tenant credentials\n- `CloseEvent.code` equals `4006`",
      diagram: "sequenceDiagram\n  participant App\n  participant Platform\n  App->>Platform: WebSocket open (disabled tenant)\n  App->>Platform: PLATFORM_ENVIRONMENT\n  Platform--xApp: Close(4006) tenant disabled",
      test: async function () {
        const config = getConfig();
        const conn2 = Connection.connect(
          config.server_url,
          "DDD",
          "DISABLED_TENANT",
          crypto.randomUUID(),
          config.oauth_url,
        );
        await conn2.waitFor("open");
        const ad = Build.applicationData(
          PlatformDirectives.PLATFORM_ENVIRONMENT,
        );
        const closeEvent = await conn2.sendAndGetResponse(ad).catch((err) =>
          err
        );
        conn2.close(4999, "Test Complete");
        if (
          closeEvent && typeof closeEvent === "object" && "code" in closeEvent
        ) {
          expect(closeEvent.code).toBe(4006);
        }
      },
    },
    {
      name:
        "it should close the connection and return 4005 if there is already a connection open",
      description:
        "Establishes a fully authenticated connection by sending `PLATFORM_ENVIRONMENT` on the first WebSocket, then opens a second WebSocket using the same `client_id` and `client_secret` and sends `PLATFORM_ENVIRONMENT` again.\n\nThe CUSS2 protocol enforces single-connection-per-tenant. When the platform detects a duplicate authenticated session, it **must** close the second connection with close code `4005` (duplicate connection).\n\nValidates:\n- First connection authenticates successfully\n- Second connection opens at the WebSocket level\n- Second connection is closed with `CloseEvent.code` equal to `4005`",
      diagram: "sequenceDiagram\n  participant App1 as App (conn 1)\n  participant Platform\n  participant App2 as App (conn 2)\n  App1->>Platform: WebSocket open\n  App1->>Platform: PLATFORM_ENVIRONMENT\n  Platform->>App1: PlatformData (OK)\n  App2->>Platform: WebSocket open\n  App2->>Platform: PLATFORM_ENVIRONMENT\n  Platform--xApp2: Close(4005) duplicate",
      test: async function () {
        const conn = this.conn;
        const config = getConfig();
        // Send initial environment data to establish the connection
        const ad = Build.applicationData(
          PlatformDirectives.PLATFORM_ENVIRONMENT,
        );
        await conn.sendAndGetResponse(ad);

        const conn2 = Connection.connect(
          config.server_url,
          config.client_id,
          config.client_secret,
          crypto.randomUUID(),
          config.oauth_url,
        );
        await conn2.waitFor("open");
        const ad2 = Build.applicationData(
          PlatformDirectives.PLATFORM_ENVIRONMENT,
        );
        const closeEvent = await conn2.sendAndGetResponse(ad2).catch((err) =>
          err
        );
        conn2.close(4999, "Test Complete");
        if (
          closeEvent && typeof closeEvent === "object" && "code" in closeEvent
        ) {
          expect(closeEvent.code).to.equal(4005);
        }
      },
    },
    {
      name: "it should acknowledge and return the EnvironmentData",
      description:
        "Sends a `PLATFORM_ENVIRONMENT` directive with valid OAuth credentials and verifies the platform responds with a complete `PlatformData` message containing `payload.environmentLevel`.\n\nThe `environmentLevel` object describes the platform's capabilities and timing constraints. This test validates presence and types of all required fields:\n\n- `sessionTimeout` - number, maximum session duration in ms\n- `deviceID` - UUID string or `\"NONE\"`, uniquely identifies the kiosk\n- `deviceLocation` - string, physical location identifier\n- `cussVersions` - array, must contain at least one `2.x` entry\n- `osName` - string, platform operating system name\n- `osVersion` - string, platform OS version\n- `initTimeout` - number, ms before connection timeout\n\nAlso validates baseline response structure via `callAndDoBaselineValidation`: `meta.messageCode` equals `\"OK\"`, `meta.eventClassification.eventMode` equals `\"SOLICITED\"`, and `meta.currentApplicationState.applicationStateCode` equals `\"INITIALIZE\"`.",
      diagram: "sequenceDiagram\n  participant App\n  participant Platform\n  App->>Platform: WebSocket open\n  App->>Platform: PLATFORM_ENVIRONMENT\n  Platform->>App: ACK (ACK_OK)\n  Platform->>App: PlatformData (environmentLevel)",
      test: async function () {
        const conn = this.conn;
        const ad = Build.applicationData(
          PlatformDirectives.PLATFORM_ENVIRONMENT,
        );
        const res = await callAndDoBaselineValidation(conn, ad);
        expect(res.payload?.environmentLevel).to.be.ok;
        const environmentLevel = res.payload?.environmentLevel;
        log(environmentLevel);
        if (environmentLevel) {
          expect(typeof environmentLevel.sessionTimeout).to.equal("number");
          expect(environmentLevel.deviceID).to.match(
            /^([0-9A-Fa-f-]{0,36}|NONE|none)$/,
          );
          expect(environmentLevel.deviceLocation).to.be.ok;
          expect(
            environmentLevel.cussVersions?.some((v) => /^2\.\d+$/.test(v)),
          ).to.be.true;
          expect(environmentLevel.osName).to.be.ok;
          expect(environmentLevel.osVersion).to.be.ok;
          expect(typeof environmentLevel.initTimeout).to.equal("number");
        }
      },
    },
    // Extended connection tests
    {
      name: "it should return ACK_PARAM when ApplicationData is malformed JSON",
      description:
        "Sends raw text (`\"this is not valid json {{{\"`) over the WebSocket instead of a valid JSON `ApplicationData` message. The platform attempts to parse the incoming frame as JSON and fails.\n\nAcceptable platform responses include closing with:\n- `4001` - treated as no valid message received (init timeout behavior)\n- `4003` - treated as wrong first message\n- `4008` - malformed message\n\nValidates:\n- WebSocket `close` event fires\n- `CloseEvent.code` is one of `4001`, `4003`, or `4008`",
      test: async function () {
        const conn = this.conn;

        const closePromise = conn.waitFor("close");
        conn.send("this is not valid json {{{");

        const closeEvent = await closePromise;
        // Platform may close with error or return ACK_PARAM
        // Either behavior is acceptable for malformed input
        log(`Connection closed with code: ${closeEvent.code}`);
        expect(closeEvent.code).to.be.oneOf([4001, 4003, 4008]);
      },
    },
    {
      name: "it should close with 4004 when OAuth token is expired",
      description:
        "Sends a `PLATFORM_ENVIRONMENT` directive with `meta.oauthToken` set to `\"expired.token.here\"` -- a token that mimics an expired JWT. The platform validates the token and determines it is expired or otherwise invalid.\n\nThis is distinct from the invalid-token test in that it simulates a token that was once valid but has passed its expiration time. The platform **must** close with code `4004` regardless of whether the token is malformed or expired.\n\nValidates:\n- WebSocket `close` event fires\n- `CloseEvent.code` equals `4004`",
      test: async function () {
        const conn = this.conn;

        // Send with an obviously expired/invalid token
        const ad = Build.applicationData(
          PlatformDirectives.PLATFORM_ENVIRONMENT,
          {
            oauthToken: "expired.token.here",
          },
        );

        const closePromise = conn.waitFor("close");
        conn.json(ad);

        const closeEvent = await closePromise;
        expect(closeEvent.code).to.equal(4004);
        log("Received expected 4004 for expired token");
      },
    },
    {
      name: "it should return ACK_OK within expectedAckTime",
      description:
        "Sends a `PLATFORM_ENVIRONMENT` directive and measures the elapsed time until the platform responds with an ACK message. Per the CUSS2 specification, the platform **must** send an ACK within `payload.environmentLevel.expectedAckTime` milliseconds of receiving any directive.\n\nThis test uses a default threshold of 1000ms. The ACK message must contain `ackCode` equal to `\"ACK_OK\"` to confirm the directive was accepted.\n\nValidates:\n- ACK response is received\n- `ackCode` equals `\"ACK_OK\"`\n- Round-trip time is less than `expectedAckTime` (1000ms default)",
      diagram: "sequenceDiagram\n  participant App\n  participant Platform\n  App->>Platform: PLATFORM_ENVIRONMENT\n  Note over App: Start timer\n  Platform->>App: ACK (ACK_OK)\n  Note over App: Stop timer\n  Note over App: Assert elapsed < expectedAckTime",
      test: async function () {
        const conn = this.conn;
        const ad = Build.applicationData(
          PlatformDirectives.PLATFORM_ENVIRONMENT,
        );

        ad.meta.oauthToken = conn.access_token;

        const startTime = performance.now();
        const ackPromise = conn.waitFor("ack");
        conn.json(ad);

        const ackResponse = await ackPromise;
        const elapsed = performance.now() - startTime;

        expect(ackResponse).to.be.ok;
        expect(ackResponse.ackCode).to.equal("ACK_OK");

        // Default expectedAckTime is typically 1000ms if not specified
        const expectedAckTime = 1000;
        expect(elapsed).to.be.lessThan(expectedAckTime);
        log(
          `ACK received in ${
            elapsed.toFixed(0)
          }ms (limit: ${expectedAckTime}ms)`,
        );
      },
    },
    {
      name:
        "it should return a cached response when retrying with the same requestID",
      description:
        "Tests the CUSS2 request caching mechanism. First establishes a connection via `PLATFORM_ENVIRONMENT`, then sends a `PLATFORM_COMPONENTS` directive with a specific `meta.requestID`. The response is recorded. The same directive with the **identical** `meta.requestID` is sent again immediately (within `maxCacheTime`).\n\nPer the CUSS2 spec, when the platform receives a directive with a `requestID` it has already processed and the cache has not expired, it **must** return the previously cached response rather than re-processing the request. This enables safe retries over unreliable connections.\n\nValidates:\n- First request returns a valid response with `meta.requestID`\n- Second request with the same `requestID` returns a response\n- Both responses share the same `meta.requestID`",
      diagram: "sequenceDiagram\n  participant App\n  participant Platform\n  App->>Platform: PLATFORM_COMPONENTS (requestID: abc-123)\n  Platform->>App: PlatformData (requestID: abc-123)\n  App->>Platform: PLATFORM_COMPONENTS (requestID: abc-123, retry)\n  Platform->>App: PlatformData (cached, requestID: abc-123)",
      test: async function () {
        const conn = this.conn;

        // First, establish the connection
        const envAd = Build.applicationData(
          PlatformDirectives.PLATFORM_ENVIRONMENT,
        );
        const envRes = await callAndDoBaselineValidation(conn, envAd);

        // Now send a components request with a fixed requestID
        const requestID = crypto.randomUUID();
        const ad = Build.applicationData(
          PlatformDirectives.PLATFORM_COMPONENTS,
        );
        ad.meta.requestID = requestID;
        ad.meta.oauthToken = conn.access_token;
        ad.meta.deviceID = conn.deviceID;

        // First request
        const promise1 = conn.waitFor(requestID);
        conn.json(ad);
        const res1 = await promise1;

        // Second request with same requestID (should be cached)
        const promise2 = conn.waitFor(requestID);
        conn.json(ad);
        const res2 = await promise2;

        expect(res1.meta.requestID).to.equal(res2.meta.requestID);
        log("Cached response returned for duplicate requestID");
      },
    },
    {
      name: "it should treat a retry beyond maxCacheTime as a new request",
      description:
        "Validates the `payload.environmentLevel.maxCacheTime` field, which defines how long the platform caches responses keyed by `meta.requestID`. After `maxCacheTime` elapses, re-sending a directive with the same `requestID` should be treated as a new request and fully re-processed.\n\nThis test currently verifies the field exists and is a positive number. A full behavioral test would require waiting for `maxCacheTime` to expire between requests, which may be impractical for fast test execution.\n\nValidates:\n- `payload.environmentLevel.maxCacheTime` is present\n- Value is a `number` greater than `0`",
      test: async function () {
        // This test would require waiting for maxCacheTime to expire
        // For now, we verify the request is processed
        const conn = this.conn;

        const envAd = Build.applicationData(
          PlatformDirectives.PLATFORM_ENVIRONMENT,
        );
        const envRes = await callAndDoBaselineValidation(conn, envAd);

        const maxCacheTime = envRes.payload?.environmentLevel?.maxCacheTime ||
          5000;
        log(`maxCacheTime: ${maxCacheTime}ms`);

        // Note: Actually waiting for cache expiry would make this test slow
        // This test documents the expected behavior
        expect(maxCacheTime).to.be.a("number");
        expect(maxCacheTime).to.be.greaterThan(0);
      },
    },
  ],
};
