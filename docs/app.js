/**
 * CUSS1 Platform Tester Application
 */

import { testConfig, clearLogs } from './tests.js';

// Application State (dynamic - tracks runtime state)
const appState = {
    tests: testConfig, // Test configuration (imported from tests.js)
    selectedTest: null,
    testResults: [],
    checkedTests: new Set(['connect']), // IDs of checked tests
    alwaysChecked: new Set(['connect']), // Tests that cannot be unchecked
    disabledTests: new Map() // Map of disabled test IDs to reasons (populated after tests run)
};

/**
 * Initialize the application
 */
$(document).ready(function() {
    loadConfigFromQueryParams();
    renderTestTree();
    bindEventHandlers();
});

/**
 * Load configuration from query string parameters
 */
function loadConfigFromQueryParams() {
    const params = new URLSearchParams(window.location.search);

    const queryConfig = {};

    if (params.has('CLIENT-ID')) {
        queryConfig.client_id = params.get('CLIENT-ID');
    }

    if (params.has('CLIENT-SECRET')) {
        queryConfig.client_secret = params.get('CLIENT-SECRET');
    }

    if (params.has('CUSS-WSS')) {
        queryConfig.server_url = decodeURIComponent(params.get('CUSS-WSS'));
    }

    if (params.has('OAUTH-URL')) {
        queryConfig.oauth_url = decodeURIComponent(params.get('OAUTH-URL'));
    }

    // Update config if we have any query params
    if (Object.keys(queryConfig).length > 0) {
        import('./tests.js').then(module => {
            module.updateConfig(queryConfig);
            console.log('Configuration loaded from query parameters:', queryConfig);
        }).catch(err => {
            console.error('Error loading config from query params:', err);
        });
    }
}

/**
 * Render the test tree from configuration
 */
function renderTestTree() {
    const $testTree = $('#testTree');
    $testTree.empty();

    appState.tests.forEach(test => {
        const $testItem = createTestItem(test);
        $testTree.append($testItem);
    });
}

/**
 * Create a test item element
 */
