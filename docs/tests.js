/**
 * CUSS2 Test Configuration
 * Define test suites, their structure, dependencies, and test functions
 */

import { expect } from "https://esm.sh/chai@5.1.2";
import { Cuss2, Connection, Models } from "https://ts.cuss2.dev/dist/cuss2.esm.js";
const { PlatformDirectives } = Models;

import {
  Build,
  callAndDoBaselineValidation,
  getConfig,
  log,
  promptUser,
} from "./helpers.js";

let cuss2 = null;

/**
 * Generate base component tests that are common to all interactive components
 * @param {string} componentName - The property name on cuss2 (e.g., 'barcodeReader')
 * @param {function} [additionalTests] - Optional callback returning array of component-specific tests
 * @returns {array} Array of test objects
 */
function baseComponentTests(componentName, additionalTests) {
  const getComponent = () => cuss2[componentName];

  const tests = [
    {
      name: "the component should exist",
      test: async function () {
        const component = getComponent();
        expect(component).to.be.ok;
        log(`${componentName} found: componentID=${component.id}`);
      },
    },
    {
      name: "the component should be OK and READY",
      test: async function () {
        const component = getComponent();
        expect(component.status).to.equal("OK");
        expect(component.ready).to.be.true;
        log(`Status: ${component.status}, Ready: ${component.ready}`);
      },
    },
    {
      name: "it should return OUT_OF_SEQUENCE if attempting to disable a component that is already disabled",
      test: async function () {
        const component = getComponent();
        const response = await component.disable();
        expect(response.meta.messageCode).to.equal("OUT_OF_SEQUENCE");
        log("Received expected OUT_OF_SEQUENCE response");
      },
    },
    {
      name: "it should report NOT_REACHABLE when the device is disconnected",
      test: async function () {
        const component = getComponent();
        await promptUser(
          `Disconnect the ${componentName}`,
          () =>
            new Promise((resolve) => {
              // If already NOT_REACHABLE, resolve immediately
              if (component.status === "NOT_REACHABLE") {
                resolve();
                return;
              }
              // Otherwise wait for status change
              const handler = (status) => {
                if (status === "NOT_REACHABLE") {
                  component.off("statusChange", handler);
                  resolve();
                }
              };
              component.on("statusChange", handler);
            }),
          { icon: "unplug" },
        );
        expect(component.status).to.equal("NOT_REACHABLE");
        log(`${componentName} reported NOT_REACHABLE`);
      },
    },
    {
      name: "it should report OK when the device is reconnected",
      test: async function () {
        const component = getComponent();
        await promptUser(
          `Reconnect the ${componentName}`,
          () =>
            new Promise((resolve) => {
              // If already OK, resolve immediately
              if (component.status === "OK") {
                resolve();
                return;
              }
              // Otherwise wait for status change
              const handler = (status) => {
                if (status === "OK") {
                  component.off("statusChange", handler);
                  resolve();
                }
              };
              component.on("statusChange", handler);
            }),
          { icon: "plug" },
        );
        expect(component.status).to.equal("OK");
        log(`${componentName} reported OK`);
      },
    },
    {
      name: "it should enable",
      test: async function () {
        const component = getComponent();
        const response = await component.enable();
        expect(response.meta.messageCode).to.equal("OK");
        expect(component.enabled).to.be.true;
        log(`${componentName} enabled successfully`);
      },
    },
  ];

  // Insert additional component-specific tests before disable
  if (additionalTests) {
    const extraTests = additionalTests();
    if (extraTests && extraTests.length > 0) {
      tests.push(...extraTests);
    }
  }

  // Add disable test at the end
  tests.push({
    name: "it should disable",
    test: async function () {
      const component = getComponent();
      const response = await component.disable();
      expect(response.meta.messageCode).to.equal("OK");
      expect(component.enabled).to.be.false;
      log(`${componentName} disabled successfully`);
    },
  });

  return tests;
}

