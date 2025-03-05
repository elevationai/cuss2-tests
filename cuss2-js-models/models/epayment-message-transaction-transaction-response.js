import { CUSS2Model } from './cuss2-model.js';

import { EPaymentMessageTransactionTransactionResponseApproval } from './epayment-message-transaction-transaction-response-approval.js';
import { EPaymentMessageTransactionTransactionResponseNonApproval } from './epayment-message-transaction-transaction-response-non-approval.js';
import { TransactionStatus } from './transaction-status.js';
export class EPaymentMessageTransactionTransactionResponse extends CUSS2Model {
    static schema = {
        "responseType": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "EPaymentMessageTransactionTransactionResponseResponseTypeEnum",
            required: true
        },
        "approval": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "EPaymentMessageTransactionTransactionResponseApproval",
            required: false
        },
        "nonApproval": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "EPaymentMessageTransactionTransactionResponseNonApproval",
            required: false
        },
        "transactionStatus": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "TransactionStatus",
            required: false
        }
    }
}
const EPaymentMessageTransactionTransactionResponseResponseTypeEnum = Object.freeze({
    APPROVAL: 'APPROVAL',
    CANCELLATION: 'CANCELLATION',
    DECLINE: 'DECLINE',
    FAILURE: 'FAILURE',
    STATUS: 'STATUS'
});

export { EPaymentMessageTransactionTransactionResponseResponseTypeEnum };