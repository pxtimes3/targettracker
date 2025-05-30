import Ajv from 'ajv';
import addKeywords from 'ajv-keywords';
import chalk from 'chalk';
import { readdirSync, readFileSync } from 'node:fs';

const ajv = new Ajv({ allErrors: true, strict: false });
addKeywords(ajv, ['uniqueItemProperties']);

let schema;

function getSchema(path = './schemas/bullet.json') {
    schema = JSON.parse(readFileSync(path));

    if (!schema) {
        console.error(`${chalk.red('✗')} No schema`);
        return;
    }
}

function getData(path = './src/bullets/') {
    if (!schema) {
        console.error(`${chalk.red('✗')} No schema`);
    }
    // Read files
    const files = readdirSync(path);
    console.log((`Found ${files.length} files in ${path}`));

    files.forEach((file) => {
        const data = JSON.parse(readFileSync(path + file));
        console.log(`Validating ${path + file}`);
        validate(data, path + file);
    })
    return;
    const data = JSON.parse(readFileSync(path));
    if (!data) {
        console.error(`No data?`);
        return;
    }

    return data;
}

function validate(data, path) {
    const validate = ajv.compile(schema);
    const valid = validate(data);

    if (valid) {
        console.log(`  ${chalk.green('✓')} Bullet schema check OK!`);
    } else {
        if (validate.errors?.some(e => e.keyword === 'uniqueItemProperties')) {
            // Manual dupe detection
            const idMap = new Map();
            const duplicates = [];
            
            data.forEach((item, index) => {
                if (idMap.has(item.id)) {
                    duplicates.push({
                        id: item.id,
                        indices: [idMap.get(item.id), index]
                    });
                } else {
                    idMap.set(item.id, index);
                }
            });
            
            console.error(`${chalk.red(`✗ Bullet validation failed for ${path}! Duplicate IDs found:`)}`);
            duplicates.forEach(dup => {
                console.error(`  ID "${dup.id}" appears at positions ${dup.indices.join(' and ')}`);
                dup.indices.forEach(idx => {
                    console.error(`    Item at position ${idx}: ${JSON.stringify(data[idx])}`);
                });
            });
        } else {
            console.error(`${chalk.red('✗')} Bullet validation failed!`, validate.errors);
        }
    }
}

function main() {
    getSchema();
    if (schema) {
        getData();
    }
    
    return;
    if (schema && data) {
        const validate = ajv.compile(schema);
        const valid = validate(data);

        if (!valid) {
            if (validate.errors?.some(e => e.keyword === 'uniqueItemProperties')) {
                // Manual dupe detection
                const idMap = new Map();
                const duplicates = [];
                
                data.forEach((item, index) => {
                    if (idMap.has(item.id)) {
                        duplicates.push({
                            id: item.id,
                            indices: [idMap.get(item.id), index]
                        });
                    } else {
                        idMap.set(item.id, index);
                    }
                });
                
                console.error(`${chalk.red('✗')} Caliber validation failed! Duplicate IDs found:`);
                duplicates.forEach(dup => {
                    console.error(`  ID "${dup.id}" appears at positions ${dup.indices.join(' and ')}`);
                    dup.indices.forEach(idx => {
                        console.error(`    Item at position ${idx}: ${JSON.stringify(data[idx])}`);
                    });
                });
            } else {
                console.error(`${chalk.red('✗')} Caliber validation failed!`, validate.errors);
            }
        } else {
            console.log(`${chalk.green('✓')} Calibers OK!`);
        }
    }
}

main();