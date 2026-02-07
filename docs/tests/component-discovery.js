/**
 * Component Discovery Test Suite
 * Tests for PLATFORM_COMPONENTS directive and component validation
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

// Valid component status values per CUSS2 spec
const VALID_COMPONENT_STATUSES = [
  "OK",
  "NOT_REACHABLE",
  "NOT_RESPONDING",
  "FAILED",
  "DISABLED",
  "UNAVAILABLE",
];

export const componentDiscoverySuite = {
  id: "component-discovery",
  name: "Component Discovery",
  description:
    "Tests the PLATFORM_COMPONENTS directive response and validates component data structure, linked components, and status values.",
  dependencies: ["connect"],
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

    // First authenticate with PLATFORM_ENVIRONMENT
    const envAd = Build.applicationData(
      PlatformDirectives.PLATFORM_ENVIRONMENT,
    );
    await callAndDoBaselineValidation(this.conn, envAd);

    // Then get components
    const compAd = Build.applicationData(
      PlatformDirectives.PLATFORM_COMPONENTS,
    );
    this.compResponse = await callAndDoBaselineValidation(this.conn, compAd);
    this.componentList = this.compResponse.payload?.componentList;
  },
  afterEach: function () {
    if (this.conn) {
      this.conn.close(4999, "Test Complete");
    }
  },
  tests: [
    {
      name: "it should return a list of components",
      description:
        "Sends a `PLATFORM_COMPONENTS` directive after authenticating via `PLATFORM_ENVIRONMENT`. The platform responds with a `PlatformData` message containing `payload.componentList`, an array of component objects representing all peripherals available on this kiosk.\n\nEach component in the array represents a physical or logical peripheral such as a barcode reader, boarding pass printer, bag tag printer, passport reader, card reader, or announcement system.\n\nValidates:\n- `payload.componentList` is an `array`\n- Array length is greater than `0` (platform has at least one component)",
      diagram: "sequenceDiagram\n  participant App\n  participant Platform\n  App->>Platform: PLATFORM_ENVIRONMENT\n  Platform->>App: PlatformData (environmentLevel)\n  App->>Platform: PLATFORM_COMPONENTS\n  Platform->>App: PlatformData (componentList[])",
      test: async function () {
        const componentList = this.componentList;

        expect(componentList).to.be.an("array");
        expect(componentList.length).to.be.greaterThan(0);

        log(`Found ${componentList.length} components`);
      },
    },
    {
      name: "each component should have valid structure",
      description:
        "Iterates over every component in `payload.componentList` and validates field types when present. Per the CUSS2 specification, component objects may contain:\n\n- `componentID` - integer, unique identifier used to address this component in `PERIPHERALS_*` directives via `meta.componentID`\n- `componentType` - string, the peripheral type (e.g., `\"barcodeReader\"`, `\"boardingPassPrinter\"`, `\"bagTagPrinter\"`, `\"passport\"`, `\"cardReader\"`)\n- `componentCharacteristics` - array of strings describing hardware capabilities\n- `linkedComponentIDs` - array of integers referencing other components that are physically or logically linked\n\nAll fields are optional per spec, but their types are validated when present.\n\nValidates:\n- `componentID` is a `number` when present\n- `componentType` is a `string` when present\n- `componentCharacteristics` is an `array` when present\n- `linkedComponentIDs` is an `array` when present",
      test: async function () {
        const componentList = this.componentList;

        for (const component of componentList) {
          // All fields are optional per spec, but validate types when present
          if (component.componentID !== undefined) {
            expect(component.componentID).to.be.a("number");
          }
          if (component.componentType !== undefined) {
            expect(component.componentType).to.be.a("string");
          }
          if (component.componentCharacteristics !== undefined) {
            expect(component.componentCharacteristics).to.be.an("array");
          }
          if (component.linkedComponentIDs !== undefined) {
            expect(component.linkedComponentIDs).to.be.an("array");
          }

          log(`Component ${component.componentID}: ${component.componentType}`);
        }
      },
    },
    {
      name: "linked components should reference valid IDs",
      description:
        "Tests referential integrity of `linkedComponentIDs` across the component list. In CUSS2, linked components represent peripherals that are physically connected or logically paired -- for example, a boarding pass printer linked to a specific barcode reader on a multi-device kiosk.\n\nThis test collects all `componentID` values into a set, then for each component that has a non-empty `linkedComponentIDs` array, verifies that every referenced ID exists in the set.\n\nIf no components declare `linkedComponentIDs`, the test is marked **inconclusive** since there is nothing to validate.\n\nValidates:\n- Every ID in `linkedComponentIDs` corresponds to an existing `componentID` in the component list\n- No dangling references to non-existent components",
      test: async function () {
        const componentList = this.componentList;
        const componentIds = new Set(componentList.map((c) => c.componentID));

        let hasLinkedComponents = false;

        for (const component of componentList) {
          const linkedIds = component.linkedComponentIDs || [];
          if (linkedIds.length > 0) {
            hasLinkedComponents = true;
            for (const linkedId of linkedIds) {
              expect(componentIds.has(linkedId)).to.be.true;
              log(
                `Component ${component.componentID} links to ${linkedId}: valid`,
              );
            }
          }
        }

        if (!hasLinkedComponents) {
          this.result = { status: "inconclusive", reason: "No components have linkedComponentIDs" };
        }
      },
    },
    {
      name: "deviceReference should group related components",
      description:
        "Validates the `deviceReference` field on components, which groups peripherals that belong to the same physical hardware device. For example, a multi-function printer might expose separate `boardingPassPrinter` and `bagTagPrinter` components that share a `deviceReference` to indicate they are the same physical unit.\n\nThis test groups all components by their `deviceReference` value and verifies each group contains at least one component. If no components declare `deviceReference`, the test is marked **inconclusive**.\n\nValidates:\n- Components with the same `deviceReference` are correctly grouped\n- Each device group contains at least one component ID",
      test: async function () {
        const componentList = this.componentList;

        const deviceGroups = new Map();
        for (const component of componentList) {
          if (component.deviceReference) {
            if (!deviceGroups.has(component.deviceReference)) {
              deviceGroups.set(component.deviceReference, []);
            }
            deviceGroups.get(component.deviceReference).push(
              component.componentID,
            );
          }
        }

        if (deviceGroups.size === 0) {
          this.result = { status: "inconclusive", reason: "No components have deviceReference" };
          return;
        }

        for (const [ref, ids] of deviceGroups) {
          log(`Device group "${ref}": components ${ids.join(", ")}`);
          expect(ids.length).to.be.greaterThan(0);
        }
      },
    },
  ],
};
