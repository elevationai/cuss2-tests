import {validateComponent} from "../componentValidation.js";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"


import {expect} from 'chai'
import config from "../config.js";
import {Connection} from "../Connection.js";
import {Build, callAndDoBaselineValidation} from "../helper.js";
import {MessageCodes, PlatformDirectives} from "../cuss2-js-models/models/index.js";

describe('Directive Calls', function () {
  let conn

  before(async function () {
    conn = await Connection.connect(config.server_url ,config.client_id, config.client_secret, config.oauth_url)
    await conn.getEnvironmentData()
    // console.log('Websocket connected')
  });
  after(function () {
    conn.close()
    // console.log('Websocket closed')
  });

  it('should return `platformComponents` data', async function () {
    const ad = Build.applicationData(PlatformDirectives.PlatformComponents)
    const res = await callAndDoBaselineValidation(conn, ad)
    const componentList = res.payload.componentList
    expect(componentList).to.exist
    expect(componentList).to.have.length.greaterThanOrEqual(1)
    for (let i = 0; i < componentList.length; i++) {
      validateComponent(componentList[i])
    }
  });

  it('should require a componentId for `peripheralsQuery`', async function () {
    const ad = Build.applicationData(PlatformDirectives.PeripheralsQuery)
    await callAndDoBaselineValidation(conn, ad, {
      status: MessageCodes.DATAMISSING
    })
  });

  it('should return `peripheralsQuery` data', async function () {
    const ad = Build.applicationData(PlatformDirectives.PeripheralsQuery, {componentID:0})
    await callAndDoBaselineValidation(conn, ad)
  });
});
