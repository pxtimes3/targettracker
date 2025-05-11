import { readFileSync } from 'fs';
import { resolve } from 'path';
import Ajv from 'ajv';

type AmmunitionData = {
    id: string;
    name: string;
    type: string;
    caliber: string;
    caliberMm: number;
    caliberId?: string;
    manufacturerBullet?: string;
    bulletName?: string;
    bulletWeight?: number;
    bulletWeightUnit?: 'g' | 'gr';
    bulletBc?: number;
    bulletBcModel?: 'g1' | 'g7';
    manufacturerPropellant?: string;
    propellantName?: string;
    propellantCharge?: number;
    propellantWeightUnit?: 'g' | 'gr';
    primerType?: string;
    manufacturerPrimer?: string;
    primerName?: string;
    manufacturerCase?: string;
    cartridgeOverallLength?: number;
    cartridgeOverallLengthUnit?: 'metric' | 'imperial';
    note?: string;
};

describe('Ammunition JSON', () => {
	let ammunitionData: AmmunitionData[];
	let schema: any;

	beforeAll(() => {
		// Load data
		const filePath = resolve(__dirname, '../ammunition.json');
		const fileContent = readFileSync(filePath, 'utf-8');
		ammunitionData = JSON.parse(fileContent);

		// Load schema
		const schemaPath = resolve(__dirname, '../schemas/ammunition.json');
		const schemaContent = readFileSync(schemaPath, 'utf-8');
		schema = JSON.parse(schemaContent);
	});

	test('should have valid JSON structure', () => {
		const ajv = new Ajv();
		const validate = ajv.compile(schema);
		const valid = validate(ammunitionData);
		
		if (!valid && validate.errors) {
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
			expect(ammo.caliberMm).toBeLessThan(40); // :D
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

	test('should have valid ammunition types', () => {
		const validTypes = ["centerfire", "rimfire", "shotgun", "airgun"];
		
		ammunitionData.forEach(ammo => {
			expect(validTypes).toContain(ammo.type);
		});
	});

	test('should have consistent ID format', () => {
		const idPattern = /^[a-z0-9.-]+$/;
		
		ammunitionData.forEach(ammo => {
			expect(ammo.id).toMatch(idPattern);
		});
	});
});