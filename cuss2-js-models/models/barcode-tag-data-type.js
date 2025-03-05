import { CUSS2Model } from './cuss2-model.js';

export class BarcodeTagDataType extends CUSS2Model {
    static schema = {
        "lpnNumber": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: true
        }
    }
}
