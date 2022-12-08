
import {
  ApplicationData,
  ApplicationState, BaggageData, CommonUseBiometricMessage, CommonUsePaymentMessage,
  DataRecordList, IlluminationData,
  ScreenResolution, ApplicationTransfer, ApplicationDataMeta, ApplicationDataPayload
} from "cuss2-javascript-models";

import * as uuid from "uuid";
import {expect} from "chai";

export const Build = {
  applicationData: (directive, options={}) => {
    const {componentID, token, dataObj} = options
    const meta = new ApplicationDataMeta()
    meta.requestID = uuid.v4()
    meta.oauthToken = token
    meta.directive = directive
    meta.componentID = componentID

    const payload = new ApplicationDataPayload()
    if(dataObj instanceof ApplicationState) { payload.applicationState = dataObj }
    if(dataObj instanceof ApplicationTransfer) { payload.applicationTransfer = dataObj }
    if(dataObj instanceof DataRecordList) { payload.dataRecords = dataObj }
    if(dataObj instanceof ScreenResolution) { payload.screenResolution = dataObj }
    if(dataObj instanceof IlluminationData) { payload.illuminationData = dataObj }
    if(dataObj instanceof BaggageData) { payload.bagdropData = dataObj }
    if(dataObj instanceof CommonUsePaymentMessage) { payload.paymentData = dataObj }
    if(dataObj instanceof CommonUseBiometricMessage) { payload.biometricData = dataObj }

    const ad = new ApplicationData(meta)
    ad.payload = payload
    return ad
  }
}

export const callAndDoBaselineValidation = async (conn, appData, options={}) => {
  const directive = appData.meta.directive
  const componentID = appData.meta.componentID
  const ackPromise = conn.waitFor('ack')
  const res = await conn.sendAndGetResponse(appData)
  const ackResponse = await ackPromise

  expect(ackResponse).to.exist
  expect(ackResponse).to.have.property('requestID').and.to.match(/^([0-9A-Fa-f-]{0,36}|NONE|none)$/)
  expect(ackResponse).to.have.property('ackCode', 'ACK_OK')

  expect(res).to.exist
  expect(res.meta).to.exist
  expect(res).to.have.nested.property('meta.requestID', ackResponse.requestID)
  expect(res).to.have.nested.property('meta.platformDirective', directive)
  if (typeof componentID === 'number') {
    expect(res).to.have.nested.property('meta.componentID', componentID)
  }
  expect(res).to.have.nested.property('meta.applicationID.companyCode')
  expect(res).to.have.nested.property('meta.applicationID.applicationName')
  expect(res).to.have.nested.property('meta.currentApplicationState.applicationStateCode', options.state || 'INITIALIZE')
  expect(res).to.have.nested.property('meta.statusCode', options.status || 'OK')
  const eventClassification = res.meta.eventClassification
  expect(eventClassification).to.exist
  //TODO: add support for UNSOLICITED
  expect(eventClassification).to.have.property('eventCategory', 'NORMAL')
  expect(eventClassification).to.have.property('eventMode', 'SOLICITED')
  expect(eventClassification).to.have.property('eventType', 'PRIVATE')
  return res
}
