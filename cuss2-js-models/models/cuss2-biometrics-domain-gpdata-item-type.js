import { CUSS2Model } from './cuss2-model.js';

export class CUSS2BiometricsDomainGPDataItemType extends CUSS2Model {
    static schema = {
        "name": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: true
        },
        "value": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: true
        }
    }
}