// Test configuration
export const testConfig = [
  {
    id: "connect",
    name: "Connect to platform",
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
    ],
  },
  {
    id: "initialize",
    name: "INITIALIZE",
    isState: true,
    dependencies: [],
    shutdown: function () {
      if (cuss2) {
        log("Closing cuss2 connection...");
        cuss2.connection.close(4999, "Test Complete");
        cuss2 = null;
      }
    },
    tests: [
      {
        name: "it should connect to the server and be in the INITIALIZE state",
        test: async function () {
          const config = getConfig();
          cuss2 = Cuss2.connect(
            config.client_id,
            config.client_secret,
            config.server_url,
            null,
            config.oauth_url,
          );

          // Listen for connection events
          cuss2.connection.on("connecting", (attemptCount) => {
            log(`Connecting to WebSocket... Attempt: ${attemptCount}`);
          });

          cuss2.connection.on("authenticating", (attemptCount) => {
            log(`Authenticating... Attempt: ${attemptCount}`);
          });

          cuss2.connection.once("authenticated", () => {
            log("Authenticated successfully");
          });

          cuss2.connection.on("close", () => {
            log("Connection closed");
          });

          cuss2.connection.on("error", (error) => {
            log(`Connection error: ${error.message}`);
          });

          // Wait for connection to be established
          log("Waiting for connection to be established...");
          await cuss2.connected;

          log("Connected successfully!");
          expect(cuss2.state).to.equal("INITIALIZE");
        },
      },
    ],
  },
  {
    id: "setup-components",
    name: "Setup Components",
    dependencies: ["initialize"],
    tests: [
      { name: "Setup Logo" },
      { name: "Setup Binary Logo" },
      { name: "Setup PECTAB" },
    ]
  },
  {
    id: "unavailable",
    name: "UNAVAILABLE",
    isState: true,
    dependencies: ["initialize"],
    tests: [
      {
        name: "it should transition to UNAVAILABLE state",
        test: async function () {
          log("Requesting UNAVAILABLE state...");
          await cuss2.requestUnavailableState();
          expect(cuss2.state).to.equal("UNAVAILABLE");
          log(`State is now: ${cuss2.state}`);
        },
      },
    ],
  },
  {
    id: "available",
    name: "AVAILABLE",
    isState: true,
    dependencies: ["unavailable"],
    tests: [
      {
        name: "it should transition to AVAILABLE state",
        test: async function () {
          log("Requesting AVAILABLE state...");
          await cuss2.requestAvailableState();
          expect(cuss2.state).to.equal("AVAILABLE");
          log(`State is now: ${cuss2.state}`);
        },
      },
    ],
  },
  {
    id: "active",
    name: "ACTIVE",
    isState: true,
    dependencies: ["available"],
    tests: [
      {
        name: "it should transition to ACTIVE state",
        test: async function () {
          log("Requesting ACTIVE state...");
          await cuss2.requestActiveState();
          expect(cuss2.state).to.equal("ACTIVE");
          log(`State is now: ${cuss2.state}`);
        },
      },
    ],
  },
  {
    id: "test-btp-printer",
    name: "Test BTP Printer",
    dependencies: ["active"],
    tests: [
      { name: "Print Bag Tag" },
    ],
  },
  {
    id: "test-bpp-printer",
    name: "Test BPP Printer",
    dependencies: ["active"],
    tests: [
      { name: "Print Boarding Pass" },
    ],
  },
  {
    id: "barcode-scan",
    name: "Barcode Scan",
    dependencies: ["active"],
    tests: baseComponentTests("barcodeReader", () => [
      {
        name: "it should return data from a scan",
        test: async function () {
          const data = await promptUser(
            "Scan a barcode",
            () =>
              new Promise((resolve) => {
                cuss2.barcodeReader.once("data", resolve);
              }),
            { icon: "scan-barcode" },
          );

          expect(data).to.be.ok;
          expect(data.length).to.be.greaterThan(0);
          log(`Received barcode data: ${JSON.stringify(data)}`);
        },
      },
    ]),
  },
  {
    id: "passport-scan",
    name: "Passport Scan",
    dependencies: ["active"],
  },
  {
    id: "announcement",
    name: "Announcement",
    dependencies: ["active"],
  },
  {
    id: "credit-card",
    name: "Credit Card",
    dependencies: ["active"],
  },
];
