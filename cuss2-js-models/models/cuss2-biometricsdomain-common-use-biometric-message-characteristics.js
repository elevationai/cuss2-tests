import { CUSS2Model } from './cuss2-model.js';

import { CUSS2BiometricsDomainBiometricAnyType } from './cuss2-biometrics-domain-biometric-any-type.js';
import { CUSS2BiometricsDomainCharacteristicsDocumentType } from './cuss2-biometrics-domain-characteristics-document-type.js';
export class CUSS2BiometricsdomainCommonUseBiometricMessageCharacteristics extends CUSS2Model {
    static schema = {
        "characteristicsDocumentType": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2BiometricsDomainCharacteristicsDocumentType",
            required: true
        },
        "characteristicsDocumentReturnType": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2BiometricsDomainCharacteristicsDocumentType",
            required: true
        },
        "characteristicsRequest": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2BiometricsDomainBiometricAnyType",
            required: false
        }
    }
}
