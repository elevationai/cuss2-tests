import { CUSS2Model } from './cuss2-model.js';

import { ApplicationDataMeta } from './application-data-meta.js';
import { ApplicationDataPayload } from './application-data-payload.js';
export class ApplicationData extends CUSS2Model {
    static schema = {
        "meta": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "ApplicationDataMeta",
            required: true
        },
        "payload": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "ApplicationDataPayload",
            required: false
        }
    }
}
