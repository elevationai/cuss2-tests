import { CUSS2Model } from './cuss2-model.js';

import { NavigationTypes } from './navigation-types.js';
export class ComponentCharacteristicsNavigationType extends CUSS2Model {
    static schema = {
        "type": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "NavigationTypes",
            required: false
        }
    }
}
