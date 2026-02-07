/**
 * CUSS2 Test Helpers
 * Logging, configuration, builders, and validation utilities
 */
import { expect } from "https://esm.sh/chai@5.1.2";

// =============================================================================
// User Prompt
// =============================================================================

// Track if a prompt is currently active (used to pause test timeout)
export let promptActive = false;

/**
 * Show a modal prompting the user to perform an action
 * @param {string} message - The message to display
 * @param {function} waitFor - Async function that resolves when the prompt should close
 * @param {object} [options] - Optional settings
 * @param {string} [options.icon] - Lucide icon name to display (e.g., 'scan-barcode', 'unplug')
 * @returns {Promise<any>} Resolves with waitFor result, rejects if user cancels
 */
export async function promptUser(message, waitFor, options = {}) {
  promptActive = true;

  const $modal = $("#promptModal");
  const $message = $("#promptMessage");
  const $icon = $("#promptIcon");
  const $buttons = $("#promptButtons");
  const $closeBtn = $modal.find(".prompt-close");

  // Set icon if provided
  if (options.icon && typeof lucide !== "undefined") {
    $icon.html(`<i data-lucide="${options.icon}"></i>`);
    lucide.createIcons({ nodes: $icon.get() });
  } else {
    $icon.empty();
  }

  // Set message and show modal
  $message.text(message);
  $buttons.empty();
  $modal.addClass("show");

  // Cleanup function
  const cleanup = () => {
    promptActive = false;
    $modal.removeClass("show");
    $buttons.empty();
    $closeBtn.off("click", cancelHandler);
  };

  let rejectCancelled;

  // Handle user cancellation
  const cancelHandler = () => {
    cleanup();
    if (rejectCancelled) {
      rejectCancelled(new Error("User cancelled the prompt"));
    }
  };

  // Listen for cancel
  $closeBtn.on("click", cancelHandler);

  // Promise that rejects if user cancels
  const cancelledPromise = new Promise((_, reject) => {
    rejectCancelled = reject;
  });

  // Build race candidates
  const raceCandidates = [cancelledPromise];

  if (waitFor) {
    raceCandidates.push(waitFor());
  }

  // Render buttons if provided
  if (options.buttons && options.buttons.length > 0) {
    const buttonPromise = new Promise((resolve) => {
      options.buttons.forEach((btn) => {
        const $btn = $("<button>").text(btn.label).on("click", () => {
          resolve(btn.value);
        });
        $buttons.append($btn);
      });
    });
    raceCandidates.push(buttonPromise);
  }

  try {
    const result = await Promise.race(raceCandidates);
    return result;
  } finally {
    cleanup();
  }
}

// =============================================================================
// Logging
// =============================================================================

let testLogs = [];

export function log(...args) {
  testLogs.push({
    timestamp: Date.now(),
    data: args.map((a) => {
      if (a === null) return "null";
      if (a === undefined) return "undefined";
      if (typeof a === "object") {
        try {
          return JSON.stringify(a, null, 2);
        } catch {
          return String(a);
        }
      }
      return String(a);
    }).join(" "),
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

const CONFIG_STORAGE_KEY = "cuss2-test-config";

const defaultConfig = {
  server_url: "http://localhost:22222",
  oauth_url: "http://localhost:22222/oauth/token",
  client_id: "EAI",
  client_secret: "secret",
};

// Load config from localStorage or use defaults
function loadConfig() {
  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (stored) {
      return { ...defaultConfig, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error("Failed to load config:", e);
  }
  return { ...defaultConfig };
}

const config = loadConfig();

export function getConfig() {
  return { ...config };
}

export function updateConfig(newConfig) {
  if (newConfig.server_url) config.server_url = newConfig.server_url;
  if (newConfig.oauth_url) config.oauth_url = newConfig.oauth_url;
  if (newConfig.client_id) config.client_id = newConfig.client_id;
  if (newConfig.client_secret) config.client_secret = newConfig.client_secret;

  // Persist to localStorage
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error("Failed to save config:", e);
  }
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

/**
 * Helper to test peripherals_setup in a specific application state
 * @param {object} cuss2 - The Cuss2 instance
 * @param {string} expectedState - Expected current state
 * @returns {Promise<{inconclusive?: boolean, success?: boolean, response?: object, error?: Error}>}
 */
export async function testSetupInState(cuss2, expectedState) {
  expect(cuss2.state).to.equal(expectedState);
  log(`Testing setup in ${expectedState} state`);

  const printer = cuss2.boardingPassPrinter || cuss2.bagTagPrinter;
  if (!printer) {
    return { inconclusive: true, reason: "No printer component available" };
  }

  if (typeof printer.setup !== "function") {
    return { inconclusive: true, reason: "Setup method not available on component" };
  }

  try {
    const response = await printer.setup({});
    log(`Setup in ${expectedState}: ${response.meta.messageCode}`);
    return { success: response.meta.messageCode === "OK", response };
  } catch (error) {
    log(`Setup in ${expectedState} error: ${error.message || error}`);
    return { error };
  }
}

export const callAndDoBaselineValidation = async (
  conn,
  appData,
  options = {},
) => {
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
      throw new Error(
        `Connection closed unexpectedly (code: ${e.code}, reason: ${
          e.reason || "none"
        })`,
      );
    }
    throw e;
  }

  try {
    ackResponse = await ackPromise;
  } catch (e) {
    if (e instanceof CloseEvent) {
      throw new Error(
        `Connection closed while waiting for ACK (code: ${e.code}, reason: ${
          e.reason || "none"
        })`,
      );
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
    options.state || "INITIALIZE",
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

/**
 * Validate an unsolicited message has correct eventClassification
 * @param {object} message - The PlatformData message
 */
export const validateUnsolicitedMessage = (message) => {
  expect(message).to.be.ok;
  expect(message.meta).to.be.ok;

  const eventClassification = message.meta.eventClassification;
  expect(eventClassification).to.be.ok;

  if (eventClassification) {
    expect(eventClassification.eventMode).to.equal("UNSOLICITED");
    expect(eventClassification.eventType).to.be.oneOf(["PUBLIC", "PRIVATE"]);
    expect(eventClassification.eventCategory).to.be.oneOf([
      "NORMAL",
      "WARNING",
      "ALARM",
    ]);

    log(
      `eventClassification: mode=${eventClassification.eventMode}, type=${eventClassification.eventType}, category=${eventClassification.eventCategory}`,
    );
  }

  return message;
};
