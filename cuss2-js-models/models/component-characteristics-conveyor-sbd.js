import { CUSS2Model } from './cuss2-model.js';

export class ComponentCharacteristicsConveyorSBD extends CUSS2Model {
    static schema = {
        "maxWeight": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: false
        },
        "maxWidth": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: false
        },
        "maxHeight": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: false
        },
        "maxLength": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: false
        },
        "maxBags": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: false
        },
        "barrierCapable": {
            type: (v) => typeof v === "boolean",
            typeName: "boolean",
            required: false
        },
        "userInterferenceCapable": {
            type: (v) => typeof v === "boolean",
            typeName: "boolean",
            required: false
        },
        "safetyIntrusionCapable": {
            type: (v) => typeof v === "boolean",
            typeName: "boolean",
            required: false
        },
        "onewayForward": {
            type: (v) => typeof v === "boolean",
            typeName: "boolean",
            required: false
        }
    }
}
