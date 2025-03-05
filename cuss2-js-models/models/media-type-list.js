import { CUSS2Model } from './cuss2-model.js';

import { MediaType } from './media-type.js';
export class MediaTypeList extends CUSS2Model {
    static schema = {
        "overridable": {
            type: (v) => typeof v === "boolean",
            typeName: "boolean",
            required: false
        },
        "mediaTypes": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "Array<MediaType>",
            required: true
        }
    }
}
