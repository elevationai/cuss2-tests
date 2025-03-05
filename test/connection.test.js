import {PlatformDirectives} from "../cuss2-js-models/models/index.js";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

import {expect} from 'chai'
import config from "../config.js";
import {Connection} from "../Connection.js";
import {Build, callAndDoBaselineValidation} from "../helper.js";

describe('The WebSocket connection', function () {
  let conn

  beforeEach(async function () {
    conn = await Connection.connect(config.server_url ,config.client_id, config.client_secret, config.oauth_url)
    // console.log('Websocket connected')
  });
  afterEach(function () {
    conn.close(4999, 'Test Complete')
    conn = undefined
    // console.log('Websocket closed')
  });

  it('should timeout and close connection with 4001 if nothing received', async function () {
    return new Promise((resolve, reject) => {
      function handler(e) {
        try {
          expect(e.code).to.eq(4001)
          resolve()
        }
        catch (e) {
          reject()
        }
      }
      conn.on('close', handler)
    })
  }).timeout(5000);

  it('should close the connection and return 4002 if the first messages is not a ApplicationData object', async function () {
    return Promise.all([
      conn.waitFor('close').then((e) => {
        expect(e.code).to.eq(4002)
      }),
      conn.send({bad:1})
    ])
  });

  it('should close the connection and return 4003 if the first messages is not a PlatformEnvironment directive', async function () {
    return Promise.all([
      conn.waitFor('close').then((e) => {
        expect(e.code).to.eq(4003)
      }),
      conn.send(Build.applicationData(PlatformDirectives.PlatformComponents))
    ])
  });

  it('should close the connection and return 4004 if the token is invalid', async function () {
    return Promise.all([
      conn.waitFor('close').then((e) => {
        expect(e.code).to.eq(4004)
      }),
      conn.send(Build.applicationData(PlatformDirectives.PlatformEnvironment, {oauthToken: 'WRONG'}))
    ])
  });

  it('should close the connection and return 4006 if the tenant is DISABLED', async function () {
    const conn2 = await Connection.connect(config.server_url, 'DDD', 'DISABLED_TENANT', config.oauth_url)
    const closeEvent = await conn2.getEnvironmentData().catch(closeEvent => closeEvent) // required first call
    conn2.close(4999, 'Test Complete')
    expect(closeEvent.code).to.eq(4006)
  });

  it('should acknowledge and return the EnvironmentData', async function () {
    const ad = Build.applicationData(PlatformDirectives.PlatformEnvironment)
    const res = await callAndDoBaselineValidation(conn, ad)
    expect(res).to.have.nested.property('payload.environmentLevel')
    const environmentLevel = res.payload.environmentLevel
    expect(environmentLevel).to.have.property('sessionTimeout').and.to.be.a('number')
    expect(environmentLevel).to.have.property('deviceID').and.to.match(/^([0-9A-Fa-f-]{0,36}|NONE|none)$/)
    expect(environmentLevel).to.have.property('deviceLocation')
    expect(environmentLevel).to.have.nested.property('cussVersions[0]', '2.0')
    expect(environmentLevel).to.have.nested.property('cussInterfaceVersions[0]', '2.0')
    expect(environmentLevel).to.have.property('osName')
    expect(environmentLevel).to.have.property('osVersion')
    expect(environmentLevel).to.have.property('initTimeout').and.to.be.a('number')
  });

  it('should close the connection and return 4005 if there is already a connection open', async function () {
    await conn.getEnvironmentData() // required first call

    const conn2 = await Connection.connect(config.server_url ,config.client_id, config.client_secret, config.oauth_url)
    const closeEvent = await conn2.getEnvironmentData().catch(closeEvent => closeEvent) // required first call
    conn2.close(4999, 'Test Complete')
    expect(closeEvent.code).to.eq(4005)
  });
});
