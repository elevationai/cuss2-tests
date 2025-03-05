import { CUSS2Model } from './cuss2-model.js';

export class CommonUsePaymentMessageErrorResponse extends CUSS2Model {
    static schema = {
        "errorDocument": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "errorReason": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CommonUsePaymentMessageErrorResponseErrorReasonEnum",
            required: true
        },
        "errorCode": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: true
        }
    }
}
const CommonUsePaymentMessageErrorResponseErrorReasonEnum = Object.freeze({
    DATAERROR: 'DATA_ERROR',
    FORMATERROR: 'FORMAT_ERROR',
    ILLOGICAL: 'ILLOGICAL'
});

export { CommonUsePaymentMessageErrorResponseErrorReasonEnum };