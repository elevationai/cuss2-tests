/**
 * EnvironmentData Validation Test Suite
 * Tests for validating the EnvironmentLevel data returned by the platform
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

export const environmentValidationSuite = {
  id: "environment-validation",
  name: "Environment Validation",
  description:
    "Validates that the EnvironmentLevel data returned by PLATFORM_ENVIRONMENT contains all required fields with correct formats.",
  dependencies: [],
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

    // Get environment data
    const ad = Build.applicationData(PlatformDirectives.PLATFORM_ENVIRONMENT);
    this.envResponse = await callAndDoBaselineValidation(this.conn, ad);
    this.environmentLevel = this.envResponse.payload?.environmentLevel;
  },
  afterEach: function () {
    if (this.conn) {
      this.conn.close(4999, "Test Complete");
    }
  },
  tests: [
    {
      name: "environmentLevel should contain all required fields",
      description:
        "Sends a `PLATFORM_ENVIRONMENT` directive and inspects the returned `payload.environmentLevel` object for all required fields defined by the CUSS2 specification.\n\nRequired fields checked:\n- `sessionTimeout` - maximum session duration in milliseconds\n- `killTimeout` - grace period after session expiry before forced disconnect\n- `initTimeout` - maximum time allowed to complete initialization\n- `expectedAckTime` - maximum time the platform should take to ACK any directive\n- `deviceID` - UUID identifying the physical kiosk, or `\"NONE\"`\n- `deviceLocation` - string describing the kiosk's physical location (e.g., airport code, terminal)\n- `cussVersions` - array of supported CUSS protocol versions\n- `osName` - operating system name of the platform\n- `osVersion` - operating system version string\n\nValidates:\n- `payload.environmentLevel` is truthy\n- Each field is present via `have.property` assertion",
      test: async function () {
        const env = this.environmentLevel;
        expect(env).to.be.ok;

        expect(env).to.have.property("sessionTimeout");
        expect(env).to.have.property("killTimeout");
        expect(env).to.have.property("initTimeout");
        expect(env).to.have.property("expectedAckTime");
        expect(env).to.have.property("deviceID");
        expect(env).to.have.property("deviceLocation");
        expect(env).to.have.property("cussVersions");
        expect(env).to.have.property("osName");
        expect(env).to.have.property("osVersion");

        log("All required fields present");
      },
    },
    {
      name: "cussVersions should include a 2.x entry",
      description:
        "Validates `payload.environmentLevel.cussVersions`, an array of strings representing the CUSS protocol versions supported by the platform. Each entry follows the format `\"major.minor\"` (e.g., `\"2.0\"`, `\"2.1\"`).\n\nSince this test suite targets CUSS2 platforms, the array **must** contain at least one entry matching the pattern `/^2\\.\\d+$/`. Platforms may also advertise backward compatibility with CUSS 1.x by including additional entries.\n\nValidates:\n- `cussVersions` is an `array`\n- Array has at least one element\n- At least one element matches the `2.x` version pattern",
      test: async function () {
        const env = this.environmentLevel;
        expect(env.cussVersions).to.be.an("array");
        expect(env.cussVersions.length).to.be.greaterThan(0);

        const has2x = env.cussVersions.some((v) => /^2\.\d+$/.test(v));
        expect(has2x).to.be.true;

        log(`cussVersions: ${env.cussVersions.join(", ")}`);
      },
    },
    {
      name: "deviceID should match UUID or NONE format",
      description:
        "Validates `payload.environmentLevel.deviceID`, which uniquely identifies the physical kiosk hardware. Per the CUSS2 specification, this field must be either:\n\n- A 36-character UUID string in standard format (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`) using hex characters and hyphens\n- The literal string `\"NONE\"` (case-insensitive) when the platform has no assigned device identifier\n\nThe `deviceID` is used by the application in subsequent directives (set on `meta.deviceID`) to identify which kiosk the request originates from.\n\nValidates:\n- `deviceID` matches the regex `/^([0-9A-Fa-f-]{36}|NONE)$/i`",
      test: async function () {
        const env = this.environmentLevel;
        expect(env.deviceID).to.match(/^([0-9A-Fa-f-]{36}|NONE)$/i);
        log(`deviceID: ${env.deviceID}`);
      },
    },
    {
      name: "sessionTimeout should be a positive number",
      description:
        "Validates `payload.environmentLevel.sessionTimeout`, which defines the maximum duration (in milliseconds) that a single passenger session may remain active. When this timer expires, the platform transitions the application back to the AVAILABLE state, ending the current transaction.\n\nTypical values range from 60000ms (1 minute) to 600000ms (10 minutes) depending on the airline and kiosk configuration. The application should use this value to display countdown warnings to the passenger.\n\nValidates:\n- `sessionTimeout` is of type `number`\n- Value is greater than `0`",
      test: async function () {
        const env = this.environmentLevel;
        expect(env.sessionTimeout).to.be.a("number");
        expect(env.sessionTimeout).to.be.greaterThan(0);
        log(`sessionTimeout: ${env.sessionTimeout}ms`);
      },
    },
    {
      name: "killTimeout should be a positive number",
      description:
        "Validates `payload.environmentLevel.killTimeout`, which defines the grace period (in milliseconds) after the `sessionTimeout` expires before the platform forcibly terminates the application's connection. During this window, the application should complete any in-progress operations and clean up resources.\n\nIf the application does not voluntarily transition to AVAILABLE or close the session within `killTimeout` ms after session expiry, the platform will forcibly disconnect.\n\nValidates:\n- `killTimeout` is of type `number`\n- Value is greater than `0`",
      test: async function () {
        const env = this.environmentLevel;
        expect(env.killTimeout).to.be.a("number");
        expect(env.killTimeout).to.be.greaterThan(0);
        log(`killTimeout: ${env.killTimeout}ms`);
      },
    },
    {
      name: "initTimeout should be a positive number",
      description:
        "Validates `payload.environmentLevel.initTimeout`, which defines the maximum time (in milliseconds) the platform will wait for a newly opened WebSocket connection to send a valid `PLATFORM_ENVIRONMENT` directive. If no valid first message arrives within this window, the platform closes the connection with code `4001`.\n\nThis value directly controls the behavior tested in the connect suite's timeout test. Applications should ensure they send `PLATFORM_ENVIRONMENT` well within this limit after opening the WebSocket.\n\nValidates:\n- `initTimeout` is of type `number`\n- Value is greater than `0`",
      test: async function () {
        const env = this.environmentLevel;
        expect(env.initTimeout).to.be.a("number");
        expect(env.initTimeout).to.be.greaterThan(0);
        log(`initTimeout: ${env.initTimeout}ms`);
      },
    },
  ],
};
