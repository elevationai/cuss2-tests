import { promises as fs } from 'fs';
import { dirname, join, relative, basename } from 'path';

async function createBaseModelFile(outputDir) {
    const content = `class CUSS2Model {
    constructor(data = {}) {
        this.validate(data);
        Object.assign(this, data);
    }

    validate(data) {
        const errors = [];
        for (const [key, validator] of Object.entries(this.constructor.schema)) {
            if (validator.required && !(key in data)) {
                errors.push(\`Missing required field: \${key}\`);
            } else if (key in data) {
                const value = data[key];
                if (!validator.type(value)) {
                    errors.push(\`Invalid type for \${key}: expected \${validator.typeName}\`);
                }
            }
        }
        if (errors.length > 0) {
            throw new Error(\`Validation failed:\\n\${errors.join('\\n')}\`);
        }
    }
}

export { CUSS2Model };`;

    await fs.mkdir(join(outputDir, 'models'), { recursive: true });
    await fs.writeFile(join(outputDir, 'models', 'cuss2-model.js'), content);
}

async function convertTypescriptLib() {
    const inputDir = './node_modules/cuss2-typescript-models';
    const outputDir = './cuss2-js-models';

    try {
        await fs.mkdir(outputDir, { recursive: true });
        await createBaseModelFile(outputDir);
        const files = await readTypeScriptFiles(inputDir);

        for (const file of files) {
            try {
                if (file.endsWith('.d.ts')) {
                    console.log(`Skipping declaration file: ${file}`);
                    continue;
                }

                await convertFile(file, inputDir, outputDir);
            } catch (error) {
                console.error(`Error converting file ${file}:`, error);
                continue;
            }
        }

        await generateIndexFile(outputDir, inputDir, files);
        console.log('Conversion completed successfully!');
    } catch (error) {
        console.error('Error during conversion:', error);
    }
}

function removeComments(content) {
    // Remove multi-line comments
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    // Remove single-line comments
    content = content.replace(/\/\/.*$/gm, '');
    // Clean up empty lines
    return content.replace(/^\s*[\r\n]/gm, '');
}

function processImports(content) {
    // Remove type imports
    content = content.replace(/import\s+type\s+[^;]+;/g, '');

    // Remove ComponentID imports
    content = content.replace(/import\s*{\s*ComponentID\s*}\s*from\s*['"]\.\/component-id['"];?\s*/g, '');

    // Add .js to relative imports
    content = content.replace(
        /from\s+['"](\.[^'"]+)['"]/g,
        (match, path) => `from '${path}${path.endsWith('.js') ? '' : '.js'}'`
    );

    // Convert require statements to imports
    content = content.replace(
        /const\s+(\w+)\s*=\s*require\(['"](\.[^'"]+)['"]\)/g,
        (match, importName, path) => `import ${importName} from '${path}${path.endsWith('.js') ? '' : '.js'}'`
    );

    return content;
}

function convertEnums(content) {
    return content.replace(/export\s+enum\s+(\w+)\s*\{([^}]+)\}/g, (match, enumName, enumBody) => {
        const enumValues = enumBody
        .split(',')
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => {
            const [key, value] = line.split('=').map(s => s.trim());
            return value ? `    ${key}: ${value}` : `    ${key}: "${key}"`;
        })
        .join(',\n');

        // Remove export keyword since we'll export at the end
        return `const ${enumName} = Object.freeze({\n${enumValues}\n});`;
    });
}

function convertArrayInterfaces(content) {
    return content.replace(
        /export\s+interface\s+(\w+)\s+extends\s+Array<(\w+)>\s*\{[^}]*\}/g,
        (match, className, arrayType) =>
            `class ${className} extends Array {
    constructor(items = []) {
        super(...items);
        this.forEach(item => {
            if (!(item instanceof ${arrayType})) {
                throw new Error(\`Invalid item type. Expected ${arrayType}\`);
            }
        });
    }
}`
    );
}

function convertRegularInterfaces(content) {
    return content.replace(
        /interface\s+(\w+)\s*\{([^}]+)\}/g,
        (match, className, properties) => {
            const validationSchema = properties
            .trim()
            .split('\n')
            .map(line => {
                line = line.trim();
                if (!line) return null;

                const colonIndex = line.indexOf(':');
                if (colonIndex === -1) return null;

                const prop = line.substring(0, colonIndex).trim();
                const type = line.substring(colonIndex + 1).trim().split(';')[0].trim();

                if (!prop || !type) return null;

                const isRequired = !line.includes('?:');
                const validatorType = getValidatorType(type);
                if (validatorType === 'enum') {
                    return `        "${prop.replace('?', '')}": {
            type: (v) => typeof v === "string" || (typeof v === "object" && v !== null),
            typeName: "${type.trim()}",
            required: ${isRequired}
        }`;
                }
                return `        "${prop.replace('?', '')}": {
            type: (v) => typeof v === "${validatorType}",
            typeName: "${validatorType}",
            required: ${isRequired}
        }`;
            })
            .filter(line => line !== null)
            .join(',\n');

            // Remove export since we'll export at the end
            return `class ${className} extends CUSS2Model {
    static schema = {
${validationSchema}
    }
}`;
        }
    );
}

