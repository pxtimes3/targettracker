import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function fetchCaliberData() {
    let data = [];

    try {
        // Use path.join to create an absolute path
        const filePath = join(__dirname, './calibers.json');
        
        // Read the file
        const fileContent = await readFile(filePath, 'utf8');
        
        // Parse the JSON
        data = JSON.parse(fileContent);
    } catch (error) {
        console.error('Error reading data', error);
    }
    
    return data;
}

async function fetchBulletData() {
    let data = [];

    try {
        // Use path.join to create an absolute path
        const filePath = join(__dirname, './src/bullets/hornady.json');
        
        // Read the file
        const fileContent = await readFile(filePath, 'utf8');
        
        // Parse the JSON
        data = JSON.parse(fileContent);
    } catch (error) {
        console.error('Error reading data', error);
    }
    
    return data;
}

// Function to map bullets to caliber IDs
function mapBulletsToCaliberIds(bulletData, caliberData) {
    // Create lookup maps for calibers by various properties
    const caliberByMm = new Map();
    const caliberByInch = new Map();
    const caliberByName = new Map();
    const caliberByAlias = new Map();
    
    // Populate lookup maps
    caliberData.forEach(caliber => {
      // By mm
      caliberByMm.set(parseFloat(caliber.mm), caliber.id);
      
      // By inch
      caliberByInch.set(parseFloat(caliber.in), caliber.id);
      
      // By name (lowercase for case-insensitive matching)
      caliberByName.set(caliber.name.toLowerCase(), caliber.id);
      
      // By aliases
      caliber.aliases.forEach(alias => {
        caliberByAlias.set(alias.toLowerCase(), caliber.id);
      });
    });
    
    // Function to find the best matching caliber ID
    function findCaliberId(bullet) {
      // First try exact mm match (most reliable)
      if (bullet.caliberMm && caliberByMm.has(parseFloat(bullet.caliberMm))) {
        return caliberByMm.get(parseFloat(bullet.caliberMm));
      }
      
      // Try inch match if available
      if (bullet.caliber && caliberByInch.has(parseFloat(bullet.caliber))) {
        return caliberByInch.get(parseFloat(bullet.caliber));
      }
      
      // Try matching by name or alias
      const bulletNameParts = bullet.name.toLowerCase().split(' ');
      
      // Check if any part of the bullet name matches a caliber name or alias
      for (const part of bulletNameParts) {
        if (caliberByName.has(part) || caliberByAlias.has(part)) {
          return caliberByName.get(part) || caliberByAlias.get(part);
        }
      }
      
      // If no match found, try some common caliber patterns in the bullet name
      const bulletFullName = bullet.name.toLowerCase();
      
      // Check for common caliber patterns
      for (const [name, id] of caliberByName.entries()) {
        if (bulletFullName.includes(name)) {
          return id;
        }
      }
      
      for (const [alias, id] of caliberByAlias.entries()) {
        if (bulletFullName.includes(alias)) {
          return id;
        }
      }
      
      // No match found
      return null;
    }
    
    // Map bullets to caliber IDs
    return bulletData.map(bullet => {
      const caliberId = findCaliberId(bullet);
      return {
        ...bullet,
        caliberId
      };
    });
  }
  
  // Usage:
  async function processData() {
    const bulletData = await fetchBulletData();
    const caliberData = await fetchCaliberData();
    
    const mappedBullets = mapBulletsToCaliberIds(bulletData, caliberData);
    
    // Output or save the mapped bullets
    console.log(JSON.stringify(mappedBullets, null, 2));
  }
  
  processData();