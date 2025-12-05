/**
 * CUSS1 Test Configuration
 * Define test suites, their structure, dependencies, and test functions
 */

// Import Chai assertion library (browser-friendly)
import { expect } from "https://esm.sh/chai@5.1.2";

// Test logging - captures data to display when a test fails
let testLogs = [];

export function log(...args) {
    testLogs.push({
        timestamp: Date.now(),
        data: args.map(a => {
            if (a === null) return 'null';
            if (a === undefined) return 'undefined';
            if (typeof a === 'object') {
                try {
                    return JSON.stringify(a, null, 2);
                } catch {
                    return String(a);
                }
            }
            return String(a);
        }).join(' ')
    });
}

export function clearLogs() {
    const captured = [...testLogs];
    testLogs = [];
    return captured;
}

// Import CUSS2 libraries - using local build (handles 'using' keyword for Safari)
import { Connection, Models } from "../../cuss2-ts/docs/dist/cuss2.esm.js";

// Destructure commonly used items from Models
const { PlatformDirectives } = Models;

// Configuration
let config = {
    server_url: "http://localhost:22222",
    oauth_url: "http://localhost:22222/oauth/token",
    client_id: "EAI",
    client_secret: "secret",
};

// Export config getter and setter
export function getConfig() {
    return { ...config };
}

export function updateConfig(newConfig) {
    if (newConfig.server_url) config.server_url = newConfig.server_url;
    if (newConfig.oauth_url) config.oauth_url = newConfig.oauth_url;
    if (newConfig.client_id) config.client_id = newConfig.client_id;
    if (newConfig.client_secret) config.client_secret = newConfig.client_secret;
}

// Helper: Build ApplicationData messages
const Build = {
    applicationData: (directive, options = {}) => {
        const { dataObj } = options;
        delete options.dataObj;

        const metaOptions = {
            deviceID: crypto.randomUUID(),
            requestID: crypto.randomUUID(),
            oauthToken: "",
            directive,
            ...options,
        };

        const meta = {
            deviceID: metaOptions.deviceID,
            requestID: metaOptions.requestID,
            oauthToken: metaOptions.oauthToken,
            directive: metaOptions.directive,
        };

        if (metaOptions.componentID !== undefined) {
            meta.componentID = metaOptions.componentID;
        }

        const payload = {};

        if (dataObj && payload) {
            payload.applicationState = dataObj;
        }

        return { meta, payload };
    },
};

// Helper: Call and validate baseline response
const callAndDoBaselineValidation = async (conn, appData, options = {}) => {
    const directive = appData.meta.directive;
    const componentID = appData.meta.componentID;
    const reqId = appData.meta.requestID;

    appData.meta.oauthToken = conn.access_token;
    if (!appData.meta.deviceID) {
        appData.meta.deviceID = conn.deviceID;
    }

    const ackPromise = conn.waitFor("ack");
    const promise = conn.waitFor(reqId, ["messageError", "socketError", "close"]);
    conn.json(appData);

    let res, ackResponse;
    try {
        res = await promise;
    } catch (e) {
        if (e instanceof CloseEvent) {
            throw new Error(`Connection closed unexpectedly (code: ${e.code}, reason: ${e.reason || 'none'})`);
        }
        throw e;
    }

    try {
        ackResponse = await ackPromise;
    } catch (e) {
        if (e instanceof CloseEvent) {
            throw new Error(`Connection closed while waiting for ACK (code: ${e.code}, reason: ${e.reason || 'none'})`);
        }
        throw e;
    }

    expect(ackResponse).to.be.ok;
    expect(ackResponse.requestID).to.match(/^([0-9A-Fa-f-]{0,36}|NONE|none)$/);
    expect(ackResponse.ackCode).to.equal("ACK_OK");

    expect(res).to.be.ok;
    expect(res.meta).to.be.ok;
    expect(res.meta.requestID).to.equal(ackResponse.requestID);
    expect(res.meta.platformDirective).to.equal(directive);

    if (typeof componentID === "number") {
        expect(res.meta.componentID).to.equal(componentID);
    }

    expect(res.meta.applicationID?.companyCode).to.be.ok;
    expect(res.meta.applicationID?.applicationName).to.be.ok;
    expect(res.meta.currentApplicationState?.applicationStateCode).to.equal(
        options.state || "INITIALIZE"
    );
    expect(res.meta.messageCode).to.equal(options.status || "OK");

    const eventClassification = res.meta.eventClassification;
    expect(eventClassification).to.be.ok;
    if (eventClassification) {
        expect(eventClassification.eventCategory).to.equal("NORMAL");
        expect(eventClassification.eventMode).to.equal("SOLICITED");
        expect(eventClassification.eventType).to.equal("PRIVATE");
    }

    return res;
};

// Shared test context
let conn = null;

