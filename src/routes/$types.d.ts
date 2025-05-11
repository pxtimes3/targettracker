import { z } from 'zod';
import type { Ammunition, Gun, User, ammunitionTypeEnum, PrimerType } from '@/server/db/schema';

declare global {
    interface Caliber {
        id: string;
        name: string;
        category: string;
        mm: string;
        in: string;
        aliases: string[];
    }

    interface PageData {
        activated: boolean;
        error: string | null;
    }

    interface Invites {
        "id": string,
        "code": string,
        "user": string,
        "invitee_email": string|null,
        "invite_sent": Date,
        "accepted": boolean,
        "active": boolean
    }

    interface SendInviteData {
        recipient: string;
        inviteCode: string;
        senderUserName: string;
    }

    type AnalysisDbType = z.infer<typeof AnalysisSchema>;
    type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>;

    interface AddEditGunProps {
        data: GunData;
        gunTypes: GunType;
        onSuccess?: (id: string) => void;
    }

    interface GunData extends Gun {
        type: GunData<type>|undefined;
        error: { message: string };
    };
    type GunType = import('@/server/db/schema').GunType;

    interface EventData {};
    interface TargetData {};
    interface AmmunitionData extends Ammunition {
        id?: string;
        type?: AmmunitionType | undefined;
        primerType?: PrimerType | undefined;
        error?: { message: string };
        [key: string]: any;
    };
    type AmmunitionType = import('@/server/db/schema').ammunitionType;

    type PrimerType = import('@/server/db/schema').PrimerType;

    interface GunEditPageServerData {
        user: User;
        gundata: GunData;
        gunTypes: GunType;
    }

    interface InfoPanelData {
        data: User;
        gunsEvents: any;
    }

    // src/routes/pixi
    type GunWithTarget = {
        gun: Gun;
        target: Targets | null; // null om inga targets -.-
    }
    
    type EventWithTarget = {
        event: Events;
        targets: Targets | null;
    }
    
    interface GunsEvents {
        guns: Gun[];
        events: Events[];
        ammunition: Ammunition[];
    }
}

const AnalysisSchema = z.object({
    id: z.string().uuid(),
    submitted: z.date(),
    updated: z.date(),
    user_id: z.string().uuid(),
    image_name: z.string().uuid()
});

const AnalysisRequestSchema = z.object({
    user_id: z.string(),
    imagename: z.string().uuid(),
});

export {};