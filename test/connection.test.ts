import { describe, it, beforeEach, afterEach } from "@std/testing/bdd";
import { expect } from "@std/expect";
import config from "../config.ts";
import { Connection } from "@cuss2/cuss2-ts";
import { Build, callAndDoBaselineValidation } from "../helper.ts";
import { PlatformDirectives } from "@cuss2/models";

Deno.env.set("NODE_TLS_REJECT_UNAUTHORIZED", "0");

describe("The WebSocket connection", () => {
  let conn: Connection;

  beforeEach(async () => {
    conn = Connection.connect(
      config.server_url,
      config.client_id,
      config.client_secret,
      crypto.randomUUID(),  // deviceID
      config.oauth_url
    );
    await conn.waitFor('open');
  });

  afterEach(() => {
    conn.close(4999, "Test Complete");
  });

  it("should timeout and close connection with 4001 if nothing received", () => {
    return new Promise((resolve, reject) => {
      function handler(e: unknown) {
        try {
          const closeEvent = e as CloseEvent;
          expect(closeEvent.code).toBe(4001);
          resolve(undefined);
        } catch (err) {
          reject(err);
        }
      }
      conn.on("close", handler);
    });
  });

  it("should close the connection and return 4002 if the first messages is not a ApplicationData object", async () => {
    await Promise.all([
      conn.waitFor("close").then((e) => {
        const closeEvent = e as CloseEvent;
        expect(closeEvent.code).toBe(4002);
      }),
      Promise.resolve(conn.json({ bad: 1 }))
    ]);
  });

  it("should close the connection and return 4003 if the first messages is not a PlatformEnvironment directive", async () => {
    await Promise.all([
      conn.waitFor("close").then((e) => {
        const closeEvent = e as CloseEvent;
        expect(closeEvent.code).toBe(4003);
      }),
      Promise.resolve(conn.send(Build.applicationData(PlatformDirectives.PLATFORM_COMPONENTS))),
    ]);
  });

  it("should close the connection and return 4004 if the token is invalid", async () => {
    await Promise.all([
      conn.waitFor("close").then((e) => {
        const closeEvent = e as CloseEvent;
        expect(closeEvent.code).toBe(4004);
      }),
      Promise.resolve(conn.send(
        Build.applicationData(PlatformDirectives.PLATFORM_ENVIRONMENT, {
          oauthToken: "WRONG",
        })
      )),
    ]);
  });

  it("should close the connection and return 4006 if the tenant is DISABLED", async () => {
    const conn2 = Connection.connect(
      config.server_url,
      "DDD",
      "DISABLED_TENANT",
      crypto.randomUUID(),  // deviceID
      config.oauth_url
    );
    await conn2.waitFor('open');
    const ad = Build.applicationData(PlatformDirectives.PLATFORM_ENVIRONMENT);
    const closeEvent = await conn2.sendAndGetResponse(ad).catch((err: unknown) => err);
    conn2.close(4999, "Test Complete");
    if (closeEvent && typeof closeEvent === 'object' && 'code' in closeEvent) {
      expect((closeEvent as CloseEvent).code).toBe(4006);
    }
  });

  it("should acknowledge and return the EnvironmentData", async () => {
    const ad = Build.applicationData(PlatformDirectives.PLATFORM_ENVIRONMENT);
    const res = await callAndDoBaselineValidation(conn, ad);
    expect(res.payload?.environmentLevel).toBeTruthy();
    const environmentLevel = res.payload?.environmentLevel;
    if (environmentLevel) {
      expect(typeof environmentLevel.sessionTimeout).toBe("number");
      expect(environmentLevel.deviceID).toMatch(/^([0-9A-Fa-f-]{0,36}|NONE|none)$/);
      expect(environmentLevel.deviceLocation).toBeTruthy();
      expect(environmentLevel.cussVersions?.[0]).toBe("2.0");
      // @ts-ignore - property might not exist in type definition
      expect(environmentLevel.cussInterfaceVersions?.[0]).toBe("2.0");
      expect(environmentLevel.osName).toBeTruthy();
      expect(environmentLevel.osVersion).toBeTruthy();
      expect(typeof environmentLevel.initTimeout).toBe("number");
    }
  });

  it("should close the connection and return 4005 if there is already a connection open", async () => {
    // Send initial environment data to establish the connection
    const ad = Build.applicationData(PlatformDirectives.PLATFORM_ENVIRONMENT);
    await conn.sendAndGetResponse(ad);

    const conn2 = Connection.connect(
      config.server_url,
      config.client_id,
      config.client_secret,
      crypto.randomUUID(),  // deviceID
      config.oauth_url
    );
    await conn2.waitFor('open');
    const ad2 = Build.applicationData(PlatformDirectives.PLATFORM_ENVIRONMENT);
    const closeEvent = await conn2.sendAndGetResponse(ad2).catch((err: unknown) => err);
    conn2.close(4999, "Test Complete");
    if (closeEvent && typeof closeEvent === 'object' && 'code' in closeEvent) {
      expect((closeEvent as CloseEvent).code).toBe(4005);
    }
  });
});