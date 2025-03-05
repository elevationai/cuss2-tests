import { CUSS2Model } from './cuss2-model.js';

import { AlibiType } from './alibi-type.js';
export class WeightType extends CUSS2Model {
    static schema = {
        "alibi": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "AlibiType",
            required: false
        },
        "weight": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: true
        },
        "stable": {
            type: (v) => typeof v === "boolean",
            typeName: "boolean",
            required: true
        },
        "imperial": {
            type: (v) => typeof v === "boolean",
            typeName: "boolean",
            required: true
        }
    }
}
