import { CUSS2Model } from './cuss2-model.js';

import { CUSS2BiometricsDomainGPDataListType } from './cuss2-biometrics-domain-gpdata-list-type.js';
import { CUSS2BiometricsDomainPassengerDataType } from './cuss2-biometrics-domain-passenger-data-type.js';
import { CUSS2BiometricsdomainBiometricProviderMessageBiometricResponseFailureReason } from './cuss2-biometricsdomain-biometric-provider-message-biometric-response-failure-reason.js';
export class CUSS2BiometricsdomainBiometricProviderMessageBiometricResponse extends CUSS2Model {
    static schema = {
        "responseType": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2BiometricsdomainBiometricProviderMessageBiometricResponseResponseTypeEnum",
            required: true
        },
        "failureReason": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2BiometricsdomainBiometricProviderMessageBiometricResponseFailureReason",
            required: false
        },
        "passengerData": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2BiometricsDomainPassengerDataType",
            required: false
        },
        "gpDataList": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2BiometricsDomainGPDataListType",
            required: false
        }
    }
}
const CUSS2BiometricsdomainBiometricProviderMessageBiometricResponseResponseTypeEnum = Object.freeze({
    CANCELLATION: 'CANCELLATION',
    FAILURE: 'FAILURE',
    NOTIFICATION: 'NOTIFICATION',
    SUCCESS: 'SUCCESS'
});

export { CUSS2BiometricsdomainBiometricProviderMessageBiometricResponseResponseTypeEnum };