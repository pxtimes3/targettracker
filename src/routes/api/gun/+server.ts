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
    barrelunit: z.boolean().default(true),
    barreltwist: z.string().max(256).optional(),
    barreltwistunit: z.boolean().default(false),
    stock: z.string().max(512).optional(),
    note: z.string().max(1024).optional(),
});

export async function POST({ request }) {
    try {
        const requestData = await request.json();
        console.log('requestData:', requestData);
        if (!requestData.userId) throw new Error('No userId supplied.');

        // Convert on to true etc.
        requestData.barreltwistunit === 'on' ? requestData.barreltwistunit = true : requestData.barreltwistunit = false;
        requestData.barrellengthunit === 'on' ? requestData.barrellengthunit = true : requestData.barrellengthunit = false;
        
        // Validate against schema
        const validatedData = GunSchema.parse(requestData);
        console.log('validatedData:', validatedData)
        if (!validatedData.id) {
            console.error(validatedData);
            throw new Error('No gun id!');
        }
        if (!validatedData.userId) {
            console.error(validatedData);
            throw new Error('No user id!');  
        } 
        
        const result = await db.update(gun)
            .set({
                name: validatedData.name,
                type: validatedData.type,
                manufacturer: validatedData.manufacturer || null,
                model: validatedData.model || null,
                caliber: validatedData.caliber,
                caliberMm: validatedData.caliber_mm || null,
                barrelLength: validatedData.barrellength || null,
                barrelLengthUnit: requestData.barrel_unit ? 'metric' : 'imperial',
                barrelTwist: validatedData.barreltwist || null,
                barrelTwistUnit: requestData.barrel_twist_unit ? 'metric' : 'imperial',
                stock: validatedData.stock || null,
                note: validatedData.note || ''
            })
            .where(
                and(
                    eq(gun.id, validatedData.id),
                    eq(gun.userId, validatedData.userId)
                )
            );
        
            const updatedGun = await db.select()
                .from(gun)
                .where(
                    and(
                        eq(gun.id, validatedData.id),
                        eq(gun.userId, validatedData.userId)
                    )
                )
                .limit(1);
            
            return json({ 
                success: true, 
                rows: result.count, 
                gun: updatedGun[0] || null 
            });
    } catch (error) {
        if (error instanceof z.ZodError) {
        // Return validation errors
            return json({ success: false, errors: error.errors }, { status: 400 });
        } else {
            console.error('Error adding gun:', error);
            return json({ success: false, message: 'Server error' }, { status: 500 });
        }
    }
}