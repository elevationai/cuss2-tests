import { CUSS2Model } from './cuss2-model.js';

import { RFIDTagDataType } from './rfidtag-data-type.js';
export class BaggageDataRfidTagList extends CUSS2Model {
    static schema = {
        "rfidTag": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "Array<RFIDTagDataType>",
            required: true
        }
    }
}
