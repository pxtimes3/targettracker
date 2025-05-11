import { eq, and } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { ammunition, ammunitionTypeEnum, measurementsEnum, weightEnum, primerTypeEnum } from '@/server/db/schema.js';
import { number, z } from 'zod';

const AmmunitionSchema = z.object({
    id: z.string().optional(),
    userId: z.string(),
    createdAt: z.date().optional(),
    name: z.string().min(1),
    type: z.enum(ammunitionTypeEnum.enumValues),
    manufacturerCase: z.string().nullable().optional(),
    manufacturerBullet: z.string().nullable().optional(),
    manufacturerPrimer: z.string().nullable().optional(),
    manufacturerPropellant: z.string().nullable().optional(),
    propellantName: z.string().nullable().optional(),
    propellantCharge: z.number().nullable().optional(),
    bulletName: z.string().nullable().optional(),
    caliber: z.string().nullable().optional(),
    bulletWeight: z.number().nullable().optional(),
    primerType: z.enum(primerTypeEnum.enumValues).nullable().optional(),
    primerName: z.string().nullable().optional(),
    bulletBc: z.number().nullable().optional(),
    bulletBcModel: z.string().nullable().optional(),
    manufacturerBrand: z.string().nullable().optional(),
    bulletWeightUnit: z.enum(weightEnum.enumValues).nullable().optional(),
    propellantWeightUnit: z.enum(weightEnum.enumValues).nullable().optional(),
    manufacturerName: z.string().nullable().optional(),
    caliberMm: z.number().nullable().optional(),
    date: z.date().optional(),
    note: z.string().nullable().optional(),
    cartridgeOverallLength: z.number().nullable().optional(),
    cartridgeOverallLengthUnit: z.enum(measurementsEnum.enumValues).nullable().optional(),
});

export async function POST({ request }): Promise<Response>
{
    try {
        let result;
        let returning;
        let updatedAmmunition;

        const requestData = await request.json();
        console.debug('requestData:', requestData);

        if (requestData) {
            // parse string => number
            requestData.bulletWeight = parseFloat(requestData.bulletWeight) || 0;
            requestData.propellantCharge = parseFloat(requestData.propellantCharge) || 0;
            requestData.bulletBc = parseFloat(requestData.bulletBc) || 0;
            requestData.caliberMm = parseFloat(requestData.caliberMm) || 0;
            requestData.cartridgeOverallLength = parseFloat(requestData.cartridgeOverallLength) || 0;
        }

        const validatedData = AmmunitionSchema.parse(requestData);

        if (!validatedData.userId) {
            throw new Error('Not authenticated?');
        }
        

        const ammunitionData = {
            name: validatedData.name,
            type: validatedData.type,
            manufacturerCase: validatedData.manufacturerCase || null,
            manufacturerBullet: validatedData.manufacturerBullet || null,
            manufacturerPrimer: validatedData.manufacturerPrimer || null,
            manufacturerPropellant: validatedData.manufacturerPropellant || null,
            propellantName: validatedData.propellantName || null,
            propellantCharge: validatedData.propellantCharge || null,
            bulletName: validatedData.bulletName || null,
            caliber: validatedData.caliber || null,
            bulletWeight: validatedData.bulletWeight || null,
            primerType: validatedData.primerType || null,
            primerName: validatedData.primerName || null,
            bulletBc: validatedData.bulletBc || null,
            bulletBcModel: validatedData.bulletBcModel || null,
            manufacturerBrand: validatedData.manufacturerBrand || null,
            bulletWeightUnit: validatedData.bulletWeightUnit || null,
            propellantWeightUnit: validatedData.propellantWeightUnit || null,
            manufacturerName: validatedData.manufacturerName || null,
            caliberMm: validatedData.caliberMm || null,
            date: validatedData.date || new Date(),
            note: validatedData.note || null,
            cartridgeOverallLength: validatedData.cartridgeOverallLength || null,
            cartridgeOverallLengthUnit: validatedData.cartridgeOverallLengthUnit || null,
            userId: validatedData.userId
        }

        // update
        if (validatedData.id) {
            result = await db.update(ammunition)
                .set(ammunitionData)
                .where(
                    and(
                        eq(ammunition.id, validatedData.id),
                        eq(ammunition.userId, validatedData.userId)
                    )
                )
                .returning();

            updatedAmmunition = await db.select()
                .from(ammunition)
                .where(
                    and(
                        eq(ammunition.id, validatedData.id),
                        eq(ammunition.userId, validatedData.userId)
                    )
                )
                .limit(1);
        }
        // insert
        else {
            result = await db.insert(ammunition)
                .values({
                    ...ammunitionData,
                    userId: validatedData.userId
                })
                .returning();
                
            updatedAmmunition = result;
        }

        return json({ 
            success: true, 
            rows: result.length || 0, 
            ammunition: Array.isArray(updatedAmmunition) ? updatedAmmunition[0] : updatedAmmunition 
        });

        // fail
    } catch (error) {
        if (error instanceof z.ZodError) {
            return json({ success: false, errors: error.errors }, { status: 400 });
        } else {
            console.error('Error adding/updating ammunition:', error);
            return json({ success: false, message: 'Server error' }, { status: 500 });
        }
    }
}