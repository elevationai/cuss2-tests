import { CUSS2Model } from './cuss2-model.js';

import { AlibiType } from './alibi-type.js';
export class DimensionType extends CUSS2Model {
    static schema = {
        "alibi": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "AlibiType",
            required: false
        },
        "height": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: false
        },
        "length": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: false
        },
        "width": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: false
        },
        "stable": {
            type: (v) => typeof v === "boolean",
            typeName: "boolean",
            required: true
        }
    }
}
