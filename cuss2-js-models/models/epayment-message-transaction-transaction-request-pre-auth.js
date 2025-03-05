import { CUSS2Model } from './cuss2-model.js';

import { AmountType } from './amount-type.js';
import { ApprovalCode } from './approval-code.js';
import { TransactionReference } from './transaction-reference.js';
export class EPaymentMessageTransactionTransactionRequestPreAuth extends CUSS2Model {
    static schema = {
        "transactionReference": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "TransactionReference",
            required: false
        },
        "approvalCode": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "ApprovalCode",
            required: false
        },
        "approvalAmounts": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "AmountType",
            required: true
        }
    }
}
