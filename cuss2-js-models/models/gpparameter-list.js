import { CUSS2Model } from './cuss2-model.js';

import { GPParameter } from './gpparameter.js';
export class GPParameterList extends CUSS2Model {
    static schema = {
        "gpParameters": {
            type: (v) => typeof v === "array",
            typeName: "array",
            required: false
        }
    }
}
