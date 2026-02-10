/**
 * CUSS1 Platform Tester Application
 */

import { testConfig } from "./tests.js";
import { clearLogs, getConfig, promptActive, updateConfig } from "./helpers.js";

// Application State (dynamic - tracks runtime state)
const appState = {
  tests: testConfig, // Test configuration (imported from tests.js)
  selectedTest: null,
  testResults: [],
  checkedTests: new Set(["connect"]), // IDs of checked tests
  disabledTests: new Map(), // Map of disabled test IDs to reasons (populated after tests run)
};

// Tooltip data keyed by element ID: { text: string, diagram?: string, svg?: string }
const tooltips = new Map();
let tooltipCounter = 0;

/**
 * Render a description string into HTML.
 * Supports paragraphs (double newline), bullet lists (lines starting with - ),
 * inline code (`backticks`), and bold (**text**).
 */
function renderDescription(data) {
  if (!data) return "";
  const text = typeof data === "string" ? data : data.text;
  if (!text) return "";

  const paragraphs = text.split("\n\n");
  let html = paragraphs.map((para) => {
    const lines = para.split("\n");
    const listLines = lines.filter((l) => /^[-•] /.test(l.trim()));

    if (listLines.length > 0) {
      const parts = [];
      let currentList = [];

      for (const line of lines) {
        if (/^[-•] /.test(line.trim())) {
          currentList.push(line.trim().replace(/^[-•] /, ""));
        } else {
          if (currentList.length > 0) {
            parts.push(
              "<ul>" +
                currentList.map((i) => `<li>${formatInline(i)}</li>`).join("") +
                "</ul>",
            );
            currentList = [];
          }
          parts.push(`<p>${formatInline(line)}</p>`);
        }
      }
      if (currentList.length > 0) {
        parts.push(
          "<ul>" +
            currentList.map((i) => `<li>${formatInline(i)}</li>`).join("") +
            "</ul>",
        );
      }
      return parts.join("");
    }

    return `<p>${formatInline(para).replace(/\n/g, "<br>")}</p>`;
  }).join("");

  if (data.svg) {
    html += `<div class="tooltip-diagram">${data.svg}</div>`;
  }

  return html;
}

