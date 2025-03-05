import { CUSS2Model } from './cuss2-model.js';

import { CardBrand } from './card-brand.js';
export class CardBrandList extends CUSS2Model {
    static schema = {
        "overridable": {
            type: (v) => typeof v === "boolean",
            typeName: "boolean",
            required: false
        },
        "cardBrands": {
            type: (v) => typeof v === "array",
            typeName: "array",
            required: true
        }
    }
}
