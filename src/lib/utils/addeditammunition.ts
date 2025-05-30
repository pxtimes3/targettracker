// src/lib/components/ammunition/addeditammunition.ts
import { validate, hyphensToSpaces, createOriginalDataCopy, convertComma, convertCommaString, convertInchToMm } from "@/utils/forms";
import { type MenuOption } from "svelte-ux";

export function createEmptyBaseRecipe(): BaseRecipe
{
    return {
        id: '',
        userId: '',
        createdAt: `${new Date()}`,
        name: `Test ${new Date().toISOString()}`,
        isFactory: false,
        
        // Caliber info
        caliber: '0.244',
        caliberMm: 5.6896,
        caliberUnit: 'metric',
        
        // Case details
        manufacturerCase: 'Norma',
        caseName: 'BR',
        
        // Bullet details
        manufacturerBullet: 'Sierra',
        bulletName: 'Varminator Express',
        bulletWeight: 55,
        bulletWeightUnit: 'gr',
        bulletBcG1: 0.132,
        bulletBcG7: 0.234,
        bulletSd: 0.567,
        
        // Propellant base details
        manufacturerPropellant: 'NormaVuori',
        propellantName: 'BadaBoom',
        
        // General info
        note: `This is a note ${new Date()}`,
        date: new Date().toUTCString(),
        type: "centerfire",
    }
};

export function createEmptyLoadVariation(): LoadVariation
{
    return {
        id: '',
        recipeId: '',
        createdAt: `${new Date()}`,
        name: '',
        propellantCharge: 69,
        propellantWeightUnit: 'gr',
        cartridgeOal: 1.23,
        cartridgeOalUnit: 'metric',
        manufacturerPrimer: 'ICC',
        primerType: 'small rifle',
        primerName: '420',
        lotNumber: '',
        date: `${new Date().getDate()}`,
        note: '',
        type: undefined
    }
}

export const createEmptyLoadRecipe = (): AmmunitionData => {
    return {
        baseRecipe: createEmptyBaseRecipe(),
        loadVariation: createEmptyLoadVariation()
    }
};

/**
 * Creates an array of options with formatted labels.
 * 
 * @param types - An array of ammunition type strings.
 * @returns An array of objects containing value and label for each ammunition type.
 */
export function createTypeOptions(types: string[]): { value: string; label: string }[] 
{
    return types.map(type => ({
        value: type,
        label: hyphensToSpaces(type)
    }));
}

export function setCaliberMm(val: string): number
{
    console.debug('setCaliberMm')
    const caliberInput = document.getElementsByName('caliber');
    
    const input: HTMLInputElement = caliberInput[0] as unknown as HTMLInputElement;
    let value = input.value;
    
    if (value.match(/^\d+,\d+$/)) {
        return convertCommaString(value);
    } else if (value.match(/^\.\d+$/)) {
        return convertInchToMm(parseFloat(value) * 10);
    } else {
        return parseFloat(value);
    }
}


export function createAmmunitionOptions(...ammunitionArrays: AmmunitionData[][]): MenuOption[] 
{
    if (ammunitionArrays.length === 0) {
        console.debug('No ammunition arrays provided');
        return [];
    }
    console.debug(`ammunition arrays:`, ammunitionArrays)

    const ammunition: AmmunitionData[] = ammunitionArrays.flat();
    
    if (!ammunition || ammunition.length === 0) {
        console.debug('No ammunition data available');
        return [];
    }
    
    // create entry on top
    const options: MenuOption[] = [
        {
            group: 'Create new... ',
            label: 'Add new ammunition entry',
            value: 'createnew'
        },
    ];

    console.debug(`126`, ammunition);
    
    // avengers, assemble!
    options.push(...ammunition.map(ammo => ({
        value: ammo.baseRecipe.id,
        group: `${ammo.baseRecipe.manufacturerBullet}`.trim(),
        label: `${ammo.baseRecipe.name} - ${ammo.baseRecipe.caliber || ''}`.trim()
    })));

    console.debug("options:", options);

    return options;
}

