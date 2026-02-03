# CUSS2 Tests

Integration tests for a CUSS2 platform.

## Overview

This test suite validates the CUSS2 (Common Use Self Service) protocol
implementation, focusing on:

- WebSocket connection handling and error codes
- Platform directives and responses
- Application state transitions (INITIALIZE, UNAVAILABLE, AVAILABLE, ACTIVE)
- Component testing (barcode readers, printers, etc.)

## Web UI

Tests are run through the browser-based test UI located in `/docs`.

### Running Locally

1. Serve the `/docs` folder with any static file server
2. Open `index.html` in a browser
3. Click the gear icon to configure connection settings
4. Select tests to run and click "Run Tests"

### Features

- **Test Tree**: Expandable/collapsible test suites with keyboard navigation
  - Arrow Up/Down: Navigate between tests
  - Arrow Left/Right: Collapse/expand suites
  - Spacebar: Toggle checkbox
- **Test Dependencies**: Suites declare dependencies on other suites. The UI enforces this with locked checkboxes — enabling a suite automatically enables its dependencies.
- **Settings Persistence**: Connection settings and test selections are saved to localStorage.
- **User Prompts**: Interactive prompts for tests requiring user action (e.g., scanning barcodes, disconnecting devices). Test timeouts are paused while a prompt is active.
- **Lifecycle Hooks**: Suites can define `beforeEach`/`afterEach` hooks that run around every test, and a `shutdown` hook for cleanup when the suite finishes.

### Configuration

Click the gear icon to configure:

- **WebSocket URL**: The CUSS2 platform WebSocket endpoint
- **Client ID**: Application identifier
- **Client Secret**: Authentication secret
- **Device ID**: Optional device identifier
- **Token URL**: OAuth token endpoint (optional, can be auto-generated from the WebSocket URL)

Default configuration:

```json
{
  "server_url": "http://localhost:22222",
  "oauth_url": "http://localhost:22222/oauth/token",
  "client_id": "EAI",
  "client_secret": "secret"
}
```

## Test Structure

### Test Suites

| Suite | Dependencies | Status |
|-------|-------------|--------|
| Connect to platform | — | Implemented |
| INITIALIZE | — | Implemented |
| Setup Components | initialize | Placeholder |
| UNAVAILABLE | initialize | Implemented |
| AVAILABLE | unavailable | Implemented |
| ACTIVE | available | Implemented |
| BTP Printer | active | Placeholder |
| BPP Printer | active | Placeholder |
| Barcode Scan | active | Implemented |
| Passport Scan | active | Placeholder |
| Announcement | active | Placeholder |
| Credit Card | active | Placeholder |

Placeholder suites are defined but have no test functions yet.

### Base Component Tests

All interactive components share common tests via `baseComponentTests()`:

1. Component should exist
2. Component should be OK and READY
3. OUT_OF_SEQUENCE when disabling already disabled component
4. NOT_REACHABLE when device is disconnected
5. OK when device is reconnected
6. Enable component
7. *(Component-specific tests)*
8. Disable component

### Adding Component-Specific Tests

```javascript
tests: baseComponentTests("barcodeReader", () => [
  {
    name: "it should return data from a scan",
    test: async function () {
      const data = await promptUser("Scan a barcode", () =>
        new Promise((resolve) => {
          cuss2.barcodeReader.once("data", resolve);
        })
      );
      expect(data).to.be.ok;
    },
  },
]),
```

## Protocol Documentation

- `/diagrams/websocket.md` — WebSocket connection sequence diagrams (error codes 4001–4006, successful connection)
- `/diagrams/accessibility.md` — Accessibility mode sequence diagrams (protocol-level documentation, no corresponding tests yet)
