import { CUSS2Model } from './cuss2-model.js';

import { PlatformDirectives } from './platform-directives.js';
import { UniqueID } from './unique-id.js';
export class ApplicationDataMeta extends CUSS2Model {
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
        "oauthToken": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: true
        },
        "directive": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "PlatformDirectives",
            required: true
        },
        "componentID": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: false
        }
    }
}
