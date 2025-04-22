// src/routes/api/guns/+server.ts
import { json } from '@sveltejs/kit';
import { number, z } from 'zod';
import { db } from '$lib/server/db';
import { gun, gunTypeEnum } from '@/server/db/schema.js';
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
    barrellength: z.number().max(256).optional().or(z.coerce.number().positive()),
    barreltwist: z.string().max(256).optional(),
    note: z.string().max(1024).optional(),
    // Add other fields with appropriate validation
});

export async function POST({ request }) {
    try {
        const requestData = await request.json();
        if (!requestData.userId) throw new Error('No userId supplied.');
        
        // Validate request body against schema
        const validatedData = GunSchema.parse(requestData);
        if (!validatedData.id) throw new Error('No gun id!');
        if (!validatedData.userId) throw new Error('No user id!');
        
        // If validation passes, proceed with database operation
        // Use parameterized queries to prevent SQL injection
        const result = await db.update(gun)
            .set({
                name: validatedData.name,
                type: validatedData.type,
                manufacturer: validatedData.manufacturer || null,
                model: validatedData.model || null,
                caliber: validatedData.caliber,
                caliberMm: validatedData.caliber_mm || null,
                barrelLength: validatedData.barrellength || null,
                barrelTwist: validatedData.barreltwist || null,
                note: validatedData.note || ''
            })
            .where(
                and(
                    eq(gun.id, validatedData.id),
                    eq(gun.userId, validatedData.userId)
                )
            );
        
        return json({ success: true, rows: result.count });
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