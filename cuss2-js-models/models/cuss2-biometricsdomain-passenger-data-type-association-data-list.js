import { CUSS2Model } from './cuss2-model.js';

import { CUSS2BiometricsDomainAssociationDataItemType } from './cuss2-biometrics-domain-association-data-item-type.js';
export class CUSS2BiometricsdomainPassengerDataTypeAssociationDataList extends CUSS2Model {
    static schema = {
        "associationDataItem": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "Array<CUSS2BiometricsDomainAssociationDataItemType>",
            required: false
        }
    }
}
