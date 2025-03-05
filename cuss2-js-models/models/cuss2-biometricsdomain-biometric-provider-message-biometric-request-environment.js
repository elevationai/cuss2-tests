import { CUSS2Model } from './cuss2-model.js';

export class CUSS2BiometricsdomainBiometricProviderMessageBiometricRequestEnvironment extends CUSS2Model {
    static schema = {
        "accessibilityMode": {
            type: (v) => typeof v === "boolean",
            typeName: "boolean",
            required: false
        },
        "language": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: true
        }
    }
}
