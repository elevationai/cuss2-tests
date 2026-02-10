/**
 * State Transition Test Suites
 * Tests for UNAVAILABLE, AVAILABLE, and ACTIVE states
 */

import { expect } from "https://esm.sh/chai@5.1.2";
import { log, testSetupInState } from "../helpers.js";
import { getCuss2 } from "./initialize.js";

export const unavailableSuite = {
  id: "unavailable",
  name: "UNAVAILABLE",
  description:
    "Transitions the application to UNAVAILABLE state, indicating the app is connected but not ready to serve passengers.",
  isState: true,
  tests: [
    {
      name: "it should transition to UNAVAILABLE state",
      requiredTests: ["initialize.0"],
      description:
        "Requests a state transition from `INITIALIZE` to `UNAVAILABLE` by calling `cuss2.requestUnavailableState()`. This sends a `PLATFORM_DATA` directive with `payload.applicationState` set to `UNAVAILABLE`.\n\nThe `UNAVAILABLE` state indicates the application is connected and authenticated but **not ready** to serve passengers. This is used during startup configuration, maintenance, or when the application needs to temporarily withdraw from service.\n\nPer the CUSS2 state machine, `INITIALIZE` can only transition to `UNAVAILABLE` -- no states may be skipped.\n\nValidates:\n- `cuss2.state` equals `\"UNAVAILABLE\"` after the transition",
      diagram: "stateDiagram-v2\n  [*] --> INITIALIZE\n  INITIALIZE --> UNAVAILABLE\n  UNAVAILABLE --> AVAILABLE\n  AVAILABLE --> ACTIVE\n  ACTIVE --> AVAILABLE\n  AVAILABLE --> UNAVAILABLE\n  UNAVAILABLE --> INITIALIZE",
      test: async function () {
        const cuss2 = getCuss2();
        log("Requesting UNAVAILABLE state...");
        await cuss2.requestUnavailableState();
        expect(cuss2.state).to.equal("UNAVAILABLE");
        log(`State is now: ${cuss2.state}`);
      },
    },
    {
      name: "query should work from UNAVAILABLE state",
      requiredTests: ["initialize.0"],
      timeout: 30000,
      description:
        "Sends `PERIPHERALS_QUERY` to all components while in `UNAVAILABLE` state.\n\n**What is validated:**\n- Every `response.meta.messageCode` equals `OK`\n- The platform does not restrict query operations based on application state",
      test: async function () {
        const cuss2 = getCuss2();
        const components = Object.values(cuss2.components);
        if (components.length === 0) {
          this.result = { status: "inconclusive", reason: "No components available" };
          return;
        }
        const results = await Promise.all(components.map((c) => c.query()));
        results.forEach((response, i) => {
          expect(response.meta.messageCode).to.equal("OK");
          log(`Component ${components[i].id} (${components[i].deviceType}): status=${components[i].status}`);
        });
      },
    },
    {
      name: "it should accept setup in UNAVAILABLE state",
      requiredTests: ["initialize.0"],
      description:
        "Sends a `PERIPHERALS_SETUP` directive while the application is in the `UNAVAILABLE` state. The `PERIPHERALS_SETUP` directive can be issued in any application state to configure component parameters such as media definitions, encoding formats, and operational modes.\n\nThis test uses the first available printer component and calls its `setup()` method. The platform should accept the request and respond with `meta.messageCode` equal to `\"OK\"`.\n\nIf no printer component is available, the test is marked **inconclusive**.\n\n**Prerequisites:**\n- Application must be in `UNAVAILABLE` state\n- At least one printer component must be present",
      test: async function () {
        const cuss2 = getCuss2();
        const result = await testSetupInState(cuss2, "UNAVAILABLE");
        if (result.inconclusive) {
          this.result = { status: "inconclusive", reason: result.reason };
        }
      },
    },
  ],
};

