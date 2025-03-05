import { CUSS2Model } from './cuss2-model.js';

import { ReceiptData } from './receipt-data.js';
export class EPaymentMessageTransactionTransactionResponseNonApproval extends CUSS2Model {
    static schema = {
        "nonApprovalReasonCode": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: false
        },
        "referral": {
            type: (v) => typeof v === "boolean",
            typeName: "boolean",
            required: false
        },
        "nonApprovalReasonText": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "receiptData": {
            type: (v) => typeof v === "array",
            typeName: "array",
            required: false
        }
    }
}
