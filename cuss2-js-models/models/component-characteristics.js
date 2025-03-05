import { CUSS2Model } from './cuss2-model.js';

import { BiometricsCharacteristics } from './biometrics-characteristics.js';
import { CUSSDataTypes } from './cussdata-types.js';
import { ComponentCharacteristicsAudioOutput } from './component-characteristics-audio-output.js';
import { ComponentCharacteristicsConveyorSBD } from './component-characteristics-conveyor-sbd.js';
import { ComponentCharacteristicsDeviceHelpInstruction } from './component-characteristics-device-help-instruction.js';
import { ComponentCharacteristicsDisplayType } from './component-characteristics-display-type.js';
import { ComponentCharacteristicsDocumentBin } from './component-characteristics-document-bin.js';
import { ComponentCharacteristicsNavigationType } from './component-characteristics-navigation-type.js';
import { DeviceTypes } from './device-types.js';
import { MediaTypes } from './media-types.js';
import { PaymentsCharacteristics } from './payments-characteristics.js';
import { SupportedColors } from './supported-colors.js';
export class ComponentCharacteristics extends CUSS2Model {
    static schema = {
        "audioOutput": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "ComponentCharacteristicsAudioOutput",
            required: false
        },
        "deviceHelpInstruction": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "ComponentCharacteristicsDeviceHelpInstruction",
            required: false
        },
        "dsTypesList": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "Array<CUSSDataTypes>",
            required: false
        },
        "mediaTypesList": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "Array<MediaTypes>",
            required: true
        },
        "deviceTypesList": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "Array<DeviceTypes>",
            required: false
        },
        "navigationType": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "ComponentCharacteristicsNavigationType",
            required: false
        },
        "displayType": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "ComponentCharacteristicsDisplayType",
            required: false
        },
        "itpsVersion": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "svgVersion": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "supportsColor": {
            type: (v) => typeof v === "boolean",
            typeName: "boolean",
            required: false
        },
        "documentBin": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "ComponentCharacteristicsDocumentBin",
            required: false
        },
        "conveyorSBD": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "ComponentCharacteristicsConveyorSBD",
            required: false
        },
        "illuminationColors": {
            type: (v) => typeof v === "array",
            typeName: "array",
            required: false
        },
        "subsystemBiometrics": {
            type: (v) => typeof v === "array",
            typeName: "array",
            required: false
        },
        "subsystemPayments": {
            type: (v) => typeof v === "array",
            typeName: "array",
            required: false
        }
    }
}
