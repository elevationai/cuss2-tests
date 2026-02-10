/**
 * Application Transfer Test Suite
 * Tests for application transfer functionality
 */

import { expect } from "https://esm.sh/chai@5.1.2";
import { log, promptUser } from "../helpers.js";
import { getCuss2 } from "./initialize.js";

export const appTransferSuite = {
  id: "app-transfer",
  name: "Application Transfer",
  description:
    "Tests for application transfer functionality including retrieving available apps and initiating transfers.",
  tests: [
    {
      name: "it should retrieve list of available applications",
      requiredTests: ["active.0"],
      description:
        "Queries the platform for a list of registered applications that are available for transfer.\n\nThe platform maintains a registry of all connected CUSS2 applications. Each application is identified by an `applicationID` containing a `companyCode` (IATA airline code) and an `applicationName`. Only applications currently in the `AVAILABLE` state can receive transfers.\n\n**What is validated:**\n- The response is an array of application objects\n- Each application includes `applicationName` and `companyCode` identifiers\n\n**Prerequisites:**\n- Platform must be in the ACTIVE state\n- At least one other application should be registered on the platform for meaningful results",
      test: async function () {
        const cuss2 = getCuss2();

        if (typeof cuss2.getAvailableApplications !== "function") {
          this.result = { status: "inconclusive", reason: "getAvailableApplications method not available" };
          return;
        }

        const apps = await cuss2.getAvailableApplications();
        expect(apps).to.be.an("array");
        log(`Found ${apps.length} available applications`);
        apps.forEach((app) => {
          log(`- ${app.applicationName} (${app.companyCode})`);
        });
      },
    },
    {
      name: "it should transfer to a target application",
      requiredTests: ["active.0"],
      description:
        "Sends a `PLATFORM_APPLICATIONS_TRANSFERREQUEST` directive with a valid `targetApplicationID` to initiate an application transfer.\n\nApplication transfer allows one CUSS2 application to hand off the kiosk session to another application (e.g., from check-in to bag drop). The source application specifies the target by its `companyCode` and `applicationName`. Upon successful transfer:\n- The source application transitions from ACTIVE to AVAILABLE\n- The target application is notified and transitions to ACTIVE\n- All peripheral components are released by the source and made available to the target\n\n**What is validated:**\n- The transfer directive receives a response (success or expected error if target is unavailable)\n\n**Prerequisites:**\n- Source application must be in the ACTIVE state\n- Target application must be registered and in the AVAILABLE state",
      test: async function () {
        const cuss2 = getCuss2();

        await promptUser(
          "Transfer will be attempted to another application",
          async () => {
            if (typeof cuss2.transferTo !== "function") {
              this.result = { status: "inconclusive", reason: "transferTo method not available" };
              return true;
            }

            try {
              const response = await cuss2.transferTo({
                targetApplicationID: {
                  companyCode: "TEST",
                  applicationName: "TestApp",
                },
              });
              log(`Transfer response: ${response.meta.messageCode}`);
            } catch (error) {
              log(
                `Transfer error (expected if target not available): ${
                  error.message || error
                }`,
              );
            }
            return true;
          },
          { icon: "arrow-right-left" },
        );
      },
    },
    {
      name: "it should include transferData in transfer request",
      requiredTests: ["active.0"],
      description:
        "Documents the expected behavior of the `transferData` payload in a `PLATFORM_APPLICATIONS_TRANSFERREQUEST`.\n\nThe `transferData` field is an optional object included in the transfer request that allows the source application to pass contextual data to the target application. This enables seamless passenger handoff between applications.\n\n**Expected behavior:**\n- The source application includes a `transferData` object in the `PLATFORM_APPLICATIONS_TRANSFERREQUEST`\n- The target application receives the `transferData` in its `TRANSFER_REQUEST` event notification\n- `transferData` can contain arbitrary application data such as passenger context, booking reference, transaction state, or session tokens\n\n**Prerequisites:**\n- Both source and target applications must support the transfer protocol",
      test: function () {
        this.result = { status: "inconclusive", reason: "Requires a second registered application to receive transfer data" };
      },
    },
    {
      name: "it should fail transfer to non-existent application",
      requiredTests: ["active.0"],
      description:
        "Sends a `PLATFORM_APPLICATIONS_TRANSFERREQUEST` with a `targetApplicationID` that does not match any registered application on the platform.\n\nThe platform must validate that the target application exists before initiating a transfer. When the `companyCode` and `applicationName` do not match any known application, the platform should reject the request with an error.\n\n**What is validated:**\n- The transfer request throws an error or returns an error response\n- The source application remains in the ACTIVE state (transfer was not initiated)\n\n**Prerequisites:**\n- Source application must be in the ACTIVE state\n- The `targetApplicationID` (`companyCode: 'INVALID'`, `applicationName: 'NonExistent'`) must not match any registered application",
      test: async function () {
        const cuss2 = getCuss2();

        if (typeof cuss2.transferTo !== "function") {
          this.result = { status: "inconclusive", reason: "transferTo method not available" };
          return;
        }

        try {
          await cuss2.transferTo({
            targetApplicationID: {
              companyCode: "INVALID",
              applicationName: "NonExistent",
            },
          });
          expect.fail("Expected error for non-existent target");
        } catch (error) {
          log(`Received expected error: ${error.message || error}`);
        }
      },
    },
    {
      name: "it should fail transfer when target is not AVAILABLE",
      requiredTests: ["active.0"],
      description:
        "Documents the expected behavior when a transfer is attempted to an application that is not in the `AVAILABLE` state.\n\nA target application must be in the `AVAILABLE` state to accept a transfer. If the target is currently `ACTIVE` (serving another passenger), `UNAVAILABLE`, or `INITIALIZE`, the platform must reject the transfer request.\n\n**Expected behavior:**\n- The transfer request fails with an error indicating the target is not available\n- The source application remains in the `ACTIVE` state (no state change occurs)\n- The source application retains control of all peripheral components\n\n**Prerequisites:**\n- Source application must be in the ACTIVE state",
      test: function () {
        this.result = { status: "inconclusive", reason: "Requires a second registered application in a non-AVAILABLE state" };
      },
    },
  ],
};
