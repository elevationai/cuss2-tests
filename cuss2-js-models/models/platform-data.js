import { CUSS2Model } from './cuss2-model.js';

import { PlatformDataMeta } from './platform-data-meta.js';
import { PlatformDataPayload } from './platform-data-payload.js';
export class PlatformData extends CUSS2Model {
    static schema = {
        "meta": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "PlatformDataMeta",
            required: true
        },
        "payload": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "PlatformDataPayload",
            required: false
        }
    }
}
