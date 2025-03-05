import { CUSS2Model } from './cuss2-model.js';

export class EPaymentMessageTransactionTransactionAcknowledge extends CUSS2Model {
    static schema = {
        "consumed": {
            type: (v) => typeof v === "boolean",
            typeName: "boolean",
            required: true
        }
    }
}
