import { CUSS2Model } from './cuss2-model.js';

import { BarcodeTagDataType } from './barcode-tag-data-type.js';
export class BaggageDataBarcodeTagList extends CUSS2Model {
    static schema = {
        "lpnBarcodeTag": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "Array<BarcodeTagDataType>",
            required: false
        },
        "otherBarcodeTag": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        }
    }
}
