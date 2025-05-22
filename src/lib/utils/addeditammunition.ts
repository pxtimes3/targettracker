// src/lib/components/ammunition/addeditammunition.ts
import { validate, hyphensToSpaces, createOriginalDataCopy, convertComma, convertCommaString, convertInchToMm } from "@/utils/forms";
import { type MenuOption } from "svelte-ux";

export const createEmptyAmmunition = (): AmmunitionData => ({
    id: '',
    userId: '',
    createdAt: new Date(),
    name: '',
    type: '',
    manufacturerCase: '',
    manufacturerBullet: '',
    manufacturerPrimer: '',
    manufacturerPropellant: '',
    propellantCharge: null,
    bulletName: '',
    caliber: '',
    caliberUnit: 'metric',
    bulletWeight: null,
    primerType: undefined,
    propellantName: '',
    primerName: '',
    note: '',
    bulletBcG7: null,
    bulletBcG1: null,
    bulletSD: null,
    manufacturerBrand: '',
    bulletWeightUnit: 'gr',
    propellantWeightUnit: 'gr',
    manufacturerName: '',
    caliberMm: null,
    cartridgeOverallLength: null,
    cartridgeOverallLengthUnit: null,
    date: new Date(),
    isFactory: false,
    error: { message: '' }
});

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
    
    // avengers, assemble!
    options.push(...ammunition.map(ammo => ({
        value: ammo.id,
        group: `${ammo.group || ammo.manufacturerBullet}`.trim(),
        label: `${ammo.name} - ${ammo.caliber || ''}`.trim()
    })));

    // console.debug(options)

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
        label: `${bullet.name} - ${bullet.caliber || ''}`.trim()
    })));

    // console.debug(options)

    return options;
}