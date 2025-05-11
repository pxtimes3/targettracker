import { readFileSync } from 'fs';
import { resolve } from 'path';

type CaliberData = {
	id: string;
	name: string;
	category: string;
	mm: string;
	in: string;
	aliases?: string[];
};

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

type CaliberNameMap = {
	[key: string]: string;
};

type InvalidEntry = {
	id: string;
	error: string;
};

type Warning = {
	id: string;
	warning: string;
};

type Suggestion = {
	id: string;
	caliber: string;
	suggestedCaliberId: string;
};

describe('Ammunition and Caliber Consistency', () => {
  let ammunitionData: AmmunitionData[];
  let calibersData: CaliberData[];
  let validCaliberIds: string[];
  let validCaliberNames: string[];
  let caliberNameToId: CaliberNameMap;

	beforeAll(() => {
		const ammunitionPath = resolve(__dirname, '../ammunition.json');
		const ammunitionContent = readFileSync(ammunitionPath, 'utf-8');
		ammunitionData = JSON.parse(ammunitionContent);
	
		const calibersPath = resolve(__dirname, '../calibers.json');
		const calibersContent = readFileSync(calibersPath, 'utf-8');
		calibersData = JSON.parse(calibersContent);
	
		validCaliberIds = calibersData.map(c => c.id);
		
		validCaliberNames = calibersData.reduce<string[]>((acc, c) => {
			acc.push(c.name);
			if (c.aliases) {
				acc.push(...c.aliases);
			}
			return acc;
		}, []);
	
		caliberNameToId = {};
		calibersData.forEach(caliber => {

		caliberNameToId[caliber.name.toLowerCase()] = caliber.id;
		caliberNameToId[caliber.name.toLowerCase().replace(/\s+/g, '')] = caliber.id;
		
		if (caliber.aliases) {
			caliber.aliases.forEach(alias => {
				caliberNameToId[alias.toLowerCase()] = caliber.id;
				caliberNameToId[alias.toLowerCase().replace(/\s+/g, '')] = caliber.id;
			});
		}
		});
	});

	test('all caliberId references should be valid', () => {
		const invalidEntries: InvalidEntry[] = [];

		ammunitionData.forEach(ammo => {
		if (ammo.caliberId && !validCaliberIds.includes(ammo.caliberId)) {
			invalidEntries.push({
				id: ammo.id,
				error: `Invalid caliberId: ${ammo.caliberId}`
			});
		}
		});

		if (invalidEntries.length > 0) {
			console.error('Invalid caliberId references:', invalidEntries);
		}
		
		expect(invalidEntries).toHaveLength(0);
	});

	test('caliber names should match known calibers', () => {
		const warnings: Warning[] = [];
	
		ammunitionData.forEach(ammo => {
		if (ammo.caliber) {
			const normalizedCaliber = ammo.caliber.toLowerCase().replace(/\s+/g, '');
			
			const matchesCaliber = validCaliberNames.some(name => {
				const normalizedName = name.toLowerCase().replace(/\s+/g, '');
				return normalizedCaliber === normalizedName || 
					normalizedCaliber.includes(normalizedName) || 
					normalizedName.includes(normalizedCaliber);
			});
	
			if (!matchesCaliber) {
				warnings.push({
				id: ammo.id,
				warning: `Caliber name "${ammo.caliber}" doesn't match any known caliber`
			});
			}
		}
		});
	
		if (warnings.length > 0) {
		console.warn('Caliber name warnings:', warnings);
		}
	});

	test('should suggest caliberId for ammunition without one', () => {
		const suggestions: Suggestion[] = [];
	
		ammunitionData.forEach(ammo => {
			if (!ammo.caliberId && ammo.caliber) {
				const normalizedCaliber = ammo.caliber.toLowerCase().replace(/\s+/g, '');
				let suggestedId: string | null = null;
				
				const normalizedCaliberMap: {[key: string]: string} = {};
				for (const [name, id] of Object.entries(caliberNameToId)) {
					normalizedCaliberMap[name.toLowerCase().replace(/\s+/g, '')] = id;
				}
				
				if (normalizedCaliberMap[normalizedCaliber]) {
					suggestedId = normalizedCaliberMap[normalizedCaliber];
				} else {
					for (const [normalizedName, id] of Object.entries(normalizedCaliberMap)) {
						if (normalizedCaliber.includes(normalizedName) || normalizedName.includes(normalizedCaliber)) {
							suggestedId = id;
							break;
						}
					}
				}
		
				if (suggestedId) {
					suggestions.push({
						id: ammo.id,
						caliber: ammo.caliber,
						suggestedCaliberId: suggestedId
					});
				}
			}
		});
	
		if (suggestions.length > 0) {
			console.info('Suggested caliber IDs:', suggestions);
		}
	});
});