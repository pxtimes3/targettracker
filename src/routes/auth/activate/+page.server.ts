import { dev } from '$app/environment';
import * as auth from '$lib/server/auth';
import * as table from '$lib/server/db/schema';
import { db } from "@/server/db";
import { fail } from '@sveltejs/kit';
import { eq } from "drizzle-orm";
import type { PageServerLoad } from './$types';


export const load: PageServerLoad = async (event) => {
    const verificationCode = event.url.searchParams.get('activate')?.toString();
    if (!verificationCode) {
        return {
            activated: false,
            error: 'No verification code provided'
        };
    }

    // kolla db efter user med ver.kod
    try {
        const query = await db.transaction(async (tx) => {
            // First get the user with the verification code
            console.log('event:', event);
            console.log(`looking for user w. vercode ${verificationCode}`);
            const user = await tx
                .select()
                .from(table.user)
                .where(eq(table.user.verificationCode, verificationCode))
                .limit(1);

            if (!user || user.length === 0) {
                throw new Error('User not found');
            }

            console.log(`found user with id: ${user[0].id}`);

            // Update user verification status
            await tx
                .update(table.user)
                .set({ verified: true })
                .where(eq(table.user.verificationCode, verificationCode));

            console.log(`updated user to be verified`);

            // If the user has an invite code, update it
            if (user[0].inviteCode) {
                await tx
                    .update(table.invitecodes)
                    .set({ accepted: true, invitee_email: user[0].email })
                    .where(eq(table.invitecodes.code, user[0].inviteCode));
            }

            console.log(`setting verification code to accepted`);

            try {
                const session = await auth.createSession(user[0].id);
                event.cookies.set(auth.sessionCookieName, session.id, {
                    path: '/',
                    sameSite: 'lax',
                    httpOnly: true,
                    expires: session.expiresAt,
                    secure: !dev
                });
                console.log(`created session`, session);
            } catch (e) {
                console.error('Error:', e);
                return fail(500, { message: 'An error creating session has occurred' });
            }
        });
    } catch (error) {
        // FIXME: Add logging
        console.error('OMGERRROR', error);
        return {
            activated: false,
            error: error.message || 'An error occurred during activation'
        };
    }

    return {
        activated: true,
        error: null
    };
};
