import { DataRecord } from './data-record.js';
class DataRecordList extends Array {
    constructor(items = []) {
        super(...items);
        this.forEach(item => {
            if (!(item instanceof DataRecord)) {
                throw new Error(`Invalid item type. Expected DataRecord`);
            }
        });
    }
}

export { DataRecordList };