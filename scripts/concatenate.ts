import { readdir, open, writeFile } from 'fs/promises';
import { join } from 'path';
import chalk from 'chalk';

const buildFiles: string[] = [];

async function readDirectory(dirPath: string): Promise<string[]> 
{
    try {
        const files = await readdir(dirPath);
        return files;
    } catch (error) {
        console.error(`Error reading directory: ${error}`);
        return [];
    }
}

async function fileCheck(path: string): Promise<boolean>
{
    try {
        await open(path, 'r+');
        console.log(`\x1b[32m\u2714\x1b[0m File ${chalk.bold.italic(path)} exists and is accessible`);
        return true;
    } catch (err) {
        console.log(`\x1b[31m\u2716\x1b[0m Seems like ${chalk.bold.italic(path)} doesn't exist or we have insufficient permissions?`);
        return false;
    }
}

async function merge(paths: string[]): Promise<void>
{
    if (paths.length === 0) {
        console.log(chalk.yellow('No files to merge'));
        return;
    }

    try {
        const mergedContent: any[] = [];
        
        for (const filePath of paths) {
            const fullPath = join(process.cwd(), filePath);
            try {
                const fileHandle = await open(fullPath, 'r');
                const content = await fileHandle.readFile('utf-8');
                await fileHandle.close();
                
                try {
                    const jsonContent = JSON.parse(content);
                    
                    if (Array.isArray(jsonContent)) {
                        mergedContent.push(...jsonContent);
                    } else {
                        const values = Object.values(jsonContent);
                        mergedContent.push(...values);
                    }
                    
                    console.log(`${chalk.green('✓')} Merged content from ${chalk.bold(filePath)}`);
                } catch (parseErr) {
                    console.error(`${chalk.red('✗')} Error parsing JSON from ${chalk.bold(filePath)}: ${parseErr}`);
                }
            } catch (err) {
                console.error(`${chalk.red('✗')} Error reading file ${chalk.bold(filePath)}: ${err}`);
            }
        }
        
        // Remove dupes
        const uniqueContent = mergedContent.filter((item, index, self) => 
            index === self.findIndex(t => t.id === item.id)
        );
        
        // Write file
        await writeFile('ammunition.json', JSON.stringify(uniqueContent, null, 2));
        console.log(`${chalk.green('✓')} Successfully wrote ${uniqueContent.length} ammunition entries to ${chalk.bold('ammunition.json')}`);
    } catch (err) {
        console.error(`${chalk.red('✗')} Error during merge operation: ${err}`);
    }
}

async function main(): Promise<void>
{
    const targetDir = process.argv[2] || 'src/';
    const fullTargetDir = join(process.cwd(), targetDir);
    console.log(`Scanning directory: ${chalk.blue(fullTargetDir)}`);
    
    const files = await readDirectory(fullTargetDir);
    
    console.log('Checking ammunition files');
    
    const ammunitionExists = await fileCheck('ammunition.json');
    
    if (files.length > 0) {
        console.log(`${chalk.green('✓')} Found ${files.length} files in directory`);
        
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        if (jsonFiles.length > 0) {
            jsonFiles.forEach(file => {
                console.log(`Found: ${chalk.blue(file)}`);
                buildFiles.push(join(targetDir, file));
            });
            
            await merge(buildFiles);
        } else {
            console.log(chalk.yellow('No JSON files found in the target directory'));
        }
    } else {
        console.log(chalk.yellow('No files found in the target directory'));
    }
}

main()
    .catch(err => console.error(`${chalk.red('✗')} Main process error: ${err}`))
    .finally(() => console.log(chalk.blue('Process completed')));