/**
 * CUSS1 Platform Tester Application
 */

import { testConfig } from "./tests.js";
import { clearLogs, getConfig, updateConfig, promptActive } from "./helpers.js";

// Application State (dynamic - tracks runtime state)
const appState = {
  tests: testConfig, // Test configuration (imported from tests.js)
  selectedTest: null,
  testResults: [],
  checkedTests: new Set(["connect"]), // IDs of checked tests
  disabledTests: new Map(), // Map of disabled test IDs to reasons (populated after tests run)
};

const STORAGE_KEY = "cuss2-test-checked-states";

/**
 * Save checked states to localStorage
 * Uses {suiteId} for suites and {suiteId}:{testName} for individual tests
 */
function saveCheckedStates() {
  const states = {};

  // Save suite-level states
  appState.tests.forEach((suite) => {
    states[suite.id] = appState.checkedTests.has(suite.id);

    // Save individual test states
    if (suite.tests) {
      suite.tests.forEach((test) => {
        const key = `${suite.id}:${test.name}`;
        states[key] = !test.skipped;
      });
    }
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
}

/**
 * Load checked states from localStorage
 */
function loadCheckedStates() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return;

  try {
    const states = JSON.parse(stored);

    // Restore suite-level states
    appState.tests.forEach((suite) => {
      if (suite.id in states) {
        if (states[suite.id]) {
          appState.checkedTests.add(suite.id);
        } else {
          appState.checkedTests.delete(suite.id);
        }
      }

      // Restore individual test states
      if (suite.tests) {
        suite.tests.forEach((test) => {
          const key = `${suite.id}:${test.name}`;
          if (key in states) {
            test.skipped = !states[key];
          }
        });
      }
    });
  } catch (e) {
    console.error("Failed to load checked states:", e);
  }
}

/**
 * Initialize the application
 */
$(document).ready(function () {
  loadConfigFromQueryParams();
  loadCheckedStates();
  renderTestTree();
  updateLockedCheckboxes();
  bindEventHandlers();
});

/**
 * Load configuration from query string parameters
 */
function loadConfigFromQueryParams() {
  const params = new URLSearchParams(globalThis.location.search);

  const queryConfig = {};

  if (params.has("CLIENT-ID")) {
    queryConfig.client_id = params.get("CLIENT-ID");
  }

  if (params.has("CLIENT-SECRET")) {
    queryConfig.client_secret = params.get("CLIENT-SECRET");
  }

  if (params.has("CUSS-WSS")) {
    queryConfig.server_url = decodeURIComponent(params.get("CUSS-WSS"));
  }

  if (params.has("OAUTH-URL")) {
    queryConfig.oauth_url = decodeURIComponent(params.get("OAUTH-URL"));
  }

  // Update config if we have any query params
  if (Object.keys(queryConfig).length > 0) {
    updateConfig(queryConfig);
    console.log("Configuration loaded from query parameters:", queryConfig);
  }
}

/**
 * Render the test tree from configuration
 */
function renderTestTree() {
  const $testTree = $("#testTree");
  $testTree.empty();

  appState.tests.forEach((test) => {
    const $testItem = createTestItem(test);
    $testTree.append($testItem);
  });
}

/**
 * Create a test item element
 */
function createTestItem(test, level = 0, parentId = null, index = 0) {
  const $container = $("<div>").addClass("test-item-container");

  // Generate internal identifier (suite ID for top-level, parent.index for children)
  const internalId = level === 0 ? test.id : `${parentId}.${index}`;

  const $item = $("<div>")
    .addClass("test-item")
    .attr("data-test-id", internalId)
    .attr("tabindex", "0");

  // Check state (only top-level suites have state)
  const isDisabled = level === 0 && appState.disabledTests.has(test.id);
  const isChecked = level === 0 && appState.checkedTests.has(test.id);

  // Add state test class
  if (test.isState) {
    $item.addClass("state-test");
  }

  // Add disabled class
  if (isDisabled) {
    $item.addClass("disabled");
  }

  // Create item content
  const $content = $("<div>").addClass("test-item-content");

  // Add checkbox for top-level items (test suites)
  if (level === 0) {
    const $checkbox = $("<input>")
      .attr("type", "checkbox")
      .attr("id", `test-${test.id}`)
      .prop("checked", isChecked)
      .prop("disabled", isDisabled);
    $content.append($checkbox);
  }

  // Add checkbox for individual tests (level > 0)
  if (level > 0) {
    const $checkbox = $("<input>")
      .attr("type", "checkbox")
      .attr("id", `test-${internalId}`)
      .addClass("test-checkbox")
      .prop("checked", !test.skipped)
      .prop("disabled", test.skippable === false);
    $content.append($checkbox);

    if (test.skipped) {
      $item.addClass("skipped");
    }
  }

  const disabledReason = level === 0
    ? appState.disabledTests.get(test.id)
    : null;
  const labelText = disabledReason ? `${test.name}` : test.name;
  const checkboxId = level === 0 ? `test-${test.id}` : `test-${internalId}`;
  const $text = $("<label>")
    .addClass("test-name")
    .attr("for", checkboxId)
    .text(labelText);

  $content.append($text);
  $item.append($content);
  $container.append($item);

  // Add sub-tests if they exist
  if (test.tests && test.tests.length > 0) {
    // Add collapsed class by default and expandable marker
    $container.addClass("collapsed has-children");

    const $children = $("<div>").addClass("test-children");
    test.tests.forEach((subTest, subTestIndex) => {
      const $childItem = createTestItem(
        subTest,
        level + 1,
        test.id,
        subTestIndex,
      );
      $children.append($childItem);
    });
    $container.append($children);
  }

  return $container;
}

/**
 * Bind event handlers
 */
function bindEventHandlers() {
  // Test item checkbox change
  $(document).on("change", '.test-item input[type="checkbox"]', function () {
    const $item = $(this).closest(".test-item");
    const testId = $item.data("test-id");
    const checked = $(this).prop("checked");
    updateTestState(testId, checked);

    // Toggle skipped class for individual tests
    if (testId.includes(".")) {
      $item.toggleClass("skipped", !checked);
    }
  });

  // Test item selection
  $(document).on("click", ".test-item", function (e) {
    if ($(e.target).is('input[type="checkbox"], label')) {
      return; // Let checkbox/label handle its own event
    }

    // Focus the item
    $(this).focus();

    // Toggle collapse state if this item has children
    const $container = $(this).closest(".test-item-container");
    if ($container.hasClass("has-children")) {
      $container.toggleClass("collapsed");
    }

    // Remove previous selection
    $(".test-item").removeClass("selected");

    // Add selection to current item
    $(this).addClass("selected");

    const testId = $(this).data("test-id");
    appState.selectedTest = testId;

    // Scroll to suite header on the right panel if it exists
    const suiteId = testId.includes(".") ? testId.split(".")[0] : testId;
    const $suiteHeader = $(`.test-suite-header[data-suite-id="${suiteId}"]`);
    if ($suiteHeader.length) {
      $suiteHeader[0].scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  // Scroll sync: highlight left panel item based on visible suite in right panel
  $(".results-panel").on("scroll", function () {
    const $headers = $(".test-suite-header");
    if ($headers.length === 0) return;

    const panelTop = $(this).offset().top;
    let visibleSuiteId = null;

    // Find the suite header that's closest to the top of the visible area
    $headers.each(function () {
      const headerTop = $(this).offset().top - panelTop;
      if (headerTop <= 50) {
        visibleSuiteId = $(this).data("suite-id");
      }
    });

    if (visibleSuiteId) {
      $(".test-item").removeClass("selected");
      $(`.test-item[data-test-id="${visibleSuiteId}"]`).addClass("selected");
      appState.selectedTest = visibleSuiteId;
    }
  });

  // Keyboard navigation for test items
  $(document).on("keydown", ".test-item", function (e) {
    const $current = $(this);
    const $container = $current.closest(".test-item-container");

    // Get all visible test items
    const $allItems = $(".test-item:visible");
    const currentIndex = $allItems.index($current);

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (currentIndex < $allItems.length - 1) {
          $allItems.eq(currentIndex + 1).focus();
        }
        break;

      case "ArrowUp":
        e.preventDefault();
        if (currentIndex > 0) {
          $allItems.eq(currentIndex - 1).focus();
        }
        break;

      case "ArrowRight":
        e.preventDefault();
        // Expand if collapsed
        if ($container.hasClass("has-children") && $container.hasClass("collapsed")) {
          $container.removeClass("collapsed");
        }
        break;

      case "ArrowLeft":
        e.preventDefault();
        // Collapse if expanded, or go to parent and collapse
        if ($container.hasClass("has-children") && !$container.hasClass("collapsed")) {
          $container.addClass("collapsed");
        } else {
          // Find parent container and collapse it, focus on parent
          const $parentContainer = $container.parent().closest(".test-item-container");
          if ($parentContainer.length) {
            $parentContainer.addClass("collapsed");
            $parentContainer.children(".test-item").first().focus();
          }
        }
        break;

      case " ":
        e.preventDefault();
        // Toggle checkbox
        const $checkbox = $current.find('input[type="checkbox"]');
        if ($checkbox.length && !$checkbox.prop("disabled")) {
          $checkbox.prop("checked", !$checkbox.prop("checked")).trigger("change");
        }
        break;

      case "Enter":
        e.preventDefault();
        // Toggle collapse or select
        if ($container.hasClass("has-children")) {
          $container.toggleClass("collapsed");
        }
        break;
    }
  });

  // Run tests button
  $(".run-tests-btn").on("click", function () {
    runTests();
  });

  // Settings button
  $(".settings-btn").on("click", function () {
    openSettingsModal();
  });

  // Modal close button
  $(".modal-close").on("click", function () {
    closeSettingsModal();
  });

  // Click outside modal to close
  $(document).on("click", ".modal", function (e) {
    if ($(e.target).hasClass("modal")) {
      closeSettingsModal();
    }
  });

  // Settings form submit
  $("#settingsForm").on("submit", function (e) {
    e.preventDefault();
    saveSettings();
  });

  // Generate button for token URL
  $(".generate-btn").on("click", function () {
    generateTokenUrl();
  });
}

/**
 * Open settings modal
 */
function openSettingsModal() {
  const config = getConfig();

  // Populate form with current config
  $("#serverUrl").val(config.server_url || "");
  $("#clientId").val(config.client_id || "");
  $("#clientSecret").val(config.client_secret || "");
  $("#deviceId").val("");
  $("#oauthUrl").val(config.oauth_url || "");

  // Show modal
  $("#settingsModal").addClass("show");
}

/**
 * Close settings modal
 */
function closeSettingsModal() {
  $("#settingsModal").removeClass("show");
}

/**
 * Save settings
 */
function saveSettings() {
  const formData = {
    server_url: $("#serverUrl").val(),
    client_id: $("#clientId").val(),
    client_secret: $("#clientSecret").val(),
    device_id: $("#deviceId").val(),
    oauth_url: $("#oauthUrl").val(),
  };

  updateConfig(formData);
  closeSettingsModal();
}

/**
 * Generate token URL from server URL
 */
function generateTokenUrl() {
  const serverUrl = $("#serverUrl").val();
  if (serverUrl) {
    const tokenUrl = serverUrl.replace(/\/platform\/subscribe$/, "") +
      "/oauth/token";
    $("#oauthUrl").val(tokenUrl);
  }
}

/**
 * Update test state when checkbox is changed
 */
function updateTestState(testId, checked) {
  // Check if this is an individual test (contains a dot) or a suite
  if (testId.includes(".")) {
    // Individual test - set skipped property directly
    const [suiteId, indexStr] = testId.split(".");
    const suite = findTest(suiteId);
    if (suite?.tests) {
      const test = suite.tests[parseInt(indexStr, 10)];
      if (test) {
        test.skipped = !checked;
      }
    }
  } else {
    // Suite - track in checkedTests
    if (checked) {
      appState.checkedTests.add(testId);
    } else {
      appState.checkedTests.delete(testId);
    }
    // Recalculate and update locked dependencies
    updateLockedCheckboxes();
  }

  saveCheckedStates();
}

/**
 * Find a test suite by ID (top-level only)
 */
function findTest(testId) {
  return appState.tests.find((test) => test.id === testId) || null;
}

/**
 * Recursively collect all dependencies of a test suite
 */
function collectDependencies(testId, collected = new Set()) {
  const test = findTest(testId);
  if (!test || !test.dependencies) return collected;

  for (const depId of test.dependencies) {
    if (!collected.has(depId)) {
      collected.add(depId);
      collectDependencies(depId, collected);
    }
  }
  return collected;
}

/**
 * Calculate which suites should be locked (can't be unchecked) because
 * they are dependencies of currently checked suites
 */
function calculateLockedDependencies() {
  const locked = new Set();

  for (const checkedId of appState.checkedTests) {
    const deps = collectDependencies(checkedId);
    for (const depId of deps) {
      // Don't lock a suite as its own dependency
      if (depId !== checkedId) {
        locked.add(depId);
      }
    }
  }

  return locked;
}

/**
 * Update the locked state of all suite checkboxes in the UI
 */
function updateLockedCheckboxes() {
  const lockedIds = calculateLockedDependencies();

  appState.tests.forEach((suite) => {
    // Set locked property directly on the suite object
    suite.locked = lockedIds.has(suite.id);

    const $checkbox = $(`#test-${suite.id}`);
    if ($checkbox.length === 0) return;

    const isDisabled = appState.disabledTests.has(suite.id);

    // Disable if locked as dependency or disabled
    $checkbox.prop("disabled", suite.locked || isDisabled);

    // If locked, ensure it's checked
    if (suite.locked && !appState.checkedTests.has(suite.id)) {
      appState.checkedTests.add(suite.id);
      $checkbox.prop("checked", true);
    }
  });
}

/**
 * Get all selected test suites with their dependencies
 */
function getSelectedTests() {
  const selected = [];

  // Get directly selected test suites (top-level only)
  appState.tests.forEach((test) => {
    const isChecked = appState.checkedTests.has(test.id);
    const isDisabled = appState.disabledTests.has(test.id);
    if (isChecked && !isDisabled) {
      selected.push(test);
    }
  });

  // Add dependencies
  const withDependencies = new Set();
  selected.forEach((test) => {
    addTestWithDependencies(test, withDependencies);
  });

  return Array.from(withDependencies);
}

/**
 * Add a test suite and its dependencies to the set
 */
function addTestWithDependencies(test, testSet) {
  // Add dependencies first
  if (test.dependencies) {
    test.dependencies.forEach((depId) => {
      const depTest = findTest(depId);
      if (depTest && !testSet.has(depTest)) {
        addTestWithDependencies(depTest, testSet);
      }
    });
  }

  // Then add the test itself
  testSet.add(test);
}

/**
 * Run selected tests
 */
async function runTests() {
  const selectedTests = getSelectedTests();

  if (selectedTests.length === 0) {
    alert("No tests selected. Please select at least one test to run.");
    return;
  }

  // Clear previous results
  appState.testResults = [];
  renderTestResults();

  // Show running state
  $(".run-tests-btn").prop("disabled", true).text("Running...");

  // Track executed suites for shutdown
  const executedSuites = [];

  try {
    // Execute tests sequentially
    for (const testSuite of selectedTests) {
      console.log("Running test suite:", testSuite.name);
      executedSuites.push(testSuite);
      const shouldContinue = await executeTestSuite(testSuite);
      if (!shouldContinue) {
        console.log("Stopping test execution due to failure");
        break;
      }
    }
  } catch (error) {
    console.error("Error running tests:", error);
    alert("Error running tests: " + error.message);
  } finally {
    // Call shutdown on suites in reverse order
    for (let i = executedSuites.length - 1; i >= 0; i--) {
      const suite = executedSuites[i];
      if (suite.shutdown) {
        try {
          console.log("Running shutdown for:", suite.name);
          await suite.shutdown();
        } catch (shutdownError) {
          console.error("Error in shutdown for", suite.name, shutdownError);
        }
      }
    }
  }

  // Restore button state
  $(".run-tests-btn").prop("disabled", false).html(
    '<span class="play-icon">▶</span> Run Tests',
  );
}

/**
 * Execute a test suite (with all its tests)
 * Returns false if execution should stop
 */
async function executeTestSuite(testSuite) {
  // If the suite has tests, execute each one
  if (testSuite.tests && testSuite.tests.length > 0) {
    for (const test of testSuite.tests) {
      if (test.skipped) {
        console.log("Skipping test:", test.name);
        continue;
      }

      const shouldContinue = await executeTest(testSuite, test);
      if (!shouldContinue) {
        return false; // Stop execution
      }
    }
  } else {
    // Suite has no sub-tests, treat it as a single test
    const shouldContinue = await executeTest(testSuite, null);
    if (!shouldContinue) {
      return false;
    }
  }
  return true;
}

/**
 * Execute a single test with beforeEach/afterEach hooks
 * Returns true if execution should continue, false to stop
 */
async function executeTest(testSuite, test) {
  const testName = test ? test.name : testSuite.name;
  const testFn = test ? test.test : null;

  console.log("Executing test:", testName);

  // Clear any previous logs before starting this test
  clearLogs();

  const result = {
    id: testSuite.id,
    suiteName: testSuite.name,
    name: testName,
    status: "pending",
    error: null,
    errorStack: null,
    logs: [],
    duration: 0,
  };

  // Add to results immediately to show "running" state
  appState.testResults.push(result);
  renderTestResults();

  const startTime = performance.now();

  // Shared context between beforeEach, test, and afterEach
  const context = {};

  try {
    // Run beforeEach hook if it exists
    if (testSuite.beforeEach) {
      console.log("Running beforeEach for:", testName);
      await testSuite.beforeEach.call(context);
    }

    // Run the test if it exists
    if (testFn) {
      console.log("Running test function for:", testName);
      // Add timeout to prevent hanging (pauses while promptActive)
      const testPromise = testFn.call(context);
      const timeoutPromise = new Promise((_, reject) => {
        const timeoutMs = 5000;
        let elapsed = 0;
        const checkInterval = 100;

        const intervalId = setInterval(() => {
          // Don't count time while prompt is active
          if (!promptActive) {
            elapsed += checkInterval;
          }
          if (elapsed >= timeoutMs) {
            clearInterval(intervalId);
            reject(new Error("Test timeout after 5 seconds"));
          }
        }, checkInterval);

        // Clear interval when test completes
        testPromise.then(() => clearInterval(intervalId)).catch(() => clearInterval(intervalId));
      });

      await Promise.race([testPromise, timeoutPromise]);
    }

    // Test passed
    result.status = "pass";
    console.log("Test passed:", testName);
  } catch (error) {
    // Test failed
    result.status = "fail";

    // Format error message based on type
    if (error instanceof CloseEvent) {
      result.error = `WebSocket closed: code ${error.code}${
        error.reason ? `, reason: ${error.reason}` : ""
      }`;
      result.errorStack = null; // CloseEvent has no useful stack
    } else {
      result.error = error.message || String(error);
      result.errorStack = error.stack || null;
    }

    console.error("Test failed:", testName, error);
  } finally {
    // Always run afterEach hook
    try {
      if (testSuite.afterEach) {
        console.log("Running afterEach for:", testName);
        await testSuite.afterEach.call(context);
      }
    } catch (cleanupError) {
      console.error("Error in afterEach:", cleanupError);
      if (result.status === "pass") {
        result.status = "fail";
        result.error = `Cleanup failed: ${cleanupError.message}`;
      }
    }

    // Capture any logs from the test
    result.logs = clearLogs();

    result.duration = performance.now() - startTime;
    renderTestResults();
    console.log("Test complete:", testName, "Status:", result.status);
  }

  // Return false if test failed (stop execution)
  return result.status === "pass";
}

/**
 * Render test results in the results panel
 */
function renderTestResults() {
  const $resultsContainer = $("#resultsContainer");
  $resultsContainer.empty();

  if (appState.testResults.length === 0) {
    $resultsContainer.html(`
            <div class="empty-state">
                <p>No tests have been run yet. Select tests and click "Run Tests" to begin.</p>
            </div>
        `);
    return;
  }

  let currentSuiteId = null;
  appState.testResults.forEach((result) => {
    // Insert suite header when suite changes
    if (result.id !== currentSuiteId) {
      currentSuiteId = result.id;
      const $suiteHeader = $("<div>")
        .addClass("test-suite-header")
        .attr("data-suite-id", result.id)
        .text(result.suiteName);
      $resultsContainer.append($suiteHeader);
    }
    const $resultCard = createResultCard(result);
    $resultsContainer.append($resultCard);
  });
}

/**
 * Create a result card element
 */
function createResultCard(result) {
  const $card = $("<div>")
    .addClass("test-result")
    .addClass(result.status);

  // Header
  const $header = $("<div>").addClass("test-result-header");

  let statusIcon = "○"; // pending
  if (result.status === "pass") statusIcon = "✓";
  if (result.status === "fail") statusIcon = "✗";

  const $icon = $("<span>")
    .addClass("status-icon")
    .addClass(result.status)
    .text(statusIcon);

  const $title = $("<h3>").text(result.name);

  // Duration
  if (result.duration > 0) {
    const $duration = $("<span>")
      .addClass("test-duration")
      .text(`${result.duration.toFixed(0)}ms`);
    $header.append($icon, $title, $duration);
  } else {
    $header.append($icon, $title);
  }

  $card.append($header);

  // Error message with stack trace
  if (result.errorStack) {
    const $errorBox = $("<div>")
      .addClass("message-box error-message")
      .text(result.errorStack);
    $card.append($errorBox);
  } else if (result.error) {
    const $errorBox = $("<div>")
      .addClass("message-box error-message")
      .text(result.error);
    $card.append($errorBox);
  }

  // Show logs only when test failed and there are logs
  if (result.status === "fail" && result.logs && result.logs.length > 0) {
    const $logHeader = $("<div>")
      .addClass("log-header")
      .text("Log");
    $card.append($logHeader);

    const $logBox = $("<div>")
      .addClass("message-box log-message");

    result.logs.forEach((entry) => {
      const $logEntry = $("<div>")
        .addClass("log-entry")
        .text(entry.data);
      $logBox.append($logEntry);
    });

    $card.append($logBox);
  }

  return $card;
}
