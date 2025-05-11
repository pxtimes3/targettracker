// tests/ammunition.test.ts
import { readFileSync } from 'fs';
import { resolve } from 'path';
import Ajv from 'ajv';
import { ammunitionSchema } from '../schemas/ammunition-schema';

const ajv = new Ajv();
const validate = ajv.compile(ammunitionSchema);

describe('Ammunition JSON', () => {
  let ammunitionData;

  beforeAll(() => {
    const filePath = resolve(__dirname, '../static/public/ammunition.json');
    const fileContent = readFileSync(filePath, 'utf-8');
    ammunitionData = JSON.parse(fileContent);
  });

  test('should be valid according to schema', () => {
    const valid = validate(ammunitionData);
    if (!valid) {
      console.error('Validation errors:', validate.errors);
    }
    expect(valid).toBe(true);
  });

  test('should have unique IDs', () => {
    const ids = ammunitionData.map(item => item.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('should have consistent unit types', () => {
    ammunitionData.forEach(ammo => {
      if (ammo.bulletWeight && !ammo.bulletWeightUnit) {
        fail(`Ammunition ${ammo.id} has bulletWeight but no bulletWeightUnit`);
      }
      if (ammo.propellantCharge && !ammo.propellantWeightUnit) {
        fail(`Ammunition ${ammo.id} has propellantCharge but no propellantWeightUnit`);
      }
      if (ammo.cartridgeOverallLength && !ammo.cartridgeOverallLengthUnit) {
        fail(`Ammunition ${ammo.id} has cartridgeOverallLength but no cartridgeOverallLengthUnit`);
      }
    });
  });

  test('should have reasonable caliberMm values', () => {
    ammunitionData.forEach(ammo => {
      if (ammo.caliberMm) {
        expect(ammo.caliberMm).toBeGreaterThan(0.1);
        expect(ammo.caliberMm).toBeLessThan(40); // Largest common caliber
      }
    });
  });

  test('should have reasonable bullet weights', () => {
    ammunitionData.forEach(ammo => {
      if (ammo.bulletWeight) {
        if (ammo.bulletWeightUnit === 'gr') {
          expect(ammo.bulletWeight).toBeGreaterThan(1);
          expect(ammo.bulletWeight).toBeLessThan(1000);
        } else if (ammo.bulletWeightUnit === 'g') {
          expect(ammo.bulletWeight).toBeGreaterThan(0.1);
          expect(ammo.bulletWeight).toBeLessThan(100);
        }
      }
    });
  });
});