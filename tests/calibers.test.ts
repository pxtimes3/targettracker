import { readFileSync } from 'fs';
import { resolve } from 'path';
import Ajv from 'ajv';

type CaliberData = {
	id: string;
	name: string;
	category: string;
	mm: string;
	in: string;
	aliases?: string[];
};

describe('Calibers JSON', () => {
	let calibersData: CaliberData[];
	let schema: any;

	beforeAll(() => {
		// Load data
		const filePath = resolve(__dirname, '../calibers.json');
		const fileContent = readFileSync(filePath, 'utf-8');
		calibersData = JSON.parse(fileContent);

		// Load schema
		const schemaPath = resolve(__dirname, '../schemas/caliber.json');
		const schemaContent = readFileSync(schemaPath, 'utf-8');
		schema = JSON.parse(schemaContent);
	});

	test('should have valid JSON structure', () => {
		const ajv = new Ajv();
		const validate = ajv.compile(schema);
		const valid = validate(calibersData);
		
		if (!valid && validate.errors) {
			console.error('Validation errors:', validate.errors);
		}
		
		expect(valid).toBe(true);
	});

	test('should have unique IDs', () => {
		const ids = calibersData.map(item => item.id);
		const uniqueIds = new Set(ids);
		expect(uniqueIds.size).toBe(ids.length);
	});

	test('should have unique names', () => {
		const names = calibersData.map(item => item.name.toLowerCase());
		const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
		
		if (duplicates.length > 0) {
			console.warn('Duplicate caliber names:', duplicates);
		}
		
		expect(duplicates).toHaveLength(0);
	});


	test('should have valid category values', () => {
		const validCategories = ["Rimfire", "Rifle", "Handgun", "Airgun", "Shotgun"];
		
		calibersData.forEach(caliber => {
			expect(validCategories).toContain(caliber.category);
		});
	});

	test('should have consistent ID format', () => {
		const idPattern = /^[a-z0-9-.]+$/;
		
		calibersData.forEach(caliber => {
			expect(caliber.id).toMatch(idPattern);
		});
	});

	test('should have reasonable caliber values', () => {
		calibersData.forEach(caliber => {
			const mmValue = parseFloat(caliber.mm);
			
			expect(mmValue).toBeGreaterThan(2);
			expect(mmValue).toBeLessThan(40);
		});
	});
});