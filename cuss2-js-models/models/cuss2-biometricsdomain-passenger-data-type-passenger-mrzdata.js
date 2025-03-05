import { CUSS2Model } from './cuss2-model.js';

import { CUSS2BiometricsDomainMRZTrackType } from './cuss2-biometrics-domain-mrztrack-type.js';
export class CUSS2BiometricsdomainPassengerDataTypePassengerMRZData extends CUSS2Model {
    static schema = {
        "mrzTrackData": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "Array<CUSS2BiometricsDomainMRZTrackType>",
            required: true
        }
    }
}
