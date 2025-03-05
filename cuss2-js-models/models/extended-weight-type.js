import { CUSS2Model } from './cuss2-model.js';

import { WeightType } from './weight-type.js';
export class ExtendedWeightType extends CUSS2Model {
    static schema = {
        "grossWeight": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "WeightType",
            required: true
        },
        "netWeight": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "WeightType",
            required: true
        },
        "tareWeight": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "WeightType",
            required: true
        },
        "tubDetected": {
            type: (v) => typeof v === "boolean",
            typeName: "boolean",
            required: true
        }
    }
}
