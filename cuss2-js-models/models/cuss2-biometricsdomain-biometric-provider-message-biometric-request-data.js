import { CUSS2Model } from './cuss2-model.js';

import { CUSS2BiometricsDomainPassengerDataType } from './cuss2-biometrics-domain-passenger-data-type.js';
import { CUSS2BiometricsdomainBiometricProviderMessageBiometricRequestDataProcessing } from './cuss2-biometricsdomain-biometric-provider-message-biometric-request-data-processing.js';
export class CUSS2BiometricsdomainBiometricProviderMessageBiometricRequestData extends CUSS2Model {
    static schema = {
        "processing": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2BiometricsdomainBiometricProviderMessageBiometricRequestDataProcessing",
            required: false
        },
        "passenger": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2BiometricsDomainPassengerDataType",
            required: false
        }
    }
}
