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

The primary way to run tests is through the browser-based test UI located in `/docs`.

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
- **Settings Persistence**: Connection settings saved to localStorage
- **User Prompts**: Interactive prompts for tests requiring user action (e.g., scanning barcodes, disconnecting devices)
- **Shutdown Hooks**: Automatic cleanup when tests complete

### Configuration

Click the gear icon to configure:

- **WebSocket URL**: The CUSS2 platform WebSocket endpoint
- **Client ID**: Application identifier
- **Client Secret**: Authentication secret
- **Token URL**: OAuth token endpoint (optional, can be auto-generated)

## CLI Tests (Deno)

Command-line tests are also available using Deno:

```bash
# Run all tests
deno task test

# Run specific test file
deno test --allow-net --allow-env --allow-read test/connection.test.ts
```

### Prerequisites

- [Deno](https://deno.land/) runtime installed
- CUSS2 server running to test against

### Configuration

CLI test configuration is in `config.ts`:

```typescript
export default {
  server_url: "http://localhost:22222",
  oauth_url: "http://localhost:22222/oauth/token",
  client_id: "EIA",
  client_secret: "secret",
};
```

## Test Structure

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

See `/diagrams/websocket.md` for WebSocket protocol sequence diagrams.
