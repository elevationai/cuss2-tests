import { CUSS2Model } from './cuss2-model.js';

export class Location extends CUSS2Model {
    static schema = {
        "airportCode": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "terminal": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "area": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "address": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        }
    }
}
