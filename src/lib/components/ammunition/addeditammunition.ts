// src/lib/components/ammunition/addeditammunition.ts
import { hyphensToSpaces, createOriginalDataCopy, resetForm } from "@/utils/forms";
import { fetchCsrfToken } from "@/utils/security";

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
    propellantCharge: 0,
    bulletName: '',
    caliber: '',
    bulletWeight: 0,
    primerType: 'large rifle',
    propellantName: '',
    primerName: '',
    note: '',
    bulletBc: 0,
    bulletBcModel: '',
    manufacturerBrand: '',
    bulletWeightUnit: '',
    propellantWeightUnit: '',
    manufacturerName: '',
    caliberMm: 0,
    date: new Date(),
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