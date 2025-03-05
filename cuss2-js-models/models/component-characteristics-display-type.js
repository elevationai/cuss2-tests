import { CUSS2Model } from './cuss2-model.js';

import { ScreenResolution } from './screen-resolution.js';
export class ComponentCharacteristicsDisplayType extends CUSS2Model {
    static schema = {
        "screenDiagonal": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: false
        },
        "resolutions": {
            type: (v) => typeof v === "array",
            typeName: "array",
            required: false
        }
    }
}
