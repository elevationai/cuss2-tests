import { CUSS2Model } from './cuss2-model.js';

export class AmountType extends CUSS2Model {
    static schema = {
        "currencyCode": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: true
        },
        "baseAmount": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: true
        }
    }
}