function getValidatorType(type) {
    if (!type) return 'object';

    type = type.trim();
    const lowerType = type.toLowerCase();

    // Special case for ComponentID
    if (type === 'ComponentID') {
        return 'number';
    }

    // Check if it's one of our enum types by seeing if it matches a type import
    if (type.includes('Codes') || type.includes('Type')) {
        return `enum`;
    }

    if (lowerType.includes('string')) return 'string';
    if (lowerType.includes('number')) return 'number';
    if (lowerType.includes('boolean')) return 'boolean';
    if (lowerType.includes('array') || lowerType.includes('[]')) return 'array';
    if (lowerType.includes('object')) return 'object';

    // Default to enum for custom types that aren't basic types
    if (/^[A-Z]/.test(type)) {
        return 'enum';
    }

    return 'object';
}

function addBaseModel(content) {
    // Only add the import if we have a class that extends CUSS2Model
    if (content.includes('extends CUSS2Model')) {
        content = `import { CUSS2Model } from './cuss2-model.js';\n\n${content}`;
    }
    return content;
}

function addExports(content) {
    // Find all top-level declarations with better regex patterns
    const declarations = new Set();

    // Match class declarations
    const classMatches = content.matchAll(/^class\s+(\w+)/gm);
    for (const match of classMatches) {
        if (match[1] !== 'CUSS2Model') {
            declarations.add(match[1]);
        }
    }

    // Match const declarations (for enums)
    const constMatches = content.matchAll(/^const\s+(\w+)\s*=/gm);
    for (const match of constMatches) {
        declarations.add(match[1]);
    }

    // Add a single export statement at the end if we have declarations
    if (declarations.size > 0) {
        content += `\nexport { ${Array.from(declarations).join(', ')} };`;
    }

    return content;
}

async function readTypeScriptFiles(dir) {
    const files = [];

    async function scan(directory) {
        try {
            const entries = await fs.readdir(directory, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = join(directory, entry.name);

                if (entry.isDirectory()) {
                    await scan(fullPath);
                } else if (entry.isFile() &&
                    (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts'))) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            console.error(`Error scanning directory ${directory}:`, error);
        }
    }

    await scan(dir);
    return files;
}

async function convertFile(file, inputDir, outputDir) {
    const tsContent = await fs.readFile(file, 'utf8');
    let jsContent = tsContent;

    // Process the content in order
    jsContent = removeComments(jsContent);
    jsContent = processImports(jsContent);
    jsContent = convertEnums(jsContent);
    jsContent = convertArrayInterfaces(jsContent);
    jsContent = convertRegularInterfaces(jsContent);
    jsContent = addBaseModel(jsContent);
    jsContent = addExports(jsContent);

    const relativePath = relative(inputDir, file);
    const outputPath = join(outputDir, relativePath)
    .replace('.ts', '.js')
    .replace('.d.ts', '.js');

    await fs.mkdir(dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, jsContent);
    console.log(`Converted: ${relativePath}`);
}

async function generateIndexFile(outputDir, inputDir, files) {
    try {
        const exports = [];

        for (const file of files) {
            if (file.endsWith('.d.ts') || basename(file).startsWith('index.')) {
                continue;
            }

            // Read the actual file content to find the export names
            const outputFile = join(outputDir, relative(inputDir, file))
            .replace('.ts', '.js');

            try {
                const content = await fs.readFile(outputFile, 'utf8');
                const exportMatch = content.match(/export\s*{([^}]+)}/);
                if (exportMatch) {
                    const exportNames = exportMatch[1].split(',').map(name => name.trim());
                    const relativePath = './' + relative(inputDir, file).replace('.ts', '.js');

                    for (const exportName of exportNames) {
                        const camelCaseName = exportName.charAt(0).toLowerCase() + exportName.slice(1);
                        exports.push(`export { ${exportName} as ${camelCaseName} } from '${relativePath}';`);
                    }
                }
            } catch (error) {
                console.error(`Error processing file ${file} for index:`, error);
            }
        }

        await fs.writeFile(
            join(outputDir, 'index.js'),
            exports.join('\n')
        );
    } catch (error) {
        console.error('Error generating index file:', error);
    }
}

convertTypescriptLib();
