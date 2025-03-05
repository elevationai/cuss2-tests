import { CUSS2Model } from './cuss2-model.js';

import { Location } from './location.js';
import { UniqueID } from './unique-id.js';
export class EnvironmentLevel extends CUSS2Model {
    static schema = {
        "sessionTimeout": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: true
        },
        "killTimeout": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: true
        },
        "initTimeout": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: false
        },
        "expectedAckTime": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: false
        },
        "maxCacheTime": {
            type: (v) => typeof v === "number",
            typeName: "number",
            required: false
        },
        "deviceModelName": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: false
        },
        "deviceID": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "UniqueID",
            required: true
        },
        "deviceLocation": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "Location",
            required: true
        },
        "cussVersions": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: true
        },
        "osName": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: true
        },
        "osVersion": {
            type: (v) => typeof v === "string",
            typeName: "string",
            required: true
        }
    }
}
