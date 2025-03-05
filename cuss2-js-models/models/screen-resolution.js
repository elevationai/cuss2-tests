import { CUSS2Model } from './cuss2-model.js';

export class ScreenResolution extends CUSS2Model {
    static schema = {
        "vertical": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: false
        },
        "horizontal": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: false
        }
    }
}
