import { CUSS2Model } from './cuss2-model.js';

import { EPaymentMessageTransactionTransactionAcknowledge } from './epayment-message-transaction-transaction-acknowledge.js';
import { EPaymentMessageTransactionTransactionRequest } from './epayment-message-transaction-transaction-request.js';
import { EPaymentMessageTransactionTransactionResponse } from './epayment-message-transaction-transaction-response.js';
import { TransactionDocumentType } from './transaction-document-type.js';
export class EPaymentMessageTransaction extends CUSS2Model {
    static schema = {
        "transactionDocumentType": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "TransactionDocumentType",
            required: true
        },
        "transactionDocumentReturnType": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "TransactionDocumentType",
            required: false
        },
        "transactionType": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "EPaymentMessageTransactionTransactionTypeEnum",
            required: true
        },
        "transactionRequest": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "EPaymentMessageTransactionTransactionRequest",
            required: false
        },
        "transactionResponse": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "EPaymentMessageTransactionTransactionResponse",
            required: false
        },
        "transactionAcknowledge": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "EPaymentMessageTransactionTransactionAcknowledge",
            required: false
        }
    }
}
const EPaymentMessageTransactionTransactionTypeEnum = Object.freeze({
    CANCEL: 'CANCEL',
    PREAUTH: 'PRE_AUTH',
    POSTAUTH: 'POST_AUTH',
    PURCHASE: 'PURCHASE',
    REFUND: 'REFUND',
    VOIDPURCHASE: 'VOID_PURCHASE',
    VOIDREFUND: 'VOID_REFUND'
});

export { EPaymentMessageTransactionTransactionTypeEnum };