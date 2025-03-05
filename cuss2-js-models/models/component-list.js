import { EnvironmentComponent } from './environment-component.js';
class ComponentList extends Array {
    constructor(items = []) {
        super(...items);
        this.forEach(item => {
            if (!(item instanceof EnvironmentComponent)) {
                throw new Error(`Invalid item type. Expected EnvironmentComponent`);
            }
        });
    }
}

export { ComponentList };