import { readdirSync, readFileSync, writeFileSync } from "fs";

const replaceNonAlphaNumeric = /[^a-z0-9]/gi;

function main() 
{
    const files = readdirSync('./src/bullets/');
    files.forEach((file) => {
        const filePath = `./src/bullets/${file}`;
        const data = JSON.parse(readFileSync(filePath));
        
        let modified = false;

        data.forEach((entry) => {
            if (entry.manufacturer && entry.name && entry.caliber && entry.weight) {
                let manufacturer = entry.manufacturer.toLowerCase().replace(replaceNonAlphaNumeric, '');
                let name = entry.name.toLowerCase().replace(replaceNonAlphaNumeric, '');
                let caliber = entry.caliber.toPrecision(3).toString().replace(/(0\.)/, '');
                let weight = entry.weight;
                let string = `${manufacturer}-${name}-${caliber}-${weight}`.toLowerCase();
                
                if (entry.id !== string) {
                    entry.id = string;
                    modified = true;
                }
            } else {
                console.log(`Entry ${entry.id || 'unknown'} in ${file} is missing required fields`);
            }
        });

        if (modified) {
            try {
                writeFileSync(filePath, JSON.stringify(data, null, 2));
                console.log(`Updated IDs in ${file}`);
            } catch (error) {
                console.error(`Error writing to ${file}:`, error);
            }
        } else {
            console.log(`No changes needed in ${file}`);
        }
    });
}

main();