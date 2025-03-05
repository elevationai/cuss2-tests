import { CUSS2Model } from './cuss2-model.js';

import { ApplicationStateChangeReasonCodes } from './application-state-change-reason-codes.js';
import { ApplicationStateCodes } from './application-state-codes.js';
export class ApplicationState extends CUSS2Model {
    static schema = {
        "applicationStateCode": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "ApplicationStateCodes",
            required: true
        },
        "accessibleMode": {
            type: (v) => typeof v === "boolean",
            typeName: "boolean",
            required: true
        },
        "applicationStateChangeReasonCode": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "ApplicationStateChangeReasonCodes",
            required: true
        },
        "applicationStateChangeReason": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "applicationBrand": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        }
    }
}
