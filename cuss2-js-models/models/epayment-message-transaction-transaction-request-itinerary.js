import { CUSS2Model } from './cuss2-model.js';

export class EPaymentMessageTransactionTransactionRequestItinerary extends CUSS2Model {
    static schema = {
        "name": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "pnr": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "date": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "flightNumber": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "departureCity": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "arrivalCity": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        }
    }
}
