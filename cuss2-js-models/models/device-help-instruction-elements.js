import { CUSS2Model } from './cuss2-model.js';

export class DeviceHelpInstructionElements extends CUSS2Model {
    static schema = {
        "time": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: false
        },
        "ssmlElement": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        }
    }
}
