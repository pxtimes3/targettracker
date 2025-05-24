import { eq, and } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { ammunition, ammunitionTypeEnum, measurementsEnum, weightEnum, primerTypeEnum } from '@/server/db/schema.js';
import { type LoadRecipe, loadRecipeSchema, type LoadVariation, loadVariationSchema } from '@/server/ammunition/schema.js';
import { number, z } from 'zod';
import type { RequestEvent } from '$types';
import { error } from '@sveltejs/kit';

export async function POST({ request }): Promise<Response>
{
    try {
        let result = [];
        let updatedAmmunition;

        const requestData = await request.json();
        console.debug('requestData:', requestData);

        
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

export async function GET({ params, locals }): Promise<Response>
{
    const userAmmunition: AmmunitionData[] = [];
    let userId: string;

    if (!locals.session?.id) { 
        error(503, 'Not authenticated.');
        return json({ success: false, rows: 0, ammunition: undefined});
    } else {
        userId = locals.session.userId;
    }

    try {
        console.debug(`Fetching ammunition for userId: ${userId}`);
        const userAmmunition = await db.select()
            .from(ammunition)
            .where(
                eq(ammunition.userId, userId)
            );
        
        if (userAmmunition) {
            console.debug('result', userAmmunition);
        }

        return json({ success: true, rows: userAmmunition.length || 0, ammunition: userAmmunition});
    } catch (error) {
        console.error(error);
        return json({ success: false, message: 'Server error' }, { status: 500 });
    }
}