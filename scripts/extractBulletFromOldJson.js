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
        const filePath = join(__dirname, './src/norma.json');
        
        // Read the file
        const fileContent = await readFile(filePath, 'utf8');
        
        // Parse the JSON
        data = JSON.parse(fileContent);
    } catch (error) {
        console.error('Error reading data', error);
    }
    
    return data;
}

// Function to extract bullet info from the ammunition data
function extractBullets(ammoData) {
    return ammoData.map(ammo => {
      // Extract caliber in decimal format
      const caliberDecimal = parseFloat(ammo.caliberMm) / 25.4;
      
      // Extract bullet weight in metric (grams)
      const weightMetric = (ammo.bulletWeight * 0.0648);
      
      // Generate a unique bullet ID
      const bulletId = `${ammo.manufacturerBullet.toLowerCase()}-${ammo.bulletName.toLowerCase().replace(/\s+/g, '-')}-${ammo.bulletWeight}`;
      
      // Determine bc1 (G1) and bc7 (G7) based on bulletBcModel
      let bc1 = null;
      let bc7 = null;
      
      if (ammo.bulletBc) {
        if (!ammo.bulletBcModel || ammo.bulletBcModel === "g1") {
          bc1 = ammo.bulletBc;
        } else if (ammo.bulletBcModel === "g7") {
          bc7 = ammo.bulletBc;
        }
      }
      
      // Construct the bullet object
      return {
        id: bulletId,
        manufacturer: ammo.manufacturerBullet,
        name: ammo.bulletName,
        caliber: parseFloat(caliberDecimal.toFixed(4)),
        caliberMm: ammo.caliberMm,
        weight: ammo.bulletWeight,
        weightMetric: parseFloat(weightMetric.toFixed(5)),
        sd: null, // You'll need to add this data separately
        bc1: bc1,
        bc7: bc7,
        type: ammo.bulletName.split(' ')[0] // Using first part of bullet name as type
      };
    });
  }
  
  function removeDuplicateBullets(bullets) {
    const uniqueBullets = [];
    const seen = new Set();
    
    bullets.forEach(bullet => {
      const key = `${bullet.manufacturer}-${bullet.name}-${bullet.weight}-${bullet.caliber}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueBullets.push(bullet);
      }
    });
    
    return uniqueBullets;
  }
  

  const ammoData = await fetchPredefinedData();
  const bullets = extractBullets(ammoData);
  const uniqueBullets = removeDuplicateBullets(bullets);
  
  // Output the result
  console.log(JSON.stringify(uniqueBullets, null, 4));