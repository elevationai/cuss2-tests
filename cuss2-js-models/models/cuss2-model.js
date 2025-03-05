class CUSS2Model {
    constructor(data = {}) {
        this.validate(data);
        Object.assign(this, data);
    }

    validate(data) {
        const errors = [];
        for (const [key, validator] of Object.entries(this.constructor.schema)) {
            if (validator.required && !(key in data)) {
                errors.push(`Missing required field: ${key}`);
            } else if (key in data) {
                const value = data[key];
                if (!validator.type(value)) {
                    errors.push(`Invalid type for ${key}: expected ${validator.typeName}`);
                }
            }
        }
        if (errors.length > 0) {
            throw new Error(`Validation failed:\n${errors.join('\n')}`);
        }
    }
}

export { CUSS2Model };