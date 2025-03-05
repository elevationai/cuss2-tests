import { CUSS2Model } from './cuss2-model.js';

import { DeviceHelpInstructionType } from './device-help-instruction-type.js';
export class ComponentCharacteristicsDeviceHelpInstruction extends CUSS2Model {
    static schema = {
        "instruction": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "DeviceHelpInstructionType",
            required: false
        }
    }
}