// Test configuration
export const testConfig = [
    {
        id: 'connect',
        name: 'Connect to platform',
        beforeEach: async function() {
            conn = Connection.connect(
                config.server_url,
                config.client_id,
                config.client_secret,
                crypto.randomUUID(),
                config.oauth_url
            );
            await conn.waitFor('open');
        },
        afterEach: function() {
            if (conn) {
                conn.close(4999, "Test Complete");
            }
            conn = null;
        },
        tests: [
            {
                name: "it should timeout and close connection with 4001 if nothing received",
                test: async function() {
                    console.log('Test: Connection object:', conn);
                    console.log('Test: Connection readyState:', conn?.readyState);
                    console.log('Test: Connection has on method?', typeof conn?.on);

                    return new Promise((resolve, reject) => {
                        function handler(e) {
                            console.log('Test: Close event fired with code:', e.code);
                            try {
                                expect(e.code).to.equal(4001);
                                resolve();
                            } catch (err) {
                                reject(err);
                            }
                        }

                        if (typeof conn.on === 'function') {
                            console.log('Test: Attaching close handler');
                            conn.on("close", handler);
                        } else {
                            reject(new Error('Connection object does not have an "on" method'));
                        }
                    });
                }
            },
            // {
            //     name: "it should close the connection and return 4002 if the first messages is not a ApplicationData object",
            //     test: async function() {
            //         await Promise.all([
            //             conn.waitFor("close").then((e) => {
            //                 expect(e.code).to.equal(4002);
            //             }),
            //             Promise.resolve(conn.json({ bad: 1 }))
            //         ]);
            //     }
            // },
            {
                name: "it should close the connection and return 4003 if the first messages is not a PlatformEnvironment directive",
                test: async function() {
                    await Promise.all([
                        conn.waitFor("close").then((e) => {
                            expect(e.code).to.equal(4003);
                        }),
                        Promise.resolve(conn.send(Build.applicationData(PlatformDirectives.PLATFORM_COMPONENTS))),
                    ]);
                }
            },
            {
                name: "it should close the connection and return 4004 if the token is invalid",
                test: async function() {
                    await Promise.all([
                        conn.waitFor("close").then((e) => {
                            expect(e.code).to.equal(4004);
                        }),
                        Promise.resolve(conn.send(
                            Build.applicationData(PlatformDirectives.PLATFORM_ENVIRONMENT, {
                                oauthToken: "WRONG",
                            })
                        )),
                    ]);
                }
            },
            // {
            //     name: "it should close the connection and return 4006 if the tenant is DISABLED",
            //     test: async function() {
            //         const conn2 = Connection.connect(
            //             config.server_url,
            //             "DDD",
            //             "DISABLED_TENANT",
            //             crypto.randomUUID(),
            //             config.oauth_url
            //         );
            //         await conn2.waitFor('open');
            //         const ad = Build.applicationData(PlatformDirectives.PLATFORM_ENVIRONMENT);
            //         const closeEvent = await conn2.sendAndGetResponse(ad).catch((err) => err);
            //         conn2.close(4999, "Test Complete");
            //         if (closeEvent && typeof closeEvent === 'object' && 'code' in closeEvent) {
            //             expect(closeEvent.code).toBe(4006);
            //         }
            //     }
            // },
            {
                name: "it should acknowledge and return the EnvironmentData",
                test: async function() {
                    const ad = Build.applicationData(PlatformDirectives.PLATFORM_ENVIRONMENT);
                    const res = await callAndDoBaselineValidation(conn, ad);
                    expect(res.payload?.environmentLevel).to.be.ok;
                    const environmentLevel = res.payload?.environmentLevel;
                    log(environmentLevel);
                    if (environmentLevel) {
                        expect(typeof environmentLevel.sessionTimeout).to.equal("number");
                        expect(environmentLevel.deviceID).to.match(/^([0-9A-Fa-f-]{0,36}|NONE|none)$/);
                        expect(environmentLevel.deviceLocation).to.be.ok;
                        expect(environmentLevel.cussVersions?.some(v => /^2\.\d+$/.test(v))).to.be.true;
                        expect(environmentLevel.osName).to.be.ok;
                        expect(environmentLevel.osVersion).to.be.ok;
                        expect(typeof environmentLevel.initTimeout).to.equal("number");
                    }
                }
            },
            {
                name: "it should close the connection and return 4005 if there is already a connection open",
                test: async function() {
                    // Send initial environment data to establish the connection
                    const ad = Build.applicationData(PlatformDirectives.PLATFORM_ENVIRONMENT);
                    await conn.sendAndGetResponse(ad);

                    const conn2 = Connection.connect(
                        config.server_url,
                        config.client_id,
                        config.client_secret,
                        crypto.randomUUID(),
                        config.oauth_url
                    );
                    await conn2.waitFor('open');
                    const ad2 = Build.applicationData(PlatformDirectives.PLATFORM_ENVIRONMENT);
                    const closeEvent = await conn2.sendAndGetResponse(ad2).catch((err) => err);
                    conn2.close(4999, "Test Complete");
                    if (closeEvent && typeof closeEvent === 'object' && 'code' in closeEvent) {
                        expect(closeEvent.code).to.equal(4005);
                    }
                }
            },
        ]
    },
    {
        id: 'setup-components',
        name: 'Setup Components',
        dependencies: ['connect']
    },
    {
        id: 'available',
        name: 'AVAILABLE',
        isState: true,
        dependencies: ['setup-components']
    },
    {
        id: 'active',
        name: 'ACTIVE',
        isState: true,
        dependencies: ['available']
    },
    {
        id: 'test-btp-printer',
        name: 'Test BTP Printer',
        dependencies: ['available'],
        tests: [
            { name: 'Setup Logo' },
            { name: 'Setup Binary Logo' },
            { name: 'Setup PECTAB' },
            { name: 'Print' }
        ]
    },
    {
        id: 'test-bpp-printer',
        name: 'Test BPP Printer',
        dependencies: ['available']
    },
    {
        id: 'barcode-scan',
        name: 'Barcode Scan',
        dependencies: ['available']
    },
    {
        id: 'passport-scan',
        name: 'Passport Scan',
        dependencies: ['available']
    },
    {
        id: 'credit-card',
        name: 'Credit Card',
        dependencies: ['available']
    },
    {
        id: 'accessible-device-restriction',
        name: 'Accessible Device Restriction',
        dependencies: ['available']
    },
    {
        id: 'go-accessible',
        name: 'Go Accessible',
        dependencies: ['accessible-device-restriction']
    }
];

// Test execution functions can be defined and exported here
// Example:
// export async function runConnectTest() {
//     // Your test implementation
// }
