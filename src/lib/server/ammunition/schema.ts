import { z } from 'zod';

// Enum schemas
const ammunitionTypeEnum = z.enum(['FACTORY', 'HANDLOAD', 'MILITARY_SURPLUS']);
const primerTypeEnum = z.enum(['SMALL_PISTOL', 'LARGE_PISTOL', 'SMALL_RIFLE', 'LARGE_RIFLE', 'SHOTGUN', 'SMALL_PISTOL_MAGNUM', 'LARGE_PISTOL_MAGNUM', 'SMALL_RIFLE_MAGNUM', 'LARGE_RIFLE_MAGNUM']);
const measurementsEnum = z.enum(['metric', 'imperial']);
const weightEnum = z.enum(['gr', 'g']);

// Base schema for fields that are optional but when provided must follow specific rules
const optionalPositiveNumber = z.number().positive().optional();
const optionalText = z.string().min(1).max(255).optional();

// Load Recipe Schema
export const loadRecipeSchema = z.object({
  id: z.string().uuid().optional(), // Optional for creation, required for updates
  userId: z.string().uuid(),
  name: z.string().min(1).max(100),
  isFactory: z.boolean().default(false),
  
  // Caliber info
  caliber: optionalText,
  caliberMm: optionalPositiveNumber,
  caliberUnit: measurementsEnum.optional(),
  
  // Case details
  manufacturerCase: optionalText,
  
  // Bullet details
  manufacturerBullet: optionalText,
  bulletName: optionalText,
  bulletWeight: optionalPositiveNumber,
  bulletWeightUnit: weightEnum.optional(),
  bulletBcG1: z.number().min(0).max(1).optional(),
  bulletBcG7: z.number().min(0).max(1).optional(),
  bulletSd: optionalPositiveNumber,
  
  // Primer details
  manufacturerPrimer: optionalText,
  primerType: primerTypeEnum.optional(),
  primerName: optionalText,
  
  // Propellant base details
  manufacturerPropellant: optionalText,
  propellantName: optionalText,
  
  // General info
  note: z.string().max(1000).optional(),
  date: z.date().optional().or(z.string().pipe(z.coerce.date())),
});

// Load Variation Schema
export const loadVariationSchema = z.object({
  id: z.string().uuid().optional(), // Optional for creation, required for updates
  recipeId: z.string().uuid(),
  name: optionalText.default(''),
  
  // Specific load details
  propellantCharge: optionalPositiveNumber,
  propellantWeightUnit: weightEnum.optional(),
  cartridgeOal: optionalPositiveNumber,
  cartridgeOalUnit: measurementsEnum.optional(),
  
  // Batch information
  lotNumber: optionalText,
  productionDate: z.date().optional().or(z.string().pipe(z.coerce.date())),
  
  // Additional info
  note: z.string().max(1000).optional(),
  type: ammunitionTypeEnum,
});

// Factory Ammunition Schema (simplified for non-reloaders)
export const factoryAmmunitionSchema = z.object({
  name: z.string().min(1).max(100),
  caliber: z.string().min(1).max(50),
  manufacturerBullet: z.string().min(1).max(100),
  bulletWeight: z.number().positive(),
  bulletWeightUnit: weightEnum,
  type: z.literal('FACTORY'),
  note: z.string().max(1000).optional(),
});

// Create schemas with validation for different use cases
export const createLoadRecipeSchema = loadRecipeSchema.omit({ id: true });
export const updateLoadRecipeSchema = loadRecipeSchema.partial().required({ id: true });

export const createLoadVariationSchema = loadVariationSchema.omit({ id: true });
export const updateLoadVariationSchema = loadVariationSchema.partial().required({ id: true });

// Helper function to create both recipe and variation from factory ammo input
export const createFactoryAmmunitionSchema = factoryAmmunitionSchema;

// Types derived from schemas
export type LoadRecipe = z.infer<typeof loadRecipeSchema>;
export type LoadVariation = z.infer<typeof loadVariationSchema>;
export type FactoryAmmunition = z.infer<typeof factoryAmmunitionSchema>;
export type CreateLoadRecipe = z.infer<typeof createLoadRecipeSchema>;
export type UpdateLoadRecipe = z.infer<typeof updateLoadRecipeSchema>;
export type CreateLoadVariation = z.infer<typeof createLoadVariationSchema>;
export type UpdateLoadVariation = z.infer<typeof updateLoadVariationSchema>;