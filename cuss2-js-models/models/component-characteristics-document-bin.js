import { CUSS2Model } from './cuss2-model.js';

export class ComponentCharacteristicsDocumentBin extends CUSS2Model {
    static schema = {
        "binSize": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: false
        },
        "allmostFullLevel": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: false
        },
        "allmostEmptyLevel": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: false
        }
    }
}
