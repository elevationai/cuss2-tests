import { CUSS2Model } from './cuss2-model.js';

export class ApplicationActivation extends CUSS2Model {
    static schema = {
        "applicationBrand": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "executionMode": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "ApplicationActivationExecutionModeEnum",
            required: true
        },
        "accessibleMode": {
            type: (v) => typeof v === "boolean",
            typeName: "boolean",
            required: true
        },
        "executionOptions": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "languageID": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: true
        },
        "transferData": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        }
    }
}
const ApplicationActivationExecutionModeEnum = Object.freeze({
    MAM: 'MAM',
    DSAM: 'DSAM'
});

export { ApplicationActivationExecutionModeEnum };