import { expect } from "@std/expect";
import type { Connection } from "@cuss2/cuss2-ts";
import type {
  ApplicationData,
  ApplicationDataMeta,
  ApplicationDataPayload,
  ApplicationState,
  PlatformDirectives,
  PlatformData,
} from "@cuss2/models";

interface BuildOptions {
  dataObj?: ApplicationState;
  deviceID?: string;
  requestID?: string;
  oauthToken?: string;
  directive?: PlatformDirectives;
  componentID?: number;
  [key: string]: unknown;
}

interface ValidationOptions {
  state?: string;
  status?: string;
}

export const Build = {
  applicationData: (directive: PlatformDirectives, options: BuildOptions = {}): ApplicationData => {
    const { dataObj } = options;
    delete options.dataObj;

    const metaOptions = {
      deviceID: crypto.randomUUID(),
      requestID: crypto.randomUUID(),
      oauthToken: "",
      directive,
      ...options,
    };

    const meta: ApplicationDataMeta = {
      deviceID: metaOptions.deviceID,
      requestID: metaOptions.requestID,
      oauthToken: metaOptions.oauthToken,
      directive: metaOptions.directive,
    } as ApplicationDataMeta;

    if (metaOptions.componentID !== undefined) {
      meta.componentID = metaOptions.componentID;
    }

    const payload: ApplicationDataPayload = {} as ApplicationDataPayload;

    if (dataObj && payload) {
      payload.applicationState = dataObj;
    }

    const ad: ApplicationData = {
      meta,
      payload,
    } as ApplicationData;

    return ad;
  },
};

// Helper function to send and get response, returning data even on error responses
const sendAndGetResponseWithErrors = async (
  conn: Connection,
  appData: ApplicationData
): Promise<PlatformData> => {
  // Temporarily override the send method to capture the response directly
  const reqId = appData.meta.requestID as string;
  appData.meta.oauthToken = conn.access_token;
  if (!appData.meta.deviceID) {
    appData.meta.deviceID = conn.deviceID;
  }
  
  const promise = conn.waitFor(reqId, ["messageError", "socketError", "close"]);
  conn.json(appData);
  const message = await promise as PlatformData;
  
  // Return the message regardless of the status code
  return message;
};

export const callAndDoBaselineValidation = async (
  conn: Connection,
  appData: ApplicationData,
  options: ValidationOptions = {}
): Promise<PlatformData> => {
  const directive = appData.meta.directive;
  const componentID = appData.meta.componentID;
  const ackPromise = conn.waitFor("ack");
  
  const res = await sendAndGetResponseWithErrors(conn, appData);
  
  const ackResponse = await ackPromise as { requestID: string; ackCode: string };

  expect(ackResponse).toBeTruthy();
  expect(ackResponse.requestID).toMatch(/^([0-9A-Fa-f-]{0,36}|NONE|none)$/);
  expect(ackResponse.ackCode).toBe("ACK_OK");

  expect(res).toBeTruthy();
  expect(res.meta).toBeTruthy();
  expect(res.meta.requestID).toBe(ackResponse.requestID);
  expect(res.meta.platformDirective).toBe(directive);

  if (typeof componentID === "number") {
    expect(res.meta.componentID).toBe(componentID);
  }

  expect(res.meta.applicationID?.companyCode).toBeTruthy();
  expect(res.meta.applicationID?.applicationName).toBeTruthy();
  expect(res.meta.currentApplicationState?.applicationStateCode).toBe(
    options.state || "INITIALIZE"
  );
  expect(res.meta.messageCode).toBe(options.status || "OK");

  const eventClassification = res.meta.eventClassification;
  expect(eventClassification).toBeTruthy();
  if (eventClassification) {
    expect(eventClassification.eventCategory).toBe("NORMAL");
    expect(eventClassification.eventMode).toBe("SOLICITED");
    expect(eventClassification.eventType).toBe("PRIVATE");
  }

  return res;
};