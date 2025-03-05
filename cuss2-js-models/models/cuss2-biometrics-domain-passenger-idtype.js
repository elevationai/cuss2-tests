import { CUSS2Model } from './cuss2-model.js';

export class CUSS2BiometricsDomainPassengerIDType extends CUSS2Model {
    static schema = {
        "identifier": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "identifierType": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2BiometricsDomainPassengerIDTypeIdentifierTypeEnum",
            required: false
        }
    }
}
const CUSS2BiometricsDomainPassengerIDTypeIdentifierTypeEnum = Object.freeze({
    CLIENT: 'CLIENT',
    PROVIDER: 'PROVIDER'
});

export { CUSS2BiometricsDomainPassengerIDTypeIdentifierTypeEnum };