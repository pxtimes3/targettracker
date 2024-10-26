import { z } from "zod";

export const loginForm = z.object({
    username: z.string().min(2).max(50),
    password: z.string().min(8),
});

export type FormSchema = typeof loginForm;
