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
