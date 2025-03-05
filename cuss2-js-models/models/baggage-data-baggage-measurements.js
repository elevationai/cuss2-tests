import { CUSS2Model } from './cuss2-model.js';

import { DimensionType } from './dimension-type.js';
import { ExtendedWeightType } from './extended-weight-type.js';
export class BaggageDataBaggageMeasurements extends CUSS2Model {
    static schema = {
        "weight": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "ExtendedWeightType",
            required: false
        },
        "dimensions": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "DimensionType",
            required: false
        }
    }
}
