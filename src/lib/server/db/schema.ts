// src/lib/server/db/schema.ts
import { sql, relations } from "drizzle-orm";
import { boolean, integer, pgEnum, pgPolicy, pgRole, pgTable, text, timestamp, uuid, doublePrecision, bigint, json } from "drizzle-orm/pg-core";

export const admin = pgRole('admin', { createRole: true, createDb: true, inherit: true }).existing();
export const service = pgRole('service', { createRole: true, createDb: true, inherit: true }).existing();

export const rolesEnum = pgEnum("roles", ["user", "vip", "admin", "service"]);
export const gunTypeEnum = pgEnum('gunType', ['rifle', 'pistol', 'air-rifle', 'air-pistol']);
export const ammunitionTypeEnum = pgEnum('ammunitionType', ['centerfire', 'rimfire', 'shotgun', 'airgun']);
export const measurementsEnum = pgEnum('measurements', ['metric', 'imperial']);
export const angleUnitEnum = pgEnum('angleunit', ['mil', 'moa']);
export const sightsEnum = pgEnum('sights', ['iron', 'scope', 'red-dot', 'holographic']);
export const weightEnum = pgEnum('weight', ['gr', 'g']);
export const primerTypeEnum = pgEnum('primertype', ['small rifle', 'small rifle magnum', 'large rifle', 'large rifle magnum', 'small pistol', 'small pistol magnum', 'large pistol', 'large pistol magnum', 'shotgun'])

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
        using: sql`true`,
        withCheck: sql`true`,
    }),
    pgPolicy('public can view', {
        as: 'permissive',
        to: undefined,
        for: 'select',
        using: sql`auth.uid() = id`,
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
    userId: uuid("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
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
        using: sql`true`,
    }),
]);

