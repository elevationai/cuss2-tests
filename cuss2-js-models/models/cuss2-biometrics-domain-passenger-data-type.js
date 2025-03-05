import { CUSS2Model } from './cuss2-model.js';

import { CUSS2BiometricsDomainPassengerIDType } from './cuss2-biometrics-domain-passenger-idtype.js';
import { CUSS2BiometricsdomainPassengerDataTypeAssociationDataList } from './cuss2-biometricsdomain-passenger-data-type-association-data-list.js';
import { CUSS2BiometricsdomainPassengerDataTypePassengerBiometricsData } from './cuss2-biometricsdomain-passenger-data-type-passenger-biometrics-data.js';
import { CUSS2BiometricsdomainPassengerDataTypePassengerMRZData } from './cuss2-biometricsdomain-passenger-data-type-passenger-mrzdata.js';
export class CUSS2BiometricsDomainPassengerDataType extends CUSS2Model {
    static schema = {
        "passengerIDs": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "Array<CUSS2BiometricsDomainPassengerIDType>",
            required: false
        },
        "passengerFamilyName": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "passengerGivenNames": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "passengerMRZData": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2BiometricsdomainPassengerDataTypePassengerMRZData",
            required: false
        },
        "passengerBiometricsData": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2BiometricsdomainPassengerDataTypePassengerBiometricsData",
            required: false
        },
        "associationDataList": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2BiometricsdomainPassengerDataTypeAssociationDataList",
            required: false
        }
    }
}
