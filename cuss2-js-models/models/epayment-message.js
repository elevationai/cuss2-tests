import { CUSS2Model } from './cuss2-model.js';

import { EPaymentMessageOperation } from './epayment-message-operation.js';
import { EPaymentMessageSetup } from './epayment-message-setup.js';
import { EPaymentMessageTransaction } from './epayment-message-transaction.js';
export class EPaymentMessage extends CUSS2Model {
    static schema = {
        "ePaymentMsgType": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "EPaymentMessageEPaymentMsgTypeEnum",
            required: true
        },
        "setup": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "EPaymentMessageSetup",
            required: false
        },
        "transaction": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "EPaymentMessageTransaction",
            required: false
        },
        "operation": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "EPaymentMessageOperation",
            required: false
        }
    }
}
const EPaymentMessageEPaymentMsgTypeEnum = Object.freeze({
    OPERATION: 'OPERATION',
    SETUP: 'SETUP',
    TRANSACTION: 'TRANSACTION'
});

export { EPaymentMessageEPaymentMsgTypeEnum };