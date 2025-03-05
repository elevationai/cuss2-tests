import { CUSS2Model } from './cuss2-model.js';

export class TransactionStatus extends CUSS2Model {
    static schema = {
        "freeFormText": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "transactionStatusID": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "TransactionStatusTransactionStatusIDEnum",
            required: false
        }
    }
}
const TransactionStatusTransactionStatusIDEnum = Object.freeze({
    AMOUNTAPPROVAL: 'AMOUNT_APPROVAL',
    APPLICATIONSELECTION: 'APPLICATION_SELECTION',
    CARDINSERTION: 'CARD_INSERTION',
    CARDREMOVAL: 'CARD_REMOVAL',
    CASHBACKENTRY: 'CASHBACK_ENTRY',
    PINENTRY: 'PIN_ENTRY',
    PROCESSING: 'PROCESSING'
});

export { TransactionStatusTransactionStatusIDEnum };