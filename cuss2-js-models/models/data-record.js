import { CUSS2Model } from './cuss2-model.js';

import { CUSSDataTypes } from './cussdata-types.js';
import { DataStatus } from './data-status.js';
export class DataRecord extends CUSS2Model {
    static schema = {
        "dataStatus": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "DataStatus",
            required: false
        },
        "dsTypes": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "Array<CUSSDataTypes>",
            required: true
        },
        "data": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: true
        },
        "encoding": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "DataRecordEncodingEnum",
            required: false
        }
    }
}
const DataRecordEncodingEnum = Object.freeze({
    TEXT: 'TEXT',
    BASE64: 'BASE64'
});

export { DataRecordEncodingEnum };