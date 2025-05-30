#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

/**
 * Merges JSON files from a directory into a single file
 * @param {string} sourceDir - Source directory containing JSON files
 * @param {string} outputFile - Path to the output merged JSON file
 * @param {boolean} asArray - Whether to merge as array (true) or object (false)
 */
function mergeJsonFiles(sourceDir, outputFile, asArray = true) {
    try {
        // Resolve absolute paths
        const sourcePath = resolve(sourceDir);
        const outputPath = resolve(outputFile);
        
        console.log(`Merging JSON files from ${sourcePath} to ${outputPath}`);
        
        // Read all files from the directory
        const files = readdirSync(sourcePath)
            .filter(file => file.endsWith('.json'));
        
        if (files.length === 0) {
            console.error(`No JSON files found in ${sourcePath}`);
            process.exit(1);
        }
        
        console.log(`Found ${files.length} JSON files`);
        
        // Initialize the result based on the output format
        let result = asArray ? [] : {};
        
        // Process each file
        files.forEach(file => {
            const filePath = join(sourcePath, file);
            try {
                const content = JSON.parse(readFileSync(filePath, 'utf8'));
                
                if (asArray) {
                    if (Array.isArray(content)) {
                        result = [...result, ...content];
                    } else {
                        result.push(content);
                    }
                } else {
                    const key = file.replace('.json', '');
                    result[key] = content;
                }
                
                console.log(`Processed: ${file}`);
            } catch (err) {
                console.error(`Error processing ${file}: ${err.message}`);
            }
        });
        
        writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log(`Successfully merged ${files.length} files to ${outputPath}`);
        
    } catch (err) {
            console.error(`Error: ${err.message}`);
            process.exit(1);
    }
}

function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.error('Usage: node merge-json.js <sourceDir> <outputFile> [--as-object]');
        process.exit(1);
    }
    
    const sourceDir = args[0];
    const outputFile = args[1];
    const asArray = !args.includes('--as-object');
    
    mergeJsonFiles(sourceDir, outputFile, asArray);
}

main();