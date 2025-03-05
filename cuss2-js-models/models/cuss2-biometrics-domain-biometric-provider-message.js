import { CUSS2Model } from './cuss2-model.js';

import { CUSS2BiometricsDomainBiometricProviderMessageType } from './cuss2-biometrics-domain-biometric-provider-message-type.js';
import { CUSS2BiometricsdomainBiometricProviderMessageBiometricRequest } from './cuss2-biometricsdomain-biometric-provider-message-biometric-request.js';
import { CUSS2BiometricsdomainBiometricProviderMessageBiometricRequestData } from './cuss2-biometricsdomain-biometric-provider-message-biometric-request-data.js';
import { CUSS2BiometricsdomainBiometricProviderMessageBiometricResponse } from './cuss2-biometricsdomain-biometric-provider-message-biometric-response.js';
export class CUSS2BiometricsDomainBiometricProviderMessage extends CUSS2Model {
    static schema = {
        "biometricProviderMessageType": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2BiometricsDomainBiometricProviderMessageType",
            required: true
        },
        "biometricProviderMessageReturnType": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2BiometricsDomainBiometricProviderMessageType",
            required: true
        },
        "biometricFunctionType": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2BiometricsDomainBiometricProviderMessageBiometricFunctionTypeEnum",
            required: true
        },
        "biometricRequest": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2BiometricsdomainBiometricProviderMessageBiometricRequest",
            required: false
        },
        "biometricRequestData": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2BiometricsdomainBiometricProviderMessageBiometricRequestData",
            required: false
        },
        "biometricResponse": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2BiometricsdomainBiometricProviderMessageBiometricResponse",
            required: false
        }
    }
}
const CUSS2BiometricsDomainBiometricProviderMessageBiometricFunctionTypeEnum = Object.freeze({
    ASSOCIATE: 'ASSOCIATE',
    DISASSOCIATE: 'DISASSOCIATE',
    ENROLL: 'ENROLL',
    GETASSOCIATIONS: 'GET_ASSOCIATIONS',
    IDENTIFY: 'IDENTIFY',
    PREVIEW: 'PREVIEW',
    PURGE: 'PURGE',
    VERIFY: 'VERIFY'
});

export { CUSS2BiometricsDomainBiometricProviderMessageBiometricFunctionTypeEnum };