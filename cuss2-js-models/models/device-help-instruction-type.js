import { CUSS2Model } from './cuss2-model.js';

import { DeviceHelpInstructionElements } from './device-help-instruction-elements.js';
export class DeviceHelpInstructionType extends CUSS2Model {
    static schema = {
        "deviceDescription": {
            type: (v) => typeof v === "array",
            typeName: "array",
            required: false
        },
        "deviceLocation": {
            type: (v) => typeof v === "array",
            typeName: "array",
            required: false
        },
        "deviceProfile": {
            type: (v) => typeof v === "array",
            typeName: "array",
            required: false
        },
        "deviceUsage": {
            type: (v) => typeof v === "array",
            typeName: "array",
            required: false
        }
    }
}
