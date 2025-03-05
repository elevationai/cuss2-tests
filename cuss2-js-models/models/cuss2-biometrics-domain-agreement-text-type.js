import { CUSS2Model } from './cuss2-model.js';

export class CUSS2BiometricsDomainAgreementTextType extends CUSS2Model {
    static schema = {
        "agreementText": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "acceptanceMandatory": {
            type: (v) => typeof v === "boolean",
            typeName: "boolean",
            required: true
        },
        "agreementName": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        }
    }
}
