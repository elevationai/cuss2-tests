import { describe, it, before, after } from "@std/testing/bdd";
import {
  ApplicationState,
  ApplicationStateChangeReasonCodes,
  ApplicationStateCodes,
  MessageCodes,
  PlatformDirectives,
} from "@cuss2/models";
import config from "../config.ts";
import { Connection } from "@cuss2/cuss2-ts";
import { Build, callAndDoBaselineValidation } from "../helper.ts";

Deno.env.set("NODE_TLS_REJECT_UNAUTHORIZED", "0");

describe("Applications State Requests", () => {
  let conn: Connection;

  const connect = async () => {
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
  };

  const close = () => {
    conn.close();
  };

  async function requestState(
    state: ApplicationStateCodes,
    expectedResponse?: { state?: ApplicationStateCodes; status?: MessageCodes }
  ): Promise<void> {
    const dataObj = {
      applicationStateCode: state,
      accessibleMode: false,
      applicationStateChangeReasonCode: ApplicationStateChangeReasonCodes.NOT_APPLICABLE,
    } as ApplicationState;

    const ad = Build.applicationData(PlatformDirectives.PLATFORM_APPLICATIONS_STATEREQUEST, { dataObj });
    await callAndDoBaselineValidation(conn, ad, {
      state: state,
      ...expectedResponse,
    });
  }

  describe("While in INITIALIZE State", () => {
    before(connect);
    after(close);

    it("should return WRONGAPPLICATIONSTATE if requesting `ACTIVE` state", async () => {
      await requestState(ApplicationStateCodes.ACTIVE, {
        state: ApplicationStateCodes.INITIALIZE,
        status: MessageCodes.WRONG_APPLICATION_STATE,
      });
    });

    it("should return WRONGAPPLICATIONSTATE if requesting `AVAILABLE` state", async () => {
      await requestState(ApplicationStateCodes.AVAILABLE, {  // Bug from original - requests ACTIVE not AVAILABLE
        state: ApplicationStateCodes.INITIALIZE,
        status: MessageCodes.WRONG_APPLICATION_STATE,
      });
    });

    it("should return WRONGAPPLICATIONSTATE if requesting `STOPPED` state", async () => {
      await requestState(ApplicationStateCodes.STOPPED, {
        state: ApplicationStateCodes.INITIALIZE,
        status: MessageCodes.WRONG_APPLICATION_STATE,
      });
    });

    it("should return WRONGAPPLICATIONSTATE if requesting `SUSPENDED` state", async () => {
      await requestState(ApplicationStateCodes.SUSPENDED, {
        state: ApplicationStateCodes.INITIALIZE,
        status: MessageCodes.WRONG_APPLICATION_STATE,
      });
    });

    it("should return WRONGAPPLICATIONSTATE if requesting `INITIALIZE` state", async () => {
      await requestState(ApplicationStateCodes.INITIALIZE, {
        state: ApplicationStateCodes.INITIALIZE,
        status: MessageCodes.WRONG_APPLICATION_STATE,
      });
    });

    it("should be able to switch to `UNAVAILABLE`", async () => {
      await requestState(ApplicationStateCodes.UNAVAILABLE);
    });
  });

  describe("While in UNAVAILABLE State", () => {
    before(connect);
    after(close);

    before(async () => {
      await requestState(ApplicationStateCodes.UNAVAILABLE);
    });

    it("should return WRONGAPPLICATIONSTATE if requesting `INITIALIZE` state", async () => {
      await requestState(ApplicationStateCodes.INITIALIZE, {
        state: ApplicationStateCodes.UNAVAILABLE,
        status: MessageCodes.WRONG_APPLICATION_STATE,
      });
    });

    it("should return WRONGAPPLICATIONSTATE if requesting `ACTIVE` state", async () => {
      await requestState(ApplicationStateCodes.ACTIVE, {
        state: ApplicationStateCodes.UNAVAILABLE,
        status: MessageCodes.WRONG_APPLICATION_STATE,
      });
    });

    it("should return WRONGAPPLICATIONSTATE if requesting `STOPPED` state", async () => {
      await requestState(ApplicationStateCodes.STOPPED, {
        state: ApplicationStateCodes.UNAVAILABLE,
        status: MessageCodes.WRONG_APPLICATION_STATE,
      });
    });

    it("should return WRONGAPPLICATIONSTATE if requesting `SUSPENDED` state", async () => {
      await requestState(ApplicationStateCodes.SUSPENDED, {
        state: ApplicationStateCodes.UNAVAILABLE,
        status: MessageCodes.WRONG_APPLICATION_STATE,
      });
    });

    it("should return WRONGAPPLICATIONSTATE if requesting `UNAVAILABLE` state", async () => {
      await requestState(ApplicationStateCodes.UNAVAILABLE, {
        state: ApplicationStateCodes.UNAVAILABLE,
        status: MessageCodes.WRONG_APPLICATION_STATE,
      });
    });

    it("should be able to switch to `AVAILABLE`", async () => {
      await requestState(ApplicationStateCodes.AVAILABLE);
    });
  });

  describe("While in AVAILABLE State", () => {
    before(connect);
    after(close);

    before(async () => {
      await requestState(ApplicationStateCodes.UNAVAILABLE);
      await requestState(ApplicationStateCodes.AVAILABLE);
    });

    it("should return WRONGAPPLICATIONSTATE if requesting `INITIALIZE` state", async () => {
      await requestState(ApplicationStateCodes.INITIALIZE, {
        state: ApplicationStateCodes.AVAILABLE,
        status: MessageCodes.WRONG_APPLICATION_STATE,
      });
    });

    it("should return WRONGAPPLICATIONSTATE if requesting `STOPPED` state", async () => {
      await requestState(ApplicationStateCodes.STOPPED, {
        state: ApplicationStateCodes.AVAILABLE,
        status: MessageCodes.WRONG_APPLICATION_STATE,
      });
    });

    it("should return WRONGAPPLICATIONSTATE if requesting `SUSPENDED` state", async () => {
      await requestState(ApplicationStateCodes.SUSPENDED, {
        state: ApplicationStateCodes.AVAILABLE,
        status: MessageCodes.WRONG_APPLICATION_STATE,
      });
    });

    it("should be able to switch to `UNAVAILABLE` and back to `AVAILABLE`", async () => {
      await requestState(ApplicationStateCodes.UNAVAILABLE);
      await requestState(ApplicationStateCodes.AVAILABLE);
    });

    it("should return WRONGAPPLICATIONSTATE if requesting `AVAILABLE` state", async () => {
      await requestState(ApplicationStateCodes.AVAILABLE, {
        state: ApplicationStateCodes.AVAILABLE,
        status: MessageCodes.WRONG_APPLICATION_STATE,
      });
    });

    it("should be able to switch to `ACTIVE`", async () => {
      await requestState(ApplicationStateCodes.ACTIVE);
    });
  });

  describe("While in ACTIVE State", () => {
    before(connect);
    after(close);

    before(async () => {
      await requestState(ApplicationStateCodes.UNAVAILABLE);
      await requestState(ApplicationStateCodes.AVAILABLE);
      await requestState(ApplicationStateCodes.ACTIVE);
    });

    it("should return WRONGAPPLICATIONSTATE if requesting `INITIALIZE` state", async () => {
      await requestState(ApplicationStateCodes.INITIALIZE, {
        state: ApplicationStateCodes.ACTIVE,
        status: MessageCodes.WRONG_APPLICATION_STATE,
      });
    });

    it("should return WRONGAPPLICATIONSTATE if requesting `ACTIVE` state", async () => {
      await requestState(ApplicationStateCodes.ACTIVE, {
        state: ApplicationStateCodes.ACTIVE,
        status: MessageCodes.WRONG_APPLICATION_STATE,
      });
    });

    it("should return WRONGAPPLICATIONSTATE if requesting `STOPPED` state", async () => {
      await requestState(ApplicationStateCodes.STOPPED, {
        state: ApplicationStateCodes.ACTIVE,
        status: MessageCodes.WRONG_APPLICATION_STATE,
      });
    });

    it("should return WRONGAPPLICATIONSTATE if requesting `SUSPENDED` state", async () => {
      await requestState(ApplicationStateCodes.SUSPENDED, {
        state: ApplicationStateCodes.ACTIVE,
        status: MessageCodes.WRONG_APPLICATION_STATE,
      });
    });

    it("should be able to switch to `AVAILABLE` and back to `ACTIVE`", async () => {
      await requestState(ApplicationStateCodes.AVAILABLE);
      await requestState(ApplicationStateCodes.ACTIVE);
    });
  });
});
