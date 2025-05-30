import { INVITEONLY, VITE_PUBLIC_TURNSTILE, VITE_SECRET_TURNSTILE } from "$env/static/private";
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { hash } from '@node-rs/argon2';
import type { Actions } from "@sveltejs/kit";
import { fail, redirect } from "@sveltejs/kit";
import { and, eq } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import type { PageServerLoad } from "../$types";

export const load: PageServerLoad = async (event) => {
    return { key: VITE_PUBLIC_TURNSTILE, inviteonly: INVITEONLY }
};

export const actions: Actions = {
    checkTurnstile: async (event) => {
        const body = await event.request.formData();

        /* TURNSTILE START */
        const token: string = body.get('token') as string;

        if (!token) {
            console.error('No token');
            console.error('body:', body)
        }

        let formData = new FormData();
        formData.append('secret', VITE_SECRET_TURNSTILE);
        formData.append('response', token);

        const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            body: formData,
            method: 'POST',
        });

        return {outcome: await result.json()};
    },
	register: async (event) => {
        const body = await event.request.formData();

        const username = body.get('username')?.toString();
		const email = body.get('email')?.toString();
		const password = body.get('password')?.toString();
		const inviteCode = body.get('invitecode')?.toString();

		if (!validateEmail(email)) {
			return fail(400, {message: `Invalid e-mail. (${email})`} );
		}

		if (!validatePassword(password)) {
			return fail(400, {message: "Invalid password"} );
		}

		/*
		if (INVITEONLY === 'true' && inviteCode) {
			if (await validateCode(inviteCode) === false) {
				return fail(400, {message: "Invalid invite code"} );
			}
			validateInviteCode(inviteCode)
		}
		*/

		const passwordHash = await hash(password, {
			// recommended minimum parameters
			memoryCost: 19456,
			timeCost: 2,
			outputLen: 32,
			parallelism: 1
		});

		console.log(passwordHash, uuidv4());

		const userid = uuidv4() as string;
		const verificationCode = uuidv4();
		try {
			const query = await db
				.insert(table.user)
				.values({
					id: userid,
					username: username as string,
					passwordHash: passwordHash as string,
					email: email as string,
					verificationCode: verificationCode,
					inviteCode: inviteCode,
				});
		} catch (e) {
			console.error('Error:', e);
			return fail(500, { message: 'An error creating db.user has occurred' });
		}

		/*
		try {
			const session = await auth.createSession(userid);
			event.cookies.set(auth.sessionCookieName, session.id, {
				path: '/',
				sameSite: 'lax',
				httpOnly: true,
				expires: session.expiresAt,
				secure: !dev
			});
		} catch (e) {
			console.error('Error:', e);
			return fail(500, { message: 'An error creating session has occurred' });
		}
		*/

        // Handle invite code and create new codes

		try {
			if (inviteCode) {
            	await invalidateCode(inviteCode)
        	}
		} catch (e) {
			console.error('Error:', e);
			return fail(500, { message: 'An error invalidating invite code has occurred' });
		}

		try {
			await createInviteCodes(userid, 5);
		} catch (e) {
			console.error('Error:', e);
			return fail(500, { message: 'An error creating invite codes has occurred' });
		}

		try {
			sendVerificationEmail(email, verificationCode)
		} catch (e) {
			console.error('Error:', e);
			return fail(500, { message: 'The postman is dead Jim!' });
		}

        return redirect(302, '/auth?register=true');
	}
} satisfies Actions;

const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';

function generateUserId(length = 21): string
{
	return uuidv4();
	//return generateRandomString({ read: (bytes) => crypto.getRandomValues(bytes) }, alphabet, length);
}

function validateEmail(email: unknown): email is string {
	return (
		typeof email === 'string' &&
		email.length >= 5 &&
		email.length <= 128 &&
		/^[^@ \t\r\n]+@[^@ \t\r\n]+\.(\w){2,}$/.test(email)
	);
}

function validatePassword(password: unknown): password is string {
	return typeof password === 'string' && password.length >= 6 && password.length <= 255;
}

async function validateInviteCode(invitecode: string|FormDataEntryValue): Promise<string|boolean>
{
	let code: string|null;
	// console.log(`validateInviteCode(${invitecode}) called`);
	try {
		const res = await db.select()
			.from(table.invitecodes)
			.where(
				and(
					eq(table.invitecodes.code, invitecode.toString()),
					eq(table.invitecodes.active, true)
				)
			)

			// console.log('Query result:', res); // Add this to see the actual result

		if (res.length > 0) {
			const firstRow = res[0]
			code = firstRow.code

			if (code === null) return false;
		} else {
			return false;
		}
	} catch (error) {
		// FIXME: Add error logging
		return false;
	}

	return code;
}

async function invalidateCode(code: string)
{
	return await db
		.update(table.invitecodes)
		.set({ active: false })
		.where(eq(table.invitecodes.code, code));
}

async function validateCode(inviteCode: string)
{
	if (!inviteCode?.toString().match(/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/)) {
		return false;
	}

	const inviteValid = await validateInviteCode(inviteCode as string);

	if (!inviteValid) {
		return false;
		//return fail(400, {message: "Invalid invite code."} );
	}
}

async function createInviteCodes(userid: string, count: number = 1): Promise<void>
{
	console.log(`got an order for ${count} codes for the userid: ${userid}`)
    try {
        const inviteCodes = Array.from({ length: count }, () => ({
            user: userid
        }));

        const q = await db
            .insert(table.invitecodes)
            .values(inviteCodes);

		console.log(`q:`, q);
    } catch (error) {
        // FIXME: Add logging
        console.error('failed to create invite codes\n\n', error)
    }
}


function sendVerificationEmail(email: string, verificationCode: string)
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
<a href="http://localhost:5173/auth/activate/?activate=${verificationCode}">Please click this link to activate your account!</a><br/><br/>
With best regards<br/>
All the ducks at Target Tracker
	`;

	const mailOptions = {
        from: "from",
        to: email,
        subject: "subject",
        html: html
    };

	transporter.sendMail(mailOptions, (error, info)=> {
        if (error) {
            console.error(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}
