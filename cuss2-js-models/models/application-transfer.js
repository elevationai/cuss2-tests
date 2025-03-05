import { CUSS2Model } from './cuss2-model.js';

import { ApplicationID } from './application-id.js';
export class ApplicationTransfer extends CUSS2Model {
    static schema = {
        "targetApplicationID": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "ApplicationID",
            required: true
        },
        "applicationBrand": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "languageID": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: true
        },
        "transferData": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        }
    }
}