/* BULLETS */
export async function fetchPredefinedBullets(): Promise<BulletData[]>
{
    let predefinedBullets: BulletData[] = [];

    try {
        const response = await fetch('/public/bullets.json');

        if (!response.ok) {
            console.error('Failed to fetch /public/bullets.json');
            throw new Error('Failed to fetch /public/bullets.json');
        }

        const result = await response.json();
        predefinedBullets = result.map((item: BulletData) => ({ ...item }));
    } catch (error) {
        console.error('Error fetching bullet data', error);
        return predefinedBullets;
    } finally {
        return predefinedBullets;
    }
}

export function createBulletOptions(...array: BulletData[][]): MenuOption[] 
{
    if (array.length == 0) {
        console.debug('No bullet array(s) provided');
        return [];
    }

    const bullets: BulletData[] = array.flat();

    if (!bullets || bullets.length === 0) {
        console.debug('No bullet data available');
        return [];
    }

    const options: MenuOption[] = [
        {
            group: 'Create new... ',
            label: 'Add new bullet entry',
            value: 'createnew'
        },
    ];

    options.push(...bullets.map(bullet => ({
        value: bullet.id,
        group: `${bullet.manufacturer}`.trim(),
        label: `${bullet.name} - ${bullet.caliber.toString().substring(1,3).padEnd(3, '0') || ''}`.trim()
    })));

    // console.debug(options)

    return options;
}

// Fetch

// Predefined via JSON
const template = createEmptyLoadRecipe();

const mappingRules: Partial<Record<keyof AmmunitionData, (src: any) => any>> = {
    baseRecipe: (src) => ({
        id: src.id || '',
        userId: '',
        createdAt: new Date().toISOString(),
        name: src.name || '',
        isFactory: true,
        caliber: src.caliber || '',
        caliberMm: src.caliberMm || 0,
        caliberUnit: 'metric',
        manufacturerCase: src.manufacturerCase || '',
        caseName: '',
        manufacturerBullet: src.manufacturerBullet || src.manufacturer || '',
        bulletName: src.bulletName || '',
        bulletWeight: src.bulletWeight || 0,
        bulletWeightUnit: src.bulletWeightUnit || 'gr',
        bulletBcG1: src.bulletBcModel === 'g1' ? (src.bulletBc || 0) : 0,
        bulletBcG7: src.bulletBcModel === 'g7' ? (src.bulletBc || 0) : 0,
        bulletSd: 0,
        manufacturerPropellant: '',
        propellantName: '',
        note: '',
        date: new Date().toUTCString(),
        type: src.type || undefined
    }),
    loadVariation: (src) => ({
        id: crypto.randomUUID(),
        recipeId: src.id || '',
        createdAt: new Date().toISOString(),
        name: `${src.name} - Standard Load`,
        propellantCharge: null,
        propellantWeightUnit: 'gr',
        cartridgeOal: 0,
        cartridgeOalUnit: 'metric',
        manufacturerPrimer: '',
        primerType: 'unknown',
        primerName: '',
        lotNumber: '',
        date: new Date().toISOString(),
        note: '',
        type: 'factory'
    })
};

export async function fetchPredefinedAmmunition(): Promise<AmmunitionData[]> {
    try {
        const response = await fetch('/public/ammunition.json');
        if (!response.ok) {
            console.error(`Failed to load ammunition data: ${response.status} ${response.statusText}`);
            throw new Error('Failed to load predefined ammunition data');
        }
        
        const data = await response.json();
        console.debug('Ammunition data loaded:', data);
        
        if (!Array.isArray(data)) {
            throw new Error('Expected data to be an array');
        }
        
        return data.map(item => mapToType(item, template, mappingRules));
    } catch (error) {
        console.error('Error loading predefined ammunition:', error);
        return [];
    }
}

function mapToType<Source extends Record<string, any>, Target>(
    source: Source,
    targetTemplate: Target,
    mappingRules?: Partial<Record<keyof Target, (src: Source) => any>>
): Target {
    const result = {} as Target;
    
    for (const key in targetTemplate) {
        if (mappingRules && key in mappingRules && mappingRules[key]) {
            result[key as keyof Target] = mappingRules[key]!(source);
        } else if (key in source) {
            // Type assertion needed because TypeScript can't guarantee key types match -.-
            result[key as keyof Target] = source[key] as any;
        } else {
            result[key as keyof Target] = targetTemplate[key as keyof Target];
        }
    }
    
    return result;
}