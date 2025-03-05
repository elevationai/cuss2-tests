import { CUSS2Model } from './cuss2-model.js';

import { CommonUsePaymentMessageCharacteristics } from './common-use-payment-message-characteristics.js';
import { CommonUsePaymentMessageErrorResponse } from './common-use-payment-message-error-response.js';
import { EPaymentMessage } from './epayment-message.js';
export class CommonUsePaymentMessage extends CUSS2Model {
    static schema = {
        "sessionID": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "documentType": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CommonUsePaymentMessageDocumentTypeEnum",
            required: true
        },
        "characteristics": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CommonUsePaymentMessageCharacteristics",
            required: false
        },
        "ePaymentMessage": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "EPaymentMessage",
            required: false
        },
        "errorResponse": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CommonUsePaymentMessageErrorResponse",
            required: false
        }
    }
}
const CommonUsePaymentMessageDocumentTypeEnum = Object.freeze({
    CHARACTERISTICS: 'CHARACTERISTICS',
    EPAYMENTMESSAGE: 'EPAYMENT_MESSAGE',
    ERRORRESPONSE: 'ERROR_RESPONSE'
});

export { CommonUsePaymentMessageDocumentTypeEnum };