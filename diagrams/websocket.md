### Timeout waiting for Environment request
```mermaid
sequenceDiagram
    opt Server Config
        Client->>Server: {seconds_to_wait_for_first_message: 1}
    end
    Client->>Server: connect
    Client->Client: wait 5
    Server->>Client: {code: 4001, reason: 'Timeout waiting for Environment request'}
```

### ApplicationData object validation
```mermaid
sequenceDiagram
    Client->>Server: connect
    Client->>Server: send({bad:1})
    Server->>Client: {code: 4002, reason: 'Invalid ApplicationData'}
```

### First Directive Must Be PLATFORM_ENVIRONMENT
```mermaid
sequenceDiagram
    Client->>Server: connect
    Client->>Server: send(Build.applicationData(PlatformComponents))
    Server->>Client: {code: 4003, reason: 'PLATFORM_ENVIRONMENT must be the first directive'}
```

### Invalid OAuth Token
```mermaid
sequenceDiagram
    Client->>Server: connect
    Client->>Server: send(Build.applicationData(PlatformEnvironment, {oauthToken: 'WRONG'}))
    Server->>Client: {code: 4004, reason: 'Invalid Token'}
```

### Successful Connection
```mermaid
sequenceDiagram
    Client->>Server: connect
    Client->>Server: send(Build.applicationData(PlatformEnvironment))
    Server->>Client: PlatformData({payload: {environmentLevel: EnvironmentLevel}})
```

### Client already connected
```mermaid
sequenceDiagram
    Client->>Server: connect
    Client->>Server: send(Build.applicationData(PlatformEnvironment))
    Server->>Client: PlatformData({payload: {environmentLevel: EnvironmentLevel}})
    Client->>Server: connect
    Client->>Server: send(Build.applicationData(PlatformEnvironment))
    Server->>Client: {code: 4005, reason: 'Client already connected'}
```

### Tenant DISABLED
```mermaid
sequenceDiagram
    opt Tenants Config
        Client->>Server: {DDD: {status: DISABLED}}
    end
    Client->>Server: connect
    Client->>Server: send(Build.applicationData(PlatformEnvironment))
    Server->>Client: {code: 4006, reason: 'DISABLED'}
```
