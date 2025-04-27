// src/routes/api/guns/+server.ts
import { json } from '@sveltejs/kit';
import { number, z } from 'zod';
import { db } from '$lib/server/db';
import { gun, gunTypeEnum, measurementsEnum } from '@/server/db/schema.js';
import { eq, and } from 'drizzle-orm';

// Define validation schema using Zod
const GunSchema = z.object({
    userId: z.string().uuid(),
    id: z.string().optional(),
    name: z.string().max(256),
    type: z.enum(gunTypeEnum.enumValues),
    manufacturer: z.string().max(256).optional(),
    model: z.string().max(256).optional(),
    caliber: z.string(),
    caliber_mm: z.coerce.number().positive().optional(),
    barrellength: z.preprocess(
        val => val === "" ? null : val,
        z.union([
            z.number().max(256).nullable(),
            z.coerce.string().transform(val => val === "" ? null : val)
        ]).optional()
    ),
    barrelunit: z.string().max(24).default('metric').optional(),
    barreltwist: z.string().max(256).optional(),
    barreltwistunit: z.string().max(24).default('metric').optional(),
    stock: z.string().max(512).optional(),
    note: z.string().max(2048).optional(),
});

export async function POST({ request }) {
    try {
        const requestData = await request.json();
        console.log('requestData:', requestData);
        if (!requestData.userId) throw new Error('No userId supplied.');

        // Convert on to true etc.
        requestData.barreltwistunit === 'on' ? requestData.barreltwistunit = 'metric' : requestData.barreltwistunit = 'imperial';
        requestData.barrellengthunit === 'on' ? requestData.barrellengthunit = 'metric' : requestData.barrellengthunit = 'imperial';
        
        // Validate against schema
        const validatedData = GunSchema.parse(requestData);
        console.log('validatedData:', validatedData)
        
        if (!validatedData.userId) {
            console.error(validatedData);
            throw new Error('No user id!');  
        }
        
        // Common data object for both insert and update
        const gunData = {
            name: validatedData.name,
            type: validatedData.type,
            manufacturer: validatedData.manufacturer || null,
            model: validatedData.model || null,
            caliber: validatedData.caliber,
            caliberMm: validatedData.caliber_mm || null,
            barrelLength: validatedData.barrellength as unknown as number || null,
            barrelLengthUnit: requestData.barrel_unit ? 'metric' : 'imperial',
            barrelTwist: validatedData.barreltwist || null,
            barrelTwistUnit: requestData.barrel_twist_unit ? 'metric' : 'imperial',
            stock: validatedData.stock || null,
            note: validatedData.note || ''
        };

        let result;
        let updatedGun;

        // If ID exists, update existing record
        if (validatedData.id) {
            result = await db.update(gun)
                .set(gunData)
                .where(
                    and(
                        eq(gun.id, validatedData.id),
                        eq(gun.userId, validatedData.userId)
                    )
                );
                
            updatedGun = await db.select()
                .from(gun)
                .where(
                    and(
                        eq(gun.id, validatedData.id),
                        eq(gun.userId, validatedData.userId)
                    )
                )
                .limit(1);
        } 
        // If no ID, insert new record
        else {
            result = await db.insert(gun)
                .values({
                    ...gunData,
                    userId: validatedData.userId
                })
                .returning();
                
            updatedGun = result;
        }
        
        return json({ 
            success: true, 
            rows: result.length || result.count || 0, 
            gun: Array.isArray(updatedGun) ? updatedGun[0] : updatedGun 
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return json({ success: false, errors: error.errors }, { status: 400 });
        } else {
            console.error('Error adding/updating gun:', error);
            return json({ success: false, message: 'Server error' }, { status: 500 });
        }
    }
}