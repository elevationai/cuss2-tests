import { CUSS2Model } from './cuss2-model.js';

export class ApplicationID extends CUSS2Model {
    static schema = {
        "companyCode": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "applicationName": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        }
    }
}
