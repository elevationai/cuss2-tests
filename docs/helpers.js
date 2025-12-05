/**
 * CUSS2 Test Helpers
 * Logging, configuration, builders, and validation utilities
 */

// Import Chai assertion library (browser-friendly)
import { expect } from "https://esm.sh/chai@5.1.2";

// Import CUSS2 libraries - using local build (handles 'using' keyword for Safari)
import { Connection, Models } from "../../cuss2-ts/docs/dist/cuss2.esm.js";

// Destructure commonly used items from Models
const { PlatformDirectives } = Models;

// Re-export for use in tests.js
export { expect, Connection, Models, PlatformDirectives };

// =============================================================================
// Logging
// =============================================================================

let testLogs = [];

export function log(...args) {
  testLogs.push({
    timestamp: Date.now(),
    data: args.map(a => {
      if (a === null) return 'null';
      if (a === undefined) return 'undefined';
      if (typeof a === 'object') {
        try {
          return JSON.stringify(a, null, 2);
        } catch {
          return String(a);
        }
      }
      return String(a);
    }).join(' ')
  });
}

export function clearLogs() {
  const captured = [...testLogs];
  testLogs = [];
  return captured;
}

// =============================================================================
// Configuration
// =============================================================================

let config = {
  server_url: "http://localhost:22222",
  oauth_url: "http://localhost:22222/oauth/token",
  client_id: "EAI",
  client_secret: "secret",
};

export function getConfig() {
  return { ...config };
}

export function updateConfig(newConfig) {
  if (newConfig.server_url) config.server_url = newConfig.server_url;
  if (newConfig.oauth_url) config.oauth_url = newConfig.oauth_url;
  if (newConfig.client_id) config.client_id = newConfig.client_id;
  if (newConfig.client_secret) config.client_secret = newConfig.client_secret;
}

// =============================================================================
// Shared Connection State
// =============================================================================

let conn = null;

export function getConn() {
  return conn;
}

export function setConn(newConn) {
  conn = newConn;
}

// =============================================================================
// Message Builders
// =============================================================================

export const Build = {
  applicationData: (directive, options = {}) => {
    const { dataObj } = options;
    delete options.dataObj;

    const metaOptions = {
      deviceID: crypto.randomUUID(),
      requestID: crypto.randomUUID(),
      oauthToken: "",
      directive,
      ...options,
    };

    const meta = {
      deviceID: metaOptions.deviceID,
      requestID: metaOptions.requestID,
      oauthToken: metaOptions.oauthToken,
      directive: metaOptions.directive,
    };

    if (metaOptions.componentID !== undefined) {
      meta.componentID = metaOptions.componentID;
    }

    const payload = {};

    if (dataObj && payload) {
      payload.applicationState = dataObj;
    }

    return { meta, payload };
  },
};

// =============================================================================
// Validation Helpers
// =============================================================================

export const callAndDoBaselineValidation = async (conn, appData, options = {}) => {
  const directive = appData.meta.directive;
  const componentID = appData.meta.componentID;
  const reqId = appData.meta.requestID;

  appData.meta.oauthToken = conn.access_token;
  if (!appData.meta.deviceID) {
    appData.meta.deviceID = conn.deviceID;
  }

  const ackPromise = conn.waitFor("ack");
  const promise = conn.waitFor(reqId, ["messageError", "socketError", "close"]);
  conn.json(appData);

  let res, ackResponse;
  try {
    res = await promise;
  } catch (e) {
    if (e instanceof CloseEvent) {
      throw new Error(`Connection closed unexpectedly (code: ${e.code}, reason: ${e.reason || 'none'})`);
    }
    throw e;
  }

  try {
    ackResponse = await ackPromise;
  } catch (e) {
    if (e instanceof CloseEvent) {
      throw new Error(`Connection closed while waiting for ACK (code: ${e.code}, reason: ${e.reason || 'none'})`);
    }
    throw e;
  }

  expect(ackResponse).to.be.ok;
  expect(ackResponse.requestID).to.match(/^([0-9A-Fa-f-]{0,36}|NONE|none)$/);
  expect(ackResponse.ackCode).to.equal("ACK_OK");

  expect(res).to.be.ok;
  expect(res.meta).to.be.ok;
  expect(res.meta.requestID).to.equal(ackResponse.requestID);
  expect(res.meta.platformDirective).to.equal(directive);

  if (typeof componentID === "number") {
    expect(res.meta.componentID).to.equal(componentID);
  }

  expect(res.meta.applicationID?.companyCode).to.be.ok;
  expect(res.meta.applicationID?.applicationName).to.be.ok;
  expect(res.meta.currentApplicationState?.applicationStateCode).to.equal(
    options.state || "INITIALIZE"
  );
  expect(res.meta.messageCode).to.equal(options.status || "OK");

  const eventClassification = res.meta.eventClassification;
  expect(eventClassification).to.be.ok;
  if (eventClassification) {
    expect(eventClassification.eventCategory).to.equal("NORMAL");
    expect(eventClassification.eventMode).to.equal("SOLICITED");
    expect(eventClassification.eventType).to.equal("PRIVATE");
  }

  return res;
};
