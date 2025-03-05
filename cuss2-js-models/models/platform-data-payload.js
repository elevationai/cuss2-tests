import { CUSS2Model } from './cuss2-model.js';

import { ApplicationActivation } from './application-activation.js';
import { BaggageData } from './baggage-data.js';
import { CUSS2BiometricsDomainCommonUseBiometricMessage } from './cuss2-biometrics-domain-common-use-biometric-message.js';
import { CommonUsePaymentMessage } from './common-use-payment-message.js';
import { ComponentList } from './component-list.js';
import { DataRecordList } from './data-record-list.js';
import { EnvironmentLevel } from './environment-level.js';
export class PlatformDataPayload extends CUSS2Model {
    static schema = {
        "applicationActivation": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "ApplicationActivation",
            required: false
        },
        "environmentLevel": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "EnvironmentLevel",
            required: false
        },
        "componentList": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "ComponentList",
            required: false
        },
        "dataRecords": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "DataRecordList",
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
