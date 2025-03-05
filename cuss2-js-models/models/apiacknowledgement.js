import { CUSS2Model } from './cuss2-model.js';

import { AckCodes } from './ack-codes.js';
import { UniqueID } from './unique-id.js';
export class APIAcknowledgement extends CUSS2Model {
    static schema = {
        "ackCode": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "AckCodes",
            required: true
        },
        "requestID": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "UniqueID",
            required: true
        },
        "description": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        }
    }
}
