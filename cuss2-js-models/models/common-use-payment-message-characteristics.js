import { CUSS2Model } from './cuss2-model.js';

import { CharacteristicsDocumentType } from './characteristics-document-type.js';
import { CommonUsePaymentMessageCharacteristicsCharacteristicsResponse } from './common-use-payment-message-characteristics-characteristics-response.js';
export class CommonUsePaymentMessageCharacteristics extends CUSS2Model {
    static schema = {
        "supportedLanguages": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "characteristicsDocumentType": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CharacteristicsDocumentType",
            required: true
        },
        "characteristicsDocumentReturnType": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CharacteristicsDocumentType",
            required: true
        },
        "characteristicsResponse": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CommonUsePaymentMessageCharacteristicsCharacteristicsResponse",
            required: false
        }
    }
}
