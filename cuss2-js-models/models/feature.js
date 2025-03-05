import { CUSS2Model } from './cuss2-model.js';

export class Feature extends CUSS2Model {
    static schema = {
        "featureName": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "FeatureFeatureNameEnum",
            required: true
        },
        "overridable": {
            type: (v) => typeof v === "boolean",
            typeName: "boolean",
            required: false
        }
    }
}
const FeatureFeatureNameEnum = Object.freeze({
    AUTOCOMMIT: 'AUTO_COMMIT',
    PREAUTHORIZATION: 'PRE_AUTHORIZATION',
    RECEIPTPRINTER: 'RECEIPT_PRINTER',
    SIGNATURECAPTURE: 'SIGNATURE_CAPTURE',
    SIGNATURECVMSUPPORTED: 'SIGNATURE_CVM_SUPPORTED'
});

export { FeatureFeatureNameEnum };