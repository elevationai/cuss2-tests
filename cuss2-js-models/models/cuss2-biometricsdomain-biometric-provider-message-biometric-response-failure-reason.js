import { CUSS2Model } from './cuss2-model.js';

export class CUSS2BiometricsdomainBiometricProviderMessageBiometricResponseFailureReason extends CUSS2Model {
    static schema = {
        "failureCode": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "CUSS2BiometricsdomainBiometricProviderMessageBiometricResponseFailureReasonFailureCodeEnum",
            required: true
        },
        "failureDescription": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        }
    }
}
const CUSS2BiometricsdomainBiometricProviderMessageBiometricResponseFailureReasonFailureCodeEnum = Object.freeze({
    FAILED: 'FAILED',
    TIMEOUT: 'TIMEOUT',
    CAMERAERROR: 'CAMERA_ERROR',
    INVALIDCONFIGURATION: 'INVALID_CONFIGURATION',
    MATCHFAILED: 'MATCH_FAILED',
    NOTIDENTIFIED: 'NOT_IDENTIFIED',
    POORCAMERAIMAGE: 'POOR_CAMERA_IMAGE',
    POORDOCUMENTIMAGE: 'POOR_DOCUMENT_IMAGE',
    DATASETNOTFOUND: 'DATA_SET_NOT_FOUND',
    FACENOTDETECTED: 'FACE_NOT_DETECTED',
    CAPTUREFAILED: 'CAPTURE_FAILED'
});

export { CUSS2BiometricsdomainBiometricProviderMessageBiometricResponseFailureReasonFailureCodeEnum };