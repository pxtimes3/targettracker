import * as table from '$lib/server/db/schema';
import { db } from '@/server/db';
import { fail, type Actions } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import { validate } from 'uuid';
import type { SendInviteData } from '../../$types';


export const load = async (event) => {
    return {
        invites: await getInvites(event.locals.session?.userId),
    }
}

export const actions: Actions = {
    /*
        1. code exists
        2. invitecodes.user === session.user.id
        3. code is active/not sent already
        4. send code
        5. invalidate (clientside)
    */
    sendinvite: async (event) => {
        const body = await event.request.formData();
        const inviteeEmail = body.get('invitee-email');
        const inviteCode = body.get('invite-code');
        const senderid = event.locals.session?.userId;

        let code: unknown;
        let senderUserName: string|undefined;

        if (!inviteeEmail) {
            return fail(400, {message: "Invitee e-mail missing."});
        }

        if (!inviteCode) {
            return fail(400, {message: "Invite-code is missing."});
        }

        if (!validate(inviteCode)) {
            return fail(400, {message: "Invalid UUID."});
        }

        if (!senderid) {
            return fail(400, {message: "No sender id provided."})
        }

        // does the code exist?
        try {
            const codeRow = await db.select()
                .from(table.invitecodes)
                .where(
                    and(
                        eq(table.invitecodes.code, inviteCode.toString()),
                        eq(table.invitecodes.user, senderid)
                    )
                )
                .limit(1)

            if (codeRow.length > 0) {
                const codeData = codeRow[0];
                if (!codeData.active && codeData.invitee_email === null && !codeData.accepted) {
                    code = codeData;
                } else {
                    // FIXME: Logging
                    console.error(
                        'codeRow.length: ', codeRow.length,
                        'codeRow[0].active: ', codeData.active,
                        'codeRow[0].invitee_email: ', codeData.invitee_email === null,
                        'codeRow[0].accepted: ', codeData.accepted
                    );
                }
            }
        } catch (error) {
            // FIXME: Logging
            console.error(error);
        }

        senderUserName = await getCurrentUserName(senderid);

        if (!senderUserName) {
            return fail(400, {message: "Who are you?"});
        }

        try {
            const sendMail = await sendInvite({
                recipient: inviteeEmail.toString(),
                inviteCode: inviteCode.toString(),
                senderUserName: senderUserName
            });
        } catch (error) {
            // FIXME: Logging
            console.error(error);
        }

        // Mail skickat. Uppdatera databasen.

        try {
            const updateCode = await db.update(table.invitecodes)
                .set({active: true, invitee_email: inviteeEmail.toString()})
                .where(
                    and(
                        eq(table.invitecodes.user, senderid),
                        eq(table.invitecodes.code, inviteCode.toString())
                    )
                );
        } catch (error) {
            // FIXME: Logging
            console.error(error);
        }

        return (200)
    }
}

async function getInvites(userid?: string)
{
    if (!userid) return;

    return await db
        .select()
        .from(table.invitecodes)
        .where(eq(table.invitecodes.user, userid));
}

async function sendInvite(data: SendInviteData): Promise<boolean>
{

    const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
            user: 'rosa.jacobi99@ethereal.email',
            pass: 'TPr9EJrytqN6c21Nu6'
        }
    });

    // FIXME: Rätt URL
    const html = `Hello!<br/><br/>
<a href="http://localhost:5173/auth/register/?code=${data.inviteCode}&email=${encodeURIComponent(data.recipient)}">Please click this link to create your account!</a><br/><br/>
With best regards<br/>
All the ducks at Target Tracker`;

    const mailOptions = {
        from: "from",
        to: data.recipient,
        subject: `${data.senderUserName} has invited you to TargetTracker!`,
        html: html
    };

    transporter.sendMail(mailOptions, (error, info)=> {
        if (error) {
            // FIXME: Logging
            console.error(error);
            return false;
        }
    });

    return true;
}

async function getCurrentUserName(userid: string): Promise<string|undefined>
{
    try {
        const query = await db.select()
            .from(table.user)
            .where(eq(table.user.id, userid));

        if (query.length === 1) {
            return query[0].username;
        }
    } catch (error) {
        // FIXME: Logging
        console.error(error);
        return;
    }
}
