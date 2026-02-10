/**
 * Base Component Tests
 * Shared test generator for interactive CUSS2 components
 */

import { expect } from "https://esm.sh/chai@5.1.2";
import { log, promptUser, validateUnsolicitedMessage } from "../helpers.js";

/**
 * Generate base component tests that are common to all interactive components
 * @param {function} getCuss2 - Function that returns the cuss2 instance
 * @param {string} componentName - The property name on cuss2 (e.g., 'barcodeReader')
 * @param {function} [additionalTests] - Optional callback returning array of component-specific tests
 * @param {array} [requiredTests] - Cross-suite requiredTests applied to all generated tests
 * @returns {array} Array of test objects
 */
export function baseComponentTests(getCuss2, componentName, additionalTests, requiredTests) {
  const getComponent = () => getCuss2()[componentName];
  const reason = `No ${componentName} component available`;

  const disconnectTest = {
    name: "it should report NOT_REACHABLE when the device is disconnected",
    description:
      `Tests that the platform sends an unsolicited status message when the **${componentName}** hardware is physically disconnected.\n\nWhen a peripheral is disconnected, the platform must send an unsolicited \`PLATFORM_DATA\` message with \`meta.currentComponentState.componentState\` set to \`"UNAVAILABLE"\` or \`meta.messageCode\` set to \`"NOT_REACHABLE"\`. The message must also include a valid \`meta.eventClassification\` with \`eventMode: "UNSOLICITED"\`.\n\n**How it is tested:**\n- The user is prompted to physically disconnect the ${componentName} device\n- The test listens for a \`message\` event on the component\n- If the component is already \`NOT_REACHABLE\`, it resolves immediately\n\n**What is validated:**\n- \`component.status\` equals \`"NOT_REACHABLE"\` after the disconnection\n- The unsolicited message passes \`validateUnsolicitedMessage()\` which checks for \`meta.eventClassification\`\n\n**Prerequisites:**\n- Component must exist and be physically connected at test start`,
    diagram: `sequenceDiagram
    participant User
    participant HW as ${componentName} Hardware
    participant Platform as CUSS2 Platform
    participant App as Test Application

    User->>HW: Physically disconnect device
    HW--xPlatform: Connection lost
    Platform->>App: Unsolicited PLATFORM_DATA
    Note right of App: meta.messageCode = "NOT_REACHABLE"
    Note right of App: meta.currentComponentState.componentState = "UNAVAILABLE"
    Note right of App: meta.eventClassification.eventMode = "UNSOLICITED"
    App->>App: Validate component.status === "NOT_REACHABLE"`,
    test: async function () {
      const component = getComponent();
      if (!component) {
        this.result = { status: "inconclusive", reason };
        return;
      }
      const result = await promptUser(
        `Disconnect the ${componentName}`,
        (signal) =>
          new Promise((resolve) => {
            if (component.status === "NOT_REACHABLE") {
              resolve({ status: "NOT_REACHABLE" });
              return;
            }
            const messageHandler = (message) => {
              if (
                message.meta?.currentComponentState?.componentState ===
                  "UNAVAILABLE" ||
                message.meta?.messageCode === "NOT_REACHABLE"
              ) {
                component.off("message", messageHandler);
                resolve({ status: "NOT_REACHABLE", message });
              }
            };
            component.on("message", messageHandler);
            signal?.addEventListener("abort", () => component.off("message", messageHandler));
          }),
        { icon: "unplug" },
      );
      expect(component.status).to.equal("NOT_REACHABLE");
      log(`${componentName} reported NOT_REACHABLE`);

      if (result.message) {
        validateUnsolicitedMessage(result.message);
      }
    },
  };

  const tests = [
    {
      name: "the component should be OK and READY",
      description:
        `Checks that the **${componentName}** component reports a healthy operational status before any enable/disable operations are attempted.\n\nThe component's \`status\` reflects the value from \`meta.currentComponentState.componentState\` in the most recent unsolicited or solicited message. A status of \`OK\` means the hardware is connected and functioning. The \`ready\` property is a convenience boolean derived from the component state.\n\n**What is validated:**\n- \`component.status\` equals \`"OK"\` (hardware is connected and healthy)\n- \`component.ready\` is \`true\` (component is ready to accept commands)\n\n**Prerequisites:**\n- Component must exist in the platform's component list\n- Hardware must be physically connected and powered on`,
      test: async function () {
        const component = getComponent();
        if (!component) {
          this.result = { status: "inconclusive", reason };
          return;
        }
        expect(component.status).to.equal("OK");
        expect(component.ready).to.be.true;
        log(`Status: ${component.status}, Ready: ${component.ready}`);
      },
    },
    {
      name:
        "it should return OUT_OF_SEQUENCE if attempting to disable a component that is already disabled",
      description:
        `Sends a \`PERIPHERALS_DISABLE\` directive for the **${componentName}** component when it is already in a disabled state.\n\nPer the CUSS2 protocol, components have an enable/disable lifecycle. Attempting to disable an already-disabled component is an invalid state transition and the platform must reject it.\n\n**How it is tested:**\n- Calls \`component.disable()\` which sends a \`PERIPHERALS_DISABLE\` message to the platform\n- The component has not been enabled yet in this test sequence, so it is already disabled\n\n**What is validated:**\n- \`response.meta.messageCode\` equals \`"OUT_OF_SEQUENCE"\`\n- The platform correctly enforces the component state machine and does not silently accept invalid transitions\n\n**Prerequisites:**\n- Component must exist and be in the disabled state`,
      test: async function () {
        const component = getComponent();
        if (!component) {
          this.result = { status: "inconclusive", reason };
          return;
        }
        try {
          const response = await component.disable();
          expect(response.meta.messageCode).to.equal("OUT_OF_SEQUENCE");
        } catch (error) {
          expect(error.message || String(error)).to.include("OUT_OF_SEQUENCE");
        }
        log("Received expected OUT_OF_SEQUENCE response");
      },
    },
    disconnectTest,
    {
      name: "it should return HARDWARE_ERROR when enabling an unavailable component",
      requiredTests: [...(requiredTests || []), ".2"],
      description:
        `Attempts to enable the **${componentName}** component while it is in a \`NOT_REACHABLE\` state (hardware disconnected).\n\nPer the CUSS2 protocol, enabling a component that is physically unavailable must be rejected by the platform with a \`HARDWARE_ERROR\` response.\n\n**How it is tested:**\n- The component must already be in \`NOT_REACHABLE\` state from the previous disconnection test\n- Calls \`component.enable()\` which sends a \`PERIPHERALS_ENABLE\` message\n\n**What is validated:**\n- \`response.meta.messageCode\` equals \`"HARDWARE_ERROR"\`\n- The platform correctly rejects the enable request for unavailable hardware\n\n**Prerequisites:**\n- Component must be in \`NOT_REACHABLE\` state`,
      test: async function () {
        if (disconnectTest.skipped) {
          this.result = { status: "inconclusive", reason: "Disconnect test was skipped" };
          return;
        }
        const component = getComponent();
        if (!component) {
          this.result = { status: "inconclusive", reason };
          return;
        }
        try {
          const response = await component.enable();
          expect(response.meta.messageCode).to.equal("HARDWARE_ERROR");
        } catch (error) {
          expect(error.message || String(error)).to.include("HARDWARE_ERROR");
        }
        log("Received expected HARDWARE_ERROR response");
      },
    },
    {
      name: "it should report OK when the device is reconnected",
      requiredTests: [...(requiredTests || []), ".2"],
      description:
        `Tests that the platform detects hardware reconnection and restores the **${componentName}** component to a healthy state.\n\nAfter a device is physically reconnected, the platform should send an unsolicited message updating \`meta.currentComponentState.componentState\` back to a healthy state. The client library translates this into a \`statusChange\` event.\n\n**How it is tested:**\n- The user is prompted to physically reconnect the ${componentName} device\n- The test listens for a \`statusChange\` event on the component with a value of \`"OK"\`\n- If the component is already \`OK\`, it resolves immediately\n\n**What is validated:**\n- \`component.status\` equals \`"OK"\` after reconnection\n- The platform successfully re-establishes communication with the hardware\n\n**Prerequisites:**\n- Component must be in \`NOT_REACHABLE\` state from the previous disconnection test`,
      diagram: `sequenceDiagram
    participant User
    participant HW as ${componentName} Hardware
    participant Platform as CUSS2 Platform
    participant App as Test Application

    User->>HW: Physically reconnect device
    HW->>Platform: Connection restored
    Platform->>App: Unsolicited PLATFORM_DATA
    Note right of App: meta.currentComponentState.componentState = "OK"
    App->>App: statusChange event fires with "OK"
    App->>App: Validate component.status === "OK"`,
      test: async function () {
        if (disconnectTest.skipped) {
          this.result = { status: "inconclusive", reason: "Disconnect test was skipped" };
          return;
        }
        const component = getComponent();
        if (!component) {
          this.result = { status: "inconclusive", reason };
          return;
        }
        await promptUser(
          `Reconnect the ${componentName}`,
          (signal) =>
            new Promise((resolve) => {
              if (component.status === "OK") {
                resolve();
                return;
              }
              const handler = (status) => {
                if (status === "OK") {
                  component.off("statusChange", handler);
                  resolve();
                }
              };
              component.on("statusChange", handler);
              signal?.addEventListener("abort", () => component.off("statusChange", handler));
            }),
          { icon: "plug" },
        );
        expect(component.status).to.equal("OK");
        log(`${componentName} reported OK`);
      },
    },
    {
      name: "it should enable",
      description:
        `Sends a \`PERIPHERALS_ENABLE\` directive to activate the **${componentName}** component.\n\nEnabling a component tells the platform to power on the hardware (if needed), start listening for input, and begin forwarding unsolicited data events to the application. A component must be enabled before it can receive scans, accept print jobs, or report media status changes.\n\n**How it is tested:**\n- Calls \`component.enable()\` which sends a \`PERIPHERALS_ENABLE\` message\n- Awaits the platform's solicited response\n\n**What is validated:**\n- \`response.meta.messageCode\` equals \`"OK"\` (enable was accepted)\n- \`component.enabled\` is \`true\` (client state updated)\n\n**Prerequisites:**\n- Component must exist, be in \`OK\` status, and currently be disabled`,
      test: async function () {
        const component = getComponent();
        if (!component) {
          this.result = { status: "inconclusive", reason };
          return;
        }
        const response = await component.enable();
        expect(response.meta.messageCode).to.equal("OK");
        expect(component.enabled).to.be.true;
        log(`${componentName} enabled successfully`);
      },
    },
  ];

  // Insert additional component-specific tests
  if (additionalTests) {
    const result = additionalTests();
    if (result) {
      // Support { beforeEnable: [...], tests: [...] } or plain array
      const before = Array.isArray(result) ? null : result.beforeEnable;
      const after = Array.isArray(result) ? result : result.tests;
      if (before?.length) {
        // Insert before the enable test (last item in tests array)
        tests.splice(tests.length - 1, 0, ...before);
      }
      if (after?.length) {
        tests.push(...after);
      }
    }
  }

  // Apply requiredTests to all tests (base + additional) that don't already have them
  if (requiredTests) {
    tests.forEach((t) => {
      if (!t.requiredTests) t.requiredTests = requiredTests;
    });
  }

  // Add disable test at the end
  tests.push({
    name: "it should disable",
    requiredTests,
    description:
      `Sends a \`PERIPHERALS_DISABLE\` directive to deactivate the **${componentName}** component.\n\nDisabling a component tells the platform to stop forwarding unsolicited data events and release the hardware for other applications. After disabling, the component will no longer report scans, media changes, or other input events.\n\n**How it is tested:**\n- Calls \`component.disable()\` which sends a \`PERIPHERALS_DISABLE\` message\n- Awaits the platform's solicited response\n\n**What is validated:**\n- \`response.meta.messageCode\` equals \`"OK"\` (disable was accepted)\n- \`component.enabled\` is \`false\` (client state updated)\n\n**Prerequisites:**\n- Component must currently be in the enabled state`,
    test: async function () {
      const component = getComponent();
      if (!component) {
        this.result = { status: "inconclusive", reason };
        return;
      }
      const response = await component.disable();
      expect(response.meta.messageCode).to.equal("OK");
      expect(component.enabled).to.be.false;
      log(`${componentName} disabled successfully`);
    },
  });

  return tests;
}
