import { sql } from "drizzle-orm";
import { boolean, integer, pgEnum, pgPolicy, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const rolesEnum = pgEnum("roles", ["user", "vip", "admin"]);

export const user = pgTable('user', {
	id: uuid('id').primaryKey(),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	role: rolesEnum().default("user"),
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

export const faq = pgTable("faq", {
	id: uuid("id").defaultRandom(),
	question: text("question").notNull(),
	answer: text("answer").notNull(),
	order: integer("order").default(0),
	created: timestamp("created").default(sql`now()`),
	updated: timestamp("updated").default(sql`now()`).$onUpdate(() => new Date()),
}, (t) => [
	pgPolicy('admin', {
		as: 'permissive',
		to: 'admin',
		for: 'all',
		using: sql``,
		withCheck: sql``,
	}),
	pgPolicy('public can view', {
		as: 'permissive',
		to: undefined,
		for: 'select',
		using: sql``,
	}),
]);

export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type InviteCodes = typeof invitecodes.$inferSelect;
export type Faq = typeof faq.$inferSelect;
