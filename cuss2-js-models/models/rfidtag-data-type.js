import { CUSS2Model } from './cuss2-model.js';

import { RFIDElement } from './rfidelement.js';
export class RFIDTagDataType extends CUSS2Model {
    static schema = {
        "id": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: true
        },
        "rfidElements": {
            type: (v) => typeof v === "array",
            typeName: "array",
            required: false
        }
    }
}
