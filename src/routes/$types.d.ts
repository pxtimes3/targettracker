import { z } from 'zod';

export interface PageData {
    activated: boolean;
    error: string | null;
}

export interface Invites {
    "id": string,
    "code": string,
    "user": string,
    "invitee_email": string|null,
    "invite_sent": Date,
    "accepted": boolean,
    "active": boolean
}

export interface SendInviteData {
    recipient: string;
    inviteCode: string;
    senderUserName: string;
}

const AnalysisSchema = z.object({
    id: z.string().uuid(),
    submitted: z.date(),
    updated: z.date(),
    user_id: z.string().uuid(),
    image_name: z.string().uuid()
});

export type AnalysisDbType = z.infer<typeof AnalysisSchema>;

const AnalysisRequestSchema = z.object({
    user_id: z.string(),
    imagename: z.string().uuid(),
});

export type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>;
