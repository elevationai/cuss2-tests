# CUSS2 Tests

Integration tests for a CUSS2 platform.

## Overview

This test suite validates the CUSS2 (Common Use Self Service) protocol implementation, focusing on:
- WebSocket connection handling and error codes
- Platform directives and responses
- Application state transitions
- Component queries and validation

## Prerequisites

- [Deno](https://deno.land/) runtime installed
- CUSS2 server running to test against

## Configuration

The test configuration is in `config.ts`:

```typescript
export default {
  server_url: "http://localhost:22222",
  oauth_url: "http://localhost:22222/oauth/token",
  client_id: "EIA",
  client_secret: "secret",
};
```

## Running Tests

Run all tests:
```bash
deno task test
```

Run specific test file:
```bash
deno test --allow-net --allow-env --allow-read test/connection.test.ts
```

## Protocol Documentation

See `/diagrams/websocket.md` for WebSocket protocol sequence diagrams.

