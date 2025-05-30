// src/routes/api/gun/[id]/+server.ts
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { gun } from '@/server/db/schema.js';
import { eq, and, sql } from 'drizzle-orm';

export async function GET({ params, locals }): Promise<Response>
{
    try {
        if (!locals.user) {
            return json({ success: false, message: 'Not authenticated' }, { status: 401 });
        }
        
        const gunId = params.id;
        if (!gunId) {
            return json({ success: false, message: 'Gun ID is required' }, { status: 400 });
        }
        
        // Fetch the gun data
        const result = await db.execute(sql`SELECT get_user_firearms_data(${locals.user.id}) WHERE id = ${gunId}`);
        
        if (result && result.length > 0) {
            return json(result[0].get_user_firearms_data);
        } else {
            return json({ success: false, message: 'Gun not found' }, { status: 404 });
        }
    } catch (error) {
        console.error('Error fetching gun:', error);
        return json({ success: false, message: 'Server error' }, { status: 500 });
    }
}