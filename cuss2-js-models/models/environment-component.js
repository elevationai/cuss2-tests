import { CUSS2Model } from './cuss2-model.js';

import { ComponentCharacteristics } from './component-characteristics.js';
import { ComponentTypes } from './component-types.js';
export class EnvironmentComponent extends CUSS2Model {
    static schema = {
        "componentDescription": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "componentID": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: false
        },
        "componentType": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "ComponentTypes",
            required: false
        },
        "componentCharacteristics": {
            type: (v) => typeof v === "array",
            typeName: "array",
            required: false
        },
        "linkedComponentIDs": {
            type: (v) => typeof v === "array",
            typeName: "array",
            required: false
        },
        "deviceReference": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        }
    }
}
