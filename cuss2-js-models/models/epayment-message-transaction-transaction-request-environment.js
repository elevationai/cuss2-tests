import { CUSS2Model } from './cuss2-model.js';

import { MerchantID } from './merchant-id.js';
export class EPaymentMessageTransactionTransactionRequestEnvironment extends CUSS2Model {
    static schema = {
        "merchantID": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "MerchantID",
            required: false
        },
        "location": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "cashier": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "orderReference": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        }
    }
}
