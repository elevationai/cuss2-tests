import { CUSS2Model } from './cuss2-model.js';

import { Feature } from './feature.js';
export class FeatureList extends CUSS2Model {
    static schema = {
        "features": {
            type: (v) => typeof v === "array",
            typeName: "array",
            required: true
        }
    }
}
