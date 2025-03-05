import { CUSS2Model } from './cuss2-model.js';

export class AlibiType extends CUSS2Model {
    static schema = {
        "provider": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "value": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: true
        }
    }
}
