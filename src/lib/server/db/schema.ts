import { sql } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const user = pgTable('user', {
	id: uuid('id').primaryKey(),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	email: text('email').notNull().unique(),
	invitedBy: uuid('invitedBy'),
	inviteCode: uuid('inviteCode'),
	verificationCode: uuid('verificationCode').notNull(),
	verified: boolean('verified').default(false),
	createdAt: timestamp('createdAt').default(sql`now()`),
});

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});

export const invitecodes = pgTable("invitecodes", {
	id: uuid("id").defaultRandom(),
	code: uuid("code").defaultRandom(),
	user: uuid("user").notNull().references(() => user.id, { onDelete: 'cascade' }),
	invitee_email: text("invitee_email"),
	invite_sent: timestamp('inivite_sent'),
	accepted: boolean('accepted').default(false),
	active: boolean("active").default(true)
});

export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type InviteCodes = typeof invitecodes.$inferSelect;
