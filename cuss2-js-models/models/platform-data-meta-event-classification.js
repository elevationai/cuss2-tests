import { CUSS2Model } from './cuss2-model.js';

import { EventCategories } from './event-categories.js';
import { EventModes } from './event-modes.js';
import { EventTypes } from './event-types.js';
export class PlatformDataMetaEventClassification extends CUSS2Model {
    static schema = {
        "eventMode": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "EventModes",
            required: false
        },
        "eventType": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "EventTypes",
            required: false
        },
        "eventCategory": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "EventCategories",
            required: false
        }
    }
}
