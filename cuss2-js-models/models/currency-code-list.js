import { CUSS2Model } from './cuss2-model.js';

import { CurrencyCode } from './currency-code.js';
export class CurrencyCodeList extends CUSS2Model {
    static schema = {
        "overridable": {
            type: (v) => typeof v === "boolean",
            typeName: "boolean",
            required: false
        },
        "currencyCodes": {
            type: (v) => typeof v === "array",
            typeName: "array",
            required: true
        }
    }
}
