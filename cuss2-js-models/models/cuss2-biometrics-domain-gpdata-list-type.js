import { CUSS2Model } from './cuss2-model.js';

import { CUSS2BiometricsDomainGPDataItemType } from './cuss2-biometrics-domain-gpdata-item-type.js';
export class CUSS2BiometricsDomainGPDataListType extends CUSS2Model {
    static schema = {
        "gpDataItems": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "Array<CUSS2BiometricsDomainGPDataItemType>",
            required: true
        }
    }
}
