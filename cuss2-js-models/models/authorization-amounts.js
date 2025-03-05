import { CUSS2Model } from './cuss2-model.js';

import { AmountType } from './amount-type.js';
export class AuthorizationAmounts extends CUSS2Model {
    static schema = {
        "requestedAmounts": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "AmountType",
            required: false
        },
        "approvedAmounts": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "AmountType",
            required: false
        }
    }
}
