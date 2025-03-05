import { CUSS2Model } from './cuss2-model.js';

export class CUSS2BiometricsDomainMRZTrackType extends CUSS2Model {
    static schema = {
        "trackData": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "trackNumber": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: false
        }
    }
}