function formatInline(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

/**
 * Pre-render mermaid diagrams for all tooltips that have them
 */
async function preRenderDiagrams() {
  if (typeof mermaid === "undefined") return;
  for (const [id, data] of tooltips) {
    if (data.diagram && !data.svg) {
      try {
        const { svg } = await mermaid.render(`mmd-${id}`, data.diagram);
        data.svg = svg;
      } catch (e) {
        console.warn(`Failed to render diagram for ${id}`, e);
      }
    }
  }
}

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
$(document).ready(async function () {
  // Initialize mermaid for diagram rendering
  if (typeof mermaid !== "undefined") {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      themeVariables: {
        background: "#1a1a2e",
        primaryColor: "#1a1a2e",
        primaryBorderColor: "#64ffda",
        lineColor: "#64ffda",
        textColor: "#e0e0e0",
        secondaryColor: "#0f0f1e",
        tertiaryColor: "#0f0f1e",
      },
    });
  }

  loadConfigFromQueryParams();
  loadCheckedStates();
  renderTestTree();
  updateLockedCheckboxes();
  updateSelectionCount();
  bindEventHandlers();

  // Pre-render any mermaid diagrams in tooltips
  await preRenderDiagrams();
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

  let currentGroup = null;

  appState.tests.forEach((test) => {
    if (test.group && test.group !== currentGroup) {
      currentGroup = test.group;
      const $groupHeader = $("<div>")
        .addClass("test-group-header")
        .attr("data-group", currentGroup)
        .text(currentGroup);
      $testTree.append($groupHeader);
    }

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

  // Add info icon with description tooltip
  if (test.description) {
    const tipId = `tip-${tooltipCounter++}`;
    tooltips.set(tipId, { text: test.description, diagram: test.diagram });
    const $infoIcon = $("<span>")
      .addClass("info-icon")
      .attr("data-tip", tipId)
      .html('<i data-lucide="info"></i>');
    $content.append($infoIcon);

    if (typeof lucide !== "undefined") {
      lucide.createIcons({ nodes: $infoIcon.get() });
    }
  }
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
  // Global tooltip positioning
  const $tooltip = $("#tooltip");

  $(document).on("mouseenter", "[data-tip]", function () {
    const data = tooltips.get($(this).attr("data-tip"));
    if (!data) return;

    $tooltip.html(renderDescription(data)).addClass("visible");

    const rect = this.getBoundingClientRect();
    let top = rect.top - $tooltip.outerHeight() - 8;
    let left = rect.left + rect.width / 2 - $tooltip.outerWidth() / 2;

    // Keep within viewport
    if (top < 4) top = rect.bottom + 8;
    if (left < 4) left = 4;
    if (left + $tooltip.outerWidth() > window.innerWidth - 4) {
      left = window.innerWidth - $tooltip.outerWidth() - 4;
    }

    $tooltip.css({ top, left });
  });

  $(document).on("mouseleave", "[data-tip]", function () {
    $tooltip.removeClass("visible");
  });

  // Dismiss tooltip on click anywhere or scroll
  $(document).on("click", function () {
    $tooltip.removeClass("visible");
  });
  document.addEventListener("scroll", function () {
    $tooltip.removeClass("visible");
  }, true);

  // Clear selection button
  $("#clearSelection").on("click", clearSelection);

  // Collapse/expand all
  $("#collapseAll").on("click", function () {
    $(".test-item-container.has-children").addClass("collapsed");
  });
  $("#expandAll").on("click", function () {
    $(".test-item-container.has-children").removeClass("collapsed");
  });

  // Track modifier keys on checkbox clicks (fires before change event)
  let lastClickHadModifier = false;
  $(document).on("click", '.test-item input[type="checkbox"]', function (e) {
    lastClickHadModifier = e.metaKey || e.ctrlKey || e.shiftKey;
  });

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

    // CMD/Ctrl/Shift + click on a suite: toggle all individual tests
    if (!testId.includes(".") && lastClickHadModifier) {
      const suite = findTest(testId);
      const $container = $(this).closest(".test-item-container");
      $container.find(".test-checkbox").prop("checked", checked).each(function () {
        $(this).closest(".test-item").toggleClass("skipped", !checked);
      });
      if (suite?.tests) {
        suite.tests.forEach((test) => { test.skipped = !checked; });
      }
      saveCheckedStates();
    }
    lastClickHadModifier = false;
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
        if (
          $container.hasClass("has-children") &&
          $container.hasClass("collapsed")
        ) {
          $container.removeClass("collapsed");
        }
        break;

      case "ArrowLeft":
        e.preventDefault();
        // Collapse if expanded, or go to parent and collapse
        if (
          $container.hasClass("has-children") &&
          !$container.hasClass("collapsed")
        ) {
          $container.addClass("collapsed");
        } else {
          // Find parent container and collapse it, focus on parent
          const $parentContainer = $container.parent().closest(
            ".test-item-container",
          );
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
          $checkbox.prop("checked", !$checkbox.prop("checked")).trigger(
            "change",
          );
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
    // Recalculate — toggling a test may change which dependencies are needed
    updateLockedCheckboxes();
  } else {
    // Suite - track in checkedTests
    if (checked) {
      appState.checkedTests.add(testId);
    } else {
      appState.checkedTests.delete(testId);
    }
    // Recalculate and update locked dependencies
    updateLockedCheckboxes();
    updateSelectionCount();
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
 * Recursively collect required tests starting from a test ID.
 * Follows each test's requiredTests transitively.
 */
function collectRequiredTests(testId, collected = new Set()) {
  if (collected.has(testId)) return collected;
  collected.add(testId);

  const dotIndex = testId.lastIndexOf(".");
  const suiteId = testId.substring(0, dotIndex);
  const testIndex = parseInt(testId.substring(dotIndex + 1), 10);

  const suite = findTest(suiteId);
  const test = suite?.tests?.[testIndex];
  if (!test?.requiredTests) return collected;

  for (const reqId of test.requiredTests) {
    // Resolve relative refs (e.g. ".2" -> "barcode-scan.2")
    const resolved = reqId.startsWith(".") ? suiteId + reqId : reqId;
    collectRequiredTests(resolved, collected);
  }

  return collected;
}

/**
 * Calculate which suites and individual tests should be locked.
 * Iterates non-skipped tests in checked suites, collects their
 * requiredTests transitively, and derives locked suites from the results.
 */
function calculateLockedDependencies() {
  const lockedTests = new Set();
  const lockedSuites = new Set();

  for (const checkedId of appState.checkedTests) {
    const suite = findTest(checkedId);
    if (!suite?.tests) continue;

    // Skip if every test in this suite is skipped
    if (suite.tests.every((t) => t.skipped)) continue;

    for (let i = 0; i < suite.tests.length; i++) {
      const test = suite.tests[i];
      if (test.skipped) continue;

      if (test.requiredTests) {
        for (const reqId of test.requiredTests) {
          const resolved = reqId.startsWith(".") ? checkedId + reqId : reqId;
          const before = lockedTests.size;
          collectRequiredTests(resolved, lockedTests);
          // Lock suites for any newly collected tests in a different suite
          if (lockedTests.size > before) {
            for (const id of lockedTests) {
              const sid = id.substring(0, id.lastIndexOf("."));
              if (sid !== checkedId) lockedSuites.add(sid);
            }
          }
        }
      }
    }
  }

  // Apply intra-suite locks for all suites (even unchecked) so display stays consistent
  for (const suite of appState.tests) {
    if (!suite.tests) continue;
    for (let i = 0; i < suite.tests.length; i++) {
      const test = suite.tests[i];
      if (test.skipped) continue;
      if (test.requiredTests) {
        for (const reqId of test.requiredTests) {
          if (reqId.startsWith(".")) {
            lockedTests.add(suite.id + reqId);
          }
        }
      }
    }
  }

  return { lockedSuites, lockedTests };
}

/**
 * Update the locked state of all suite and test checkboxes in the UI.
 * Locked suites can't be unchecked. Within locked suites, only specific
 * required tests are locked — other tests remain toggleable.
 */
function updateLockedCheckboxes() {
  const { lockedSuites, lockedTests } = calculateLockedDependencies();

  appState.tests.forEach((suite) => {
    suite.locked = lockedSuites.has(suite.id);

    const $checkbox = $(`#test-${suite.id}`);
    if ($checkbox.length === 0) return;

    const isDisabled = appState.disabledTests.has(suite.id);

    // Disable suite checkbox if locked as dependency or disabled
    $checkbox.prop("disabled", suite.locked || isDisabled);

    // If locked, ensure it's checked
    if (suite.locked && !appState.checkedTests.has(suite.id)) {
      appState.checkedTests.add(suite.id);
      $checkbox.prop("checked", true);
    }

    // Update individual test checkboxes
    const $container = $checkbox.closest(".test-item-container");
    if (suite.tests) {
      suite.tests.forEach((test, index) => {
        const testId = `${suite.id}.${index}`;
        const $testItem = $container.find(`.test-item[data-test-id="${testId}"]`);
        const $testCheckbox = $testItem.find(".test-checkbox");
        if ($testCheckbox.length === 0) return;

        if (lockedTests.has(testId)) {
          $testCheckbox.prop("checked", true).prop("disabled", true);
          $testItem.removeClass("skipped");
          test.skipped = false;
        } else {
          $testCheckbox.prop("disabled", false);
        }
      });
    }
  });
}

/**
 * Update the selection count displayed in the sticky header
 */
function updateSelectionCount() {
  const total = appState.tests.length;
  const checked = appState.tests.filter((t) => appState.checkedTests.has(t.id)).length;
  $("#selectionCount").text(`${checked} of ${total} suites selected`);
}

/**
 * Clear all suite selections
 */
function clearSelection() {
  appState.checkedTests.clear();
  appState.tests.forEach((suite) => {
    $(`#test-${suite.id}`).prop("checked", false);
    if (suite.tests) {
      suite.tests.forEach((test) => {
        test.skipped = true;
      });
    }
  });
  $(".test-checkbox").prop("checked", false);

  updateLockedCheckboxes();
  updateSelectionCount();
  saveCheckedStates();
}

/**
 * Get all selected test suites (checked + locked dependencies) in config order.
 */
function getSelectedTests() {
  const { lockedSuites } = calculateLockedDependencies();

  return appState.tests.filter((suite) => {
    if (appState.disabledTests.has(suite.id)) return false;
    return lockedSuites.has(suite.id) || appState.checkedTests.has(suite.id);
  });
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
  const startTime = performance.now();

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

  // Calculate summary
  const summary = {
    total: appState.testResults.length,
    passed: appState.testResults.filter((r) => r.status === "pass").length,
    failed: appState.testResults.filter((r) => r.status === "fail").length,
    inconclusive:
      appState.testResults.filter((r) => r.status === "inconclusive").length,
    duration: performance.now() - startTime,
  };

  // Render final results with summary
  renderTestResults(summary);

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
  // Highlight the running suite in the left panel
  const $suiteItem = $(`.test-item[data-test-id="${testSuite.id}"]`);
  $suiteItem.addClass("running");
  $suiteItem.closest(".test-item-container").removeClass("collapsed");
  $suiteItem[0]?.scrollIntoView({ behavior: "smooth", block: "nearest" });

  // Run beforeAll hook if it exists
  if (testSuite.beforeAll) {
    console.log("Running beforeAll for:", testSuite.name);
    await testSuite.beforeAll();
  }

  // If the suite has tests, execute each one
  if (testSuite.tests && testSuite.tests.length > 0) {
    for (let i = 0; i < testSuite.tests.length; i++) {
      const test = testSuite.tests[i];
      if (test.skipped) {
        console.log("Skipping test:", test.name);
        continue;
      }

      // Highlight the running test
      const testId = `${testSuite.id}.${i}`;
      const $testItem = $(`.test-item[data-test-id="${testId}"]`);
      $testItem.addClass("running");
      $testItem[0]?.scrollIntoView({ behavior: "smooth", block: "nearest" });

      const shouldContinue = await executeTest(testSuite, test);

      $testItem.removeClass("running");
      if (!shouldContinue) {
        $suiteItem.removeClass("running");
        return false;
      }
    }
  } else {
    // Suite has no sub-tests, treat it as a single test
    const shouldContinue = await executeTest(testSuite, null);
    if (!shouldContinue) {
      $suiteItem.removeClass("running");
      return false;
    }
  }

  $suiteItem.removeClass("running");
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
    description: test ? test.description : null,
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
      // Tests can specify custom timeout via test.timeout (in ms)
      const testPromise = testFn.call(context);
      const timeoutMs = test.timeout || 5000;
      const timeoutPromise = new Promise((_, reject) => {
        let elapsed = 0;
        const checkInterval = 100;

        const intervalId = setInterval(() => {
          // Don't count time while prompt is active
          if (!promptActive) {
            elapsed += checkInterval;
          }
          if (elapsed >= timeoutMs) {
            clearInterval(intervalId);
            reject(new Error(`Test timeout after ${timeoutMs / 1000} seconds`));
          }
        }, checkInterval);

        // Clear interval when test completes
        testPromise.then(() => clearInterval(intervalId)).catch(() =>
          clearInterval(intervalId)
        );
      });

      await Promise.race([testPromise, timeoutPromise]);
    }

    // Check if test explicitly set result status (e.g., inconclusive)
    if (context.result?.status) {
      result.status = context.result.status;
      if (context.result.reason) {
        result.reason = context.result.reason;
      }
      console.log(`Test ${context.result.status}:`, testName);
    } else {
      // Test passed
      result.status = "pass";
      console.log("Test passed:", testName);
    }
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
  // Inconclusive tests do not stop execution
  return result.status === "pass" || result.status === "inconclusive";
}

/**
 * Render test results in the results panel
 */
function renderTestResults(summary = null) {
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

  // Add summary if provided
  if (summary) {
    const $summary = createSummaryCard(summary);
    $resultsContainer.append($summary);
  }

  // Auto-scroll to bottom
  const $resultsPanel = $(".results-panel");
  $resultsPanel.scrollTop($resultsPanel[0].scrollHeight);
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
  if (result.status === "inconclusive") statusIcon = "?";

  const $icon = $("<span>")
    .addClass("status-icon")
    .addClass(result.status)
    .text(statusIcon);

  const $title = $("<h3>").text(result.name);

  // Info icon for description
  if (result.description) {
    const tipId = `tip-${tooltipCounter++}`;
    tooltips.set(tipId, { text: result.description, diagram: result.diagram });
    const $infoIcon = $("<span>")
      .addClass("info-icon")
      .attr("data-tip", tipId)
      .html('<i data-lucide="info"></i>');
    $title.append($infoIcon);
  }

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

  // Render Lucide icons in the card
  if (typeof lucide !== "undefined") {
    lucide.createIcons({ nodes: $card.get() });
  }

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

  // Inconclusive reason
  if (result.status === "inconclusive" && result.reason) {
    const $reasonBox = $("<div>")
      .addClass("message-box inconclusive-reason")
      .text(result.reason);
    $card.append($reasonBox);
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

/**
 * Create a summary card element
 */
function createSummaryCard(summary) {
  const $card = $("<div>")
    .addClass("test-summary");

  const $header = $("<div>")
    .addClass("test-summary-header")
    .text("Test Run Complete");

  const $stats = $("<div>").addClass("test-summary-stats");

  // Total
  const $total = $("<div>")
    .addClass("summary-stat")
    .html(
      `<span class="stat-value">${summary.total}</span><span class="stat-label">Total</span>`,
    );

  // Passed
  const $passed = $("<div>")
    .addClass("summary-stat pass")
    .html(
      `<span class="stat-value">${summary.passed}</span><span class="stat-label">Passed</span>`,
    );

  // Failed
  const $failed = $("<div>")
    .addClass("summary-stat fail")
    .html(
      `<span class="stat-value">${summary.failed}</span><span class="stat-label">Failed</span>`,
    );

  // Inconclusive
  const $inconclusive = $("<div>")
    .addClass("summary-stat inconclusive")
    .html(
      `<span class="stat-value">${summary.inconclusive}</span><span class="stat-label">Inconclusive</span>`,
    );

  $stats.append($total, $passed, $failed, $inconclusive);

  // Duration
  const $duration = $("<div>")
    .addClass("test-summary-duration")
    .text(`Total time: ${(summary.duration / 1000).toFixed(2)}s`);

  $card.append($header, $stats, $duration);

  return $card;
}
