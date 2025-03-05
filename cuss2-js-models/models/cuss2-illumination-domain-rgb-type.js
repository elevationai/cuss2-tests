import { CUSS2Model } from './cuss2-model.js';

export class CUSS2IlluminationDomainRgbType extends CUSS2Model {
    static schema = {
        "red": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: true
        },
        "green": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: true
        },
        "blue": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: true
        }
    }
}
