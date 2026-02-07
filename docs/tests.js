/**
 * CUSS2 Test Configuration
 * Aggregates all test suites from individual files
 */

// Connection & Authentication
import { connectSuite } from "./tests/connect.js";

// State Management
import { getCuss2, initializeSuite, setCuss2 } from "./tests/initialize.js";
import {
  activeSuite,
  availableSuite,
  unavailableSuite,
} from "./tests/state-transitions.js";
import { stateReverseSuite } from "./tests/state-reverse.js";
import { statePlatformSuite } from "./tests/state-platform.js";

// Environment & Component Discovery
import { environmentValidationSuite } from "./tests/environment-validation.js";
import { componentDiscoverySuite } from "./tests/component-discovery.js";

// Setup & Context
import { setupContextSuite } from "./tests/setup-context.js";

// Directive Handling
import { directiveErrorsSuite } from "./tests/directive-errors.js";
import { peripheralsQuerySuite } from "./tests/peripherals-query.js";
import { peripheralsCancelSuite } from "./tests/peripherals-cancel.js";
import { concurrentDirectivesSuite } from "./tests/concurrent-directives.js";

// Termination
import { terminationSuite } from "./tests/termination.js";

// Component Tests - Input devices
import { barcodeScanSuite } from "./tests/barcode-scan.js";
import { passportScanSuite } from "./tests/passport-scan.js";
// Component Tests - Output devices
import { bppPrinterSuite, btpPrinterSuite } from "./tests/printers.js";
import { announcementSuite } from "./tests/announcement.js";

// Component Tests - Interactive devices
import { creditCardSuite } from "./tests/credit-card.js";
import { illuminationSuite } from "./tests/illumination.js";

// Component Tests - Complex devices
import { sbdConveyorsSuite } from "./tests/sbd-conveyors.js";

// State cleanup
import { envCleanupSuite } from "./tests/env-cleanup.js";

// Application & Session
import { appTransferSuite } from "./tests/app-transfer.js";
import { sessionExtensionSuite } from "./tests/session-extension.js";

// Re-export cuss2 accessor for test suites that need it
export { getCuss2, setCuss2 };

// =============================================================================
// Group Assignments
// =============================================================================

connectSuite.group = "Connection & Environment";
environmentValidationSuite.group = "Connection & Environment";
componentDiscoverySuite.group = "Connection & Environment";

initializeSuite.group = "State Progression";
unavailableSuite.group = "State Progression";
availableSuite.group = "State Progression";
activeSuite.group = "State Progression";

directiveErrorsSuite.group = "Protocol";
concurrentDirectivesSuite.group = "Protocol";
peripheralsQuerySuite.group = "Protocol";
peripheralsCancelSuite.group = "Protocol";

setupContextSuite.group = "Setup & Context";

barcodeScanSuite.group = "Input Devices";
passportScanSuite.group = "Input Devices";
creditCardSuite.group = "Input Devices";

btpPrinterSuite.group = "Output Devices";
bppPrinterSuite.group = "Output Devices";
announcementSuite.group = "Output Devices";
illuminationSuite.group = "Output Devices";

sbdConveyorsSuite.group = "Baggage Handling";

stateReverseSuite.group = "State Behavior";
statePlatformSuite.group = "State Behavior";
envCleanupSuite.group = "State Behavior";

appTransferSuite.group = "Session & Lifecycle";
sessionExtensionSuite.group = "Session & Lifecycle";
terminationSuite.group = "Session & Lifecycle";

// =============================================================================
// Test Configuration
// =============================================================================

/**
 * Complete test configuration
 * Order matters - suites are executed in this order
 * Dependencies are resolved automatically by the test runner
 */
export const testConfig = [
  // Connection & Environment
  connectSuite,
  environmentValidationSuite,
  componentDiscoverySuite,

  // State Progression
  initializeSuite,
  unavailableSuite,
  availableSuite,
  activeSuite,

  // Protocol (automated, no hardware interaction)
  directiveErrorsSuite,
  concurrentDirectivesSuite,
  peripheralsQuerySuite,
  peripheralsCancelSuite,

  // Setup & Context
  setupContextSuite,

  // Input Devices
  barcodeScanSuite,
  passportScanSuite,
  creditCardSuite,
  // Output Devices
  btpPrinterSuite,
  bppPrinterSuite,
  announcementSuite,
  illuminationSuite,

  // Baggage Handling
  sbdConveyorsSuite,

  // State Behavior (transitions away from ACTIVE and back)
  stateReverseSuite,
  statePlatformSuite,
  envCleanupSuite,

  // Session & Lifecycle (must be last group - termination closes connections)
  appTransferSuite,
  sessionExtensionSuite,
  terminationSuite,
];
