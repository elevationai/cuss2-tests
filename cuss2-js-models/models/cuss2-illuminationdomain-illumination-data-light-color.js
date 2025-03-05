import { CUSS2Model } from './cuss2-model.js';

import { CUSS2IlluminationDomainRgbType } from './cuss2-illumination-domain-rgb-type.js';
export class CUSS2IlluminationdomainIlluminationDataLightColor extends CUSS2Model {
    static schema = {
        "name": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2IlluminationdomainIlluminationDataLightColorNameEnum",
            required: false
        },
        "rgb": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2IlluminationDomainRgbType",
            required: false
        }
    }
}
const CUSS2IlluminationdomainIlluminationDataLightColorNameEnum = Object.freeze({
    ON: 'CLR_ON',
    OFF: 'CLR_OFF',
    RED: 'CLR_RED',
    GREEN: 'CLR_GREEN',
    BLUE: 'CLR_BLUE',
    DARKRED: 'CLR_DARKRED',
    DARKGREEN: 'CLR_DARKGREEN',
    DARKBLUE: 'CLR_DARKBLUE',
    YELLOW: 'CLR_YELLOW',
    MAGENTA: 'CLR_MAGENTA',
    CYAN: 'CLR_CYAN',
    AMBER: 'CLR_AMBER',
    PURPLE: 'CLR_PURPLE',
    SPRINGGREEN: 'CLR_SPRINGGREEN',
    WHITE: 'CLR_WHITE'
});

export { CUSS2IlluminationdomainIlluminationDataLightColorNameEnum };