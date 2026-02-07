# CUSS2 Tests

Browser-based integration tests for CUSS2 (Common Use Self Service) platforms.

## Project Structure

- `/docs` - Web UI test runner (served via GitHub Pages or local server)
  - `app.js` - Test harness with suite execution, hooks, and user prompts
  - `helpers.js` - Shared utilities (`log`, `promptUser`, `validateUnsolicitedMessage`, etc.)
  - `tests.js` - Test suite aggregation and execution order
  - `/tests/*.js` - Individual test suites
- `/diagrams` - Protocol documentation (WebSocket sequences, accessibility modes)
- `/mocks` - Mock-up documentation

## Test Suite Conventions

### Suite Structure

```javascript
export const mySuite = {
  id: "my-suite",           // Unique identifier
  name: "My Suite",         // Display name
  description: "...",       // Shown in UI
  dependencies: ["active"], // Required suites (auto-enabled in UI)
  isState: true,            // Optional: marks state transition suites
  beforeAll: async function () { /* runs once before all tests */ },
  beforeEach: async function () { /* runs before each test */ },
  afterEach: async function () { /* runs after each test */ },
  shutdown: function () { /* cleanup when suite finishes */ },
  tests: [...]
};
```

### Test Structure

```javascript
{
  name: "it should do something",
  description: "Detailed description shown in UI",
  timeout: 180000, // Optional: override default 5s timeout (milliseconds)
  test: async function () {
    // Use this.result = { status: "inconclusive" } for skip
    // Use expect.fail() for explicit failure
  }
}
```

### Shared Connection

Most tests share a connection via `getCuss2()` from `initialize.js`. Tests requiring fresh connections should create their own and close them when done.

### State Transitions

CUSS2 state progression: `INITIALIZE → UNAVAILABLE → AVAILABLE → ACTIVE`

You cannot skip states. Always transition through each state in order.

### User Prompts

```javascript
const result = await promptUser(
  "Instruction to user",
  () => new Promise((resolve) => {
    // Wait for hardware event
    component.once("data", resolve);
  }),
  { icon: "scan" } // Lucide icon name
);
```

Test timeouts pause while prompts are active.

### Base Component Tests

Use `baseComponentTests()` for common component behavior:

```javascript
tests: baseComponentTests("barcodeReader", () => [
  // Component-specific tests inserted after enable, before disable
]);
```

### Validating Unsolicited Messages

```javascript
import { validateUnsolicitedMessage } from "../helpers.js";

// Asserts message has meta.eventClassification
validateUnsolicitedMessage(message);
```

## Deno Tasks

- `deno task test` - Run Deno tests
- `deno task check` - Type check TypeScript files
- `deno task lint` - Lint code

## Dependencies

Browser tests use ESM imports from CDN:
- `chai` for assertions
- `@cuss2/cuss2-ts` for CUSS2 client

Deno tests use JSR imports defined in `deno.json`.
