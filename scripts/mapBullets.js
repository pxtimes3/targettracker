import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function fetchPredefinedData() {
    let data = [];

    try {
        // Use path.join to create an absolute path
        const filePath = join(__dirname, './src/lapua.json');
        
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
        const filePath = join(__dirname, './src/bullets/lapua.json');
        
        // Read the file
        const fileContent = await readFile(filePath, 'utf8');
        
        // Parse the JSON
        data = JSON.parse(fileContent);
    } catch (error) {
        console.error('Error reading data', error);
    }
    
    return data;
}

// Function to transform ammunition data to reference bullets by ID
function transformAmmoData(ammoData, bulletData) {
    // Create a lookup map for bullets by their properties
    const bulletLookup = new Map();
    
    // Populate the lookup map
    bulletData.forEach(bullet => {
      // Create a key based on manufacturer, name, and weight
      const key = `${bullet.manufacturer}-${bullet.name}-${bullet.weight}`;
      bulletLookup.set(key, bullet.id);
    });
    
    // Transform the ammo data
    return ammoData.map(ammo => {
      // Create a key to look up the matching bullet
      const bulletKey = `${ammo.manufacturerBullet}-${ammo.bulletName}-${ammo.bulletWeight}`;
      const bulletId = bulletLookup.get(bulletKey);
      
      // Create a new object without the bullet properties
      const {
        manufacturerBullet,
        bulletName,
        bulletWeight,
        bulletWeightUnit,
        bulletBc,
        bulletBcModel,
        ...rest
      } = ammo;
      
      // Return the new ammo object with bulletId
      return {
        ...rest,
        bulletId: bulletId || null // Use null if no matching bullet is found
      };
    });
  }
  
  // Usage:
  async function processData() {
    const ammoData = await fetchPredefinedData(); // Your original data
    const bulletData = await fetchBulletData(); // Your new bullet data
    
    const transformedAmmo = transformAmmoData(ammoData, bulletData);
    
    // Output or save the transformed data
    console.log(JSON.stringify(transformedAmmo, null, 2));
  }
  
  processData();