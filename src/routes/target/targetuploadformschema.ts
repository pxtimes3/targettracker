import { z } from "zod";

export const targetUploadFormSchema = z.object({
    targetname: z.string().min(2).max(128),
    targettype: z.string().min(2).max(128),
    targetrange: z.number().min(1).max(3),
    rangeunit: z.enum(["metric","imperial"]),
});

export type TargetUploadFormSchema = typeof targetUploadFormSchema;
