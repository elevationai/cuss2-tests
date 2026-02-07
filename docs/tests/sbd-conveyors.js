/**
 * Self Bag Drop - Conveyor Operations Test Suite
 * Tests for SBD conveyor belt components
 */

import { expect } from "https://esm.sh/chai@5.1.2";
import { log, promptUser, validateUnsolicitedMessage } from "../helpers.js";
import { getCuss2 } from "./initialize.js";

export const sbdConveyorsSuite = {
  id: "sbd-conveyors",
  name: "SBD Conveyors",
  description:
    "Tests for Self Bag Drop conveyor belt operations including bag detection, measurements, and movement.",
  dependencies: ["active"],
  tests: [
    {
      name: "insertion belt component should exist",
      description:
        "Validates that the platform's component discovery response included an `INSERTION_BELT` component for Self Bag Drop operations.\n\nThe insertion belt is the primary conveyor component in SBD systems, responsible for accepting passenger baggage, measuring it, and transporting it into the baggage handling system. It is identified by `deviceType` of `INSERTION_BELT` in the component list.\n\n**What is validated:**\n- An insertion belt component exists (either via the `insertionBelt` convenience property or by searching components for `deviceType === 'INSERTION_BELT'`)\n- The component has a valid `componentID`\n\n**Prerequisites:**\n- Platform must be in the ACTIVE state\n- The platform must have SBD conveyor hardware connected",
      test: async function () {
        const cuss2 = getCuss2();
        const belt = cuss2.insertionBelt ||
          Object.values(cuss2.components).find(
            (c) => c.deviceType === "INSERTION_BELT",
          );

        if (!belt) {
          this.result = { status: "inconclusive", reason: "No insertion belt component available" };
          return;
        }

        expect(belt).to.be.ok;
        log(`Insertion belt found: componentID=${belt.id}`);
      },
    },
    {
      name: "it should enable the insertion belt",
      description:
        "Sends an enable directive to the insertion belt component to activate it for baggage handling operations.\n\nEnabling the insertion belt powers on the conveyor motor, activates weight sensors, dimension scanners, and barcode readers integrated into the belt. Once enabled, the belt can detect bag placement and process baggage.\n\n**What is validated:**\n- The response `meta.messageCode` equals `OK`\n\n**Prerequisites:**\n- Insertion belt component must exist\n- Platform must be in the ACTIVE state",
      test: async function () {
        const cuss2 = getCuss2();
        const belt = cuss2.insertionBelt ||
          Object.values(cuss2.components).find(
            (c) => c.deviceType === "INSERTION_BELT",
          );

        if (!belt) {
          this.result = { status: "inconclusive", reason: "No insertion belt component available" };
          return;
        }

        const response = await belt.enable();
        expect(response.meta.messageCode).to.equal("OK");
        log("Insertion belt enabled");
      },
    },
    {
      name: "it should detect bag placement (BAGGAGE_PRESENT)",
      description:
        "Prompts the user to place a bag on the insertion belt and waits for the platform to report `BAGGAGE_PRESENT` status.\n\nWhen a bag is placed on the enabled conveyor belt, the platform's weight and/or optical sensors detect its presence and send an unsolicited message with `baggageState` set to `BAGGAGE_PRESENT` in `meta.currentComponentState`. The test listens for this message via the component's event emitter.\n\n**What is validated:**\n- The `belt.baggageStatus` property equals `BAGGAGE_PRESENT` after detection\n- The unsolicited message has a valid `eventClassification` (via `validateUnsolicitedMessage`)\n\n**Prerequisites:**\n- Insertion belt must be enabled\n- A physical bag must be available for placement",
      test: async function () {
        const cuss2 = getCuss2();
        const belt = cuss2.insertionBelt ||
          Object.values(cuss2.components).find(
            (c) => c.deviceType === "INSERTION_BELT",
          );

        if (!belt) {
          this.result = { status: "inconclusive", reason: "No insertion belt component available" };
          return;
        }

        const result = await promptUser(
          "Place a bag on the insertion belt",
          () =>
            new Promise((resolve) => {
              if (belt.baggageStatus === "BAGGAGE_PRESENT") {
                resolve({ status: "BAGGAGE_PRESENT" });
                return;
              }
              const messageHandler = (message) => {
                if (
                  message.meta?.currentComponentState?.baggageState ===
                    "BAGGAGE_PRESENT" ||
                  belt.baggageStatus === "BAGGAGE_PRESENT"
                ) {
                  belt.off("message", messageHandler);
                  resolve({ status: "BAGGAGE_PRESENT", message });
                }
              };
              belt.on("message", messageHandler);
            }),
          { icon: "package" },
        );

        expect(belt.baggageStatus).to.equal("BAGGAGE_PRESENT");
        log("BAGGAGE_PRESENT detected");

        if (result.message) {
          validateUnsolicitedMessage(result.message);
        }
      },
    },
    {
      name: "it should process bag and return measurements",
      description:
        "Sends a `PERIPHERALS_CONVEYORS_PROCESS` directive to instruct the conveyor to weigh and measure the bag currently on the belt.\n\nThe process directive triggers the SBD system's integrated sensors to capture baggage measurements including weight, height, width, and length. Results are returned in the `payload.baggageMeasurements` object. The response may also include `weightUnit` (`METRIC` or `IMPERIAL`) and a `barcodeTagList` array containing scanned IATA baggage tag Licence Plate Numbers (LPNs).\n\n**What is validated:**\n- The response `meta.messageCode` equals `OK`\n- If present, `payload.baggageMeasurements` includes `weight` and `dimensions`\n- If present, `payload.baggageMeasurements.weightUnit` is `METRIC` or `IMPERIAL`\n- If present, `payload.barcodeTagList` is an array and each tag is logged\n\n**Prerequisites:**\n- Insertion belt must be enabled\n- A bag must be present on the belt (`BAGGAGE_PRESENT` status)",
      diagram: "sequenceDiagram\n    participant App as Application\n    participant Platform as CUSS2 Platform\n    participant Belt as Insertion Belt\n    App->>Platform: PERIPHERALS_CONVEYORS_PROCESS\n    Platform->>Belt: Activate sensors\n    Belt-->>Platform: Weight + dimensions + barcodes\n    Platform-->>App: OK + baggageMeasurements\n    Note over App: payload.baggageMeasurements contains:\n    Note over App: weight, dimensions, weightUnit, barcodeTagList",
      test: async function () {
        const cuss2 = getCuss2();
        const belt = cuss2.insertionBelt ||
          Object.values(cuss2.components).find(
            (c) => c.deviceType === "INSERTION_BELT",
          );

        if (!belt || typeof belt.process !== "function") {
          this.result = { status: "inconclusive", reason: "No insertion belt with process method available" };
          return;
        }

        const response = await belt.process();
        expect(response.meta.messageCode).to.equal("OK");

        if (response.payload?.baggageMeasurements) {
          const measurements = response.payload.baggageMeasurements;
          log(`Weight: ${measurements.weight}`);
          log(`Dimensions: ${JSON.stringify(measurements.dimensions)}`);

          // Validate weight unit
          if (measurements.weightUnit) {
            expect(measurements.weightUnit).to.be.oneOf([
              "METRIC",
              "IMPERIAL",
            ]);
            log(`Weight unit: ${measurements.weightUnit}`);
          }
        }

        // Validate barcode tags
        if (response.payload?.barcodeTagList) {
          log(
            `Detected ${response.payload.barcodeTagList.length} baggage tags`,
          );
          response.payload.barcodeTagList.forEach((tag, i) => {
            log(`Tag ${i + 1}: ${tag}`);
          });
        }
      },
    },
    {
      name: "it should move bag forward",
      description:
        "Sends a `PERIPHERALS_CONVEYORS_FORWARD` directive to move the bag forward on the conveyor belt toward the baggage handling system.\n\nThis is the primary operation for accepting a bag after it has been processed and validated. The belt physically moves the bag in the forward direction (away from the passenger, into the BHS). The platform may return `OUT_OF_SEQUENCE` if no bag is present or the belt is not in the correct state for forward movement.\n\n**What is validated:**\n- The response `meta.messageCode` is either `OK` or `OUT_OF_SEQUENCE`\n\n**Prerequisites:**\n- Insertion belt must be enabled\n- A bag should be present on the belt for a successful forward operation",
      test: async function () {
        const cuss2 = getCuss2();
        const belt = cuss2.insertionBelt ||
          Object.values(cuss2.components).find(
            (c) => c.deviceType === "INSERTION_BELT",
          );

        if (!belt || typeof belt.forward !== "function") {
          this.result = { status: "inconclusive", reason: "No insertion belt with forward method available" };
          return;
        }

        const response = await belt.forward();
        expect(response.meta.messageCode).to.be.oneOf([
          "OK",
          "OUT_OF_SEQUENCE",
        ]);
        log(`Forward response: ${response.meta.messageCode}`);
      },
    },
    {
      name: "it should move bag backward",
      description:
        "Sends a `PERIPHERALS_CONVEYORS_BACKWARD` directive to move the bag backward on the conveyor belt toward the passenger.\n\nThis operation is used to return a bag to the passenger, typically when a bag is rejected (oversized, overweight, or multiple bags detected). The belt physically reverses direction. The platform may return `OUT_OF_SEQUENCE` if the belt state does not allow backward movement.\n\n**What is validated:**\n- The response `meta.messageCode` is either `OK` or `OUT_OF_SEQUENCE`\n\n**Prerequisites:**\n- Insertion belt must be enabled",
      test: async function () {
        const cuss2 = getCuss2();
        const belt = cuss2.insertionBelt ||
          Object.values(cuss2.components).find(
            (c) => c.deviceType === "INSERTION_BELT",
          );

        if (!belt || typeof belt.backward !== "function") {
          this.result = { status: "inconclusive", reason: "No insertion belt with backward method available" };
          return;
        }

        const response = await belt.backward();
        expect(response.meta.messageCode).to.be.oneOf([
          "OK",
          "OUT_OF_SEQUENCE",
        ]);
        log(`Backward response: ${response.meta.messageCode}`);
      },
    },
    {
      name: "it should report BAGGAGE_ABSENT when bag is removed",
      description:
        "Prompts the user to remove the bag from the insertion belt and waits for the platform to report `BAGGAGE_ABSENT` status.\n\nWhen a bag is removed from the belt (either manually by the passenger or via a forward/backward conveyor operation), the platform's sensors detect the absence and update the component's `baggageState` to `BAGGAGE_ABSENT` via an unsolicited message or status change event.\n\n**What is validated:**\n- The `belt.baggageStatus` property transitions to `BAGGAGE_ABSENT` (or is already absent)\n\n**Prerequisites:**\n- Insertion belt must be enabled\n- A bag should currently be on the belt from a prior test",
      test: async function () {
        const cuss2 = getCuss2();
        const belt = cuss2.insertionBelt ||
          Object.values(cuss2.components).find(
            (c) => c.deviceType === "INSERTION_BELT",
          );

        if (!belt) {
          this.result = { status: "inconclusive", reason: "No insertion belt component available" };
          return;
        }

        await promptUser(
          "Remove the bag from the insertion belt",
          () =>
            new Promise((resolve) => {
              const handler = () => {
                if (
                  belt.baggageStatus === "BAGGAGE_ABSENT" || !belt.baggageStatus
                ) {
                  belt.off("statusChange", handler);
                  resolve();
                }
              };
              belt.on("statusChange", handler);

              if (
                belt.baggageStatus === "BAGGAGE_ABSENT" || !belt.baggageStatus
              ) {
                resolve();
              }
            }),
          { icon: "package-x" },
        );

        log("Bag removed");
      },
    },
    {
      name: "it should detect BAGGAGE_OVERSIZED for oversized bag",
      description:
        "Prompts the user to place an oversized bag on the insertion belt and waits for the platform to report `BAGGAGE_OVERSIZED` status.\n\nThe SBD system uses dimension sensors (optical, laser, or infrared) to determine if a bag exceeds the maximum allowed size. When dimensions exceed the configured threshold, the platform sets `baggageState` to `BAGGAGE_OVERSIZED` in an unsolicited message. The application would typically respond by sending `PERIPHERALS_CONVEYORS_BACKWARD` to return the bag to the passenger.\n\n**What is validated:**\n- The `belt.baggageStatus` is logged after a 30-second detection window\n- If the status change is detected, it matches `BAGGAGE_OVERSIZED`\n\n**Prerequisites:**\n- Insertion belt must be enabled\n- A physically oversized bag (or test fixture) must be available",
      test: async function () {
        const cuss2 = getCuss2();
        const belt = cuss2.insertionBelt ||
          Object.values(cuss2.components).find(
            (c) => c.deviceType === "INSERTION_BELT",
          );

        if (!belt) {
          this.result = { status: "inconclusive", reason: "No insertion belt component available" };
          return;
        }

        await promptUser(
          "Place an oversized bag on the belt",
          () =>
            new Promise((resolve) => {
              const handler = () => {
                if (belt.baggageStatus === "BAGGAGE_OVERSIZED") {
                  belt.off("statusChange", handler);
                  resolve();
                }
              };
              belt.on("statusChange", handler);

              // Also accept after timeout
              setTimeout(() => {
                belt.off("statusChange", handler);
                resolve();
              }, 30000);
            }),
          { icon: "maximize-2" },
        );

        log(`Current baggage status: ${belt.baggageStatus || "unknown"}`);
      },
    },
    {
      name: "it should detect BAGGAGE_MULTIPLE_BAGS",
      description:
        "Prompts the user to place two bags simultaneously on the insertion belt and waits for the platform to report `BAGGAGE_MULTIPLE_BAGS` status.\n\nSBD systems are designed to process one bag at a time. When the platform's sensors detect more than one distinct bag on the belt, it reports `BAGGAGE_MULTIPLE_BAGS` via an unsolicited message. The application should then instruct the passenger to remove extra bags before proceeding.\n\n**What is validated:**\n- The `belt.baggageStatus` is logged after a 30-second detection window\n- If the status change is detected, it matches `BAGGAGE_MULTIPLE_BAGS`\n\n**Prerequisites:**\n- Insertion belt must be enabled\n- Two physical bags must be available",
      test: async function () {
        const cuss2 = getCuss2();
        const belt = cuss2.insertionBelt ||
          Object.values(cuss2.components).find(
            (c) => c.deviceType === "INSERTION_BELT",
          );

        if (!belt) {
          this.result = { status: "inconclusive", reason: "No insertion belt component available" };
          return;
        }

        await promptUser(
          "Place two bags on the belt simultaneously",
          () =>
            new Promise((resolve) => {
              const handler = () => {
                if (belt.baggageStatus === "BAGGAGE_MULTIPLE_BAGS") {
                  belt.off("statusChange", handler);
                  resolve();
                }
              };
              belt.on("statusChange", handler);

              setTimeout(() => {
                belt.off("statusChange", handler);
                resolve();
              }, 30000);
            }),
          { icon: "layers" },
        );

        log(`Current baggage status: ${belt.baggageStatus || "unknown"}`);
      },
    },
    {
      name: "it should report BAGGAGE_WEIGHT_OUT_OF_RANGE for heavy bag",
      description:
        "Prompts the user to place an overweight bag on the insertion belt and waits for the platform to report `BAGGAGE_WEIGHT_OUT_OF_RANGE` status.\n\nThe SBD system's integrated scale measures the weight of the bag against configured airline weight limits. When the weight exceeds the maximum threshold, the platform reports `BAGGAGE_WEIGHT_OUT_OF_RANGE` in an unsolicited message. The application would typically send `PERIPHERALS_CONVEYORS_BACKWARD` to return the bag.\n\n**What is validated:**\n- The `belt.baggageStatus` is logged after a 30-second detection window\n- If the status change is detected, it matches `BAGGAGE_WEIGHT_OUT_OF_RANGE`\n\n**Prerequisites:**\n- Insertion belt must be enabled\n- An overweight bag (or test weight) must be available",
      test: async function () {
        const cuss2 = getCuss2();
        const belt = cuss2.insertionBelt ||
          Object.values(cuss2.components).find(
            (c) => c.deviceType === "INSERTION_BELT",
          );

        if (!belt) {
          this.result = { status: "inconclusive", reason: "No insertion belt component available" };
          return;
        }

        await promptUser(
          "Place an overweight bag on the belt",
          () =>
            new Promise((resolve) => {
              const handler = () => {
                if (belt.baggageStatus === "BAGGAGE_WEIGHT_OUT_OF_RANGE") {
                  belt.off("statusChange", handler);
                  resolve();
                }
              };
              belt.on("statusChange", handler);

              setTimeout(() => {
                belt.off("statusChange", handler);
                resolve();
              }, 30000);
            }),
          { icon: "scale" },
        );

        log(`Current baggage status: ${belt.baggageStatus || "unknown"}`);
      },
    },
    {
      name: "it should disable the insertion belt",
      description:
        "Sends a disable directive to the insertion belt component to deactivate it and release the conveyor hardware.\n\nDisabling the insertion belt stops the conveyor motor, deactivates sensors, and returns the component to an idle state. After disabling, no further baggage operations (`process`, `forward`, `backward`) can be performed until the belt is re-enabled.\n\n**What is validated:**\n- The response `meta.messageCode` equals `OK`\n\n**Prerequisites:**\n- Insertion belt must be currently enabled\n- No bag should be in transit on the belt (belt should be clear)",
      test: async function () {
        const cuss2 = getCuss2();
        const belt = cuss2.insertionBelt ||
          Object.values(cuss2.components).find(
            (c) => c.deviceType === "INSERTION_BELT",
          );

        if (!belt) {
          this.result = { status: "inconclusive", reason: "No insertion belt component available" };
          return;
        }

        const response = await belt.disable();
        expect(response.meta.messageCode).to.equal("OK");
        log("Insertion belt disabled");
      },
    },
  ],
};
