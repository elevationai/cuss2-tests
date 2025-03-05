import { CUSS2Model } from './cuss2-model.js';

import { CommonUsePaymentMessageCharacteristicsCharacteristicsResponseEPayment } from './common-use-payment-message-characteristics-characteristics-response-epayment.js';
export class CommonUsePaymentMessageCharacteristicsCharacteristicsResponse extends CUSS2Model {
    static schema = {
        "ePayment": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CommonUsePaymentMessageCharacteristicsCharacteristicsResponseEPayment",
            required: false
        }
    }
}