export const availableSuite = {
  id: "available",
  name: "AVAILABLE",
  description:
    "Transitions the application to AVAILABLE state, indicating the app is ready to accept a passenger interaction.",
  isState: true,
  tests: [
    {
      name: "it should transition to AVAILABLE state",
      requiredTests: ["unavailable.0"],
      description:
        "Requests a state transition from `UNAVAILABLE` to `AVAILABLE` by calling `cuss2.requestAvailableState()`. This sends a `PLATFORM_DATA` directive with `payload.applicationState` set to `AVAILABLE`.\n\nThe `AVAILABLE` state indicates the application is **ready to accept a passenger interaction**. The kiosk display should show an attract screen or welcome message. The platform may begin routing passengers to this kiosk.\n\nIn `AVAILABLE` state, components can receive `PERIPHERALS_SETUP` but cannot yet be enabled for data capture -- that requires the `ACTIVE` state.\n\nValidates:\n- `cuss2.state` equals `\"AVAILABLE\"` after the transition",
      diagram: "sequenceDiagram\n  participant App\n  participant Platform\n  Note over App: state = UNAVAILABLE\n  App->>Platform: PLATFORM_DATA (applicationState: AVAILABLE)\n  Platform->>App: ACK (ACK_OK)\n  Platform->>App: PlatformData (stateChange confirmed)\n  Note over App: state = AVAILABLE",
      test: async function () {
        const cuss2 = getCuss2();
        log("Requesting AVAILABLE state...");
        await cuss2.requestAvailableState();
        expect(cuss2.state).to.equal("AVAILABLE");
        log(`State is now: ${cuss2.state}`);
      },
    },
    {
      name: "query should work from AVAILABLE state",
      requiredTests: ["unavailable.0"],
      timeout: 30000,
      description:
        "Sends `PERIPHERALS_QUERY` to all components while in `AVAILABLE` state.\n\n**What is validated:**\n- Every `response.meta.messageCode` equals `OK`\n- Combined with the INITIALIZE and UNAVAILABLE query tests, this confirms query works in all non-ACTIVE states",
      test: async function () {
        const cuss2 = getCuss2();
        const components = Object.values(cuss2.components);
        if (components.length === 0) {
          this.result = { status: "inconclusive", reason: "No components available" };
          return;
        }
        const results = await Promise.all(components.map((c) => c.query()));
        results.forEach((response, i) => {
          expect(response.meta.messageCode).to.equal("OK");
          log(`Component ${components[i].id} (${components[i].deviceType}): status=${components[i].status}`);
        });
      },
    },
    {
      name: "it should accept setup in AVAILABLE state",
      requiredTests: ["unavailable.0"],
      description:
        "Sends a `PERIPHERALS_SETUP` directive while the application is in the `AVAILABLE` state. Applications commonly use this state to pre-configure peripherals before a passenger interaction begins, ensuring components are ready when the session transitions to `ACTIVE`.\n\nThis test uses the first available printer component and calls its `setup()` method. The platform should accept the request and respond with `meta.messageCode` equal to `\"OK\"`.\n\nIf no printer component is available, the test is marked **inconclusive**.\n\n**Prerequisites:**\n- Application must be in `AVAILABLE` state\n- At least one printer component must be present",
      test: async function () {
        const cuss2 = getCuss2();
        const result = await testSetupInState(cuss2, "AVAILABLE");
        if (result.inconclusive) {
          this.result = { status: "inconclusive", reason: result.reason };
        }
      },
    },
  ],
};

export const activeSuite = {
  id: "active",
  name: "ACTIVE",
  description:
    "Transitions the application to ACTIVE state, indicating a passenger transaction is in progress.",
  isState: true,
  tests: [
    {
      name: "it should transition to ACTIVE state",
      requiredTests: ["available.0"],
      description:
        "Requests a state transition from `AVAILABLE` to `ACTIVE` by calling `cuss2.requestActiveState()`. This sends a `PLATFORM_DATA` directive with `payload.applicationState` set to `ACTIVE`.\n\nThe `ACTIVE` state indicates a **passenger transaction is in progress**. This is the only state in which components can be enabled via `PERIPHERALS_ENABLE` for data capture (scanning boarding passes, reading passports, printing tags, etc.). The `sessionTimeout` timer from `payload.environmentLevel` begins counting down.\n\nPer the CUSS2 state machine, `ACTIVE` can only be reached from `AVAILABLE`. When the transaction completes, the application transitions back to `AVAILABLE`.\n\nValidates:\n- `cuss2.state` equals `\"ACTIVE\"` after the transition",
      diagram: "sequenceDiagram\n  participant App\n  participant Platform\n  Note over App: state = AVAILABLE\n  App->>Platform: PLATFORM_DATA (applicationState: ACTIVE)\n  Platform->>App: ACK (ACK_OK)\n  Platform->>App: PlatformData (stateChange confirmed)\n  Note over App: state = ACTIVE\n  Note over App: sessionTimeout starts",
      test: async function () {
        const cuss2 = getCuss2();
        log("Requesting ACTIVE state...");
        await cuss2.requestActiveState();
        expect(cuss2.state).to.equal("ACTIVE");
        log(`State is now: ${cuss2.state}`);
      },
    },
    {
      name: "it should accept setup in ACTIVE state",
      requiredTests: ["available.0"],
      description:
        "Sends a `PERIPHERALS_SETUP` directive while the application is in the `ACTIVE` state. In the `ACTIVE` state, the application has full access to all peripheral operations including `PERIPHERALS_ENABLE`, `PERIPHERALS_SEND`, `PERIPHERALS_QUERY`, and `PERIPHERALS_CANCEL`, in addition to `PERIPHERALS_SETUP`.\n\nThis test verifies that setup remains functional during an active passenger transaction, allowing the application to reconfigure components mid-session if needed (e.g., switching media templates between boarding pass and bag tag printing).\n\nIf no printer component is available, the test is marked **inconclusive**.\n\n**Prerequisites:**\n- Application must be in `ACTIVE` state\n- At least one printer component must be present",
      test: async function () {
        const cuss2 = getCuss2();
        const result = await testSetupInState(cuss2, "ACTIVE");
        if (result.inconclusive) {
          this.result = { status: "inconclusive", reason: result.reason };
        }
      },
    },
  ],
};
