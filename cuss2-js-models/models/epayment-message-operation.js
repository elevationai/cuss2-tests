import { CUSS2Model } from './cuss2-model.js';

import { OperationDocumentType } from './operation-document-type.js';
export class EPaymentMessageOperation extends CUSS2Model {
    static schema = {
        "operationDocumentType": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "OperationDocumentType",
            required: true
        },
        "operationDocumentReturnType": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "OperationDocumentType",
            required: false
        },
        "operationType": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "EPaymentMessageOperationOperationTypeEnum",
            required: true
        },
        "operationRequest": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "operationResponse": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "EPaymentMessageOperationOperationResponseEnum",
            required: false
        }
    }
}
const EPaymentMessageOperationOperationTypeEnum = Object.freeze({
    SYSTEMHEALTH: 'SYSTEM_HEALTH',
    ENDOFDAY: 'END_OF_DAY',
    STARTOFDAY: 'START_OF_DAY',
    SIGNON: 'SIGN_ON',
    MERCHANTSWITCH: 'MERCHANT_SWITCH',
    KEYMANAGEMENT: 'KEY_MANAGEMENT'
});
const EPaymentMessageOperationOperationResponseEnum = Object.freeze({
    OFFLINE: 'OFFLINE',
    ONLINE: 'ONLINE',
    COMPLETED: 'COMPLETED',
    INPROGRESS: 'IN_PROGRESS'
});

export { EPaymentMessageOperationOperationTypeEnum, EPaymentMessageOperationOperationResponseEnum };