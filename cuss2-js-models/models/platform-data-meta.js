import { CUSS2Model } from './cuss2-model.js';

import { ApplicationID } from './application-id.js';
import { ApplicationState } from './application-state.js';
import { ComponentState } from './component-state.js';
import { MessageCodes } from './message-codes.js';
import { PassengerSessionID } from './passenger-session-id.js';
import { PlatformDataMetaEventClassification } from './platform-data-meta-event-classification.js';
import { PlatformDirectives } from './platform-directives.js';
import { UniqueID } from './unique-id.js';
export class PlatformDataMeta extends CUSS2Model {
    static schema = {
        "deviceID": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "UniqueID",
            required: true
        },
        "requestID": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "UniqueID",
            required: true
        },
        "timeStamp": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "Date",
            required: true
        },
        "passengerSessionID": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "PassengerSessionID",
            required: true
        },
        "applicationID": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "ApplicationID",
            required: true
        },
        "componentID": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: false
        },
        "componentState": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "ComponentState",
            required: false
        },
        "currentApplicationState": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "ApplicationState",
            required: true
        },
        "messageCode": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "MessageCodes",
            required: true
        },
        "eventClassification": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "PlatformDataMetaEventClassification",
            required: false
        },
        "platformDirective": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "PlatformDirectives",
            required: false
        }
    }
}
