import { CUSS2Model } from './cuss2-model.js';

import { ApplicationState } from './application-state.js';
import { ApplicationTransfer } from './application-transfer.js';
import { BaggageData } from './baggage-data.js';
import { CUSS2BiometricsDomainCommonUseBiometricMessage } from './cuss2-biometrics-domain-common-use-biometric-message.js';
import { CUSS2IlluminationDomainIlluminationData } from './cuss2-illumination-domain-illumination-data.js';
import { CommonUsePaymentMessage } from './common-use-payment-message.js';
import { DataRecordList } from './data-record-list.js';
import { ScreenResolution } from './screen-resolution.js';
export class ApplicationDataPayload extends CUSS2Model {
    static schema = {
        "applicationState": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "ApplicationState",
            required: false
        },
        "applicationTransfer": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "ApplicationTransfer",
            required: false
        },
        "dataRecords": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "DataRecordList",
            required: false
        },
        "screenResolution": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "ScreenResolution",
            required: false
        },
        "illuminationData": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2IlluminationDomainIlluminationData",
            required: false
        },
        "bagdropData": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "BaggageData",
            required: false
        },
        "paymentData": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CommonUsePaymentMessage",
            required: false
        },
        "biometricData": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2BiometricsDomainCommonUseBiometricMessage",
            required: false
        }
    }
}
