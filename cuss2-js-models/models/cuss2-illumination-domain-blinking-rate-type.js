import { CUSS2Model } from './cuss2-model.js';

export class CUSS2IlluminationDomainBlinkingRateType extends CUSS2Model {
    static schema = {
        "durationOff": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: true
        },
        "durationOn": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: true
        }
    }
}
