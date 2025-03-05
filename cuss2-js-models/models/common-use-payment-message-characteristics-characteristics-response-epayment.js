import { CUSS2Model } from './cuss2-model.js';

import { CardBrandList } from './card-brand-list.js';
import { CurrencyCodeList } from './currency-code-list.js';
import { FeatureList } from './feature-list.js';
import { MediaTypeList } from './media-type-list.js';
export class CommonUsePaymentMessageCharacteristicsCharacteristicsResponseEPayment extends CUSS2Model {
    static schema = {
        "featureList": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "FeatureList",
            required: false
        },
        "cardBrandList": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CardBrandList",
            required: false
        },
        "mediaTypeList": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "MediaTypeList",
            required: false
        },
        "currencyCodeList": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CurrencyCodeList",
            required: false
        }
    }
}
