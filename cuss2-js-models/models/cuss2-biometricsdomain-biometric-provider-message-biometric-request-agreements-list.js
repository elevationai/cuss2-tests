import { CUSS2Model } from './cuss2-model.js';

import { CUSS2BiometricsDomainAgreementTextType } from './cuss2-biometrics-domain-agreement-text-type.js';
export class CUSS2BiometricsdomainBiometricProviderMessageBiometricRequestAgreementsList extends CUSS2Model {
    static schema = {
        "agreementTextList": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "Array<CUSS2BiometricsDomainAgreementTextType>",
            required: true
        }
    }
}
