import { CUSS2Model } from './cuss2-model.js';

import { CUSS2BiometricsDomainPassengerBiometricsType } from './cuss2-biometrics-domain-passenger-biometrics-type.js';
export class CUSS2BiometricsdomainPassengerDataTypePassengerBiometricsData extends CUSS2Model {
    static schema = {
        "passengerBiometrics": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "Array<CUSS2BiometricsDomainPassengerBiometricsType>",
            required: true
        }
    }
}
