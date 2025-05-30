import Ajv from 'ajv';
import addKeywords from 'ajv-keywords';
import chalk from 'chalk';
import { readFileSync } from 'node:fs';

const ajv = new Ajv({ allErrors: true, strict: false });
addKeywords(ajv, ['uniqueItemProperties']);

function getSchema(path = './schemas/caliber.json') {
    const schema = JSON.parse(readFileSync(path));

    if (!schema) {
        console.error(`No schema?`);
        return;
    }

    //console.log(`schema:`, schema);

    return schema;
}

function getData(path = './calibers.json') {
    const data = JSON.parse(readFileSync(path));
    if (!data) {
        console.error(`No data?`);
        return;
    }

    return data;
}

function main() {
    const schema = getSchema();
    const data = getData();
    
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