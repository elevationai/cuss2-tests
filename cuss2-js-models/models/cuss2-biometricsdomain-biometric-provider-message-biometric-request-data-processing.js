import { CUSS2Model } from './cuss2-model.js';

export class CUSS2BiometricsdomainBiometricProviderMessageBiometricRequestDataProcessing extends CUSS2Model {
    static schema = {
        "keypadKey": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        }
    }
}
