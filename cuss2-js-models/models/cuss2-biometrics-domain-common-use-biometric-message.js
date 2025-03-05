import { CUSS2Model } from './cuss2-model.js';

import { CUSS2BiometricsDomainBiometricProviderMessage } from './cuss2-biometrics-domain-biometric-provider-message.js';
import { CUSS2BiometricsdomainCommonUseBiometricMessageCharacteristics } from './cuss2-biometricsdomain-common-use-biometric-message-characteristics.js';
export class CUSS2BiometricsDomainCommonUseBiometricMessage extends CUSS2Model {
    static schema = {
        "documentType": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2BiometricsDomainCommonUseBiometricMessageDocumentTypeEnum",
            required: true
        },
        "sessionID": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "characteristics": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2BiometricsdomainCommonUseBiometricMessageCharacteristics",
            required: false
        },
        "biometricProviderMessage": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2BiometricsDomainBiometricProviderMessage",
            required: false
        },
        "errorResponse": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2BiometricsDomainCommonUseBiometricMessageErrorResponseEnum",
            required: false
        }
    }
}
const CUSS2BiometricsDomainCommonUseBiometricMessageDocumentTypeEnum = Object.freeze({
    CHARACTERISTICS: 'CHARACTERISTICS',
    BIOMETRICPROVIDERMESSAGE: 'BIOMETRIC_PROVIDER_MESSAGE',
    ERRORRESPONSE: 'ERROR_RESPONSE'
});
const CUSS2BiometricsDomainCommonUseBiometricMessageErrorResponseEnum = Object.freeze({
    DATAERROR: 'DATA_ERROR',
    FORMATERROR: 'FORMAT_ERROR',
    ILLOGICAL: 'ILLOGICAL'
});

export { CUSS2BiometricsDomainCommonUseBiometricMessageDocumentTypeEnum, CUSS2BiometricsDomainCommonUseBiometricMessageErrorResponseEnum };