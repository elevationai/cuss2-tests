import { CUSS2Model } from './cuss2-model.js';

import { CUSS2BiometricsDomainGPDataListType } from './cuss2-biometrics-domain-gpdata-list-type.js';
import { CUSS2BiometricsDomainPassengerDataType } from './cuss2-biometrics-domain-passenger-data-type.js';
import { CUSS2BiometricsdomainBiometricProviderMessageBiometricRequestAgreementsList } from './cuss2-biometricsdomain-biometric-provider-message-biometric-request-agreements-list.js';
import { CUSS2BiometricsdomainBiometricProviderMessageBiometricRequestEnvironment } from './cuss2-biometricsdomain-biometric-provider-message-biometric-request-environment.js';
export class CUSS2BiometricsdomainBiometricProviderMessageBiometricRequest extends CUSS2Model {
    static schema = {
        "environment": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2BiometricsdomainBiometricProviderMessageBiometricRequestEnvironment",
            required: false
        },
        "agreementsList": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2BiometricsdomainBiometricProviderMessageBiometricRequestAgreementsList",
            required: false
        },
        "passenger": {
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
