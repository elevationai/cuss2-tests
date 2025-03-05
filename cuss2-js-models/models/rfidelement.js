import { CUSS2Model } from './cuss2-model.js';

export class RFIDElement extends CUSS2Model {
    static schema = {
        "objectKey": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: true
        },
        "binaryData": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "stringData": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        }
    }
}