export const analysis = pgTable("analysis", {
    id: uuid("id").defaultRandom(),
    submitted: timestamp("submitted").default(sql`now()`),
    updated: timestamp("updated").default(sql`now()`).$onUpdate(() => new Date()),
    user_id: uuid("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
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
    user_id: uuid("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
    cursortips: boolean("cursortips").default(true),
    isometrics: boolean("isometrics").default(true),
    mils: boolean("mils").default(true),
    showallshots: boolean("showallshots").default(true),
    editorhelpclosed: boolean("editorhelpclosed").default(false),
    lasttargettype: text("lasttargettype"),
    lastcaliber: uuid("lastcaliber"),
    lastgun: uuid("lastgun"),
});

export const gun = pgTable('gun', {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    userId: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    name: text('name').notNull(),
    type: gunTypeEnum('type').notNull(),
    manufacturer: text('manufacturer'),
    caliber: text('caliber').notNull(),
    sights: text('sights'),
    barrel: text('barrel'),
    barrelLength: doublePrecision('barrelLength'),
    stock: text('stock'),
    note: text('note'),
    manufacturerOther: text('manufacturer_other'),
    barrelTwist: text('barrel_twist'),
    pictureOriginal: text('picture_original'),
    caliberMm: doublePrecision('caliber_mm'),
    model: text('model'),
    barrelLengthUnit: measurementsEnum('barrel_length_unit'),
    barrelTwistUnit: measurementsEnum('barrel_twist_unit'),
});

/** Deprecated */
export const ammunition = pgTable('ammunition', {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    userId: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    name: text('name').notNull(),
    type: ammunitionTypeEnum('type').notNull(),
    manufacturerCase: text('manufacturer_case'),
    manufacturerBullet: text('manufacturer_bullet'),
    manufacturerPrimer: text('manufacturer_primer'),
    manufacturerPropellant: text('manufacturer_propellant'),
    propellantName: text('propellant_name'),
    propellantCharge: doublePrecision('propellant_charge'),
    bulletName: text('bullet_name'),
    caliber: text('caliber'),
    caliberUnit: measurementsEnum('caliber_unit'),
    bulletWeight: doublePrecision('bullet_weight'),
    primerType: primerTypeEnum('primer_type'),
    primerName: text('primerName'),
    bulletBcG1: doublePrecision('bullet_bc_g1'),
    bulletBcG7: doublePrecision('bullet_bc_g7'),
    bulletSD: doublePrecision('bullet_sd'),
    manufacturerBrand: text('manufacturer_brand'),
    bulletWeightUnit: weightEnum('bullet_weight_unit'),
    propellantWeightUnit: weightEnum('propellant_weight_unit'),
    manufacturerName: text('manufacturer_name'),
    caliberMm: doublePrecision('caliber_mm'),
    date: timestamp('date', { withTimezone: true }).defaultNow(),
    note: text('note'),
    cartridgeOverallLength: doublePrecision('cartridge_oal'),
    cartridgeOverallLengthUnit: measurementsEnum('cartridge_oal_unit'),
});

export const loadRecipe = pgTable('load_recipe', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    name: text('name').notNull(),
    isFactory: boolean('is_factory').notNull().default(false),
    
    // Caliber info
    caliber: text('caliber'),
    caliberMm: doublePrecision('caliber_mm'),
    caliberUnit: measurementsEnum('caliber_unit'),
    
    // Case details
    manufacturerCase: text('manufacturer_case'),
    
    // Bullet details
    manufacturerBullet: text('manufacturer_bullet'),
    bulletId: text('bullet_id'),
    bulletName: text('bullet_name'),
    bulletWeight: doublePrecision('bullet_weight'),
    bulletWeightUnit: weightEnum('bullet_weight_unit'),
    bulletBcG1: doublePrecision('bullet_bc_g1'),
    bulletBcG7: doublePrecision('bullet_bc_g7'),
    bulletSd: doublePrecision('bullet_sd'),
    
    // Propellant base details
    manufacturerPropellant: text('manufacturer_propellant'),
    propellantName: text('propellant_name'),
    
    // General info
    note: text('note'),
    date: timestamp('date', { withTimezone: true }).defaultNow(),
    type: ammunitionTypeEnum('type').notNull(),
});
  
export const loadVariation = pgTable('load_variation', {
    id: uuid('id').primaryKey().defaultRandom(),
    recipeId: uuid('recipe_id').notNull().references(() => loadRecipe.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    name: text('name'),
    // Propellant load details
    propellantCharge: doublePrecision('propellant_charge'),
    propellantWeightUnit: weightEnum('propellant_weight_unit'),
    // Cartridge details
    cartridgeOal: doublePrecision('cartridge_oal'),
    cartridgeOalUnit: measurementsEnum('cartridge_oal_unit'),
    // Primer details
    manufacturerPrimer: text('manufacturer_primer'),
    primerType: primerTypeEnum('primer_type'),
    primerName: text('primer_name'),
    // Batch information
    lotNumber: text('lot_number'),
    date: timestamp('priduction_date', { withTimezone: true }).defaultNow(),
    // Additional info
    note: text('note'),
});

export const events = pgTable('events', {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    userId: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').default('').notNull(),
    location: text('location'),
    note: text('note'),
    date: timestamp('date', { withTimezone: true }),
});

export const groups = pgTable('groups', {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    groupNumber: bigint('group_number', { mode: 'number' }).default(1).notNull(),
    meanradius: doublePrecision('meanradius'),
    cep: doublePrecision('cep'),
    varianceX: doublePrecision('variance_x'),
    varianceY: doublePrecision('variance_y'),
    sdX: doublePrecision('sd_x'),
    sdY: doublePrecision('sd_y'),
    es: doublePrecision('es'),
    diagonal: doublePrecision('diagonal'),
    fom: doublePrecision('fom'),
    ccr: doublePrecision('ccr'),
    size: doublePrecision('size'),
    userId: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    targetId: uuid('target_id'),
});

export const manufacturers = pgTable('manufacturers', {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    name: text('name').notNull(),
    ammunition: boolean('ammunition').default(false).notNull(),
    guns: boolean('guns').default(false).notNull(),
    airguns: boolean('airguns').default(false).notNull(),
    popularity: bigint('popularity', { mode: 'number' }).default(0),
    ammunitionAir: boolean('ammunition_air').default(false).notNull(),
});

export const sight = pgTable('sight', {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    type: sightsEnum('type'),
    zoom: text('zoom'),
    objective: doublePrecision('objective'),
    objectiveUnit: measurementsEnum('objective_unit'),
    heightOverBore: doublePrecision('height_over_bore'),
    heightOverBoreUnit: measurementsEnum('height_over_bore_unit'),
    adjustments: angleUnitEnum('adjustments'),
    click: doublePrecision('click'),
    manufacturer: text('manufacturer'),
    model: text('model'),
    userId: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
});

export const targets = pgTable('targets', {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    userId: uuid('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    gunId: uuid('gun_id').notNull(),
    ammunitionId: uuid('ammunition_id').notNull(),
    eventId: uuid('event_id').notNull(),
    data: json('data').notNull(),
    dataSize: doublePrecision('data_size'),
    dataMr: doublePrecision('data_mr'),
    dataEs: doublePrecision('data_es'),
    imageUrl: text('image_url'),
    imageThumbnailUrl: text('image_thumbnail_url'),
    dataGroups: bigint('data_groups', { mode: 'number' }).default(1),
    name: text('name'),
    note: text('note'),
    public: boolean('public').default(false),
});

export const userdata = pgTable('userdata', {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    userId: uuid('user_id').references(() => user.id, { onDelete: 'cascade' }),
    name: text('name'),
    surname: text('surname'),
});

export const userflags = pgTable('userflags', {
    id: bigint('id', { mode: 'number' }).primaryKey(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    userId: uuid('user_id').references(() => user.id, { onDelete: 'cascade' }),
    unitsystem: measurementsEnum('unitsystem').default('metric'),
    angleunit: angleUnitEnum('angleunit').default('mil'),
    targetShowall: boolean('target_showall').default(true),
});


export const loadRecipeRelations = relations(loadRecipe, ({ one, many }) => ({
    user: one(user, {
    fields: [loadRecipe.userId],
    references: [user.id],
    }),
    variations: many(loadVariation),
}));

export const loadVariationRelations = relations(loadVariation, ({ one, many }) => ({
    recipe: one(loadRecipe, {
    fields: [loadVariation.recipeId],
    references: [loadRecipe.id],
    }),
}));

export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type InviteCodes = typeof invitecodes.$inferSelect;
export type Faq = typeof faq.$inferSelect;
export type Analysis = typeof analysis.$inferSelect;
export type Gun = typeof gun.$inferSelect;
export type GunType = (typeof gunTypeEnum.enumValues)[number];
export type MeasurementsType = (typeof measurementsEnum.enumValues)[number];
export type AngleUnitType = (typeof angleUnitEnum.enumValues)[number];
export type WeightType = (typeof weightEnum.enumValues)[number];
export type Ammunition = typeof ammunition.$inferSelect;
export type AmmunitionType = (typeof ammunitionTypeEnum.enumValues)[number];
export type PrimerType = (typeof primerTypeEnum.enumValues)[number];
export type Events = typeof events.$inferSelect;
export type Groups = typeof groups.$inferSelect;
export type Manufacturers = typeof manufacturers.$inferSelect;
export type Sight = typeof sight.$inferSelect;
export type Targets = typeof targets.$inferSelect;
export type UserData = typeof userdata.$inferSelect;
export type UserFlags = typeof userflags.$inferSelect;