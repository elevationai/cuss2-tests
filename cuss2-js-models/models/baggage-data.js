import { CUSS2Model } from './cuss2-model.js';

import { BaggageDataBaggageMeasurements } from './baggage-data-baggage-measurements.js';
import { BaggageDataBarcodeTagList } from './baggage-data-barcode-tag-list.js';
import { BaggageDataRfidTagList } from './baggage-data-rfid-tag-list.js';
export class BaggageData extends CUSS2Model {
    static schema = {
        "baggageMeasurements": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "BaggageDataBaggageMeasurements",
            required: false
        },
        "barcodeTagList": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "BaggageDataBarcodeTagList",
            required: false
        },
        "rfidTagList": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "BaggageDataRfidTagList",
            required: false
        },
        "bsmMessage": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        }
    }
}
