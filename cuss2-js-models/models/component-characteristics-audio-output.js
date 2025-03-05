import { CUSS2Model } from './cuss2-model.js';

export class ComponentCharacteristicsAudioOutput extends CUSS2Model {
    static schema = {
        "ssmlVersion": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: true
        },
        "supportedLanguages": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: true
        }
    }
}
