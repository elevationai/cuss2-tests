import { CUSS2Model } from './cuss2-model.js';

import { CUSS2IlluminationDomainBlinkingRateType } from './cuss2-illumination-domain-blinking-rate-type.js';
import { CUSS2IlluminationdomainIlluminationDataLightColor } from './cuss2-illuminationdomain-illumination-data-light-color.js';
export class CUSS2IlluminationDomainIlluminationData extends CUSS2Model {
    static schema = {
        "duration": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: true
        },
        "lightColor": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2IlluminationdomainIlluminationDataLightColor",
            required: true
        },
        "blinkRate": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2IlluminationDomainBlinkingRateType",
            required: false
        }
    }
}
