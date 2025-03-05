import { CUSS2Model } from './cuss2-model.js';

import { AuthorizationAmounts } from './authorization-amounts.js';
import { EPaymentMessageTransactionTransactionRequestEnvironment } from './epayment-message-transaction-transaction-request-environment.js';
import { EPaymentMessageTransactionTransactionRequestItinerary } from './epayment-message-transaction-transaction-request-itinerary.js';
import { EPaymentMessageTransactionTransactionRequestPreAuth } from './epayment-message-transaction-transaction-request-pre-auth.js';
import { GPParameterList } from './gpparameter-list.js';
export class EPaymentMessageTransactionTransactionRequest extends CUSS2Model {
    static schema = {
        "language": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "environment": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "EPaymentMessageTransactionTransactionRequestEnvironment",
            required: false
        },
        "preAuth": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "EPaymentMessageTransactionTransactionRequestPreAuth",
            required: false
        },
        "itinerary": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "EPaymentMessageTransactionTransactionRequestItinerary",
            required: false
        },
        "billingDescription": {
            type: (v) => typeof v === "string",
            typeName: "string",
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
            required: false
        }
    }
}
