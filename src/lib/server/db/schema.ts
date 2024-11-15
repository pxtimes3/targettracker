import { sql } from "drizzle-orm";
import { boolean, integer, pgEnum, pgPolicy, pgRole, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const admin = pgRole('admin', { createRole: true, createDb: true, inherit: true });
export const service = pgRole('service', { createRole: true, createDb: true, inherit: true });

export const rolesEnum = pgEnum("roles", ["user", "vip", "admin", "service"]);

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
}, (t) => [
	pgPolicy('admin access all', {
		as: 'permissive',
		to: 'admin',
		for: 'all',
		using: sql`true`,  // Allows access to all rows
		withCheck: sql`true`,  // Allows all changes
	}),
	pgPolicy('public can view', {
		as: 'permissive',
		to: undefined,
		for: 'select',
		using: sql`auth.uid() = user_id`,
	}),
]);

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
}, (t) => [
	pgPolicy('admin access all', {
		as: 'permissive',
		to: 'admin',
		for: 'all',
		using: sql`true`,
		withCheck: sql`true`,
	}),
	pgPolicy('public can view', {
		as: 'permissive',
		to: undefined,
		for: 'select',
		using: sql`auth.uid() = user_id`,
	}),
]);

export const faq = pgTable("faq", {
	id: uuid("id").defaultRandom(),
	question: text("question").notNull(),
	answer: text("answer").notNull(),
	order: integer("order").default(0),
	created: timestamp("created").default(sql`now()`),
	updated: timestamp("updated").default(sql`now()`).$onUpdate(() => new Date()),
}, (t) => [
	pgPolicy('admin access all', {
		as: 'permissive',
		to: 'admin',
		for: 'all',
		using: sql`true`,
		withCheck: sql`true`,
	}),
	pgPolicy('public can view', {
		as: 'permissive',
		to: undefined,
		for: 'select',
		using: sql``,
	}),
]);

export const analysis = pgTable("analysis", {
	id: uuid("id").defaultRandom(),
	submitted: timestamp("submitted").default(sql`now()`),
	updated: timestamp("updated").default(sql`now()`).$onUpdate(() => new Date()),
	user_id: uuid("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }).notNull(),
	image_name: text("image_name").notNull(),
	result: text("result"),
	error: text("error"),
}, (t) => [
	pgPolicy('admin access all', {
		as: 'permissive',
		to: 'admin',
		for: 'all',
		using: sql`true`,
		withCheck: sql`true`,
	}),
	sql`ALTER TABLE public.analysis FORCE ROW LEVEL SECURITY`,
    sql`ALTER TABLE public.analysis ENABLE ROW LEVEL SECURITY`,
    sql`ALTER TABLE public.analysis OWNER TO service`,
	pgPolicy('service', {
		as: 'permissive',
		to: 'service',
		for: 'all',
		using: sql`true`,
		withCheck: sql`true`,
	}),
	pgPolicy('public can view', {
		as: 'permissive',
		to: undefined,
		for: 'select',
		using: sql`auth.uid() = user_id`,
	}),
]);

export const settings = pgTable("settings", {
	id: uuid("id").defaultRandom(),
	user_id: uuid("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }).notNull(),
	cursortips: boolean("cursortips").default(sql`true`),
	isometrics: boolean("isometrics").default(sql`true`),
	mils: boolean("mils").default(sql`true`),
	showallshots: boolean("showallshots").default(sql`true`),
	editorhelpclosed: boolean("editorhelpclosed").default(sql`false`),
	lasttargettype: text("lasttargettype"),
	lastcaliber: uuid("lastcaliber"),
	lastgun: uuid("lastgun"),
});

export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type InviteCodes = typeof invitecodes.$inferSelect;
export type Faq = typeof faq.$inferSelect;
export type Analysis = typeof analysis.$inferSelect;
