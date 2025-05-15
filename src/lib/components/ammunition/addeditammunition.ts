// src/lib/components/ammunition/addeditammunition.ts
import { hyphensToSpaces, createOriginalDataCopy, resetForm } from "@/utils/forms";

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