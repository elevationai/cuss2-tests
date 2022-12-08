import {validateComponent} from "../componentValidation.js";
import {
  ApplicationState,
  ApplicationStateCodes,
  PlatformDirectives,
  StatusCodes
} from "cuss2-javascript-models";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"


import config from "../config.js";
import {Connection} from "../Connection.js";
import {Build, callAndDoBaselineValidation} from "../helper.js";

describe('Applications State Requests', function () {
  let conn
  const connect = async () => {
    conn = await Connection.connect(config.server_url ,config.client_id, config.client_secret, config.oauth_url)
    await conn.getEnvironmentData()
  }
  const close = () => {
    conn.close(4999, 'Test Complete')
    conn = undefined
  }


  async function requestState(state, expectedResponse={}) {
    const dataObj = ApplicationState.constructFromObject({
      applicationStateCode: state
    })
    const ad = Build.applicationData(PlatformDirectives.platformApplicationsStaterequest, {dataObj})
    await callAndDoBaselineValidation(conn, ad, {
      state: state, ...expectedResponse
    })
  }

  describe('While in INITIALIZE State', function () {
    before(connect);
    after(close);

    it('should return WRONG_APPLICATION_STATE if requesting `ACTIVE` state', async function () {
      await requestState(ApplicationStateCodes.ACTIVE, {
        state: ApplicationStateCodes.INITIALIZE,
        status: StatusCodes.WRONG_APPLICATION_STATE
      })
    })
    it('should return WRONG_APPLICATION_STATE if requesting `AVAILABLE` state', async function () {
      await requestState(ApplicationStateCodes.ACTIVE, {
        state: ApplicationStateCodes.INITIALIZE,
        status: StatusCodes.WRONG_APPLICATION_STATE
      })
    })
    it('should return WRONG_APPLICATION_STATE if requesting `STOPPED` state', async function () {
      await requestState(ApplicationStateCodes.STOPPED, {
        state: ApplicationStateCodes.INITIALIZE,
        status: StatusCodes.WRONG_APPLICATION_STATE
      })
    })
    it('should return WRONG_APPLICATION_STATE if requesting `SUSPENDED` state', async function () {
      await requestState(ApplicationStateCodes.SUSPENDED, {
        state: ApplicationStateCodes.INITIALIZE,
        status: StatusCodes.WRONG_APPLICATION_STATE
      })
    })
    // make sure to do this last to reduce impact of it failing & messing with other tests
    it('should return WRONG_APPLICATION_STATE if requesting `INITIALIZE` state', async function () {
      await requestState(ApplicationStateCodes.INITIALIZE, {
        state: ApplicationStateCodes.INITIALIZE,
        status: StatusCodes.WRONG_APPLICATION_STATE
      })
    })
    it('should be able to switch to `UNAVAILABLE`', async function () {
      await requestState(ApplicationStateCodes.UNAVAILABLE)
    })
  })

  describe('While in UNAVAILABLE State', function () {
    before(async () => {
      await connect()
      await requestState(ApplicationStateCodes.UNAVAILABLE)
    })
    after(close)

    it('should return WRONG_APPLICATION_STATE if requesting `INITIALIZE` state', async function () {
      await requestState(ApplicationStateCodes.INITIALIZE, {
        state: ApplicationStateCodes.UNAVAILABLE,
        status: StatusCodes.WRONG_APPLICATION_STATE
      })
    })
    it('should return WRONG_APPLICATION_STATE if requesting `ACTIVE` state', async function () {
      await requestState(ApplicationStateCodes.ACTIVE, {
        state: ApplicationStateCodes.UNAVAILABLE,
        status: StatusCodes.WRONG_APPLICATION_STATE
      })
    })
    it('should return WRONG_APPLICATION_STATE if requesting `STOPPED` state', async function () {
      await requestState(ApplicationStateCodes.STOPPED, {
        state: ApplicationStateCodes.UNAVAILABLE,
        status: StatusCodes.WRONG_APPLICATION_STATE
      })
    })
    it('should return WRONG_APPLICATION_STATE if requesting `SUSPENDED` state', async function () {
      await requestState(ApplicationStateCodes.SUSPENDED, {
        state: ApplicationStateCodes.UNAVAILABLE,
        status: StatusCodes.WRONG_APPLICATION_STATE
      })
    })
    // make sure to do this last to reduce impact of it failing & messing with other tests
    it('should return WRONG_APPLICATION_STATE if requesting `UNAVAILABLE` state', async function () {
      await requestState(ApplicationStateCodes.UNAVAILABLE, {
        state: ApplicationStateCodes.UNAVAILABLE,
        status: StatusCodes.WRONG_APPLICATION_STATE
      })
    })
    it('should be able to switch to `AVAILABLE`', async function () {
      await requestState(ApplicationStateCodes.AVAILABLE)
    })
  })

  describe('While in AVAILABLE State', function () {
    before(async () => {
      await connect()
      await requestState(ApplicationStateCodes.UNAVAILABLE)
      await requestState(ApplicationStateCodes.AVAILABLE)
    })
    after(close)

    it('should return WRONG_APPLICATION_STATE if requesting `INITIALIZE` state', async function () {
      await requestState(ApplicationStateCodes.INITIALIZE, {
        state: ApplicationStateCodes.AVAILABLE,
        status: StatusCodes.WRONG_APPLICATION_STATE
      })
    })
    it('should return WRONG_APPLICATION_STATE if requesting `STOPPED` state', async function () {
      await requestState(ApplicationStateCodes.STOPPED, {
        state: ApplicationStateCodes.AVAILABLE,
        status: StatusCodes.WRONG_APPLICATION_STATE
      })
    })
    it('should return WRONG_APPLICATION_STATE if requesting `SUSPENDED` state', async function () {
      await requestState(ApplicationStateCodes.SUSPENDED, {
        state: ApplicationStateCodes.AVAILABLE,
        status: StatusCodes.WRONG_APPLICATION_STATE
      })
    })
    it('should be able to switch to `UNAVAILABLE` and back to `AVAILABLE`', async function () {
      await requestState(ApplicationStateCodes.UNAVAILABLE)
      await requestState(ApplicationStateCodes.AVAILABLE)
    })
    // make sure to do this last to reduce impact of it failing & messing with other tests
    it('should return WRONG_APPLICATION_STATE if requesting `AVAILABLE` state', async function () {
      await requestState(ApplicationStateCodes.AVAILABLE, {
        state: ApplicationStateCodes.AVAILABLE,
        status: StatusCodes.WRONG_APPLICATION_STATE
      })
    })
    it('should be able to switch to `ACTIVE`', async function () {
      await requestState(ApplicationStateCodes.ACTIVE)
    })
  })

  describe('While in ACTIVE State', function () {
    before(async () => {
      await connect()
      await requestState(ApplicationStateCodes.UNAVAILABLE)
      await requestState(ApplicationStateCodes.AVAILABLE)
      await requestState(ApplicationStateCodes.ACTIVE)
    })
    after(close)

    it('should return WRONG_APPLICATION_STATE if requesting `INITIALIZE` state', async function () {
      await requestState(ApplicationStateCodes.INITIALIZE, {
        state: ApplicationStateCodes.ACTIVE,
        status: StatusCodes.WRONG_APPLICATION_STATE
      })
    })
    it('should return WRONG_APPLICATION_STATE if requesting `ACTIVE` state', async function () {
      await requestState(ApplicationStateCodes.ACTIVE, {
        state: ApplicationStateCodes.ACTIVE,
        status: StatusCodes.WRONG_APPLICATION_STATE
      })
    })
    it('should return WRONG_APPLICATION_STATE if requesting `STOPPED` state', async function () {
      await requestState(ApplicationStateCodes.STOPPED, {
        state: ApplicationStateCodes.ACTIVE,
        status: StatusCodes.WRONG_APPLICATION_STATE
      })
    })
    it('should return WRONG_APPLICATION_STATE if requesting `SUSPENDED` state', async function () {
      await requestState(ApplicationStateCodes.SUSPENDED, {
        state: ApplicationStateCodes.ACTIVE,
        status: StatusCodes.WRONG_APPLICATION_STATE
      })
    })
    it('should be able to switch to `AVAILABLE` and back to `ACTIVE`', async function () {
      await requestState(ApplicationStateCodes.AVAILABLE)
      await requestState(ApplicationStateCodes.ACTIVE)
    })
  })
})
