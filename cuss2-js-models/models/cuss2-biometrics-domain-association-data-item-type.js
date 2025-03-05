import { CUSS2Model } from './cuss2-model.js';

export class CUSS2BiometricsDomainAssociationDataItemType extends CUSS2Model {
    static schema = {
        "data": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "associationDataTag": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: true
        }
    }
}
