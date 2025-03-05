import { CUSS2Model } from './cuss2-model.js';

import { ApprovalCode } from './approval-code.js';
import { AuthorizationAmounts } from './authorization-amounts.js';
import { GPParameterList } from './gpparameter-list.js';
import { MediaType } from './media-type.js';
import { ReceiptData } from './receipt-data.js';
import { TransactionReference } from './transaction-reference.js';
export class EPaymentMessageTransactionTransactionResponseApproval extends CUSS2Model {
    static schema = {
        "cardholderReceiptPrinted": {
            type: (v) => typeof v === "boolean",
            typeName: "boolean",
            required: false
        },
        "merchantReceiptPrinted": {
            type: (v) => typeof v === "boolean",
            typeName: "boolean",
            required: false
        },
        "transactionReference": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "TransactionReference",
            required: false
        },
        "mediaType": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "MediaType",
            required: false
        },
        "approvalType": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "EPaymentMessageTransactionTransactionResponseApprovalApprovalTypeEnum",
            required: false
        },
        "signatureCapture": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "cardBrand": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "approvalCode": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "ApprovalCode",
            required: false
        },
        "gpParameters": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "GPParameterList",
            required: false
        },
        "authorizationAmounts": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "AuthorizationAmounts",
            required: true
        },
        "receiptData": {
            type: (v) => typeof v === "array",
            typeName: "array",
            required: false
        }
    }
}
const EPaymentMessageTransactionTransactionResponseApprovalApprovalTypeEnum = Object.freeze({
    NONE: 'NONE',
    PIN: 'PIN',
    SIGNATURE: 'SIGNATURE'
});

export { EPaymentMessageTransactionTransactionResponseApprovalApprovalTypeEnum };