function createTestItem(test, level = 0, parentId = null, index = 0) {
    const $container = $('<div>').addClass('test-item-container');

    // Generate internal identifier (suite ID for top-level, parent.index for children)
    const internalId = level === 0 ? test.id : `${parentId}.${index}`;

    const $item = $('<div>')
        .addClass('test-item')
        .attr('data-test-id', internalId);

    // Check state (only top-level suites have state)
    const isDisabled = level === 0 && appState.disabledTests.has(test.id);
    const isAlwaysChecked = level === 0 && appState.alwaysChecked.has(test.id);
    const isChecked = level === 0 && appState.checkedTests.has(test.id);

    // Add state test class
    if (test.isState) {
        $item.addClass('state-test');
    }

    // Add disabled class
    if (isDisabled) {
        $item.addClass('disabled');
    }

    // Create item content
    const $content = $('<div>').addClass('test-item-content');

    // Add checkbox for top-level items (test suites)
    if (level === 0) {
        const $checkbox = $('<input>')
            .attr('type', 'checkbox')
            .attr('id', `test-${test.id}`)
            .prop('checked', isChecked)
            .prop('disabled', isDisabled || isAlwaysChecked);
        $content.append($checkbox);
    }

    // Add checkbox for individual tests (level > 0)
    if (level > 0) {
        const $checkbox = $('<input>')
            .attr('type', 'checkbox')
            .attr('id', `test-${internalId}`)
            .addClass('test-checkbox')
            .prop('checked', !test.skipped)
            .prop('disabled', test.skippable === false);
        $content.append($checkbox);

        if (test.skipped) {
            $item.addClass('skipped');
        }
    }

    const disabledReason = level === 0 ? appState.disabledTests.get(test.id) : null;
    const labelText = disabledReason ? `${test.name}` : test.name;
    const checkboxId = level === 0 ? `test-${test.id}` : `test-${internalId}`;
    const $text = $('<label>')
        .addClass('test-name')
        .attr('for', checkboxId)
        .text(labelText);

    $content.append($text);
    $item.append($content);
    $container.append($item);

    // Add sub-tests if they exist
    if (test.tests && test.tests.length > 0) {
        const $children = $('<div>').addClass('test-children');
        test.tests.forEach((subTest, subTestIndex) => {
            const $childItem = createTestItem(subTest, level + 1, test.id, subTestIndex);
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
    $(document).on('change', '.test-item input[type="checkbox"]', function(e) {
        const $item = $(this).closest('.test-item');
        const testId = $item.data('test-id');
        const checked = $(this).prop('checked');
        updateTestState(testId, checked);

        // Toggle skipped class for individual tests
        if (testId.includes('.')) {
            $item.toggleClass('skipped', !checked);
        }
    });

    // Test item selection
    $(document).on('click', '.test-item', function(e) {
        if ($(e.target).is('input[type="checkbox"], label')) {
            return; // Let checkbox/label handle its own event
        }

        // Remove previous selection
        $('.test-item').removeClass('selected');

        // Add selection to current item
        $(this).addClass('selected');

        const testId = $(this).data('test-id');
        appState.selectedTest = testId;
    });

    // Run tests button
    $('.run-tests-btn').on('click', function() {
        runTests();
    });

    // Settings button
    $('.settings-btn').on('click', function() {
        openSettingsModal();
    });

    // Modal close button
    $('.modal-close').on('click', function() {
        closeSettingsModal();
    });

    // Click outside modal to close
    $(document).on('click', '.modal', function(e) {
        if ($(e.target).hasClass('modal')) {
            closeSettingsModal();
        }
    });

    // Settings form submit
    $('#settingsForm').on('submit', function(e) {
        e.preventDefault();
        saveSettings();
    });

    // Generate button for token URL
    $('.generate-btn').on('click', function() {
        generateTokenUrl();
    });
}

/**
 * Open settings modal
 */
function openSettingsModal() {
    // Import config from tests.js dynamically
    import('./tests.js').then(module => {
        const config = module.getConfig();

        // Populate form with current config
        $('#serverUrl').val(config.server_url || '');
        $('#clientId').val(config.client_id || '');
        $('#clientSecret').val(config.client_secret || '');
        $('#deviceId').val('');
        $('#oauthUrl').val(config.oauth_url || '');

        // Show modal
        $('#settingsModal').addClass('show');
    }).catch(err => {
        console.error('Error loading config:', err);
        // Show modal anyway with empty values
        $('#settingsModal').addClass('show');
    });
}

/**
 * Close settings modal
 */
function closeSettingsModal() {
    $('#settingsModal').removeClass('show');
}

/**
 * Save settings
 */
function saveSettings() {
    const formData = {
        server_url: $('#serverUrl').val(),
        client_id: $('#clientId').val(),
        client_secret: $('#clientSecret').val(),
        device_id: $('#deviceId').val(),
        oauth_url: $('#oauthUrl').val()
    };

    // Update config in tests.js
    import('./tests.js').then(module => {
        module.updateConfig(formData);
        closeSettingsModal();
    }).catch(err => {
        console.error('Error saving config:', err);
        alert('Error saving settings. Please try again.');
    });
}

/**
 * Generate token URL from server URL
 */
function generateTokenUrl() {
    const serverUrl = $('#serverUrl').val();
    if (serverUrl) {
        const tokenUrl = serverUrl.replace(/\/platform\/subscribe$/, '') + '/oauth/token';
        $('#oauthUrl').val(tokenUrl);
    }
}

/**
 * Update test state when checkbox is changed
 */
function updateTestState(testId, checked) {
    // Check if this is an individual test (contains a dot) or a suite
    if (testId.includes('.')) {
        // Individual test - set skipped property directly
        const [suiteId, indexStr] = testId.split('.');
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
    }
}

/**
 * Find a test suite by ID (top-level only)
 */
function findTest(testId) {
    return appState.tests.find(test => test.id === testId) || null;
}

/**
 * Get all selected test suites with their dependencies
 */
function getSelectedTests() {
    const selected = [];

    // Get directly selected test suites (top-level only)
    appState.tests.forEach(test => {
        const isChecked = appState.checkedTests.has(test.id);
        const isDisabled = appState.disabledTests.has(test.id);
        if (isChecked && !isDisabled) {
            selected.push(test);
        }
    });

    // Add dependencies
    const withDependencies = new Set();
    selected.forEach(test => {
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
        test.dependencies.forEach(depId => {
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
        alert('No tests selected. Please select at least one test to run.');
        return;
    }

    // Clear previous results
    appState.testResults = [];
    renderTestResults();

    // Show running state
    $('.run-tests-btn').prop('disabled', true).text('Running...');

    try {
        // Execute tests sequentially
        for (const testSuite of selectedTests) {
            console.log('Running test suite:', testSuite.name);
            const shouldContinue = await executeTestSuite(testSuite);
            if (!shouldContinue) {
                console.log('Stopping test execution due to failure');
                break;
            }
        }
    } catch (error) {
        console.error('Error running tests:', error);
        alert('Error running tests: ' + error.message);
    }

    // Restore button state
    $('.run-tests-btn').prop('disabled', false).html('<span class="play-icon">▶</span> Run Tests');
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
                console.log('Skipping test:', test.name);
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

    console.log('Executing test:', testName);

    // Clear any previous logs before starting this test
    clearLogs();

    const result = {
        id: testSuite.id,
        name: testName,
        status: 'pending',
        error: null,
        errorStack: null,
        logs: [],
        duration: 0
    };

    // Add to results immediately to show "running" state
    appState.testResults.push(result);
    renderTestResults();

    const startTime = performance.now();

    try {
        // Run beforeEach hook if it exists
        if (testSuite.beforeEach) {
            console.log('Running beforeEach for:', testName);
            await testSuite.beforeEach();
        }

        // Run the test if it exists
        if (testFn) {
            console.log('Running test function for:', testName);
            // Add timeout to prevent hanging
            await Promise.race([
                testFn(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Test timeout after 5 seconds')), 5000)
                )
            ]);
        }

        // Test passed
        result.status = 'pass';
        console.log('Test passed:', testName);
    } catch (error) {
        // Test failed
        result.status = 'fail';

        // Format error message based on type
        if (error instanceof CloseEvent) {
            result.error = `WebSocket closed: code ${error.code}${error.reason ? `, reason: ${error.reason}` : ''}`;
            result.errorStack = null; // CloseEvent has no useful stack
        } else {
            result.error = error.message || String(error);
            result.errorStack = error.stack || null;
        }

        console.error('Test failed:', testName, error);
    } finally {
        // Always run afterEach hook
        try {
            if (testSuite.afterEach) {
                console.log('Running afterEach for:', testName);
                await testSuite.afterEach();
            }
        } catch (cleanupError) {
            console.error('Error in afterEach:', cleanupError);
            if (result.status === 'pass') {
                result.status = 'fail';
                result.error = `Cleanup failed: ${cleanupError.message}`;
            }
        }

        // Capture any logs from the test
        result.logs = clearLogs();

        result.duration = performance.now() - startTime;
        renderTestResults();
        console.log('Test complete:', testName, 'Status:', result.status);
    }

    // Return false if test failed (stop execution)
    return result.status === 'pass';
}

/**
 * Render test results in the results panel
 */
function renderTestResults() {
    const $resultsContainer = $('#resultsContainer');
    $resultsContainer.empty();

    if (appState.testResults.length === 0) {
        $resultsContainer.html(`
            <div class="empty-state">
                <p>No tests have been run yet. Select tests and click "Run Tests" to begin.</p>
            </div>
        `);
        return;
    }

    appState.testResults.forEach(result => {
        const $resultCard = createResultCard(result);
        $resultsContainer.append($resultCard);
    });
}

/**
 * Create a result card element
 */
function createResultCard(result) {
    const $card = $('<div>')
        .addClass('test-result')
        .addClass(result.status);

    // Header
    const $header = $('<div>').addClass('test-result-header');

    let statusIcon = '○'; // pending
    if (result.status === 'pass') statusIcon = '✓';
    if (result.status === 'fail') statusIcon = '✗';

    const $icon = $('<span>')
        .addClass('status-icon')
        .addClass(result.status)
        .text(statusIcon);

    const $title = $('<h3>').text(result.name);

    // Duration
    if (result.duration > 0) {
        const $duration = $('<span>')
            .addClass('test-duration')
            .text(`${result.duration.toFixed(0)}ms`);
        $header.append($icon, $title, $duration);
    } else {
        $header.append($icon, $title);
    }

    $card.append($header);

    // Error message with stack trace
    if (result.errorStack) {
        const $errorBox = $('<div>')
            .addClass('message-box error-message')
            .text(result.errorStack);
        $card.append($errorBox);
    } else if (result.error) {
        const $errorBox = $('<div>')
            .addClass('message-box error-message')
            .text(result.error);
        $card.append($errorBox);
    }

    // Show logs only when test failed and there are logs
    if (result.status === 'fail' && result.logs && result.logs.length > 0) {
        const $logHeader = $('<div>')
            .addClass('log-header')
            .text('Log');
        $card.append($logHeader);

        const $logBox = $('<div>')
            .addClass('message-box log-message');

        result.logs.forEach(entry => {
            const $logEntry = $('<div>')
                .addClass('log-entry')
                .text(entry.data);
            $logBox.append($logEntry);
        });

        $card.append($logBox);
    }

    return $card;
}
