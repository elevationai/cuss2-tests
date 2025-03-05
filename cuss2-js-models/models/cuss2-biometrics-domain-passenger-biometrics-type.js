import { CUSS2Model } from './cuss2-model.js';

export class CUSS2BiometricsDomainPassengerBiometricsType extends CUSS2Model {
    static schema = {
        "data": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "biometricsType": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2BiometricsDomainPassengerBiometricsTypeBiometricsTypeEnum",
            required: true
        },
        "lightType": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2BiometricsDomainPassengerBiometricsTypeLightTypeEnum",
            required: false
        },
        "dataSource": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2BiometricsDomainPassengerBiometricsTypeDataSourceEnum",
            required: false
        },
        "dataFormat": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2BiometricsDomainPassengerBiometricsTypeDataFormatEnum",
            required: true
        }
    }
}
const CUSS2BiometricsDomainPassengerBiometricsTypeBiometricsTypeEnum = Object.freeze({
    FACE: 'FACE',
    FINGER: 'FINGER',
    IRIS: 'IRIS',
    PALM: 'PALM'
});
const CUSS2BiometricsDomainPassengerBiometricsTypeLightTypeEnum = Object.freeze({
    IR: 'IR',
    UV: 'UV',
    VISIBLE: 'VISIBLE'
});
const CUSS2BiometricsDomainPassengerBiometricsTypeDataSourceEnum = Object.freeze({
    BIOMETRICPROVIDER: 'BIOMETRIC_PROVIDER',
    CAMERA: 'CAMERA',
    MRTDCHIP: 'MRTD_CHIP',
    MRTDVISIBLE: 'MRTD_VISIBLE',
    SCANNER: 'SCANNER'
});
const CUSS2BiometricsDomainPassengerBiometricsTypeDataFormatEnum = Object.freeze({
    BMP: 'BMP',
    JPG: 'JPG',
    PNG: 'PNG'
});

export { CUSS2BiometricsDomainPassengerBiometricsTypeBiometricsTypeEnum, CUSS2BiometricsDomainPassengerBiometricsTypeLightTypeEnum, CUSS2BiometricsDomainPassengerBiometricsTypeDataSourceEnum, CUSS2BiometricsDomainPassengerBiometricsTypeDataFormatEnum };