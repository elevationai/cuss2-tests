import { describe, it, before, after } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { validateComponent } from "../componentValidation.ts";
import config from "../config.ts";
import { Connection } from "@cuss2/cuss2-ts";
import { Build, callAndDoBaselineValidation } from "../helper.ts";
import { PlatformDirectives, MessageCodes } from "@cuss2/models";

Deno.env.set("NODE_TLS_REJECT_UNAUTHORIZED", "0");

describe("Directive Calls", () => {
  let conn: Connection;

  before(async () => {
    conn = Connection.connect(
      config.server_url,
      config.client_id,
      config.client_secret,
      crypto.randomUUID(),  // deviceID
      config.oauth_url
    );
    await conn.waitFor('open');
    const ad = Build.applicationData(PlatformDirectives.PLATFORM_ENVIRONMENT);
    await conn.sendAndGetResponse(ad);
  });

  after(() => {
    conn.close();
  });

  it("should return `platformComponents` data", async () => {
    const ad = Build.applicationData(PlatformDirectives.PLATFORM_COMPONENTS);
    const res = await callAndDoBaselineValidation(conn, ad);
    expect(res.payload?.componentList).toBeTruthy();
    const componentList = res.payload?.componentList;
    if (componentList && Array.isArray(componentList)) {
      expect(componentList.length).toBeGreaterThan(1);
      for (const component of componentList) {
        validateComponent(component);
      }
    }
  });

  it("should require a componentId for `peripheralsQuery`", async () => {
    const ad = Build.applicationData(PlatformDirectives.PERIPHERALS_QUERY);
    await callAndDoBaselineValidation(conn, ad, {
      status: MessageCodes.DATA_MISSING
    });
  });

  it("should return `peripheralsQuery` data", async () => {
    const ad = Build.applicationData(PlatformDirectives.PERIPHERALS_QUERY, { componentID: 0 });
    await callAndDoBaselineValidation(conn, ad);
  });
});