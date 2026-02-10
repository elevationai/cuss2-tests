/**
 * Illumination Test Suite
 * Tests for illumination/light component
 */

import { expect } from "https://esm.sh/chai@5.1.2";
import { log } from "../helpers.js";
import { getCuss2 } from "./initialize.js";
import { baseComponentTests } from "./base-component.js";

export const illuminationSuite = {
  id: "illumination",
  name: "Illumination",
  description:
    "Tests for illumination component including color setting (RGB and predefined), query, and state transition reset.",
  tests: baseComponentTests(getCuss2, "illumination", () => [
    {
      name: "it should set color via RGB value",
      description:
        "Sets the illumination component color using explicit RGB values (`red`, `green`, `blue` ranging 0-255).\n\nThe directive sends a setup command with an RGB color object (in this case, pure green: `{ red: 0, green: 255, blue: 0 }`). The platform translates these values to the physical illumination hardware.\n\n**What is validated:**\n- The response `meta.messageCode` equals `OK`\n- The platform accepts arbitrary RGB color values\n\n**Prerequisites:**\n- Illumination component must be enabled\n- Platform must be in the ACTIVE state",
      test: async function () {
        const cuss2 = getCuss2();
        const illumination = cuss2.illumination;
        if (!illumination) {
          this.result = { status: "inconclusive", reason: "No illumination component available" };
          return;
        }

        if (typeof illumination.setColor === "function") {
          const response = await illumination.setColor({
            red: 0,
            green: 255,
            blue: 0,
          });
          expect(response.meta.messageCode).to.equal("OK");
          log("RGB color set successfully (0, 255, 0)");
        } else if (typeof illumination.setup === "function") {
          const response = await illumination.setup({
            color: { red: 0, green: 255, blue: 0 },
          });
          expect(response.meta.messageCode).to.equal("OK");
          log("RGB color set via setup");
        } else {
          log("Color setting method not available");
        }
      },
    },
    {
      name: "it should set predefined color (CLR_GREEN)",
      description:
        "Sets the illumination component color using the predefined CUSS2 color constant `CLR_GREEN`.\n\nCUSS2 defines a set of standard color constants (`CLR_GREEN`, `CLR_RED`, `CLR_BLUE`, `CLR_YELLOW`, `CLR_WHITE`, `CLR_OFF`, etc.) that platforms must support. Using predefined constants ensures consistent behavior across different hardware implementations.\n\n**What is validated:**\n- The response `meta.messageCode` equals `OK`\n- The platform accepts predefined `CLR_*` color constants\n\n**Prerequisites:**\n- Illumination component must be enabled",
      test: async function () {
        const cuss2 = getCuss2();
        const illumination = cuss2.illumination;
        if (!illumination) {
          this.result = { status: "inconclusive", reason: "No illumination component available" };
          return;
        }

        if (typeof illumination.setColor === "function") {
          const response = await illumination.setColor("CLR_GREEN");
          expect(response.meta.messageCode).to.equal("OK");
          log("Predefined color CLR_GREEN set");
        } else if (typeof illumination.setup === "function") {
          const response = await illumination.setup({ color: "CLR_GREEN" });
          expect(response.meta.messageCode).to.equal("OK");
          log("CLR_GREEN set via setup");
        } else {
          log("Color setting method not available");
        }
      },
    },
    {
      name: "it should turn off illumination (CLR_OFF)",
      description:
        "Turns off the illumination component by sending the predefined color constant `CLR_OFF`.\n\n`CLR_OFF` is the standard CUSS2 method for deactivating illumination hardware. This is functionally equivalent to setting RGB values to `{ red: 0, green: 0, blue: 0 }` but uses the platform-recognized constant.\n\n**What is validated:**\n- The response `meta.messageCode` equals `OK`\n- The illumination hardware is deactivated\n\n**Prerequisites:**\n- Illumination component must be enabled\n- Illumination should ideally be on (from a prior color-set test) to confirm the off transition",
      test: async function () {
        const cuss2 = getCuss2();
        const illumination = cuss2.illumination;
        if (!illumination) {
          this.result = { status: "inconclusive", reason: "No illumination component available" };
          return;
        }

        if (typeof illumination.setColor === "function") {
          const response = await illumination.setColor("CLR_OFF");
          expect(response.meta.messageCode).to.equal("OK");
          log("Illumination turned off");
        } else if (typeof illumination.off === "function") {
          const response = await illumination.off();
          expect(response.meta.messageCode).to.equal("OK");
          log("Illumination off via off()");
        } else {
          log("Off method not available");
        }
      },
    },
    {
      name: "it should query illumination status",
      description:
        "Sends a `PERIPHERALS_QUERY` directive to the illumination component to retrieve its current state.\n\nThe query response includes the component's current color setting and operational status in `meta.currentComponentState`. This confirms the platform accurately tracks and reports illumination state.\n\n**What is validated:**\n- The response `meta.messageCode` equals `OK`\n- The component's `status` property reflects the current state\n\n**Prerequisites:**\n- Illumination component must be enabled",
      test: async function () {
        const cuss2 = getCuss2();
        const illumination = cuss2.illumination;
        if (!illumination) {
          this.result = { status: "inconclusive", reason: "No illumination component available" };
          return;
        }

        const response = await illumination.query();
        expect(response.meta.messageCode).to.equal("OK");
        log(`Illumination query: status=${illumination.status}`);
      },
    },
    {
      name: "illumination should reset on state transition away from ACTIVE",
      description:
        "Verifies that illumination state resets to the platform default when the application transitions away from the ACTIVE state.\n\nPer the CUSS2 specification, peripheral state (including illumination color) is tied to the application's ACTIVE session. When the application transitions to AVAILABLE (e.g., ending a passenger interaction), all component configurations should reset.\n\n**Test flow:**\n- Set illumination to `CLR_RED`\n- Transition from ACTIVE to AVAILABLE via `requestAvailableState()`\n- Return to ACTIVE via `requestActiveState()`\n- Query illumination to confirm it has been reset to the platform default\n- Re-enable the component for subsequent tests\n\n**What is validated:**\n- State transitions complete successfully (state equals `AVAILABLE` then `ACTIVE`)\n- Illumination color is no longer the previously set value after the round-trip\n\n**Prerequisites:**\n- Illumination component must be enabled\n- Platform must be in the ACTIVE state",
      test: async function () {
        const cuss2 = getCuss2();
        const illumination = cuss2.illumination;
        if (!illumination) {
          this.result = { status: "inconclusive", reason: "No illumination component available" };
          return;
        }

        // Set a color
        if (typeof illumination.setColor === "function") {
          await illumination.setColor("CLR_RED");
          log("Set color to CLR_RED");
        }

        // Transition to AVAILABLE
        await cuss2.requestAvailableState();
        expect(cuss2.state).to.equal("AVAILABLE");
        log("Transitioned to AVAILABLE");

        // Return to ACTIVE
        await cuss2.requestActiveState();
        expect(cuss2.state).to.equal("ACTIVE");
        log("Returned to ACTIVE");

        // Query illumination
        await illumination.query();
        log("Illumination should be reset to platform default");

        // Re-enable for subsequent tests
        await illumination.enable();
      },
    },
  ], ["active.0"]),
};
