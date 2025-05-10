import { db } from '@/server/db/index.js';
import { gun } from '@/server/db/schema.js';
import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export async function POST({ request, locals }): Promise<Response>
{
    console.log('locals', locals);

    if (!locals.user) {
        return json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }
    
    const result = await db.select()
        .from(gun)
        .where(
            eq(gun.userId, locals.user.id)
        )

    console.log(result);

    return json(result);
};